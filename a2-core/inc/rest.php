<?php
/**
 * REST SURFACE — `a2/v1`
 * ======================
 *
 * RULE: the response shapes here are a **contract**. The Next.js front end types
 * against them, so a field is never renamed or removed without bumping the
 * namespace. Flat formatters only — no `_embedded`, no `_links`, no HAL.
 *
 * WHY FLAT (from Setu's `inc/rest.php`, kept deliberately)
 * -------------------------------------------------------
 * The default WP REST post shape is a document about a post: guid objects,
 * rendered/raw/protected content triples, embeddable link graphs, feature flags.
 * A React component wants `{ title, href, excerpt, image }`. Making the browser
 * walk WP's shape means either shipping a mapper that must be kept in sync, or
 * `_embed=wp:featuredmedia` plus three levels of null-guarding. Setu flattened
 * at the source and was right. Every formatter in this file returns exactly the
 * fields the UI renders and nothing else — which also means the public API
 * cannot leak a field nobody meant to publish.
 *
 * ROUTES
 * ------
 *   GET  /a2/v1/bootstrap            everything the homepage needs, in one call
 *   GET  /a2/v1/programmes           ?vertical=&zone=&per_page=
 *   GET  /a2/v1/drives               ?zone=&upcoming=1
 *   GET  /a2/v1/stories              ?vertical=
 *   GET  /a2/v1/zones
 *   GET  /a2/v1/metrics              → inc/metrics.php
 *   GET  /a2/v1/ledger               → inc/ledger.php
 *   GET  /a2/v1/documents            data-room cards (metadata only)
 *   GET  /a2/v1/term-charter         → inc/terms.php
 *   GET  /a2/v1/health               → a2-core.php
 *   POST /a2/v1/contribution-intent  → inc/contributions.php
 *   POST /a2/v1/gateway-webhook      → inc/contributions.php
 *   POST /a2/v1/grievance
 *   POST /a2/v1/csr-enquiry
 *   POST /a2/v1/revalidate           → inc/revalidate.php
 *
 * CORS
 * ----
 * Locked to ONE origin (the front end), echoed back rather than `*`, with
 * `Vary: Origin`. This is Setu's rule and it is the correct one: `*` plus
 * cookies is a vulnerability, and `Access-Control-Allow-Origin: *` on an endpoint
 * that takes a contribution intent is an invitation.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\rest;

use A2\Core\metrics;
use A2\Core\ledger;

if (!defined('ABSPATH')) {
    exit;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CORS
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\cors_headers', 15);
add_filter('rest_pre_serve_request', __NAMESPACE__ . '\\cors_preflight', 10, 4);

/**
 * Only ever one origin. `A2_FRONTEND_ORIGIN` is set in wp-config.php.
 */
function cors_headers(): void
{
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

    add_filter('rest_pre_serve_request', static function ($served) {
        $origin = get_http_origin();
        if ($origin && $origin === \A2\Core\frontend_origin()) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Vary: Origin', false);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-A2-Secret');
        }
        return $served;
    });
}

/**
 * @param bool             $served
 * @param \WP_HTTP_Response $result
 * @param \WP_REST_Request $request
 * @param \WP_REST_Server  $server
 * @return bool
 */
function cors_preflight($served, $result, $request, $server)
{
    if (strtoupper((string) $request->get_method()) === 'OPTIONS') {
        status_header(204);
        return true;
    }
    return (bool) $served;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FORMATTERS — the contract
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * A card. Every listing route returns this shape, so the front end has one
 * component contract rather than one per route.
 *
 * @return array{id:int,slug:string,title:string,excerpt:string,href:string,image:?array{src:string,alt:string,width:int,height:int},date:string,tags:string[],meta:array<string,mixed>}
 */
function card(\WP_Post $post, array $extra_meta = []): array
{
    $thumb_id = (int) get_post_thumbnail_id($post);
    $image = null;

    if ($thumb_id > 0) {
        $src = wp_get_attachment_image_src($thumb_id, 'large');
        if (is_array($src)) {
            $image = [
                'src'    => (string) $src[0],
                'alt'    => (string) get_post_meta($thumb_id, '_wp_attachment_image_alt', true),
                'width'  => (int) $src[1],
                'height' => (int) $src[2],
            ];
        }
    }

    $terms = [];
    foreach (['vertical', 'service_zone', 'remnant_type'] as $tax) {
        $list = wp_get_post_terms($post->ID, $tax, ['fields' => 'slugs']);
        if (!is_wp_error($list)) {
            $terms = array_merge($terms, $list);
        }
    }

    $meta = [];
    foreach ($extra_meta as $key) {
        $meta[str_replace('a2_', '', $key)] = get_post_meta($post->ID, $key, true);
    }

    return [
        'id'      => $post->ID,
        'slug'    => $post->post_name,
        'title'   => wp_strip_all_tags(get_the_title($post)),
        'excerpt' => wp_strip_all_tags(get_the_excerpt($post)),
        'href'    => (string) (get_permalink($post) ?: ''),
        'image'   => $image,
        // The front end renders the date with <time datetime>. ISO only.
        'date'    => mysql2date('c', $post->post_date_gmt, false),
        'tags'    => array_values(array_unique($terms)),
        'meta'    => $meta,
    ];
}

/**
 * Paginated envelope. Explicit `total` so the UI can render "of N" without a
 * second HEAD request.
 *
 * @param array<int, array<string, mixed>> $items
 * @return array{items:mixed[],total:int,page:int,per_page:int,pages:int}
 */
function envelope(array $items, int $total, int $page, int $per_page): array
{
    return [
        'items'    => $items,
        'total'    => $total,
        'page'     => $page,
        'per_page' => $per_page,
        'pages'    => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
    ];
}

/**
 * Run a query with the common args and return the envelope.
 *
 * @param array<string, mixed> $args
 */
function listing(array $args, array $meta_keys = []): array
{
    $defaults = [
        'post_type'      => 'a2_project',
        'post_status'    => 'publish',
        'posts_per_page' => 12,
        'paged'          => 1,
    ];
    $query = new \WP_Query(array_merge($defaults, $args));

    $items = array_map(
        static fn (\WP_Post $p): array => card($p, $meta_keys),
        $query->posts
    );

    return envelope($items, (int) $query->found_posts, (int) $query->get('paged'), (int) $query->get('posts_per_page'));
}

/**
 * Turn request params into a tax_query without trusting the caller's shape.
 *
 * @return array<int, array<string, mixed>>
 */
function tax_query_from(\WP_REST_Request $request, array $map): array
{
    $out = [];
    foreach ($map as $param => $taxonomy) {
        $value = $request->get_param($param);
        if (!is_string($value) || $value === '') {
            continue;
        }
        $slugs = array_filter(array_map('sanitize_title', explode(',', $value)));
        if ($slugs !== []) {
            $out[] = ['taxonomy' => $taxonomy, 'field' => 'slug', 'terms' => $slugs];
        }
    }
    return $out;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROUTES
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_routes');

function register_routes(): void
{
    $read = static fn (): bool => true; // public reads; post_status governs exposure

    /* ── bootstrap: one call for the homepage ───────────────────────────── */
    register_rest_route('a2/v1', '/bootstrap', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static function (): \WP_REST_Response {
            return rest_ensure_response([
                'metrics'     => array_values(array_map(
                    static fn (string $key, array $row): array => ['key' => $key] + $row,
                    array_keys(metrics\snapshot()), metrics\snapshot()
                )),
                'programmes'  => listing(['post_type' => 'a2_project', 'posts_per_page' => 3], ['a2_progress_pct', 'a2_zone_slugs']),
                'drives'      => listing([
                    'post_type'      => 'a2_drive',
                    'posts_per_page' => 3,
                    'meta_key'       => 'a2_drive_date',
                    'orderby'        => 'meta_value',
                    'order'          => 'ASC',
                    'meta_query'     => [['key' => 'a2_drive_date', 'value' => gmdate('Y-m-d'), 'compare' => '>=']],
                ], ['a2_drive_date', 'a2_capacity', 'a2_meeting_point']),
                'zones'       => zones(),
                'switches'    => \A2\Core\switches\all(),
                'generated_at' => gmdate('c'),
            ]);
        },
    ]);

    /* ── programmes ─────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/programmes', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static fn (\WP_REST_Request $r): \WP_REST_Response => rest_ensure_response(listing([
            'post_type'      => 'a2_project',
            'posts_per_page' => per_page($r),
            'paged'          => page($r),
            'tax_query'      => tax_query_from($r, ['vertical' => 'vertical', 'zone' => 'service_zone']),
        ], ['a2_progress_pct', 'a2_kpi_target', 'a2_kpi_actual', 'a2_zone_slugs'])),
        'args'                => listing_args(),
    ]);

    /* ── drives ─────────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/drives', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static function (\WP_REST_Request $r): \WP_REST_Response {
            $meta = [];
            if ($r->get_param('upcoming')) {
                $meta[] = ['key' => 'a2_drive_date', 'value' => gmdate('Y-m-d'), 'compare' => '>='];
            }
            return rest_ensure_response(listing([
                'post_type'      => 'a2_drive',
                'posts_per_page' => per_page($r),
                'paged'          => page($r),
                'tax_query'      => tax_query_from($r, ['zone' => 'service_zone', 'vertical' => 'vertical']),
                'meta_key'       => 'a2_drive_date',
                'orderby'        => 'meta_value',
                'order'          => 'ASC',
                'meta_query'     => $meta,
            ], ['a2_drive_date', 'a2_start_time', 'a2_meeting_point', 'a2_capacity', 'a2_registered']));
        },
        'args'                => listing_args() + ['upcoming' => ['type' => 'boolean', 'default' => false]],
    ]);

    /* ── stories ────────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/stories', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static fn (\WP_REST_Request $r): \WP_REST_Response => rest_ensure_response(listing([
            'post_type'      => 'a2_beneficiary', // stories are re-voiced beneficiary records
            'posts_per_page' => per_page($r),
            'paged'          => page($r),
            'tax_query'      => tax_query_from($r, ['vertical' => 'vertical']),
            'meta_query'     => [
                ['key' => 'a2_consent_date', 'value' => '', 'compare' => '!='],
                ['key' => 'a2_consent_withdrawn', 'value' => '1', 'compare' => '!='],
            ],
        ])),
        'args'                => listing_args(),
    ]);

    /* ── zones ──────────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/zones', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static fn (): \WP_REST_Response => rest_ensure_response(zones()),
    ]);

    /* ── data room cards (metadata only — the file itself is gated) ──────── */
    register_rest_route('a2/v1', '/documents', [
        'methods'             => 'GET',
        'permission_callback' => $read,
        'callback'            => static function (): \WP_REST_Response {
            $items = array_map(static function (\WP_Post $p): array {
                $bytes = (int) get_post_meta($p->ID, 'a2_file_bytes', true);
                return [
                    'id'      => $p->ID,
                    'title'   => wp_strip_all_tags(get_the_title($p)),
                    'label'   => (string) get_post_meta($p->ID, 'a2_file_label', true),
                    'bytes'   => $bytes,
                    'size'    => size_label($bytes),
                    'audited' => (bool) get_post_meta($p->ID, 'a2_audited', true),
                    'gated'   => (bool) get_post_meta($p->ID, 'a2_requires_lead', true),
                    // Deliberately NO file URL. The download is lead-captured
                    // and served through an authenticated endpoint (§6.6).
                ];
            }, get_posts([
                'post_type'      => 'a2_resource_doc',
                'post_status'    => 'publish',
                'posts_per_page' => 50,
                'orderby'        => 'menu_order title',
                'order'          => 'ASC',
            ]));

            return rest_ensure_response(['items' => $items, 'total' => count($items)]);
        },
    ]);

    /* ── grievance ──────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/grievance', [
        'methods'             => 'POST',
        'permission_callback' => $read,
        'callback'            => static function (\WP_REST_Request $r) {
            if (!rate_limit('grievance', 5, HOUR_IN_SECONDS)) {
                return new \WP_Error('a2_rate_limited', __('Too many submissions. Please try later.', 'a2-core'), ['status' => 429]);
            }

            $body = sanitize_textarea_field((string) $r->get_param('body'));
            if (mb_strlen($body) < 20) {
                return new \WP_Error('a2_too_short', __('Please describe the issue in at least 20 characters.', 'a2-core'), ['status' => 422]);
            }

            $ticket = 'A2-' . gmdate('ymd') . '-' . strtoupper(wp_generate_password(5, false, false));

            $post_id = wp_insert_post([
                'post_type'    => 'a2_grievance',
                'post_status'  => 'private',
                'post_title'   => sprintf('Grievance %s', $ticket),
                'post_content' => $body,
                'meta_input'   => [
                    'a2_ticket_id' => $ticket,
                    'a2_status'    => 'received',
                    'a2_anonymous' => (bool) $r->get_param('anonymous'),
                ],
            ], true);

            if (is_wp_error($post_id)) {
                return $post_id;
            }

            // Only the ticket ID is returned. No internal post ID, no author name.
            return rest_ensure_response(['ticket_id' => $ticket, 'status' => 'received']);
        },
        'args' => [
            'body'      => ['type' => 'string', 'required' => true],
            'anonymous' => ['type' => 'boolean', 'default' => false],
        ],
    ]);

    /* ── CSR enquiry ────────────────────────────────────────────────────── */
    register_rest_route('a2/v1', '/csr-enquiry', [
        'methods'             => 'POST',
        'permission_callback' => $read,
        'callback'            => static function (\WP_REST_Request $r) {
            if (!rate_limit('csr', 5, HOUR_IN_SECONDS)) {
                return new \WP_Error('a2_rate_limited', __('Too many submissions. Please try later.', 'a2-core'), ['status' => 429]);
            }

            $company = sanitize_text_field((string) $r->get_param('company'));
            $email = sanitize_email((string) $r->get_param('email'));
            if ($company === '' || !is_email($email)) {
                return new \WP_Error('a2_invalid', __('A company name and a valid email are required.', 'a2-core'), ['status' => 422]);
            }

            $post_id = wp_insert_post([
                'post_type'   => 'a2_csr_lead',
                'post_status' => 'private',
                'post_title'  => $company,
                'meta_input'  => [
                    'a2_company' => $company,
                    // Never store the raw address on the lead row: the CRM holds
                    // contact data, this holds a hash so dedupe works without PII.
                    'a2_contact_hash' => wp_hash($email),
                    'a2_stage'        => 'eoi',
                ],
            ], true);

            if (is_wp_error($post_id)) {
                return $post_id;
            }

            do_action('a2_csr_enquiry_received', (int) $post_id, $email);

            return rest_ensure_response(['received' => true, 'stage' => 'eoi']);
        },
        'args' => [
            'company' => ['type' => 'string', 'required' => true],
            'email'   => ['type' => 'string', 'required' => true, 'format' => 'email'],
        ],
    ]);
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

function page(\WP_REST_Request $request): int
{
    return max(1, (int) ($request->get_param('page') ?: 1));
}

function per_page(\WP_REST_Request $request): int
{
    return max(1, min(50, (int) ($request->get_param('per_page') ?: 12)));
}

/** @return array<string, array<string, mixed>> */
function listing_args(): array
{
    return [
        'page'     => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
        'per_page' => ['type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 50],
        'vertical' => ['type' => 'string', 'sanitize_callback' => 'sanitize_title'],
        'zone'     => ['type' => 'string', 'sanitize_callback' => 'sanitize_title'],
    ];
}

/** @return array<int, array<string, mixed>> */
function zones(): array
{
    $terms = get_terms(['taxonomy' => 'service_zone', 'hide_empty' => false]);
    if (is_wp_error($terms)) {
        return [];
    }

    return array_map(static function (\WP_Term $t): array {
        return [
            'slug'  => $t->slug,
            'name'  => $t->name,
            // §0.2(1): Patia is planned, the other four are live. Phase is data.
            'phase' => $t->slug === 'north-patia' ? 'planned' : 'active',
            'count' => (int) $t->count,
        ];
    }, $terms);
}

function size_label(int $bytes): string
{
    if ($bytes <= 0) {
        return '';
    }
    if ($bytes < 1024 * 1024) {
        return sprintf('%d KB', (int) ceil($bytes / 1024));
    }
    return sprintf('%.1f MB', $bytes / (1024 * 1024));
}

/**
 * Per-IP transient rate limit. Ported from Setu (10/hour on the donation
 * intent); here it is per-route so a burst of grievances cannot exhaust the CSR
 * form's budget.
 */
function rate_limit(string $bucket, int $limit, int $window): bool
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) wp_unslash($_SERVER['REMOTE_ADDR']) : 'unknown';
    $key = 'a2_rl_' . $bucket . '_' . md5($ip);
    $count = (int) get_transient($key);

    if ($count >= $limit) {
        return false;
    }

    set_transient($key, $count + 1, $window);
    return true;
}
