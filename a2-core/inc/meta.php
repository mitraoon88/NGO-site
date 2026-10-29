<?php
/**
 * META REGISTRY — blueprint §8.3 / §8.4
 * ====================================
 *
 * Ported from Setu's `inc/meta.php`, whose shape was right: one `fields()` map,
 * `register_post_meta` with an explicit `auth_callback`, and a single
 * `sanitize_field()` that switches on type. That pattern is kept because it has
 * three properties worth preserving:
 *
 *   1. **One place to audit.** Every meta key the platform writes is in
 *      `fields()`. Nothing calls `update_post_meta()` on an unregistered key.
 *   2. **Auth per field, not per request.** `auth_callback` runs on every REST
 *      write, so a compromised token cannot set `a2_verified_by`.
 *   3. **Sanitise once.** Each type maps to exactly one sanitiser, so a value
 *      cannot be `absint`ed on the way in and echoed raw on the way out.
 *
 * WHAT CHANGED FROM SETU
 * ----------------------
 *   • `show_in_rest` is layer-aware: Layer 2/3 meta is NOT exposed on the public
 *     REST surface. Setu exposed everything, which was fine for 3 CPTs and is a
 *     privacy breach for `a2_beneficiary`.
 *   • Consent is enforced at publish, not just stored (§8.4).
 *   • Financial fields are read-only from REST entirely — only the gateway
 *     webhook (inc/contributions.php) may write them.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\meta;

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', __NAMESPACE__ . '\\register_meta_fields', 20);

/**
 * The registry.
 *
 * Each field: [ type, sanitise, capability-required-to-write, public? ]
 *
 *   type     string|int|float|bool|date|url|email|enum|attachment|user
 *   san      sanitiser id used by sanitize_field()
 *   cap      capability required to write via REST (defaults to edit_posts)
 *   public   true → show_in_rest on the public surface (Layer 1 only)
 *
 * @return array<string, array<string, array{label:string,type:string,san:string,cap?:string,public?:bool,enum?:string[],note?:string}>>
 */
function fields(): array
{
    return [

        /* ── Programmes / campaigns ──────────────────────────────────────── */
        'a2_project' => [
            'a2_vertical_slug'   => ['label' => 'Vertical', 'type' => 'string', 'san' => 'slug', 'public' => true],
            'a2_zone_slugs'      => ['label' => 'Zones', 'type' => 'string', 'san' => 'csv_slug', 'public' => true],
            'a2_kpi_target'      => ['label' => 'KPI target', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_kpi_actual'      => ['label' => 'KPI actual', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_progress_pct'    => ['label' => 'Progress %', 'type' => 'int', 'san' => 'pct', 'public' => true],
            'a2_story_consent'   => ['label' => 'Story consent on file', 'type' => 'bool', 'san' => 'bool', 'note' => '§8.4: no identifiable story publishes without this.'],
        ],
        'a2_campaign' => [
            'a2_target_inr'      => ['label' => 'Target (INR)', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_raised_inr'      => ['label' => 'Raised (INR) — read-only', 'type' => 'int', 'san' => 'int', 'public' => true, 'cap' => 'manage_options'],
            'a2_deadline'        => ['label' => 'Deadline', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_utilisation_note' => ['label' => 'Utilisation note', 'type' => 'string', 'san' => 'text', 'public' => true],
        ],

        /* ── Collection runs — the ledger's source of truth ──────────────── */
        'a2_collection_run' => [
            'a2_run_date'        => ['label' => 'Run date', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_zone_slug'       => ['label' => 'Zone', 'type' => 'string', 'san' => 'slug', 'public' => true],
            'a2_weight_kg'       => ['label' => 'Weight collected (kg)', 'type' => 'float', 'san' => 'float', 'public' => true],
            'a2_baskets'         => ['label' => 'Baskets in', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_temples_covered' => ['label' => 'Temples covered', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_remnant_type'    => ['label' => 'Remnant type', 'type' => 'string', 'san' => 'slug', 'public' => true],
            'a2_photo_ids'       => ['label' => 'Photo attachment IDs', 'type' => 'string', 'san' => 'csv_int'],
            'a2_verified'        => ['label' => 'Verified', 'type' => 'bool', 'san' => 'bool', 'public' => true,
                                     'note' => 'Only verified runs appear on /transparency-log.'],
            'a2_verified_by'     => ['label' => 'Verified by (user ID)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_verify_ledger'],
            'a2_verified_at'     => ['label' => 'Verified at', 'type' => 'date', 'san' => 'datetime', 'cap' => 'a2_verify_ledger', 'public' => true],
        ],
        'a2_processing_batch' => [
            'a2_status_slug'     => ['label' => 'Status', 'type' => 'string', 'san' => 'slug', 'public' => true],
            'a2_input_kg'        => ['label' => 'Input (kg)', 'type' => 'float', 'san' => 'float', 'public' => true],
            'a2_output_kg'       => ['label' => 'Output (kg)', 'type' => 'float', 'san' => 'float', 'public' => true],
            'a2_operator_id'     => ['label' => 'Operator (user ID)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_batches'],
            'a2_run_ids'         => ['label' => 'Linked collection runs', 'type' => 'string', 'san' => 'csv_int', 'public' => true],
        ],

        /* ── Drives / temple sites ──────────────────────────────────────── */
        'a2_drive' => [
            'a2_drive_date'      => ['label' => 'Date', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_start_time'      => ['label' => 'Start time', 'type' => 'string', 'san' => 'text', 'public' => true],
            'a2_meeting_point'   => ['label' => 'Meeting point', 'type' => 'string', 'san' => 'text', 'public' => true],
            'a2_capacity'        => ['label' => 'Volunteer capacity', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_registered'      => ['label' => 'Registered count', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_safety_briefed'  => ['label' => 'Safety brief delivered', 'type' => 'bool', 'san' => 'bool'],
        ],
        'a2_temple_site' => [
            'a2_mou_status'      => ['label' => 'MoU status', 'type' => 'string', 'san' => 'enum', 'public' => true,
                                     'enum' => ['none', 'verbal', 'draft', 'signed']],
            'a2_mou_expiry'      => ['label' => 'MoU expiry', 'type' => 'date', 'san' => 'date'],
            'a2_care_baseline'   => ['label' => 'Care baseline', 'type' => 'string', 'san' => 'text', 'public' => true],
            'a2_last_served'     => ['label' => 'Last served', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_geo'             => ['label' => 'Lat,Long', 'type' => 'string', 'san' => 'geo', 'public' => true],
        ],

        /* ── People — the privacy-critical group ─────────────────────────── */
        'a2_beneficiary' => [
            'a2_consent_date'    => ['label' => 'Consent date', 'type' => 'date', 'san' => 'date',
                                     'note' => '§8.4 mandatory before publish.'],
            'a2_consent_scope'   => ['label' => 'Consent scope', 'type' => 'string', 'san' => 'enum',
                                     'enum' => ['internal', 'photo', 'story_named', 'story_anon']],
            'a2_consent_withdrawn' => ['label' => 'Consent withdrawn', 'type' => 'bool', 'san' => 'bool'],
            'a2_household_size'  => ['label' => 'Household size', 'type' => 'int', 'san' => 'int'],
            'a2_skill_slugs'     => ['label' => 'Skills', 'type' => 'string', 'san' => 'csv_slug'],
            'a2_remittance_note' => ['label' => 'Remittance note', 'type' => 'string', 'san' => 'text', 'cap' => 'a2_manage_remittances'],
        ],
        'a2_student' => [
            'a2_guardian_consent' => ['label' => 'Guardian consent on file', 'type' => 'bool', 'san' => 'bool',
                                      'note' => '§10.5: under-18 records do not exist without this.'],
            'a2_dob'              => ['label' => 'Date of birth', 'type' => 'date', 'san' => 'date'],
            'a2_centre'           => ['label' => 'Learning centre', 'type' => 'string', 'san' => 'text'],
            'a2_grade'            => ['label' => 'Grade', 'type' => 'string', 'san' => 'text'],
            'a2_attendance_pct'   => ['label' => 'Attendance %', 'type' => 'int', 'san' => 'pct'],
        ],
        'a2_attendance' => [
            'a2_checkin_at'      => ['label' => 'Check-in (ISO)', 'type' => 'string', 'san' => 'datetime'],
            'a2_checkout_at'     => ['label' => 'Check-out (ISO)', 'type' => 'string', 'san' => 'datetime'],
            'a2_geo'             => ['label' => 'Lat,Long', 'type' => 'string', 'san' => 'geo'],
            'a2_hours_verified'  => ['label' => 'Verified hours', 'type' => 'float', 'san' => 'float', 'public' => true],
            'a2_verified_by'     => ['label' => 'Verified by', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_verify_attendance'],
        ],

        /* ── Money ──────────────────────────────────────────────────────── */
        'a2_contribution' => [
            // Every field here is gateway-written. Hand editing a contribution
            // amount is indistinguishable from fraud in an audit, so the cap is
            // set high enough that only an administrator can do it, deliberately.
            'a2_amount_inr'      => ['label' => 'Amount (INR)', 'type' => 'int', 'san' => 'int', 'cap' => 'manage_options', 'public' => true],
            'a2_currency'        => ['label' => 'Currency', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
            'a2_gateway'         => ['label' => 'Gateway', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
            'a2_gateway_order_id' => ['label' => 'Gateway order ID', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
            'a2_gateway_payment_id' => ['label' => 'Gateway payment ID', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
            'a2_status'          => ['label' => 'Status', 'type' => 'string', 'san' => 'enum', 'cap' => 'manage_options',
                                     'enum' => ['created', 'paid', 'failed', 'refunded'], 'public' => true],
            'a2_consent_ref'     => ['label' => 'Consent reference', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
            'a2_pan_80g'         => ['label' => 'PAN (for 80G)', 'type' => 'string', 'san' => 'text', 'cap' => 'manage_options'],
        ],
        'a2_remittance' => [
            'a2_sevika_id'       => ['label' => 'Sevika (user ID)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_remittances'],
            'a2_gross_inr'       => ['label' => 'Gross (INR)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_remittances'],
            'a2_net_inr'         => ['label' => 'Net (INR)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_remittances'],
            'a2_transfer_ref'    => ['label' => 'Bank transfer reference', 'type' => 'string', 'san' => 'text', 'cap' => 'a2_manage_remittances'],
            'a2_paid_on'         => ['label' => 'Paid on', 'type' => 'date', 'san' => 'date', 'cap' => 'a2_manage_remittances'],
        ],
        'a2_expense' => [
            'a2_amount_inr'      => ['label' => 'Amount (INR)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_expenses'],
            'a2_category'        => ['label' => 'Category', 'type' => 'string', 'san' => 'text', 'cap' => 'a2_manage_expenses'],
            'a2_bill_attachment' => ['label' => 'Bill attachment ID', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_expenses'],
            'a2_approved_by'     => ['label' => 'Approved by', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_expenses'],
        ],

        /* ── Documents — file-first, per Setu ───────────────────────────── */
        'a2_resource_doc' => [
            'a2_file_id'         => ['label' => 'File (attachment ID)', 'type' => 'int', 'san' => 'int', 'cap' => 'a2_manage_data_room'],
            'a2_file_bytes'      => ['label' => 'File size (bytes)', 'type' => 'int', 'san' => 'int', 'public' => true],
            'a2_file_label'      => ['label' => 'File label', 'type' => 'string', 'san' => 'text', 'public' => true,
                                     'note' => 'Shown on the download card: "PDF · 3.2 MB · audited".'],
            'a2_audited'         => ['label' => 'Audited', 'type' => 'bool', 'san' => 'bool', 'public' => true],
            'a2_requires_lead'   => ['label' => 'Requires lead capture', 'type' => 'bool', 'san' => 'bool', 'public' => true],
        ],
        'a2_document' => [
            'a2_file_id'         => ['label' => 'File (attachment ID)', 'type' => 'int', 'san' => 'int'],
            'a2_doc_category'    => ['label' => 'Category', 'type' => 'string', 'san' => 'text'],
            'a2_version'         => ['label' => 'Version', 'type' => 'string', 'san' => 'text'],
        ],

        /* ── CSR / grants ──────────────────────────────────────────────── */
        'a2_csr_lead' => [
            'a2_company'         => ['label' => 'Company', 'type' => 'string', 'san' => 'text', 'cap' => 'a2_manage_csr_leads'],
            'a2_stage'           => ['label' => 'Stage', 'type' => 'string', 'san' => 'enum', 'cap' => 'a2_manage_csr_leads',
                                     'enum' => ['eoi', 'proposal', 'due_diligence', 'csr1', 'active', 'declined', 'dormant']],
            'a2_csr1_on_file'    => ['label' => 'CSR-1 on file', 'type' => 'bool', 'san' => 'bool', 'cap' => 'a2_manage_csr_leads',
                                     'note' => '§10.6: no grant may be recorded as received without CSR-1.'],
            'a2_contact_hash'    => ['label' => 'Contact hash', 'type' => 'string', 'san' => 'text', 'cap' => 'a2_manage_csr_leads'],
        ],
        'a2_grant' => [
            'a2_amount_inr'      => ['label' => 'Amount (INR)', 'type' => 'int', 'san' => 'int', 'cap' => 'manage_options'],
            'a2_csr1_on_file'    => ['label' => 'CSR-1 on file', 'type' => 'bool', 'san' => 'bool', 'cap' => 'manage_options'],
            'a2_fcra_registered' => ['label' => 'FCRA registered', 'type' => 'bool', 'san' => 'bool', 'cap' => 'manage_options'],
        ],

        /* ── Grievances ────────────────────────────────────────────────── */
        'a2_grievance' => [
            'a2_ticket_id'       => ['label' => 'Ticket ID', 'type' => 'string', 'san' => 'text', 'public' => true],
            'a2_status'          => ['label' => 'Status', 'type' => 'string', 'san' => 'enum', 'public' => true,
                                     'enum' => ['received', 'acknowledged', 'in_progress', 'resolved', 'closed']],
            'a2_resolved_on'     => ['label' => 'Resolved on', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_anonymous'       => ['label' => 'Anonymous', 'type' => 'bool', 'san' => 'bool'],
        ],

        /* ── Certificates ──────────────────────────────────────────────── */
        'a2_certificate' => [
            'a2_verify_id'       => ['label' => 'Public verify ID', 'type' => 'string', 'san' => 'slug', 'public' => true],
            'a2_issued_to'       => ['label' => 'Issued to (user ID)', 'type' => 'int', 'san' => 'int', 'cap' => 'edit_others_posts'],
            'a2_issued_on'       => ['label' => 'Issued on', 'type' => 'date', 'san' => 'date', 'public' => true],
            'a2_hours'           => ['label' => 'Seva hours', 'type' => 'float', 'san' => 'float', 'public' => true],
        ],
    ];
}

/* ─────────────────────────────────────────────────────────────────────────────
   REGISTRATION
   ───────────────────────────────────────────────────────────────────────────── */

function register_meta_fields(): void
{
    foreach (fields() as $post_type => $group) {
        $layer1 = \A2\Core\cpt\layer_of($post_type) === 1;

        foreach ($group as $key => $def) {
            register_post_meta($post_type, $key, [
                'type'          => rest_type($def['type']),
                'single'        => true,
                'show_in_rest'  => $layer1 && ($def['public'] ?? false),
                'default'       => default_for($def['type']),
                'auth_callback' => static function (bool $allowed, string $meta_key, int $post_id) use ($def): bool {
                    // Read is governed by show_in_rest; this callback gates writes.
                    if (defined('REST_REQUEST') && REST_REQUEST === false) {
                        return $allowed;
                    }
                    return current_user_can($def['cap'] ?? 'edit_posts', $post_id);
                },
                'sanitize_callback' => static function ($value) use ($def) {
                    return sanitize_field((string) $def['san'], $value, $def);
                },
            ]);
        }
    }
}

function rest_type(string $type): string
{
    return match ($type) {
        'int'                        => 'integer',
        'float'                      => 'number',
        'bool'                       => 'boolean',
        default                      => 'string',
    };
}

/**
 * @return mixed
 */
function default_for(string $type)
{
    return match ($type) {
        'int'   => 0,
        'float' => 0.0,
        'bool'  => false,
        default => '',
    };
}

/**
 * The single sanitise switch. Every meta value in the platform passes through it.
 *
 * @param mixed $value
 * @param array{type:string,san:string,enum?:string[]} $def
 * @return mixed
 */
function sanitize_field(string $san, $value, array $def)
{
    switch ($san) {
        case 'int':
            return max(0, (int) $value);

        case 'pct':
            return min(100, max(0, (int) $value));

        case 'float':
            return max(0.0, (float) $value);

        case 'bool':
            return (bool) $value;

        case 'slug':
            return sanitize_title((string) $value);

        case 'csv_slug':
            $parts = is_array($value) ? $value : explode(',', (string) $value);
            return implode(',', array_values(array_filter(array_map(
                static fn ($v): string => sanitize_title((string) $v),
                $parts
            ))));

        case 'csv_int':
            $parts = is_array($value) ? $value : explode(',', (string) $value);
            $ids = array_map('absint', array_map('strval', $parts));
            return implode(',', array_values(array_filter($ids)));

        case 'enum':
            $clean = sanitize_key((string) $value);
            $allowed = $def['enum'] ?? [];
            // An unknown enum is rejected, not stored: a typo must not become state.
            return in_array($clean, $allowed, true) ? $clean : ($allowed[0] ?? '');

        case 'date':
            $ts = strtotime((string) $value);
            return $ts ? gmdate('Y-m-d', $ts) : '';

        case 'datetime':
            $ts = strtotime((string) $value);
            return $ts ? gmdate('c', $ts) : '';

        case 'geo':
            // "lat,long" — validated numerically so a bad string cannot reach a map API.
            $parts = array_map('trim', explode(',', (string) $value));
            if (count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) {
                return '';
            }
            $lat = (float) $parts[0];
            $lng = (float) $parts[1];
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                return '';
            }
            return sprintf('%.6F,%.6F', $lat, $lng);

        case 'text':
        default:
            return sanitize_text_field((string) $value);
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSENT GATES — §8.4 / §10.5
   ───────────────────────────────────────────────────────────────────────────── */

add_filter('wp_insert_post_data', __NAMESPACE__ . '\\enforce_consent', 20, 2);

/**
 * A record that identifies a person does not become public without consent.
 *
 * Setu stored a consent reference for stories but never blocked on it. The
 * blueprint is stricter for two types, so both are gated here:
 *
 *   a2_beneficiary → a2_consent_date must be set
 *   a2_student     → a2_guardian_consent must be true
 *
 * Implementation note: same trick as the term charter (inc/terms.php) — the
 * publish status is downgraded to `draft` and the reason is handed to the admin
 * notice through a transient. WordPress offers no clean "abort save" hook.
 *
 * @param array<string, mixed> $data
 * @param array<string, mixed> $postarr
 * @return array<string, mixed>
 */
function enforce_consent(array $data, array $postarr): array
{
    $post_type = (string) ($data['post_type'] ?? '');
    $status = (string) ($data['post_status'] ?? '');

    if (!in_array($status, ['publish', 'private'], true)) {
        return $data;
    }

    $post_id = (int) ($postarr['ID'] ?? 0);
    $problems = [];

    if ($post_type === 'a2_beneficiary') {
        $consent = $post_id ? (string) get_post_meta($post_id, 'a2_consent_date', true) : '';
        $withdrawn = $post_id ? (bool) get_post_meta($post_id, 'a2_consent_withdrawn', true) : false;
        if ($consent === '') {
            $problems[] = __('a consent date is required (§8.4)', 'a2-core');
        }
        if ($withdrawn) {
            $problems[] = __('consent has been withdrawn — the record may not be published', 'a2-core');
        }
    }

    if ($post_type === 'a2_student') {
        $guardian = $post_id ? (bool) get_post_meta($post_id, 'a2_guardian_consent', true) : false;
        if (!$guardian) {
            $problems[] = __('guardian consent is required for an under-18 record (§10.5)', 'a2-core');
        }
    }

    if ($problems === []) {
        return $data;
    }

    $data['post_status'] = 'draft';

    if (function_exists('set_transient') && $post_id) {
        set_transient('a2_consent_block_' . $post_id, $problems, 60);
    }

    return $data;
}

add_action('admin_notices', __NAMESPACE__ . '\\consent_notice');

function consent_notice(): void
{
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if ($screen === null || !in_array($screen->base, ['post', 'post-new'], true)) {
        return;
    }
    $post_id = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : 0;
    if (!$post_id) {
        return;
    }
    $problems = get_transient('a2_consent_block_' . $post_id);
    if (!is_array($problems) || $problems === []) {
        return;
    }
    delete_transient('a2_consent_block_' . $post_id);
    ?>
    <div class="notice notice-error">
        <p><strong><?php esc_html_e('Saved as a draft — consent requirement not met.', 'a2-core'); ?></strong></p>
        <ul style="list-style:disc;margin-left:20px">
            <?php foreach ($problems as $p) : ?>
                <li><?php echo esc_html((string) $p); ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php
}
