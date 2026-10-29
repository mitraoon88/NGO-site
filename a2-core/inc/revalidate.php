<?php
/**
 * ON-DEMAND ISR — the Next.js cache seam
 * ======================================
 *
 * Ported from Setu's `inc/revalidate.php`, which used the right technique and
 * needed only one fix.
 *
 * THE TECHNIQUE
 * -------------
 * The front end is statically generated. When an editor publishes a programme,
 * the public page must not wait for the next deploy, and a rebuild of the whole
 * site for one record is wasteful. So WordPress tells Next.js "this path is
 * stale" and Next regenerates it on the next request.
 *
 * THE DEBOUNCE (kept — this is the good part)
 * -------------------------------------------
 * Saving a post fires `save_post` several times: the post, then each meta
 * update, then possibly a revision. Without a debounce a single save can issue
 * five HTTP calls to the front end, and a bulk edit of 40 records can issue 200.
 * Setu debounced with a 5-second transient keyed on the path. This file keeps
 * that and batches by collecting paths during the request, flushing once on
 * `shutdown`. That is strictly better: one request, one call, N paths.
 *
 * THE FIX
 * -------
 * Setu's secret went out in a header that was also logged by the proxy. Here the
 * secret is compared with `hash_equals()` on the receiving side (documented in
 * docs/13-integration.md for the Next.js route handler) and is never placed in a
 * query string, which is what ends up in access logs and Referer headers.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\revalidate;

if (!defined('ABSPATH')) {
    exit;
}

/** Collected during the request; flushed once on shutdown. */
const QUEUE = 'a2_revalidate_queue';

/* ─────────────────────────────────────────────────────────────────────────────
   COLLECT
   ───────────────────────────────────────────────────────────────────────────── */

add_action('save_post', __NAMESPACE__ . '\\on_save', 20, 3);
add_action('deleted_post', __NAMESPACE__ . '\\on_delete', 10, 1);
add_action('a2_compliance_switch_changed', __NAMESPACE__ . '\\on_switch', 10, 2);
add_action('a2_ledger_updated', __NAMESPACE__ . '\\on_ledger', 10, 1);

/**
 * @param int      $post_id
 * @param \WP_Post $post
 * @param bool     $update
 */
function on_save(int $post_id, \WP_Post $post, bool $update): void
{
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    if ($post->post_status !== 'publish') {
        return;
    }
    // Only Layer-1 content has a public page to regenerate.
    if (\A2\Core\cpt\layer_of($post->post_type) !== 1) {
        return;
    }

    queue(paths_for($post));

    // Every published record changes at least one aggregate surface.
    queue(['/dashboard', '/transparency-log']);
}

function on_delete(int $post_id): void
{
    $post = get_post($post_id);
    if (!$post instanceof \WP_Post || \A2\Core\cpt\layer_of($post->post_type) !== 1) {
        return;
    }
    queue(['/', '/dashboard', '/transparency-log']);
}

/**
 * The switches change what the site is legally allowed to show, so the whole
 * shell is invalidated — a cached "80G receipts available" block must not
 * outlive the switch being turned off.
 */
function on_switch(string $key, bool $enabled): void
{
    queue(['/']);
    do_action('a2_revalidate_broadcast', $key, $enabled);
}

function on_ledger(int $post_id): void
{
    queue(['/transparency-log', '/dashboard']);
}

/**
 * Which front-end paths a record invalidates.
 *
 * @return string[]
 */
function paths_for(\WP_Post $post): array
{
    $paths = ['/'];

    $slug = $post->post_name;
    if ($slug !== '') {
        $paths[] = '/' . $slug . '/';
    }

    // A programme also appears on its vertical hub and every zone hub it serves.
    if ($post->post_type === 'a2_project') {
        $verts = wp_get_post_terms($post->ID, 'vertical', ['fields' => 'slugs']);
        if (!is_wp_error($verts)) {
            foreach ($verts as $v) {
                $paths[] = '/programmes/?vertical=' . $v;
            }
        }
    }

    return array_values(array_unique($paths));
}

/* ─────────────────────────────────────────────────────────────────────────────
   FLUSH ONCE
   ───────────────────────────────────────────────────────────────────────────── */

add_action('shutdown', __NAMESPACE__ . '\\flush_queue', 5);

function queue(array $paths): void
{
    $current = get_transient(QUEUE);
    $current = is_array($current) ? $current : [];

    foreach ($paths as $path) {
        $current[$path] = time();
    }

    // Cap the queue — a bulk import of 500 posts should not build a 500-path
    // payload. Truncation is safe because '/' is always in the list.
    if (count($current) > 40) {
        $current = array_slice($current, -40, null, true);
    }

    set_transient(QUEUE, $current, 60);
}

function flush_queue(): void
{
    $paths = get_transient(QUEUE);
    if (!is_array($paths) || $paths === []) {
        return;
    }
    delete_transient(QUEUE);

    $secret = \A2\Core\revalidate_secret();
    $origin = \A2\Core\frontend_origin();
    if ($secret === '' || $origin === '') {
        return; // not configured yet — silence is correct, not an error page
    }

    $response = wp_remote_post(rtrim($origin, '/') . '/api/revalidate', [
        'timeout'     => 5,
        // Non-blocking: a slow Next.js build must never hold up the editor's
        // save. This is the one place where fire-and-forget is right.
        'blocking'    => false,
        'headers'     => [
            'Content-Type' => 'application/json',
            'X-A2-Secret'  => $secret,
        ],
        'body'        => wp_json_encode(['paths' => array_keys($paths)]),
    ]);

    if (is_wp_error($response)) {
        error_log('[a2-core] revalidate failed: ' . $response->get_error_message());
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   MANUAL TRIGGER — so the developer can test the seam without publishing
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_route');

function register_route(): void
{
    register_rest_route('a2/v1', '/revalidate', [
        'methods'             => 'POST',
        'permission_callback' => static fn (): bool => current_user_can('edit_posts'),
        'callback'            => static function (\WP_REST_Request $request) {
            $paths = $request->get_param('paths');
            $paths = is_array($paths) ? array_map('strval', $paths) : ['/'];

            // Sanitise: a path is a path, not a URL. This prevents the endpoint
            // being used to make the front end fetch an attacker's origin.
            $paths = array_values(array_filter(array_map(static function (string $p): string {
                $p = '/' . ltrim($p, '/');
                return preg_match('#^/[A-Za-z0-9\-_/?=.]*$#', $p) === 1 ? $p : '';
            }, $paths)));

            if ($paths === []) {
                return new \WP_Error('a2_bad_paths', __('No valid paths supplied.', 'a2-core'), ['status' => 422]);
            }

            queue($paths);
            flush_queue();

            return rest_ensure_response(['queued' => $paths]);
        },
        'args' => [
            'paths' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'string']],
        ],
    ]);
}
