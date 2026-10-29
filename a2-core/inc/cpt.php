<?php
/**
 * CONTENT MODEL — 26 post types, blueprint §8.1
 * =============================================
 *
 * The single most important thing in this file is not any one registration: it
 * is that the `public` flag encodes the three-layer architecture of §2.2.
 *
 *   Layer 1  Public Sacred Narrative   → public = true,  in sitemap, indexed
 *   Layer 2  Authenticated Operations  → public = false, absent from sitemap
 *   Layer 3  Gated Auditor Data Room   → public = false, capability-gated
 *
 * Getting this wrong is the "narrative-privacy" failure of §13.3: an internal
 * batch record surfacing in a Google result. So the layer is declared as data,
 * not scattered through the array literals, and `a2-core` asserts the mapping
 * in a unit test (`validation/php/CPTTest.php`).
 *
 * Seeded from Setu's `inc/cpt.php`. Those registrations were correct in shape;
 * what changed is scale (3 → 26) and the addition of an explicit layer.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\cpt;

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', __NAMESPACE__ . '\\register_post_types', 5);

/**
 * The register. One row per CPT, in blueprint order.
 *
 * Keys:
 *   layer    1|2|3 — drives public/indexing (§2.2)
 *   title    admin label
 *   singular
 *   icon     dashicon
 *   supports editor features
 *   note     why it exists (shown in the admin screen)
 *
 * @return array<string, array{layer:int,title:string,singular:string,icon:string,supports:string[],note:string}>
 */
function register(): array
{
    return [
        /* ── LAYER 1 — public ─────────────────────────────────────────────── */
        'a2_project' => [
            'layer' => 1, 'title' => __('Programmes', 'a2-core'), 'singular' => __('Programme', 'a2-core'),
            'icon' => 'dashicons-portfolio', 'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields'],
            'note' => __('Programmes and campaigns across verticals.', 'a2-core'),
        ],
        'a2_drive' => [
            'layer' => 1, 'title' => __('Seva Drives', 'a2-core'), 'singular' => __('Seva Drive', 'a2-core'),
            'icon' => 'dashicons-calendar-alt', 'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields'],
            'note' => __('Temple cleanliness drives and Seva events open to volunteers.', 'a2-core'),
        ],
        'a2_zone' => [
            'layer' => 1, 'title' => __('Service Zones', 'a2-core'), 'singular' => __('Zone', 'a2-core'),
            'icon' => 'dashicons-location-alt', 'supports' => ['title', 'editor', 'thumbnail', 'custom-fields'],
            'note' => __('The five service zones with geo bounds and phase.', 'a2-core'),
        ],
        'a2_temple_site' => [
            'layer' => 1, 'title' => __('Temple Sites', 'a2-core'), 'singular' => __('Temple Site', 'a2-core'),
            'icon' => 'dashicons-buddicons-community', 'supports' => ['title', 'editor', 'thumbnail', 'custom-fields'],
            'note' => __('Adopted shrines, MoU status, care baseline, last served.', 'a2-core'),
        ],
        'a2_collection_run' => [
            'layer' => 1, 'title' => __('Collection Runs', 'a2-core'), 'singular' => __('Collection Run', 'a2-core'),
            'icon' => 'dashicons-update', 'supports' => ['title', 'custom-fields'],
            'note' => __('Daily remnant diversion records — the ledger\'s source of truth. Publishes to /transparency-log once verified.', 'a2-core'),
        ],
        'a2_processing_batch' => [
            'layer' => 1, 'title' => __('Restoration Batches', 'a2-core'), 'singular' => __('Restoration Batch', 'a2-core'),
            'icon' => 'dashicons-image-rotate', 'supports' => ['title', 'custom-fields'],
            'note' => __('Status transitions (sorted → pulverised → stored/composted) with operator and timestamps.', 'a2-core'),
        ],
        'a2_campaign' => [
            'layer' => 1, 'title' => __('Campaigns', 'a2-core'), 'singular' => __('Campaign', 'a2-core'),
            'icon' => 'dashicons-megaphone', 'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields'],
            'note' => __('Seva support campaigns with utilisation updates.', 'a2-core'),
        ],
        'a2_certificate' => [
            'layer' => 1, 'title' => __('Certificates', 'a2-core'), 'singular' => __('Certificate', 'a2-core'),
            'icon' => 'dashicons-awards', 'supports' => ['title', 'custom-fields'],
            'note' => __('Seva / internship certificates with a public verify ID.', 'a2-core'),
        ],

        /* ── LAYER 2 — authenticated operations ───────────────────────────── */
        'a2_task' => [
            'layer' => 2, 'title' => __('Tasks', 'a2-core'), 'singular' => __('Task', 'a2-core'),
            'icon' => 'dashicons-yes-alt', 'supports' => ['title', 'editor', 'custom-fields'],
            'note' => __('Tasks and milestones inside the operations portal.', 'a2-core'),
        ],
        'a2_field_report' => [
            'layer' => 2, 'title' => __('Field Reports', 'a2-core'), 'singular' => __('Field Report', 'a2-core'),
            'icon' => 'dashicons-camera-alt', 'supports' => ['title', 'editor', 'custom-fields'],
            'note' => __('Geo-tagged before/after submissions. Never public until verified and re-voiced.', 'a2-core'),
        ],
        'a2_attendance' => [
            'layer' => 2, 'title' => __('Attendance', 'a2-core'), 'singular' => __('Attendance Record', 'a2-core'),
            'icon' => 'dashicons-clock', 'supports' => ['title', 'custom-fields'],
            'note' => __('GPS check-in/out and verified Seva hours.', 'a2-core'),
        ],
        'a2_volunteer' => [
            'layer' => 2, 'title' => __('Volunteers', 'a2-core'), 'singular' => __('Volunteer', 'a2-core'),
            'icon' => 'dashicons-groups', 'supports' => ['title', 'custom-fields'],
            'note' => __('Volunteer profiles mirroring WP users.', 'a2-core'),
        ],
        'a2_beneficiary' => [
            'layer' => 2, 'title' => __('Sevika Records', 'a2-core'), 'singular' => __('Sevika Record', 'a2-core'),
            'icon' => 'dashicons-heart', 'supports' => ['title', 'custom-fields'],
            'note' => __('Sevika / women-programme records with consent flags. PII separated from public content (§8.4).', 'a2-core'),
        ],
        'a2_enrollment' => [
            'layer' => 2, 'title' => __('Enrolments', 'a2-core'), 'singular' => __('Enrolment', 'a2-core'),
            'icon' => 'dashicons-welcome-learn-more', 'supports' => ['title', 'custom-fields'],
            'note' => __('Skilling batches, hours and assessments.', 'a2-core'),
        ],
        'a2_student' => [
            'layer' => 2, 'title' => __('Students', 'a2-core'), 'singular' => __('Student', 'a2-core'),
            'icon' => 'dashicons-book', 'supports' => ['title', 'custom-fields'],
            'note' => __('Learning-centre children. Guardian consent mandatory before this record can be created.', 'a2-core'),
        ],
        'a2_assessment' => [
            'layer' => 2, 'title' => __('Assessments', 'a2-core'), 'singular' => __('Assessment', 'a2-core'),
            'icon' => 'dashicons-clipboard', 'supports' => ['title', 'custom-fields'],
            'note' => __('Student competency / remedial assessments.', 'a2-core'),
        ],
        'a2_product' => [
            'layer' => 2, 'title' => __('Sacred Crafts', 'a2-core'), 'singular' => __('Craft Item', 'a2-core'),
            'icon' => 'dashicons-products', 'supports' => ['title', 'thumbnail', 'custom-fields'],
            'note' => __('Internal craft inventory. §0.2(4): non-public, noindex, sitemap-excluded. No public /products route exists.', 'a2-core'),
        ],
        'a2_remittance' => [
            'layer' => 2, 'title' => __('Remittances', 'a2-core'), 'singular' => __('Remittance', 'a2-core'),
            'icon' => 'dashicons-bank', 'supports' => ['title', 'custom-fields'],
            'note' => __('Per-Sevika bank transfers. Publicly aggregated as the 80/20 chart only — never a named record.', 'a2-core'),
        ],
        'a2_asset' => [
            'layer' => 2, 'title' => __('Assets', 'a2-core'), 'singular' => __('Asset', 'a2-core'),
            'icon' => 'dashicons-car', 'supports' => ['title', 'custom-fields'],
            'note' => __('EVs, bamboo baskets, equipment, custody history.', 'a2-core'),
        ],
        'a2_expense' => [
            'layer' => 2, 'title' => __('Expenses', 'a2-core'), 'singular' => __('Expense', 'a2-core'),
            'icon' => 'dashicons-receipt', 'supports' => ['title', 'custom-fields'],
            'note' => __('Expenses with bill evidence and an approval chain.', 'a2-core'),
        ],
        'a2_contribution' => [
            'layer' => 2, 'title' => __('Voluntary Contributions', 'a2-core'), 'singular' => __('Contribution', 'a2-core'),
            'icon' => 'dashicons-money-alt', 'supports' => ['title', 'custom-fields'],
            'note' => __('Contribution records and acknowledgements. Created by the gateway only, never by hand (§10.6).', 'a2-core'),
        ],
        'a2_csr_lead' => [
            'layer' => 2, 'title' => __('CSR Leads', 'a2-core'), 'singular' => __('CSR Lead', 'a2-core'),
            'icon' => 'dashicons-businessperson', 'supports' => ['title', 'custom-fields'],
            'note' => __('Corporate partnership pipeline, EOI stage until CSR-1.', 'a2-core'),
        ],
        'a2_grant' => [
            'layer' => 2, 'title' => __('Grants', 'a2-core'), 'singular' => __('Grant', 'a2-core'),
            'icon' => 'dashicons-chart-line', 'supports' => ['title', 'custom-fields'],
            'note' => __('Dormant until registration + CSR-1. The compliance switch gates writes.', 'a2-core'),
        ],
        'a2_resource_doc' => [
            'layer' => 2, 'title' => __('Data Room Documents', 'a2-core'), 'singular' => __('Data Room Document', 'a2-core'),
            'icon' => 'dashicons-lock', 'supports' => ['title', 'custom-fields'],
            'note' => __('Gated prospectus, KPI schedule, MoU template, budgets. Download is lead-captured (§6.6).', 'a2-core'),
        ],
        'a2_grievance' => [
            'layer' => 2, 'title' => __('Grievances', 'a2-core'), 'singular' => __('Grievance', 'a2-core'),
            'icon' => 'dashicons-sos', 'supports' => ['title', 'editor', 'custom-fields'],
            'note' => __('Grievance tickets with a public status lookup by ticket ID.', 'a2-core'),
        ],
        'a2_document' => [
            'layer' => 2, 'title' => __('Documents', 'a2-core'), 'singular' => __('Document', 'a2-core'),
            'icon' => 'dashicons-media-document', 'supports' => ['title', 'custom-fields'],
            'note' => __('SOPs, MoUs, policies, training material — internal library.', 'a2-core'),
        ],
    ];
}

/**
 * Register all 26.
 *
 * `public` is derived from the layer, never written by hand — that is the whole
 * point. A Layer 2 type that somehow became public would be a §13.3 breach.
 */
function register_post_types(): void
{
    foreach (register() as $slug => $def) {
        $is_public = $def['layer'] === 1;

        register_post_type($slug, [
            'labels' => [
                'name'          => $def['title'],
                'singular_name' => $def['singular'],
                /* translators: %s: singular post type name */
                'add_new_item'  => sprintf(__('Add %s', 'a2-core'), $def['singular']),
                /* translators: %s: singular post type name */
                'edit_item'     => sprintf(__('Edit %s', 'a2-core'), $def['singular']),
                'search_items'  => sprintf(__('Search %s', 'a2-core'), $def['title']),
                'not_found'     => sprintf(__('No %s yet.', 'a2-core'), strtolower($def['title'])),
            ],
            'description'         => $def['note'],
            'public'              => $is_public,
            'publicly_queryable'  => $is_public,
            'exclude_from_search' => !$is_public,
            'show_in_rest'        => $is_public,   // L2/L3 never reach the public REST surface
            'rest_base'           => $slug,
            'show_ui'             => true,          // admins still see every type
            'show_in_menu'        => true,
            'show_in_nav_menus'   => false,
            'menu_icon'           => $def['icon'],
            'supports'            => $def['supports'],
            'has_archive'         => false,         // the front-end owns archives
            'hierarchical'        => false,
            'rewrite'             => $is_public
                ? ['slug' => str_replace('a2_', '', $slug), 'with_front' => false]
                : false,
            'capability_type'     => 'post',
            'map_meta_cap'        => true,
            'can_export'          => true,
            'delete_with_user'    => false,
        ]);
    }
}

/**
 * Human-readable layer, for the admin screen and the health endpoint.
 */
function layer_of(string $post_type): int
{
    $all = register();
    return $all[$post_type]['layer'] ?? 2;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SITEMAP — §5.2: the XML sitemap excludes every non-Layer-1 type, plus the
   gated query strings. WordPress includes public types automatically, but the
   explicit filter documents the intent and survives a future `public` mistake.
   ───────────────────────────────────────────────────────────────────────────── */

add_filter('wp_sitemaps_post_types', __NAMESPACE__ . '\\filter_sitemap_types');

/**
 * @param array<string, \WP_Post_Type> $types
 * @return array<string, \WP_Post_Type>
 */
function filter_sitemap_types(array $types): array
{
    foreach ($types as $slug => $type) {
        if (layer_of((string) $slug) !== 1) {
            unset($types[$slug]);
        }
    }
    return $types;
}
