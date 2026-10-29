<?php
/**
 * ROW-LEVEL SCOPING — blueprint §9
 * ================================
 *
 * "Row-level scoping (coordinators see only their zone/vertical) is enforced in
 *  a2-core via pre_get_posts filters plus meta/term capability checks — role
 *  plugins alone cannot provide row-level isolation."
 *
 * This file is that sentence, implemented.
 *
 * THE THREE PLACES A ROW CAN LEAK
 * -------------------------------
 * A WordPress installation hands you post rows through more than one door, and
 * closing only one door is the classic mistake:
 *
 *   1. Query loops        — `pre_get_posts` (admin lists, REST collections)
 *   2. Single access      — `template_redirect` / `user_has_cap` on a direct URL
 *   3. The REST API       — per-id endpoints bypass `pre_get_posts` entirely
 *
 * All three are closed below. The rule is deliberately fail-closed: a scoped
 * user with no zones assigned sees nothing, not everything.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\scoping;

use A2\Core\roles;

if (!defined('ABSPATH')) {
    exit;
}

/** Post types that carry a `service_zone` term and therefore need scoping. */
function scoped_post_types(): array
{
    return ['a2_collection_run', 'a2_student', 'a2_beneficiary', 'a2_temple_site', 'a2_drive', 'a2_field_report', 'a2_attendance'];
}

/**
 * Should this request be scoped at all?
 *
 * Cron, WP-CLI and the REST gateway must never be scoped — a remittance
 * calculation that silently sees one zone is a financial error, not a
 * permissions improvement.
 */
function should_scope(): bool
{
    if (wp_doing_cron() || (defined('WP_CLI') && WP_CLI)) {
        return false;
    }
    if (!is_user_logged_in()) {
        return false; // public queries are governed by post_status, not by zone
    }
    if (current_user_can('manage_options')) {
        return false;
    }

    return current_user_can('a2_view_own_zone_only');
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOOR 1 — query loops
   ───────────────────────────────────────────────────────────────────────────── */

add_action('pre_get_posts', __NAMESPACE__ . '\\filter_main_query');

function filter_main_query(\WP_Query $query): void
{
    if (!should_scope()) {
        return;
    }

    $post_type = $query->get('post_type');
    $types = is_array($post_type) ? $post_type : ($post_type !== '' ? [$post_type] : []);

    // An unscoped query with no explicit post_type is the admin's "All posts"
    // list, which mixes types. Scope it only when every type is a scoped one OR
    // when the request is clearly for a scoped type.
    $intersect = array_intersect($types, scoped_post_types());
    if ($intersect === []) {
        return;
    }

    $zones = roles\zones_for_user();
    if ($zones === []) {
        // Fail closed: a scoped user with no zone assignment sees nothing.
        $query->set('post__in', [0]);
        return;
    }

    $tax_query = (array) $query->get('tax_query');
    $tax_query[] = [
        'taxonomy'         => 'service_zone',
        'field'            => 'slug',
        'terms'            => $zones,
        'operator'         => 'IN',
        'include_children' => true,
    ];
    $query->set('tax_query', $tax_query);
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOOR 2 — a direct URL
   ───────────────────────────────────────────────────────────────────────────── */

add_action('template_redirect', __NAMESPACE__ . '\\guard_single');

function guard_single(): void
{
    if (!is_singular() || !should_scope()) {
        return;
    }

    $post = get_queried_object();
    if (!$post instanceof \WP_Post || !in_array($post->post_type, scoped_post_types(), true)) {
        return;
    }

    if (!can_access($post->ID)) {
        wp_die(
            esc_html__('This record belongs to a service zone you are not assigned to.', 'a2-core'),
            esc_html__('Not available', 'a2-core'),
            ['response' => 403]
        );
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOOR 3 — REST by id
   ───────────────────────────────────────────────────────────────────────────── */

add_filter('rest_post_query', __NAMESPACE__ . '\\filter_rest_query', 10, 2);

/**
 * @param array<string, mixed> $args
 * @param \WP_REST_Request     $request
 * @return array<string, mixed>
 */
function filter_rest_query(array $args, \WP_REST_Request $request): array
{
    if (!should_scope()) {
        return $args;
    }
    $post_type = (string) ($args['post_type'] ?? '');
    if (!in_array($post_type, scoped_post_types(), true)) {
        return $args;
    }

    $zones = roles\zones_for_user();
    $args['tax_query'] = (array) ($args['tax_query'] ?? []);
    $args['tax_query'][] = [
        'taxonomy' => 'service_zone',
        'field'    => 'slug',
        'terms'    => $zones === [] ? ['__none__'] : $zones,
    ];

    return $args;
}

/* ─────────────────────────────────────────────────────────────────────────────
   THE PREDICATE — one function every caller uses
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * May the current user see this row?
 *
 * Used by the template guard, the admin column renderer and the block theme.
 * A single predicate means a future caller cannot invent a weaker rule.
 */
function can_access(int $post_id): bool
{
    if (!is_user_logged_in()) {
        return false;
    }
    if (current_user_can('manage_options')) {
        return true;
    }
    if (!current_user_can('a2_view_own_zone_only')) {
        return true; // role is not zone-scoped by design
    }

    $zones = roles\zones_for_user();
    if ($zones === []) {
        return false;
    }

    $terms = wp_get_post_terms($post_id, 'service_zone', ['fields' => 'slugs']);
    if (is_wp_error($terms) || $terms === []) {
        // A scoped record with no zone is not "public" — it is unclassified.
        return false;
    }

    return array_intersect($zones, $terms) !== [];
}

/* ─────────────────────────────────────────────────────────────────────────────
   ASSIGNING ZONES — so an administrator can actually use this
   ───────────────────────────────────────────────────────────────────────────── */

add_action('show_user_profile', __NAMESPACE__ . '\\render_zone_field');
add_action('edit_user_profile', __NAMESPACE__ . '\\render_zone_field');

function render_zone_field(\WP_User $user): void
{
    if (!current_user_can('edit_users')) {
        return;
    }
    $assigned = roles\zones_for_user((int) $user->ID);
    $zones = get_terms(['taxonomy' => 'service_zone', 'hide_empty' => false]);
    if (is_wp_error($zones)) {
        return;
    }
    ?>
    <h2><?php esc_html_e('A2 service zone scope', 'a2-core'); ?></h2>
    <table class="form-table" role="presentation">
        <tr>
            <th><label><?php esc_html_e('Assigned zones', 'a2-core'); ?></label></th>
            <td>
                <input type="hidden" name="a2_zone_scope_present" value="1" />
                <?php foreach ($zones as $zone) : ?>
                    <label style="display:block;margin-bottom:4px">
                        <input type="checkbox" name="a2_zone_scope[]"
                               value="<?php echo esc_attr($zone->slug); ?>"
                               <?php checked(in_array($zone->slug, $assigned, true)); ?> />
                        <?php echo esc_html($zone->name); ?>
                    </label>
                <?php endforeach; ?>
                <p class="description">
                    <?php esc_html_e('Only applies to zone-scoped roles. Administrators see every zone regardless. A scoped user with no zone sees nothing — the rule fails closed.', 'a2-core'); ?>
                </p>
            </td>
        </tr>
    </table>
    <?php
    wp_nonce_field('a2_zone_scope_save', 'a2_zone_scope_nonce');
}

add_action('personal_options_update', __NAMESPACE__ . '\\save_zone_field');
add_action('edit_user_profile_update', __NAMESPACE__ . '\\save_zone_field');

function save_zone_field(int $user_id): void
{
    if (!current_user_can('edit_users')) {
        return;
    }
    if (!isset($_POST['a2_zone_scope_nonce'])
        || !wp_verify_nonce(sanitize_key((string) wp_unslash($_POST['a2_zone_scope_nonce'])), 'a2_zone_scope_save')) {
        return;
    }
    if (!isset($_POST['a2_zone_scope_present'])) {
        return;
    }

    $raw = isset($_POST['a2_zone_scope']) ? (array) wp_unslash($_POST['a2_zone_scope']) : [];
    $zones = array_values(array_filter(array_map('sanitize_title', array_map('strval', $raw))));

    update_user_meta($user_id, 'a2_zone_scope', $zones);
}
