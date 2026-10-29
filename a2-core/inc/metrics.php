<?php
/**
 * GOVERNED METRICS — blueprint §11.4
 * ==================================
 *
 * The homepage carries four figures. Every one of them is a compliance claim
 * under §11.4, and the failure mode of a claim is not that it is unflattering —
 * it is that it is *unrepeatable* when an auditor asks "show me where 1,200
 * comes from".
 *
 * So no figure on this platform is a string in a template. Each one is derived
 * from rows, each derivation is defined here, and the page renders
 * `value · label · target/actual · as-of date`. If the rows are empty the
 * figure renders as "—" rather than a plausible-looking number. **A missing
 * number is an honest dashboard; an invented number is a liability.**
 *
 *   Metric Tons Diverted  = SUM(a2_weight_kg) over VERIFIED collection runs / 1000
 *   Compliance Hours      = SUM(a2_hours_verified) over verified attendance
 *   Direct Banking %      = remittances paid by bank transfer / remittances due
 *   Children Sustained    = COUNT(a2_student) with attendance ≥ 60% this term
 *
 * Year-1 targets live in `targets()` and are labelled "Target — Year 1" in the
 * UI. An actual-vs-target pair is always displayed as a pair; showing an actual
 * alone invites it to be read as an achievement.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\metrics;

if (!defined('ABSPATH')) {
    exit;
}

/** Cached for 15 minutes; invalidated on ledger writes (see invalidate()). */
const CACHE_KEY = 'a2_metrics_snapshot';
const CACHE_TTL = 900;

/**
 * The four homepage figures, in display order.
 *
 * @return array<string, array{label:string,target:string,unit:string,source:string,definition:string}>
 */
function definitions(): array
{
    return [
        'metric_tons_diverted' => [
            'label'      => __('Metric Tons Diverted', 'a2-core'),
            'target'     => '150+',
            'unit'       => 't',
            'source'     => 'a2_collection_run',
            'definition' => __('Sum of verified collection-run weights ÷ 1000.', 'a2-core'),
        ],
        'compliance_hours' => [
            'label'      => __('Compliance Hours', 'a2-core'),
            'target'     => '1,200+',
            'unit'       => 'h',
            'source'     => 'a2_attendance',
            'definition' => __('Sum of attendance records whose hours a Field Lead has verified.', 'a2-core'),
        ],
        'direct_banking_pct' => [
            'label'      => __('Direct Banking', 'a2-core'),
            'target'     => '100%',
            'unit'       => '%',
            'source'     => 'a2_remittance',
            'definition' => __('Share of Sevika remittances settled by direct bank transfer, not cash.', 'a2-core'),
        ],
        'children_sustained' => [
            'label'      => __('Children Sustained', 'a2-core'),
            'target'     => '60+',
            'unit'       => '',
            'source'     => 'a2_student',
            'definition' => __('Count of enrolled children with attendance at or above 60% this term.', 'a2-core'),
        ],
    ];
}

/**
 * Compute every figure from the database. Cached, because this runs on the
 * homepage and the homepage has an LCP budget (§12.3, < 2.5 s on 4G).
 *
 * @param bool $fresh Bypass the cache (health endpoint, admin preview).
 * @return array<string, array{value:string,raw:float|null,label:string,target:string,as_of:string,has_data:bool}>
 */
function snapshot(bool $fresh = false): array
{
    if (!$fresh) {
        $cached = get_transient(CACHE_KEY);
        if (is_array($cached) && $cached !== []) {
            return $cached;
        }
    }

    $out = [];

    foreach (definitions() as $key => $def) {
        $raw = compute($key);
        $out[$key] = [
            'value'    => format_value($key, $raw),
            'raw'      => $raw,
            'label'    => $def['label'],
            'target'   => $def['target'],
            'as_of'    => gmdate('Y-m-d'),
            'has_data' => $raw !== null,
        ];
    }

    /** Filter for a site that wants to publish an audited figure ahead of the rows. */
    $out = apply_filters('a2_metrics_snapshot', $out);

    set_transient(CACHE_KEY, $out, CACHE_TTL);
    return $out;
}

/**
 * @return float|null null = no data (render "—")
 */
function compute(string $key): ?float
{
    switch ($key) {
        case 'metric_tons_diverted':
            $kg = sum_meta('a2_collection_run', 'a2_weight_kg', ['a2_verified' => true]);
            return $kg === null ? null : $kg / 1000.0;

        case 'compliance_hours':
            return sum_meta('a2_attendance', 'a2_hours_verified');

        case 'direct_banking_pct':
            $total = count_posts('a2_remittance');
            if ($total === 0) {
                return null;
            }
            $banked = count_posts('a2_remittance', static function (int $id): bool {
                return (string) get_post_meta($id, 'a2_transfer_ref', true) !== '';
            });
            return ($banked / $total) * 100.0;

        case 'children_sustained':
            $count = count_posts('a2_student', static function (int $id): bool {
                return (int) get_post_meta($id, 'a2_attendance_pct', true) >= 60;
            });
            return $count === 0 ? null : (float) $count;

        default:
            return null;
    }
}

/**
 * SUM of a numeric meta across a post type, optionally only where a flag meta
 * matches. Returns null when there are no rows — distinct from 0, which is a
 * real and publishable value.
 *
 * @param array<string, mixed> $where
 */
function sum_meta(string $post_type, string $meta_key, array $where = []): ?float
{
    $ids = get_posts([
        'post_type'      => $post_type,
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
        'meta_query'     => where_to_meta_query($where),
    ]);

    if ($ids === []) {
        return null;
    }

    $sum = 0.0;
    foreach ($ids as $id) {
        $sum += (float) get_post_meta((int) $id, $meta_key, true);
    }
    return $sum;
}

/**
 * @param array<string, mixed> $where
 * @return array<int, array<string, mixed>>
 */
function where_to_meta_query(array $where): array
{
    $query = [];
    foreach ($where as $key => $value) {
        $query[] = ['key' => $key, 'value' => $value, 'compare' => is_bool($value) ? '=' : 'LIKE'];
    }
    return $query;
}

/**
 * Count posts, optionally filtered by a PHP predicate (used where the logic is
 * not expressible as a meta query without fragility).
 */
function count_posts(string $post_type, ?callable $predicate = null): int
{
    $ids = get_posts([
        'post_type'      => $post_type,
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ]);

    if ($predicate === null) {
        return count($ids);
    }
    return count(array_filter($ids, $predicate));
}

/**
 * Display formatting. Note what is NOT here: no rounding that inflates. 148.6
 * tonnes renders "148.6", never "150". The "+" in the target comes from the
 * target string, and an actual only earns a "+" by clearing its target.
 */
function format_value(string $key, ?float $raw): string
{
    if ($raw === null) {
        return '—';
    }

    $def = definitions()[$key] ?? null;
    $target_raw = $def ? (float) rtrim($def['target'], '+%') : 0.0;

    switch ($key) {
        case 'metric_tons_diverted':
            $s = number_format_i18n($raw, $raw < 10 ? 1 : 0);
            break;
        case 'compliance_hours':
            $s = number_format_i18n($raw, 0);
            break;
        case 'direct_banking_pct':
            $s = number_format_i18n($raw, 0) . '%';
            break;
        case 'children_sustained':
            $s = number_format_i18n($raw, 0);
            break;
        default:
            $s = (string) $raw;
    }

    // The "+" is a claim of exceeding a target, so it is only appended when true.
    if ($target_raw > 0 && $raw >= $target_raw && !str_ends_with($s, '%')) {
        $s .= '+';
    }

    return $s;
}

/** Called by ledger writes so the homepage does not serve a stale figure. */
function invalidate(): void
{
    delete_transient(CACHE_KEY);
}

add_action('a2_ledger_updated', __NAMESPACE__ . '\\invalidate');
add_action('a2_compliance_switch_changed', __NAMESPACE__ . '\\invalidate');

/* ─────────────────────────────────────────────────────────────────────────────
   REST — the homepage reads these, not the template
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_routes');

function register_routes(): void
{
    register_rest_route('a2/v1', '/metrics', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => static function (\WP_REST_Request $request) {
            $out = [];
            foreach (snapshot((bool) $request->get_param('fresh')) as $key => $row) {
                $out[] = ['key' => $key] + $row;
            }
            return rest_ensure_response($out);
        },
        'args' => [
            'fresh' => ['type' => 'boolean', 'default' => false],
        ],
    ]);
}
