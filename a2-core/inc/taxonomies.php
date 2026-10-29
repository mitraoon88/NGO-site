<?php
/**
 * TAXONOMIES — 6, blueprint §8.2
 * ==============================
 *
 *   vertical          hierarchical  Heritage Care · Women Self-Dependency ·
 *                                   Education · Ecological Restoration · General Seva
 *   service_zone      hierarchical  South (Old Town Core) · Central (Unit Area Hub) ·
 *                                   East (Rasulgarh Corridor) · West (Nayapalli
 *                                   Cluster) · North (Patia Corporate Line)
 *   remnant_type      flat          the five remnant classes
 *   processing_status flat          Logged & Sorted → Pulverised & Shade-Dried →
 *                                   Levelled & Stored → Deployed to Composting
 *   skill             flat          the seven skills
 *   language          flat          en · or   (Polylang reads this)
 *
 * TERMS ARE SEEDED, NOT LEFT TO THE EDITOR
 * ----------------------------------------
 * §0.2(1) makes the five-zone model final and §8.2 names every remnant type.
 * If those are free text an editor will eventually type "South Zone" and
 * "south zone" and the dashboard matrix will silently double-count. So the
 * canonical terms are installed on activation and the editor may only add
 * children of `vertical`.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\taxonomies;

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', __NAMESPACE__ . '\\register_taxonomies', 6);
add_action('init', __NAMESPACE__ . '\\seed_terms', 20);

/**
 * Which post types each taxonomy attaches to.
 *
 * @return array<string, array{taxonomy:array<string,mixed>,types:string[],terms:array<int,array{name:string,slug:string,children?:array<int,array{name:string,slug:string}>}>}>
 */
function register(): array
{
    return [
        'vertical' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Verticals', 'a2-core'), 'singular_name' => __('Vertical', 'a2-core')],
                'hierarchical' => true,
                'public'       => true,
                'show_in_rest' => true,
                'rewrite'      => ['slug' => 'vertical', 'with_front' => false],
            ],
            'types' => ['a2_project', 'a2_drive', 'a2_campaign', 'a2_story'],
            'terms' => [
                ['name' => 'Heritage Care', 'slug' => 'heritage-care'],
                ['name' => 'Women Self-Dependency', 'slug' => 'women-self-dependency'],
                ['name' => 'Education', 'slug' => 'education'],
                ['name' => 'Ecological Restoration', 'slug' => 'ecological-restoration'],
                ['name' => 'General Seva', 'slug' => 'general-seva'],
            ],
        ],

        'service_zone' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Service zones', 'a2-core'), 'singular_name' => __('Service zone', 'a2-core')],
                'hierarchical' => true,
                'public'       => true,
                'show_in_rest' => true,
                'rewrite'      => ['slug' => 'zone', 'with_front' => false],
            ],
            'types' => ['a2_collection_run', 'a2_student', 'a2_beneficiary', 'a2_temple_site', 'a2_drive'],
            // §0.2(1): five zones final. North/Patia carries phase = planned.
            'terms' => [
                ['name' => 'South (Old Town Core)', 'slug' => 'south-old-town'],
                ['name' => 'Central (Unit Area Hub)', 'slug' => 'central-unit'],
                ['name' => 'East (Rasulgarh Corridor)', 'slug' => 'east-rasulgarh'],
                ['name' => 'West (Nayapalli Cluster)', 'slug' => 'west-nayapalli'],
                ['name' => 'North (Patia Corporate Line)', 'slug' => 'north-patia'],
            ],
        ],

        'remnant_type' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Remnant types', 'a2-core'), 'singular_name' => __('Remnant type', 'a2-core')],
                'hierarchical' => false,
                'public'       => true,
                'show_in_rest' => true,
            ],
            'types' => ['a2_collection_run'],
            'terms' => [
                ['name' => 'Terracotta Clay & Floral Mass', 'slug' => 'terracotta-floral'],
                ['name' => 'Fresh Garland Petals', 'slug' => 'fresh-garland-petals'],
                ['name' => 'Leaves & Botanical Remnants', 'slug' => 'leaves-botanical'],
                ['name' => 'Moderate Mixed Floral Waste', 'slug' => 'mixed-floral'],
                ['name' => 'Localised Ritual Offerings', 'slug' => 'localised-offerings'],
            ],
        ],

        'processing_status' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Processing status', 'a2-core'), 'singular_name' => __('Processing status', 'a2-core')],
                'hierarchical' => false,
                'public'       => false, // internal state, never a public archive
                'show_in_rest' => true,
            ],
            'types' => ['a2_processing_batch'],
            'terms' => [
                ['name' => 'Logged & Sorted (In-House Hub)', 'slug' => 'logged-sorted'],
                ['name' => 'Pulverised & Shade-Dried', 'slug' => 'pulverised-shade-dried'],
                ['name' => 'Levelled & Stored for Diya Base', 'slug' => 'levelled-stored'],
                ['name' => 'Deployed to Composting Grid', 'slug' => 'composting-grid'],
            ],
        ],

        'skill' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Skills', 'a2-core'), 'singular_name' => __('Skill', 'a2-core')],
                'hierarchical' => false,
                'public'       => false,
                'show_in_rest' => true,
            ],
            'types' => ['a2_enrollment', 'a2_beneficiary'],
            'terms' => [
                ['name' => 'Traditional Hand-Rolling', 'slug' => 'hand-rolling'],
                ['name' => 'Organic Blending', 'slug' => 'organic-blending'],
                ['name' => 'Sacred Craft Preservation', 'slug' => 'craft-preservation'],
                ['name' => 'Sortation', 'slug' => 'sortation'],
                ['name' => 'Teaching', 'slug' => 'teaching'],
                ['name' => 'First Aid', 'slug' => 'first-aid'],
                ['name' => 'EV Logistics', 'slug' => 'ev-logistics'],
            ],
        ],

        'language' => [
            'taxonomy' => [
                'labels'       => ['name' => __('Languages', 'a2-core'), 'singular_name' => __('Language', 'a2-core')],
                'hierarchical' => false,
                'public'       => false,
                'show_in_rest' => true,
            ],
            'types' => ['a2_project', 'a2_drive', 'a2_campaign', 'a2_story'],
            'terms' => [
                ['name' => 'English', 'slug' => 'en'],
                ['name' => 'Odia', 'slug' => 'or'],
            ],
        ],
    ];
}

function register_taxonomies(): void
{
    foreach (register() as $slug => $def) {
        register_taxonomy($slug, $def['types'], array_merge($def['taxonomy'], [
            'show_admin_column' => true,
            'query_var'         => true,
        ]));
    }
}

/**
 * Idempotent seed. Runs on every `init` but only writes when a term is missing,
 * so it is safe on an existing install and cheap (one term query per taxonomy).
 */
function seed_terms(): void
{
    foreach (register() as $slug => $def) {
        if (!taxonomy_exists($slug)) {
            continue; // activation order can put us here before registration
        }
        foreach ($def['terms'] as $term) {
            if (term_exists($term['slug'], $slug) === null) {
                wp_insert_term($term['name'], $slug, ['slug' => $term['slug']]);
            }
        }
    }
}
