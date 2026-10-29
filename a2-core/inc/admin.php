<?php
/**
 * ADMIN — the operator's view of the governance machinery
 * =======================================================
 *
 * Everything an in-house operator needs to run the platform without a
 * developer: a dashboard that says what is live and what is blocked, the
 * compliance switch panel, the ledger verification queue, and the audit log.
 *
 * The organising principle is that the screen must make the *dangerous* state
 * obvious. A switch that is ON looks different from one that is OFF; a figure
 * with no source rows says "—" and shows why; a term-charter hit shows the
 * replacement, not just the offence.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\admin;

use A2\Core\metrics;
use A2\Core\ledger;
use A2\Core\switches;
use A2\Core\roles;

if (!defined('ABSPATH')) {
    exit;
}

const SLUG = 'a2-core';

add_action('admin_menu', __NAMESPACE__ . '\\menu');
add_action('admin_init', __NAMESPACE__ . '\\handle_switch_post');
add_action('admin_enqueue_scripts', __NAMESPACE__ . '\\assets');

function menu(): void
{
    add_menu_page(
        __('A2 Platform', 'a2-core'),
        __('A2 Platform', 'a2-core'),
        'a2_view_metrics',
        SLUG,
        __NAMESPACE__ . '\\render_dashboard',
        'dashicons-shield-alt',
        3
    );

    add_submenu_page(SLUG, __('Overview', 'a2-core'), __('Overview', 'a2-core'), 'a2_view_metrics', SLUG, __NAMESPACE__ . '\\render_dashboard');

    add_submenu_page(
        SLUG,
        __('Compliance switches', 'a2-core'),
        __('Compliance', 'a2-core'),
        'a2_manage_switches',
        SLUG . '-switches',
        __NAMESPACE__ . '\\render_switches'
    );

    add_submenu_page(
        SLUG,
        __('Ledger verification', 'a2-core'),
        __('Ledger', 'a2-core'),
        'a2_view_ledger',
        SLUG . '-ledger',
        __NAMESPACE__ . '\\render_ledger'
    );

    add_submenu_page(
        SLUG,
        __('Audit log', 'a2-core'),
        __('Audit log', 'a2-core'),
        'a2_view_audit_log',
        SLUG . '-audit',
        __NAMESPACE__ . '\\render_audit'
    );
}

function assets(string $hook): void
{
    if (!str_contains($hook, SLUG)) {
        return;
    }
    wp_enqueue_style(
        'a2-admin',
        plugins_url('assets/css/admin.css', A2_CORE_FILE),
        [],
        A2_CORE_VERSION
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OVERVIEW
   ───────────────────────────────────────────────────────────────────────────── */

function render_dashboard(): void
{
    if (!current_user_can('a2_view_metrics')) {
        wp_die(esc_html__('You do not have access to this page.', 'a2-core'), 403);
    }

    $snapshot = metrics\snapshot(true);
    $all_switches = switches\all();
    $pending = count(get_posts([
        'post_type'      => 'a2_collection_run',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'meta_query'     => [['key' => 'a2_verified', 'value' => '1', 'compare' => '!=']],
    ]));
    ?>
    <div class="wrap a2-admin">
        <h1><?php esc_html_e('A2 Platform overview', 'a2-core'); ?></h1>
        <p class="a2-lede">
            <?php esc_html_e('These four figures are what the homepage publishes. Every one is derived from records below — nothing here is typed by hand.', 'a2-core'); ?>
        </p>

        <div class="a2-cards">
            <?php foreach ($snapshot as $key => $row) : ?>
                <div class="a2-card<?php echo $row['has_data'] ? '' : ' a2-card--empty'; ?>">
                    <span class="a2-card__value"><?php echo esc_html($row['value']); ?></span>
                    <span class="a2-card__label"><?php echo esc_html($row['label']); ?></span>
                    <span class="a2-card__target">
                        <?php
                        printf(
                            /* translators: %s: year-1 target */
                            esc_html__('Target — Year 1: %s', 'a2-core'),
                            esc_html($row['target'])
                        );
                        ?>
                    </span>
                    <span class="a2-card__meta">
                        <?php
                        printf(
                            /* translators: %s: ISO date */
                            esc_html__('as of %s', 'a2-core'),
                            esc_html($row['as_of'])
                        );
                        ?>
                    </span>
                    <?php if (!$row['has_data']) : ?>
                        <span class="a2-card__note">
                            <?php esc_html_e('No source rows yet — the site renders "—" rather than a figure.', 'a2-core'); ?>
                        </span>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <h2><?php esc_html_e('What is live', 'a2-core'); ?></h2>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th><?php esc_html_e('Compliance switch', 'a2-core'); ?></th>
                    <th><?php esc_html_e('State', 'a2-core'); ?></th>
                    <th><?php esc_html_e('Legal trigger', 'a2-core'); ?></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($all_switches as $key => $row) : ?>
                <tr>
                    <td><strong><?php echo esc_html($row['label']); ?></strong></td>
                    <td>
                        <span class="a2-pill <?php echo $row['enabled'] ? 'a2-pill--on' : 'a2-pill--off'; ?>">
                            <?php echo $row['enabled'] ? esc_html__('ON', 'a2-core') : esc_html__('OFF', 'a2-core'); ?>
                        </span>
                    </td>
                    <td><?php echo esc_html($row['trigger']); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <h2><?php esc_html_e('Needs attention', 'a2-core'); ?></h2>
        <ul class="a2-list">
            <li>
                <?php
                printf(
                    /* translators: %d: number of unverified runs */
                    esc_html(_n('%d collection run is waiting to be verified.', '%d collection runs are waiting to be verified.', $pending, 'a2-core')),
                    (int) $pending
                );
                ?>
                <?php if ($pending > 0) : ?>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=' . SLUG . '-ledger')); ?>"><?php esc_html_e('Review', 'a2-core'); ?></a>
                <?php endif; ?>
            </li>
        </ul>
    </div>
    <?php
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPLIANCE SWITCHES
   ───────────────────────────────────────────────────────────────────────────── */

function handle_switch_post(): void
{
    if (!isset($_POST['a2_switch_action']) || $_POST['a2_switch_action'] !== 'set') {
        return;
    }
    if (!current_user_can('a2_manage_switches')) {
        wp_die(esc_html__('You cannot change compliance switches.', 'a2-core'), 403);
    }
    check_admin_referer('a2_switch_set');

    $key = isset($_POST['key']) ? sanitize_key((string) wp_unslash($_POST['key'])) : '';
    $value = isset($_POST['value']) && $_POST['value'] === '1';
    $reason = isset($_POST['reason']) ? sanitize_text_field((string) wp_unslash($_POST['reason'])) : '';

    // A reason is mandatory. A compliance switch flipped with no stated cause is
    // indistinguishable, six months later, from a mistake.
    if (mb_strlen($reason) < 10) {
        wp_safe_redirect(add_query_arg('a2_error', 'reason_required', admin_url('admin.php?page=' . SLUG . '-switches')));
        exit;
    }

    switches\set($key, $value, $reason);

    wp_safe_redirect(add_query_arg('a2_ok', '1', admin_url('admin.php?page=' . SLUG . '-switches')));
    exit;
}

function render_switches(): void
{
    if (!current_user_can('a2_manage_switches')) {
        wp_die(esc_html__('You do not have access to this page.', 'a2-core'), 403);
    }

    $rows = switches\all();
    $log = switches\log_entries(50);
    ?>
    <div class="wrap a2-admin">
        <h1><?php esc_html_e('Compliance switches', 'a2-core'); ?></h1>

        <?php if (isset($_GET['a2_error']) && $_GET['a2_error'] === 'reason_required') : ?>
            <div class="notice notice-error"><p><?php esc_html_e('Enter a reason of at least 10 characters. The reason is recorded in the audit log.', 'a2-core'); ?></p></div>
        <?php endif; ?>
        <?php if (isset($_GET['a2_ok'])) : ?>
            <div class="notice notice-success"><p><?php esc_html_e('Switch updated and logged.', 'a2-core'); ?></p></div>
        <?php endif; ?>

        <p class="a2-lede">
            <?php esc_html_e('Each switch represents a legal or contractual condition. It stays OFF until that condition is actually met — not until it is expected to be met.', 'a2-core'); ?>
        </p>

        <table class="widefat">
            <thead>
                <tr>
                    <th style="width:24%"><?php esc_html_e('Switch', 'a2-core'); ?></th>
                    <th><?php esc_html_e('Enable only when', 'a2-core'); ?></th>
                    <th style="width:10%"><?php esc_html_e('State', 'a2-core'); ?></th>
                    <th style="width:34%"><?php esc_html_e('Change', 'a2-core'); ?></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($rows as $key => $row) : ?>
                <tr>
                    <td>
                        <strong><?php echo esc_html($row['label']); ?></strong>
                        <?php if ($row['danger']) : ?>
                            <br /><span class="a2-danger"><?php esc_html_e('Makes a legal claim', 'a2-core'); ?></span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo esc_html($row['trigger']); ?></td>
                    <td>
                        <span class="a2-pill <?php echo $row['enabled'] ? 'a2-pill--on' : 'a2-pill--off'; ?>">
                            <?php echo $row['enabled'] ? esc_html__('ON', 'a2-core') : esc_html__('OFF', 'a2-core'); ?>
                        </span>
                    </td>
                    <td>
                        <form method="post">
                            <?php wp_nonce_field('a2_switch_set'); ?>
                            <input type="hidden" name="a2_switch_action" value="set" />
                            <input type="hidden" name="key" value="<?php echo esc_attr($key); ?>" />
                            <input type="hidden" name="value" value="<?php echo $row['enabled'] ? '0' : '1'; ?>" />
                            <label style="display:block;margin-bottom:6px">
                                <?php esc_html_e('Reason (recorded)', 'a2-core'); ?>
                                <input type="text" name="reason" class="regular-text" required minlength="10" />
                            </label>
                            <button type="submit" class="button<?php echo $row['danger'] && !$row['enabled'] ? ' button-primary' : ''; ?>">
                                <?php echo $row['enabled'] ? esc_html__('Turn off', 'a2-core') : esc_html__('Turn on', 'a2-core'); ?>
                            </button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <h2><?php esc_html_e('Recent changes', 'a2-core'); ?></h2>
        <?php if ($log === []) : ?>
            <p><?php esc_html_e('No switch has been changed since install. This is the expected state.', 'a2-core'); ?></p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('When', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Switch', 'a2-core'); ?></th>
                        <th><?php esc_html_e('To', 'a2-core'); ?></th>
                        <th><?php esc_html_e('By', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Reason', 'a2-core'); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($log as $entry) : ?>
                    <tr>
                        <td><code><?php echo esc_html((string) ($entry['at'] ?? '')); ?></code></td>
                        <td><?php echo esc_html((string) ($entry['key'] ?? '')); ?></td>
                        <td><?php echo !empty($entry['enabled']) ? esc_html__('ON', 'a2-core') : esc_html__('OFF', 'a2-core'); ?></td>
                        <td><?php echo esc_html((string) ($entry['user'] ?? '')); ?></td>
                        <td><?php echo esc_html((string) ($entry['reason'] ?? '')); ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    <?php
}

/* ─────────────────────────────────────────────────────────────────────────────
   LEDGER VERIFICATION
   ───────────────────────────────────────────────────────────────────────────── */

function render_ledger(): void
{
    if (!current_user_can('a2_view_ledger')) {
        wp_die(esc_html__('You do not have access to this page.', 'a2-core'), 403);
    }

    if (isset($_POST['a2_verify_run'])) {
        check_admin_referer('a2_verify_run');
        $id = isset($_POST['run_id']) ? absint(wp_unslash($_POST['run_id'])) : 0;
        $result = ledger\verify_run($id);
        $class = is_wp_error($result) ? 'notice-error' : 'notice-success';
        $message = is_wp_error($result) ? $result->get_error_message() : __('Run verified. It is now part of the public ledger.', 'a2-core');
        printf('<div class="notice %s"><p>%s</p></div>', esc_attr($class), esc_html($message));
    }

    $unverified = get_posts([
        'post_type'      => 'a2_collection_run',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'meta_query'     => [['key' => 'a2_verified', 'value' => '1', 'compare' => '!=']],
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    ?>
    <div class="wrap a2-admin">
        <h1><?php esc_html_e('Ledger verification', 'a2-core'); ?></h1>
        <p class="a2-lede">
            <?php esc_html_e('A collection run contributes to the published tonne figure only after it is verified here. Verification records who did it and when.', 'a2-core'); ?>
        </p>

        <?php if ($unverified === []) : ?>
            <p><?php esc_html_e('Nothing is waiting. Every published run has been verified.', 'a2-core'); ?></p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Run date', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Zone', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Weight (kg)', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Baskets', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Temples', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Action', 'a2-core'); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($unverified as $post) : ?>
                    <?php
                    $weight = (float) get_post_meta($post->ID, 'a2_weight_kg', true);
                    $allowed = \A2\Core\scoping\can_access($post->ID);
                    ?>
                    <tr>
                        <td><?php echo esc_html((string) get_post_meta($post->ID, 'a2_run_date', true)); ?></td>
                        <td><?php echo esc_html((string) get_post_meta($post->ID, 'a2_zone_slug', true)); ?></td>
                        <td<?php echo $weight <= 0 ? ' class="a2-danger"' : ''; ?>>
                            <?php echo $weight > 0 ? esc_html(number_format_i18n($weight, 1)) : esc_html__('missing', 'a2-core'); ?>
                        </td>
                        <td><?php echo esc_html((string) (int) get_post_meta($post->ID, 'a2_baskets', true)); ?></td>
                        <td><?php echo esc_html((string) (int) get_post_meta($post->ID, 'a2_temples_covered', true)); ?></td>
                        <td>
                            <?php if (!$allowed) : ?>
                                <em><?php esc_html_e('Other zone', 'a2-core'); ?></em>
                            <?php elseif (!current_user_can('a2_verify_ledger')) : ?>
                                <em><?php esc_html_e('Read only', 'a2-core'); ?></em>
                            <?php elseif ($weight <= 0) : ?>
                                <a href="<?php echo esc_url((string) get_edit_post_link($post->ID)); ?>"><?php esc_html_e('Enter weight first', 'a2-core'); ?></a>
                            <?php else : ?>
                                <form method="post" style="margin:0">
                                    <?php wp_nonce_field('a2_verify_run'); ?>
                                    <input type="hidden" name="run_id" value="<?php echo esc_attr((string) $post->ID); ?>" />
                                    <button type="submit" name="a2_verify_run" value="1" class="button button-primary">
                                        <?php esc_html_e('Verify', 'a2-core'); ?>
                                    </button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    <?php
}

/* ─────────────────────────────────────────────────────────────────────────────
   AUDIT LOG
   ───────────────────────────────────────────────────────────────────────────── */

function render_audit(): void
{
    if (!current_user_can('a2_view_audit_log')) {
        wp_die(esc_html__('You do not have access to this page.', 'a2-core'), 403);
    }

    $entries = ledger\audit_entries(100);
    ?>
    <div class="wrap a2-admin">
        <h1><?php esc_html_e('Audit log', 'a2-core'); ?></h1>
        <p class="a2-lede">
            <?php esc_html_e('Two things are logged: a change to a ledger figure that is already public, and every compliance switch change. Nothing else needs a paper trail; everything else is reversible.', 'a2-core'); ?>
        </p>

        <?php if ($entries === []) : ?>
            <p><?php esc_html_e('Empty. No public figure has been corrected and no switch has been changed.', 'a2-core'); ?></p>
        <?php else : ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('When', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Action', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Record', 'a2-core'); ?></th>
                        <th><?php esc_html_e('User', 'a2-core'); ?></th>
                        <th><?php esc_html_e('Before → after', 'a2-core'); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($entries as $entry) : ?>
                    <tr>
                        <td><code><?php echo esc_html((string) ($entry['at'] ?? '')); ?></code></td>
                        <td><?php echo esc_html((string) ($entry['action'] ?? '')); ?></td>
                        <td><?php echo esc_html((string) ($entry['post'] ?? '')); ?></td>
                        <td><?php echo esc_html((string) ($entry['user'] ?? '')); ?></td>
                        <td>
                            <details>
                                <summary><?php esc_html_e('Show diff', 'a2-core'); ?></summary>
                                <pre style="white-space:pre-wrap;font-size:11px"><?php
                                    echo esc_html((string) wp_json_encode(
                                        ['before' => $entry['before'] ?? [], 'after' => $entry['after'] ?? []],
                                        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
                                    ));
                                ?></pre>
                            </details>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    <?php
}
