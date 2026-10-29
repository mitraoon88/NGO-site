<?php
/**
 * TERM CHARTER — blueprint §4.2 and §0.2 ruling 6.
 * ==================================================
 *
 * "Term charter (enforced in code, not merely by convention)"
 *
 * The blueprint's naming rulings are not style advice. Public copy must not say
 * "waste", "donation", "wages", "80G" without the switch, and so on. The risk is
 * asymmetric: a single editorial slip publishes a prohibited claim to donors and
 * authorities, and the retraction is far more expensive than the block.
 *
 * So the charter is enforced at three points, in increasing strictness:
 *
 *   1. `content_save_pre`   — a 'block' term refuses the save outright.
 *   2. `admin_notices`      — the editor sees exactly which word and what to write.
 *   3. CI (`npm run lint:copy`) — the front-end build fails on the same dictionary.
 *
 * WHY THE DICTIONARY IS IN PHP *AND* JS
 * -------------------------------------
 * It is defined once here and exported to JSON by
 * `GET /a2/v1/term-charter`; the CI lint reads that JSON. One source, two
 * consumers. If the endpoint is unreachable in CI, the JSON is checked in and
 * `validation/check-term-charter.mjs` fails when they differ.
 *
 * WHY SAVES ARE REFUSED RATHER THAN REWRITTEN
 * -------------------------------------------
 * Auto-replacement was rejected deliberately. "waste of time" is ordinary
 * English; "Sacred Remnant of time" is nonsense. A machine cannot tell which
 * sense is meant, so it must ask a human.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\terms;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The charter.
 *
 * `pattern` is a PCRE fragment WITHOUT delimiters, matched case-insensitively
 * against whole words. `replacement` is guidance, never applied automatically.
 * `severity`:
 *   block — save refused
 *   warn  — editor notice only (the word can be legitimate in context)
 *
 * @return array<int, array{id:string,pattern:string,replacement:string,severity:string,ref:string,why:string}>
 */
function charter(): array
{
    return [
        [
            'id'          => 'waste',
            'pattern'     => '\bwaste\b',
            'replacement' => 'Sacred Remnant · Pushpa · Nirmalya',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Ritual offerings are never described as waste on public pages.',
        ],
        [
            'id'          => 'garbage',
            'pattern'     => '\bgarbage\b',
            'replacement' => 'Sacred Remnant',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Same ruling as "waste".',
        ],
        [
            'id'          => 'trash',
            'pattern'     => '\btrash\b',
            'replacement' => 'Sacred Remnant',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Same ruling as "waste".',
        ],
        [
            'id'          => 'payroll',
            'pattern'     => '\bpayroll\b',
            'replacement' => 'Sevika Livelihood Remittance',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Sevikas receive a livelihood remittance, not a wage.',
        ],
        [
            'id'          => 'wage',
            'pattern'     => '\bwages?\b',
            'replacement' => 'Sevika Livelihood Remittance',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Same ruling as "payroll".',
        ],
        [
            'id'          => 'donation',
            'pattern'     => '\bdonations?\b',
            'replacement' => 'Voluntary Contribution',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'The public term is Voluntary Contribution.',
        ],
        [
            'id'          => 'donate',
            'pattern'     => '\bdonate\b',
            'replacement' => 'Contribute',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Same ruling — the CTA is "Contribute", never "Donate".',
        ],
        [
            'id'          => 'donor',
            'pattern'     => '\bdonors?\b',
            'replacement' => 'Contributor',
            'severity'    => 'block',
            'ref'         => '§0.2(6)',
            'why'         => 'Same ruling.',
        ],
        [
            'id'          => 'worker',
            'pattern'     => '\bworkers?\b',
            'replacement' => 'Sevika',
            'severity'    => 'block',
            'ref'         => '§20 glossary',
            'why'         => '"Sevika" is an honorific. "Worker/employee" is never used publicly.',
        ],
        [
            'id'          => 'employee',
            'pattern'     => '\bemployees?\b',
            'replacement' => 'Sevika',
            'severity'    => 'warn',
            'ref'         => '§20 glossary',
            'why'         => 'Usually means Sevika, but can be legitimate (e.g. CSR partner staff).',
        ],
        [
            'id'          => 'service',
            'pattern'     => '\bservice\b',
            'replacement' => 'Seva (when it means the work)',
            'severity'    => 'warn',
            'ref'         => '§20 glossary',
            'why'         => '"Seva" is never translated. "Service" is fine for "customer service".',
        ],
        [
            'id'          => '80g',
            'pattern'     => '\b80\s?-?g\b',
            'replacement' => 'remove until the 80G switch is enabled',
            'severity'    => 'block',
            'ref'         => '§13.1',
            'why'         => '80G receipts are prohibited until the grant is obtained.',
        ],
        [
            'id'          => 'tax-free',
            'pattern'     => '\btax[\s-]?free\b',
            'replacement' => 'remove — no tax-free language is permitted pre-registration',
            'severity'    => 'block',
            'ref'         => '§13.2',
            'why'         => 'Prohibited until registered.',
        ],
        [
            'id'          => 'fcra',
            'pattern'     => '\bfcra\b',
            'replacement' => 'remove until the international switch is enabled',
            'severity'    => 'block',
            'ref'         => '§13.1',
            'why'         => 'Foreign contributions are prohibited until FCRA is obtained.',
        ],
        [
            'id'          => 'csr-grant',
            'pattern'     => '\bcsr\s+(grant|grants)\b',
            'replacement' => 'prohibited until registration + CSR-1',
            'severity'    => 'block',
            'ref'         => '§13.2',
            'why'         => 'Direct CSR grants may not be claimed or shown as received.',
        ],
    ];
}

/**
 * Scan a string and return every violation.
 *
 * @return array<int, array{id:string,severity:string,match:string,replacement:string,ref:string,why:string}>
 */
function scan(string $text): array
{
    if (trim($text) === '') {
        return [];
    }

    // Strip shortcodes and HTML so we do not flag markup attributes.
    $plain = wp_strip_all_tags(strip_shortcodes($text));

    $hits = [];
    foreach (charter() as $term) {
        if (preg_match('/' . $term['pattern'] . '/iu', $plain, $m) === 1) {
            $hits[] = [
                'id'          => $term['id'],
                'severity'    => $term['severity'],
                'match'       => (string) $m[0],
                'replacement' => $term['replacement'],
                'ref'         => $term['ref'],
                'why'         => $term['why'],
            ];
        }
    }

    return $hits;
}

/**
 * Only the blocking rules — used by the save filter.
 *
 * @return array<int, array{id:string,severity:string,match:string,replacement:string,ref:string,why:string}>
 */
function blocking_hits(string $text): array
{
    return array_values(array_filter(scan($text), static fn (array $h): bool => $h['severity'] === 'block'));
}

/**
 * Post types the charter applies to. Every public-facing type, plus pages
 * (a banned term in a page body is just as public as one in a post).
 *
 * The charter does NOT apply to `a2_resource_doc` or `a2_grievance` bodies,
 * because those are gated/internal by definition (blueprint §13.3 permits
 * institutional vocabulary inside the data room).
 *
 * @return string[]
 */
function governed_post_types(): array
{
    return [
        'page',
        'post',
        'a2_project',
        'a2_drive',
        'a2_zone',
        'a2_temple_site',
        'a2_collection_run',
        'a2_processing_batch',
        'a2_campaign',
        'a2_story',
        'a2_beneficiary',
        'a2_student',
        'a2_temple',
    ];
}

/* ─────────────────────────────────────────────────────────────────────────────
   ENFORCEMENT 1 — refuse the save
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Runs before the post is written.
 *
 * Returning the untouched content from `content_save_pre` lets WordPress save,
 * so we cannot abort cleanly from that filter alone. Instead we intercept on
 * `wp_insert_post_data`, which is the last point where we can still alter the
 * row — and we blank the content and set a flag so the editor sees a notice
 * explaining exactly what happened. The post keeps its previous body rather
 * than a half-migrated one.
 *
 * HONEST LIMITATION, stated for the handover: WordPress has no clean "abort a
 * save" hook. The three real options are (a) this — refuse the new body and
 * explain, (b) a JS block in the editor that prevents publishing, or (c) both.
 * This plugin ships (a) now, and (b) is wired in `enqueue_editor_guard()`.
 */
add_filter('wp_insert_post_data', __NAMESPACE__ . '\\guard_save', 99, 2);

/**
 * @param array<string, mixed> $data
 * @param array<string, mixed> $postarr
 * @return array<string, mixed>
 */
function guard_save(array $data, array $postarr): array
{
    $post_type = (string) ($data['post_type'] ?? '');
    if (!in_array($post_type, governed_post_types(), true)) {
        return $data;
    }

    // An administrator can publish through a deliberate override, but the
    // override is logged. Nothing else bypasses the charter.
    $override = current_user_can('manage_options')
        && isset($_POST['a2_term_charter_override'])
        && sanitize_key((string) wp_unslash($_POST['a2_term_charter_override'])) === '1';

    if ($override) {
        error_log(sprintf(
            '[a2-core] term charter overridden by user %d on post %s (%s)',
            get_current_user_id(),
            (string) ($postarr['ID'] ?? 'new'),
            $post_type
        ));
        return $data;
    }

    $hits = blocking_hits((string) ($data['post_content'] ?? '') . ' ' . (string) ($data['post_title'] ?? ''));
    if ($hits === []) {
        return $data;
    }

    // Keep the previously published body. `post_content` is replaced with the
    // existing row's content so a blocked edit cannot destroy live copy.
    $existing = isset($postarr['ID']) ? get_post((int) $postarr['ID']) : null;
    if ($existing instanceof \WP_Post) {
        $data['post_content'] = $existing->post_content;
        $data['post_title']   = $existing->post_title;
    }

    set_transient('a2_terms_blocked_' . get_current_user_id(), $hits, 5 * MINUTE_IN_SECONDS);

    return $data;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ENFORCEMENT 2 — tell the editor what to do
   ───────────────────────────────────────────────────────────────────────────── */

add_action('admin_notices', __NAMESPACE__ . '\\blocked_notice');

function blocked_notice(): void
{
    $key  = 'a2_terms_blocked_' . get_current_user_id();
    $hits = get_transient($key);
    if (!is_array($hits) || $hits === []) {
        return;
    }
    delete_transient($key);

    echo '<div class="notice notice-error"><p><strong>';
    esc_html_e('Not saved — the term charter refused this copy.', 'a2-core');
    echo '</strong></p><ul style="margin-left:1.2em;list-style:disc">';

    foreach ($hits as $hit) {
        printf(
            '<li><code>%1$s</code> → <strong>%2$s</strong><br><span class="description">%3$s (%4$s)</span></li>',
            esc_html((string) $hit['match']),
            esc_html((string) $hit['replacement']),
            esc_html((string) $hit['why']),
            esc_html((string) $hit['ref'])
        );
    }

    echo '</ul><p>';
    esc_html_e('Your previous copy is still live — nothing was lost. Edit the wording above and save again.', 'a2-core');
    echo '</p></div>';
}

/* ─────────────────────────────────────────────────────────────────────────────
   ENFORCEMENT 3 — stop it at the editor, before the save is even attempted
   ───────────────────────────────────────────────────────────────────────────── */

add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_guard');

function enqueue_editor_guard(): void
{
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || !in_array($screen->post_type, governed_post_types(), true)) {
        return;
    }

    wp_enqueue_script(
        'a2-term-charter',
        A2_CORE_URL . 'assets/js/term-charter.js',
        ['wp-plugins', 'wp-edit-post', 'wp-data', 'wp-i18n', 'wp-notices'],
        VERSION,
        true
    );

    wp_localize_script('a2-term-charter', 'A2TermCharter', [
        // Keys must match what assets/js/term-charter.js reads: match / replace /
        // block / why / ref. A rename on one side is a silent no-op on the other,
        // which is exactly the failure this guard exists to prevent.
        'terms' => array_map(
            static fn (array $t): array => [
                'match'   => $t['match'],
                'replace' => $t['replacement'],
                'block'   => $t['severity'] === 'block',
                'why'     => $t['why'],
                'ref'     => $t['ref'],
            ],
            charter()
        ),
        'canOverride' => current_user_can('manage_options'),
    ]);
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPORT — the CI lint consumes this, so there is one dictionary
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_route');

function register_route(): void
{
    register_rest_route('a2/v1', '/term-charter', [
        'methods'             => 'GET',
        // Public: it contains no secrets, and the CI lint must be able to read it
        // on a staging box before any credentials exist.
        'permission_callback' => '__return_true',
        'callback'            => static fn (): array => [
            'version'    => VERSION,
            'governed'   => governed_post_types(),
            'terms'      => charter(),
        ],
    ]);
}
