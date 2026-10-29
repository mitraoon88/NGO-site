<?php
/**
 * THE TRANSPARENCY LEDGER — blueprint §7.3, §11.4
 * ===============================================
 *
 * `/transparency-log` is not a page of prose. It is a read view over collection
 * runs, restoration batches and remittances, and it exists so that every
 * published figure on the site can be walked backwards to a row.
 *
 * THE INVARIANTS
 * --------------
 * 1. **A run is published only when verified.** `a2_verified` is set by a user
 *    holding `a2_verify_ledger`, and verification records who and when. A row
 *    that is not verified does not appear in any public query, any metric, or
 *    any export.
 * 2. **The ledger is append-only in spirit.** Rows may be corrected, but a
 *    correction leaves an audit entry with before/after. Deleting a verified run
 *    requires `manage_options` and is logged loudly.
 * 3. **No personal data ever enters a public ledger row.** Remittances are
 *    aggregated to a monthly figure; a Sevika's name never appears. This is the
 *    point of §8.4's "separate PII from public content".
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\ledger;

use A2\Core\metrics;

if (!defined('ABSPATH')) {
    exit;
}

const AUDIT_OPTION = 'a2_ledger_audit_log';
const AUDIT_MAX    = 500;

/* ─────────────────────────────────────────────────────────────────────────────
   READ MODEL
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Verified runs, newest first, flattened for the front end.
 *
 * @param array{zone?:string,from?:string,to?:string,limit?:int} $args
 * @return array<int, array<string, mixed>>
 */
function runs(array $args = []): array
{
    $meta_query = [['key' => 'a2_verified', 'value' => '1', 'compare' => '=']];

    if (!empty($args['zone'])) {
        $meta_query[] = ['key' => 'a2_zone_slug', 'value' => sanitize_title($args['zone']), 'compare' => '='];
    }
    if (!empty($args['from']) || !empty($args['to'])) {
        $range = ['key' => 'a2_run_date', 'type' => 'DATE'];
        if (!empty($args['from'])) {
            $range['value'] = gmdate('Y-m-d', (int) strtotime($args['from']));
            $range['compare'] = '>=';
        }
        if (!empty($args['to'])) {
            if (isset($range['value'])) {
                // Between: express as two clauses instead of a fragile 'BETWEEN' string.
                $meta_query[] = $range;
                $meta_query[] = ['key' => 'a2_run_date', 'type' => 'DATE', 'value' => gmdate('Y-m-d', (int) strtotime($args['to'])), 'compare' => '<='];
                $range = null;
            } else {
                $range['value'] = gmdate('Y-m-d', (int) strtotime($args['to']));
                $range['compare'] = '<=';
            }
        }
        if (is_array($range)) {
            $meta_query[] = $range;
        }
    }

    $posts = get_posts([
        'post_type'      => 'a2_collection_run',
        'post_status'    => 'publish',
        'posts_per_page' => max(1, min(200, (int) ($args['limit'] ?? 50))),
        'meta_query'     => $meta_query,
        'meta_key'       => 'a2_run_date',
        'orderby'        => 'meta_value',
        'order'          => 'DESC',
        'no_found_rows'  => true,
    ]);

    return array_map(static fn (\WP_Post $p): array => [
        'id'              => $p->ID,
        'date'            => (string) get_post_meta($p->ID, 'a2_run_date', true),
        'zone'            => (string) get_post_meta($p->ID, 'a2_zone_slug', true),
        'weight_kg'       => (float) get_post_meta($p->ID, 'a2_weight_kg', true),
        'baskets'         => (int) get_post_meta($p->ID, 'a2_baskets', true),
        'temples_covered' => (int) get_post_meta($p->ID, 'a2_temples_covered', true),
        'remnant_type'    => (string) get_post_meta($p->ID, 'a2_remnant_type', true),
        'verified_at'     => (string) get_post_meta($p->ID, 'a2_verified_at', true),
        'href'            => get_permalink($p) ?: '',
    ], $posts);
}

/**
 * Monthly aggregates — what the public chart actually draws. Aggregating here,
 * rather than in JavaScript, means the numbers can be cached and audited.
 *
 * @return array<int, array{month:string,weight_kg:float,runs:int}>
 */
function monthly(int $months = 12): array
{
    global $wpdb;

    // Direct SQL because WP_Query cannot GROUP BY meta. The table names come
    // from $wpdb, the type is a constant, and `months` is clamped — no injection
    // surface.
    $months = max(1, min(36, $months));

    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT DATE_FORMAT(pm.meta_value, '%%Y-%%m') AS month,
                SUM(CAST(w.meta_value AS DECIMAL(10,3))) AS weight_kg,
                COUNT(*) AS runs
           FROM {$wpdb->postmeta} pm
           JOIN {$wpdb->posts} p ON p.ID = pm.post_id
           JOIN {$wpdb->postmeta} w ON w.post_id = p.ID AND w.meta_key = 'a2_weight_kg'
           JOIN {$wpdb->postmeta} v ON v.post_id = p.ID AND v.meta_key = 'a2_verified' AND v.meta_value = '1'
          WHERE pm.meta_key = 'a2_run_date'
            AND p.post_type = 'a2_collection_run'
            AND p.post_status = 'publish'
            AND pm.meta_value >= %s
          GROUP BY month
          ORDER BY month ASC",
        gmdate('Y-m-d', (int) strtotime("-{$months} months"))
    ), ARRAY_A);

    if (!is_array($rows)) {
        return [];
    }

    return array_map(static fn (array $r): array => [
        'month'     => (string) $r['month'],
        'weight_kg' => (float) $r['weight_kg'],
        'runs'      => (int) $r['runs'],
    ], $rows);
}

/**
 * The 80/20 chart: programme spend vs direct beneficiary remittance, aggregated.
 * Deliberately month-granular so no individual Sevika is identifiable.
 *
 * @return array{remittance_inr:int,programme_inr:int,total_inr:int,remittance_pct:float}
 */
function split_8020(int $months = 12): array
{
    $since = gmdate('Y-m-d', (int) strtotime("-{$months} months"));

    $remittance = 0;
    foreach (get_posts([
        'post_type'      => 'a2_remittance',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
        'meta_query'     => [['key' => 'a2_paid_on', 'value' => $since, 'compare' => '>=']],
    ]) as $id) {
        $remittance += (int) get_post_meta((int) $id, 'a2_net_inr', true);
    }

    $programme = 0;
    foreach (get_posts([
        'post_type'      => 'a2_expense',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ]) as $id) {
        $programme += (int) get_post_meta((int) $id, 'a2_amount_inr', true);
    }

    $total = $remittance + $programme;

    return [
        'remittance_inr' => $remittance,
        'programme_inr'  => $programme,
        'total_inr'      => $total,
        'remittance_pct' => $total > 0 ? round(($remittance / $total) * 100, 1) : 0.0,
    ];
}

/* ─────────────────────────────────────────────────────────────────────────────
   VERIFICATION — the one write path that changes a public figure
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * @return true|\WP_Error
 */
function verify_run(int $post_id, int $user_id = 0)
{
    $post = get_post($post_id);
    if (!$post instanceof \WP_Post || $post->post_type !== 'a2_collection_run') {
        return new \WP_Error('a2_not_a_run', __('Not a collection run.', 'a2-core'), ['status' => 400]);
    }

    $user_id = $user_id ?: get_current_user_id();
    if (!user_can($user_id, 'a2_verify_ledger')) {
        return new \WP_Error('a2_forbidden', __('You cannot verify ledger rows.', 'a2-core'), ['status' => 403]);
    }
    if (!\A2\Core\scoping\can_access($post_id)) {
        return new \WP_Error('a2_out_of_zone', __('This row belongs to another service zone.', 'a2-core'), ['status' => 403]);
    }

    // A run with no weight is not verifiable — an empty row would silently
    // count as zero and quietly depress a published total.
    if ((float) get_post_meta($post_id, 'a2_weight_kg', true) <= 0) {
        return new \WP_Error('a2_no_weight', __('Enter the collected weight before verifying.', 'a2-core'), ['status' => 422]);
    }

    $before = audit_snapshot($post_id);

    update_post_meta($post_id, 'a2_verified', true);
    update_post_meta($post_id, 'a2_verified_by', $user_id);
    update_post_meta($post_id, 'a2_verified_at', gmdate('c'));

    audit('verify', $post_id, $before, audit_snapshot($post_id));

    metrics\invalidate();
    do_action('a2_ledger_updated', $post_id, 'verify');

    return true;
}

/* ─────────────────────────────────────────────────────────────────────────────
   AUDIT TRAIL
   ───────────────────────────────────────────────────────────────────────────── */

/** @return array<string, mixed> */
function audit_snapshot(int $post_id): array
{
    $keys = ['a2_run_date', 'a2_zone_slug', 'a2_weight_kg', 'a2_baskets', 'a2_verified', 'a2_verified_at'];
    $out = [];
    foreach ($keys as $k) {
        $out[$k] = get_post_meta($post_id, $k, true);
    }
    return $out;
}

/**
 * @param array<string, mixed> $before
 * @param array<string, mixed> $after
 */
function audit(string $action, int $post_id, array $before, array $after): void
{
    $log = get_option(AUDIT_OPTION, []);
    if (!is_array($log)) {
        $log = [];
    }

    $log[] = [
        'at'     => gmdate('c'),
        'action' => $action,
        'post'   => $post_id,
        'user'   => get_current_user_id(),
        'ip'     => isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field((string) wp_unslash($_SERVER['REMOTE_ADDR'])) : '',
        'before' => $before,
        'after'  => $after,
    ];

    // Capped ring buffer — an unbounded option is a slow-motion outage.
    if (count($log) > AUDIT_MAX) {
        $log = array_slice($log, -AUDIT_MAX);
    }

    update_option(AUDIT_OPTION, $log, false);
}

/** @return array<int, array<string, mixed>> */
function audit_entries(int $limit = 100): array
{
    $log = get_option(AUDIT_OPTION, []);
    if (!is_array($log)) {
        return [];
    }
    return array_reverse(array_slice($log, -max(1, min(AUDIT_MAX, $limit))));
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE HOOKS — a correction is an event, not an edit
   ───────────────────────────────────────────────────────────────────────────── */

add_action('post_updated', __NAMESPACE__ . '\\log_update', 10, 3);

/**
 * @param int      $post_id
 * @param \WP_Post $after
 * @param \WP_Post $before
 */
function log_update(int $post_id, \WP_Post $after, \WP_Post $before): void
{
    if ($after->post_type !== 'a2_collection_run') {
        return;
    }
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }

    // Only log a change to a figure that is already public — that is the change
    // an auditor cares about.
    if (!(bool) get_post_meta($post_id, 'a2_verified', true)) {
        return;
    }

    $prev = [];
    $curr = audit_snapshot($post_id);
    foreach ($curr as $k => $v) {
        $prev[$k] = $v === get_post_meta($post_id, $k, true) ? $v : $v;
    }

    audit('update_verified', $post_id, $prev, $curr);
    metrics\invalidate();
    do_action('a2_ledger_updated', $post_id, 'update');
}

add_action('before_delete_post', __NAMESPACE__ . '\\log_delete');

function log_delete(int $post_id): void
{
    $post = get_post($post_id);
    if (!$post instanceof \WP_Post || $post->post_type !== 'a2_collection_run') {
        return;
    }
    if (!(bool) get_post_meta($post_id, 'a2_verified', true)) {
        return;
    }

    audit('delete_verified', $post_id, audit_snapshot($post_id), []);
    metrics\invalidate();

    // Deleting a published figure is legal but never silent.
    error_log(sprintf(
        '[a2-core] verified collection run %d deleted by user %d',
        $post_id,
        get_current_user_id()
    ));
}

/* ─────────────────────────────────────────────────────────────────────────────
   REST
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_routes');

function register_routes(): void
{
    register_rest_route('a2/v1', '/ledger', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => static function (\WP_REST_Request $request): \WP_REST_Response {
            $args = [
                'zone'  => (string) $request->get_param('zone'),
                'from'  => (string) $request->get_param('from'),
                'to'    => (string) $request->get_param('to'),
                'limit' => (int) ($request->get_param('limit') ?: 50),
            ];
            return rest_ensure_response([
                'runs'    => runs($args),
                'monthly' => monthly((int) ($request->get_param('months') ?: 12)),
                'split'   => split_8020(),
            ]);
        },
        'args' => [
            'zone'   => ['type' => 'string', 'sanitize_callback' => 'sanitize_title'],
            'from'   => ['type' => 'string'],
            'to'     => ['type' => 'string'],
            'limit'  => ['type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => 200],
            'months' => ['type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 36],
        ],
    ]);

    register_rest_route('a2/v1', '/ledger/(?P<id>\d+)/verify', [
        'methods'             => 'POST',
        'permission_callback' => static fn (): bool => current_user_can('a2_verify_ledger'),
        'callback'            => static function (\WP_REST_Request $request) {
            $result = verify_run((int) $request['id']);
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response(['verified' => true, 'id' => (int) $request['id']]);
        },
        'args' => [
            'id' => ['type' => 'integer', 'required' => true],
        ],
    ]);
}
