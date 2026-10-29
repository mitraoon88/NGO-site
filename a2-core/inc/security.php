<?php
/**
 * SECURITY BASELINE — blueprint §13
 * ==================================
 *
 * Ported near-verbatim from Setu's `inc/security.php`. That file was the
 * strongest thing in the seed codebase and most of it is kept unchanged,
 * because these are all cases where the default WordPress behaviour is a
 * liability rather than a feature.
 *
 * Every rule below is a *default-off* decision: the platform turns a capability
 * off and the developer turns it back on if a specific need appears. That is the
 * opposite of WordPress's own posture and it is the right way round for a site
 * that holds beneficiary records.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\security;

if (!defined('ABSPATH')) {
    exit;
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. ATTACK SURFACE
   ───────────────────────────────────────────────────────────────────────────── */

// XML-RPC is not used by anything in this platform and is a password-brute-force
// vector (system.multicall). Off, not filtered.
add_filter('xmlrpc_enabled', '__return_false');

// Pingbacks/trackbacks: same class of problem, no reader value.
add_filter('xmlrpc_methods', static function (array $methods): array {
    unset($methods['pingback.ping'], $methods['pingback.extensions.getPingbacks']);
    return $methods;
});

add_filter('wp_headers', static function (array $headers): array {
    unset($headers['X-Pingback']);
    return $headers;
});

/* ─────────────────────────────────────────────────────────────────────────────
   2. USER ENUMERATION
   ───────────────────────────────────────────────────────────────────────────── */

// `?author=1` redirects to /author/admin/ and leaks the login name. A 301 to the
// front page keeps old links alive without answering the question.
add_action('template_redirect', static function (): void {
    if (isset($_GET['author']) && !is_admin()) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

// The users endpoint is a full staff directory when left open.
add_filter('rest_endpoints', static function (array $endpoints): array {
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

// Author archives render a post list per user — same leak, different door.
add_action('template_redirect', static function (): void {
    if (is_author()) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

add_filter('rest_user_query', static function (array $args): array {
    // Even logged-in subscribers cannot page through other accounts.
    if (!current_user_can('list_users')) {
        $args['include'] = [get_current_user_id()];
    }
    return $args;
});

/* ─────────────────────────────────────────────────────────────────────────────
   3. CONTENT SURFACE
   ───────────────────────────────────────────────────────────────────────────── */

// Comments are off platform-wide. A comments table on a beneficiary-facing site
// is a moderation liability with no upside.
add_filter('comments_open', '__return_false', 20);
add_filter('pings_open', '__return_false', 20);
add_filter('comments_array', static fn (): array => [], 10);

// The generator meta tag advertises the exact version to scan for.
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// Version query strings on assets are fine in public; stripping them is a
// cargo-cult practice. Left alone deliberately — noted here so nobody adds it
// and breaks cache busting.

/* ─────────────────────────────────────────────────────────────────────────────
   4. UPLOADS
   ───────────────────────────────────────────────────────────────────────────── */

// A 6000px phone photo will not be resized by WordPress and will be served at
// full size forever. 4000 px is the ceiling Setu chose; it is generous enough for
// print-adjacent PDFs and small enough to survive a bad upload.
add_filter('big_image_size_threshold', static fn (): int => 4000);

// Uploaded SVGs can carry script. Allowed only for administrators, who are
// trusted with unfiltered HTML anyway.
add_filter('upload_mimes', static function (array $mimes): array {
    if (!current_user_can('manage_options')) {
        unset($mimes['svg'], $mimes['svgz']);
    }
    return $mimes;
});

add_filter('wp_check_filetype_and_ext', static function ($data, $file, $filename, $mimes) {
    if (current_user_can('manage_options') && str_ends_with(strtolower((string) $filename), '.svg')) {
        $data['type'] = 'image/svg+xml';
        $data['ext'] = 'svg';
    }
    return $data;
}, 10, 4);

// Alt text is not optional on this site: the accessibility bar is contractual
// (§12.2). An image saved without alt text gets an admin notice, not silence.
add_action('admin_notices', static function (): void {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if ($screen === null || $screen->base !== 'post') {
        return;
    }
    $post_id = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : 0;
    $thumb_id = $post_id ? (int) get_post_thumbnail_id($post_id) : 0;
    if ($thumb_id === 0) {
        return;
    }
    if ((string) get_post_meta($thumb_id, '_wp_attachment_image_alt', true) !== '') {
        return;
    }
    ?>
    <div class="notice notice-warning">
        <p>
            <?php esc_html_e('The featured image has no alt text. Every image on this site needs a description — decorative images get an empty alt, informative ones get a sentence.', 'a2-core'); ?>
            <a href="<?php echo esc_url((string) get_edit_post_link($thumb_id)); ?>"><?php esc_html_e('Fix it', 'a2-core'); ?></a>
        </p>
    </div>
    <?php
});

/* ─────────────────────────────────────────────────────────────────────────────
   5. CAPABILITIES
   ───────────────────────────────────────────────────────────────────────────── */

// `unfiltered_html` allows raw <script>. Editors do not need it; only
// administrators do.
add_filter('map_meta_cap', static function (array $caps, string $cap, int $user_id): array {
    if ($cap === 'unfiltered_html' && !user_can($user_id, 'manage_options')) {
        return ['do_not_allow'];
    }
    return $caps;
}, 10, 3);

// Application passwords: a per-user API credential that bypasses 2FA. Not used
// here, so it is removed rather than left as an unmonitored door.
add_filter('wp_is_application_passwords_available', '__return_false');

/* ─────────────────────────────────────────────────────────────────────────────
   6. HEADERS
   ───────────────────────────────────────────────────────────────────────────── */

add_filter('wp_headers', static function (array $headers): array {
    $headers['X-Content-Type-Options'] = 'nosniff';
    $headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    $headers['X-Frame-Options'] = 'SAMEORIGIN';
    $headers['Permissions-Policy'] = 'geolocation=(self), camera=(), microphone=(), payment=(self)';
    return $headers;
});

/**
 * A note on CSP: it is NOT set here. The Next.js front end serves the public
 * pages and owns that header (see docs/13-integration.md). Setting a second,
 * weaker policy from WordPress would only apply to wp-admin and give a false
 * sense that the public site is covered.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   7. LOGIN HARDENING
   ───────────────────────────────────────────────────────────────────────────── */

// The login error must not distinguish "no such user" from "wrong password" —
// that difference is a username oracle.
add_filter('login_errors', static fn (): string => __('The credentials do not match an account.', 'a2-core'));

// Subscribers (Volunteers/Sevikas) never need wp-admin. Blocking it here is
// defence in depth behind the role's narrow capabilities (§9).
add_action('admin_init', static function (): void {
    if (wp_doing_ajax() || !is_user_logged_in()) {
        return;
    }
    if (!current_user_can('edit_posts') && !current_user_can('read') === false) {
        return;
    }
    $user = wp_get_current_user();
    if (in_array('a2_sevika', (array) $user->roles, true)) {
        wp_safe_redirect(home_url('/'));
        exit;
    }
});

/**
 * Disable the file editor. A compromised administrator account should not be
 * able to turn itself into arbitrary PHP execution.
 */
if (!defined('DISALLOW_FILE_EDIT')) {
    define('DISALLOW_FILE_EDIT', true);
}
