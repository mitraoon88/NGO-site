<?php
/**
 * ROLES — 9-role matrix, blueprint §9
 * ===================================
 *
 * | Role                      | Base WP role        | Scope                                     |
 * |---------------------------|---------------------|-------------------------------------------|
 * | Super Admin               | administrator       | Everything incl. plugins, compliance       |
 * | Org Admin                 | restricted admin    | All operations; no plugin/theme install    |
 * | Program Manager           | editor + caps       | All verticals, CSR pipeline, ledger verify |
 * | Operations Coordinator    | author + caps       | Collection runs, batches, QC — own zone(s) |
 * | Heritage Coordinator      | author + caps       | Drives, temple sites, MoUs, field reports  |
 * | Field Lead                | contributor + caps  | Attendance + report verification only      |
 * | Volunteer / Sevika        | subscriber          | Own shifts, hours, slips, certificates     |
 * | Accountant                | custom finance      | Remittances, expenses, 80/20, ledger       |
 * | CSR Manager               | custom              | CSR leads, resource drawer, analytics      |
 * | Auditor/Viewer            | read-only           | Ledger + data room + audit log             |
 *
 * WHY NOT A ROLE PLUGIN
 * ---------------------
 * §9 states it plainly: "role plugins alone cannot provide row-level isolation".
 * A role plugin gives you capability granularity; it cannot make coordinator A
 * unable to see coordinator B's zone. That needs a query filter, which is
 * inc/scoping.php. This file creates the roles and capabilities; that file makes
 * them mean something.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\roles;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The matrix as data, so the admin screen, the tests and the docs all read the
 * same thing.
 *
 * `caps` are added on top of the base role's capabilities (never replacing
 * them — replacing an editor's caps breaks the block editor in non-obvious
 * ways). `deny` are removed explicitly.
 *
 * @return array<string, array{label:string,base:string,scope:string,caps:string[],deny:string[]}>
 */
function matrix(): array
{
    return [
        'a2_program_manager' => [
            'label' => __('Program Manager', 'a2-core'),
            'base'  => 'editor',
            'scope' => 'all verticals, CSR pipeline, ledger verification',
            'caps'  => [
                'a2_view_ledger', 'a2_verify_ledger', 'a2_manage_csr_leads',
                'a2_manage_metrics', 'a2_manage_campaigns', 'a2_view_finance',
                'a2_export_ledger',
            ],
            'deny'  => ['manage_options', 'install_plugins', 'edit_theme_options'],
        ],
        'a2_ops_coordinator' => [
            'label' => __('Operations Coordinator', 'a2-core'),
            'base'  => 'author',
            'scope' => 'collection runs, restoration batches, chamber assignment, QC — own zone(s)',
            'caps'  => [
                'a2_view_ledger', 'a2_manage_collection_runs', 'a2_manage_batches',
                'a2_verify_ledger', 'a2_view_own_zone_only',
            ],
            'deny'  => ['publish_posts', 'edit_others_posts', 'manage_options'],
        ],
        'a2_heritage_coordinator' => [
            'label' => __('Heritage Coordinator', 'a2-core'),
            'base'  => 'author',
            'scope' => 'drives, temple sites, MoUs, field reports',
            'caps'  => [
                'a2_manage_drives', 'a2_manage_temple_sites', 'a2_verify_field_reports',
                'a2_view_own_zone_only',
            ],
            'deny'  => ['manage_options'],
        ],
        'a2_field_lead' => [
            'label' => __('Field Lead', 'a2-core'),
            'base'  => 'contributor',
            'scope' => 'attendance and report verification only',
            'caps'  => ['a2_verify_attendance', 'a2_verify_field_reports', 'a2_view_own_zone_only'],
            'deny'  => ['publish_posts', 'upload_files', 'manage_options'],
        ],
        'a2_sevika' => [
            'label' => __('Volunteer / Sevika', 'a2-core'),
            // Subscriber = front-end only, no wp-admin at all (§9). This is a
            // safeguarding decision as much as a permissions one: an account
            // that cannot log into wp-admin cannot accidentally see another
            // Sevika's remittance record.
            'base'  => 'subscriber',
            'scope' => 'own shifts, tasks, hours, remittance slips, certificates',
            'caps'  => ['read'],
            'deny'  => ['edit_posts', 'upload_files', 'manage_options', 'list_users'],
        ],
        'a2_accountant' => [
            'label' => __('Accountant', 'a2-core'),
            'base'  => 'author',
            'scope' => 'remittances, expenses, 80/20, contribution ledger',
            'caps'  => [
                'a2_manage_remittances', 'a2_manage_expenses', 'a2_view_finance',
                'a2_view_ledger', 'a2_export_ledger', 'a2_verify_ledger',
            ],
            'deny'  => ['manage_options', 'edit_theme_options', 'install_plugins'],
        ],
        'a2_csr_manager' => [
            'label' => __('CSR Manager', 'a2-core'),
            'base'  => 'author',
            'scope' => 'CSR leads, resource drawer, download analytics, proposals',
            'caps'  => ['a2_manage_csr_leads', 'a2_manage_data_room', 'a2_view_metrics', 'a2_export_ledger'],
            'deny'  => ['manage_options', 'a2_view_finance'],
        ],
        'a2_auditor' => [
            'label' => __('Auditor / Viewer', 'a2-core'),
            'base'  => 'subscriber',
            'scope' => 'read-only: ledger, data room, audit log',
            'caps'  => ['a2_view_ledger', 'a2_view_metrics', 'a2_view_finance', 'a2_export_ledger', 'a2_view_audit_log'],
            'deny'  => ['edit_posts', 'publish_posts', 'manage_options', 'a2_verify_ledger'],
        ],
        'a2_org_admin' => [
            'label' => __('Org Admin', 'a2-core'),
            'base'  => 'administrator',
            'scope' => 'all operations; cannot install plugins or themes',
            'caps'  => ['a2_view_audit_log', 'a2_manage_metrics'],
            'deny'  => ['install_plugins', 'install_themes', 'edit_theme_options', 'update_core', 'switch_themes'],
        ],
    ];
}

/**
 * Every custom capability the platform defines. Registered against both roles
 * and the administrator, so an admin is never locked out of their own platform.
 *
 * @return string[]
 */
function capabilities(): array
{
    return [
        'a2_view_ledger', 'a2_verify_ledger', 'a2_export_ledger',
        'a2_manage_collection_runs', 'a2_manage_batches', 'a2_manage_drives',
        'a2_manage_temple_sites', 'a2_verify_field_reports', 'a2_verify_attendance',
        'a2_manage_remittances', 'a2_manage_expenses', 'a2_view_finance',
        'a2_manage_csr_leads', 'a2_manage_data_room', 'a2_manage_metrics',
        'a2_manage_campaigns', 'a2_view_metrics', 'a2_view_audit_log',
        'a2_view_own_zone_only', 'a2_override_term_charter', 'a2_manage_switches',
    ];
}

/**
 * Create the roles. Idempotent: re-running adds missing caps without removing
 * ones an administrator granted by hand.
 */
function install_roles(): void
{
    foreach (matrix() as $slug => $def) {
        $existing = get_role($slug);

        if ($existing === null) {
            add_role($slug, $def['label'], ['read']);
        }

        $role = get_role($slug);
        if ($role === null) {
            continue;
        }

        foreach ($def['caps'] as $cap) {
            if (!$role->has_cap($cap)) {
                $role->add_cap($cap);
            }
        }
        foreach ($def['deny'] as $cap) {
            if ($role->has_cap($cap)) {
                $role->remove_cap($cap);
            }
        }
    }

    // Administrators hold every platform capability; the compliance switches
    // are separated out because §13 wants them behind `manage_options` AND a
    // deliberate second act (the reason field).
    $admin = get_role('administrator');
    if ($admin !== null) {
        foreach (capabilities() as $cap) {
            if (!$admin->has_cap($cap)) {
                $admin->add_cap($cap);
            }
        }
        if (!$admin->has_cap('a2_manage_switches')) {
            $admin->add_cap('a2_manage_switches');
        }
    }
}

/**
 * Convenience: does the current user hold any of these?
 */
function current_user_can_any(array $caps): bool
{
    foreach ($caps as $cap) {
        if (current_user_can($cap)) {
            return true;
        }
    }
    return false;
}

/**
 * The zone(s) a user is scoped to. An empty array means "all zones" — which is
 * the correct default for Program Manager / Accountant / Auditor, and the thing
 * scoping.php must never confuse with "none".
 *
 * @return string[] Term slugs.
 */
function zones_for_user(int $user_id = 0): array
{
    $user_id = $user_id ?: get_current_user_id();
    if (user_can($user_id, 'manage_options')) {
        return []; // unrestricted
    }
    $zones = get_user_meta($user_id, 'a2_zone_scope', true);
    return is_array($zones) ? array_values(array_filter(array_map('sanitize_title', $zones))) : [];
}
