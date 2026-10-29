<?php
/**
 * Plugin Name:       A2 Core — Seva Platform Engine
 * Plugin URI:        https://a2foundation.in
 * Description:       Content model, roles, scoping, term charter, ledger, contributions and compliance switches for the A2 Foundation platform. Business logic only — presentation lives in the a2-ekamra theme.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      8.2
 * Author:            A2 Foundation web team
 * License:           GPL-2.0-or-later
 * Text Domain:       a2-core
 * Update URI:        false
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS PLUGIN IS
 * ─────────────────────────────────────────────────────────────────────────────
 * The engine half of the A2 Foundation platform, per
 * A2-FOUNDATION-FINAL-PLATFORM-BLUEPRINT.pdf §11.1:
 *
 *   "All business logic in the custom plugin a2-core — CPTs, taxonomies, roles,
 *    scoping, term-charter filter, workflows, dashboards, REST endpoints, PDF
 *    templates, PWA service worker. Nothing in functions.php."
 *
 * It is seeded from the Setu Foundation reference build (ngo-site-reference),
 * which proved these patterns in production shape: registered meta with
 * sanitise + auth callbacks, a flat REST namespace so the front-end never walks
 * `_embedded`, an HMAC-verified gateway webhook, nonce-guarded meta boxes, and
 * fire-and-forget cache revalidation. Those were kept. What changed:
 *
 *   • 3 post types  → 26 (blueprint §8), with the public/private boundary of the
 *     three-layer architecture encoded in each registration
 *   • no roles       → 9-role matrix + row-level zone scoping (§9)
 *   • no term charter → enforced on save AND in CI (§4.2)
 *   • "donation"     → Voluntary Contribution, gated behind a compliance switch (§13)
 *   • no metric discipline → every counter renders from the metric subsystem (§12)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SAFETY POSTURE
 * ─────────────────────────────────────────────────────────────────────────────
 * The foundation is UNREGISTERED (§13). Every legally-gated capability is OFF:
 * 80G receipts, international payments, CSR grant acceptance, public commerce.
 * They are not commented out — they are behind admin switches that default to
 * FALSE, so enabling one is a deliberate, logged act rather than a code edit.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core;

// Every PHP file in this plugin starts this way.
if (!defined('ABSPATH')) {
    exit;
}

const VERSION    = '0.1.0';
const SCHEMA     = '1';       // bump when the CPT/meta register changes
const MIN_PHP    = '8.2';

define('A2_CORE_FILE', __FILE__);
define('A2_CORE_PATH', plugin_dir_path(__FILE__));
define('A2_CORE_URL', plugin_dir_url(__FILE__));
define('A2_CORE_VERSION', VERSION); // used for asset cache busting

/**
 * Refuse to boot on an unsupported PHP version rather than fatal halfway
 * through a page render.
 */
if (version_compare(PHP_VERSION, MIN_PHP, '<')) {
    add_action('admin_notices', static function (): void {
        printf(
            '<div class="notice notice-error"><p>%s</p></div>',
            esc_html(sprintf(
                /* translators: 1: required version, 2: current version */
                __('A2 Core requires PHP %1$s or newer. This server runs %2$s. The plugin has not loaded.', 'a2-core'),
                MIN_PHP,
                PHP_VERSION
            ))
        );
    });
    return;
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. CONFIGURATION — set in wp-config.php, never in the database
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * The origin allowed to read the REST API.
 *
 *   define('A2_FRONTEND_ORIGIN', 'https://a2foundation.in');
 */
function frontend_origin(): string
{
    return defined('A2_FRONTEND_ORIGIN')
        ? untrailingslashit((string) A2_FRONTEND_ORIGIN)
        : 'http://localhost:3100';
}

/**
 * Shared secret for on-demand cache revalidation (`X-A2-Secret`).
 * Rotate by editing wp-config.php; it never touches the database.
 */
function revalidate_secret(): string
{
    return defined('A2_REVALIDATE_SECRET') ? (string) A2_REVALIDATE_SECRET : '';
}

/**
 * Razorpay keys. Absent keys mean "manual mode": intents are recorded and no
 * order is created, so the site is safe to run before the gateway is live.
 */
function razorpay_key_id(): string
{
    return defined('A2_RAZORPAY_KEY_ID') ? (string) A2_RAZORPAY_KEY_ID : '';
}

function razorpay_key_secret(): string
{
    return defined('A2_RAZORPAY_KEY_SECRET') ? (string) A2_RAZORPAY_KEY_SECRET : '';
}

function razorpay_webhook_secret(): string
{
    return defined('A2_RAZORPAY_WEBHOOK_SECRET') ? (string) A2_RAZORPAY_WEBHOOK_SECRET : '';
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. BOOT ORDER
   Deliberately explicit. `cpt` must register before `meta` (meta boxes attach to
   post types) and before `roles` (capability mapping reads post types).
   ───────────────────────────────────────────────────────────────────────────── */

require_once A2_CORE_PATH . 'inc/terms.php';       // no dependencies — used by everything
require_once A2_CORE_PATH . 'inc/switches.php';    // compliance gates — read by cpt/rest/contributions
require_once A2_CORE_PATH . 'inc/cpt.php';
require_once A2_CORE_PATH . 'inc/taxonomies.php';
require_once A2_CORE_PATH . 'inc/roles.php';
require_once A2_CORE_PATH . 'inc/scoping.php';
require_once A2_CORE_PATH . 'inc/meta.php';
require_once A2_CORE_PATH . 'inc/metrics.php';
require_once A2_CORE_PATH . 'inc/ledger.php';
require_once A2_CORE_PATH . 'inc/contributions.php';
require_once A2_CORE_PATH . 'inc/rest.php';
require_once A2_CORE_PATH . 'inc/security.php';
require_once A2_CORE_PATH . 'inc/revalidate.php';
require_once A2_CORE_PATH . 'inc/admin.php';

register_activation_hook(__FILE__, static function (): void {
    cpt\register_post_types();
    taxonomies\register_taxonomies();
    roles\install_roles();
    switches\install_defaults();
    flush_rewrite_rules();

    // Record what this install is running, so support can ask one question.
    update_option('a2_core_version', VERSION, false);
    update_option('a2_core_schema', SCHEMA, false);
});

register_deactivation_hook(__FILE__, static function (): void {
    // Roles and switches are intentionally NOT removed on deactivation: deleting
    // roles orphans every user who holds one, and silently re-enabling 80G
    // receipts because someone toggled a plugin is worse than leaving it off.
    flush_rewrite_rules();
});

/**
 * Health line for the deploy pipeline — mirrors Setu's `/setu/v1/health`.
 */
add_action('rest_api_init', static function (): void {
    register_rest_route('a2/v1', '/health', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => static fn (): array => [
            'ok'            => true,
            'plugin'        => VERSION,
            'schema'        => SCHEMA,
            'wp_version'    => get_bloginfo('version'),
            'php_version'   => PHP_VERSION,
            'origin'        => frontend_origin(),
            'switches'      => switches\all(),
            'time'          => gmdate('c'),
        ],
    ]);
});
