<?php
/**
 * COMPLIANCE SWITCHES — blueprint §13.1
 * =====================================
 *
 * "Hard admin switches (site options, default OFF). Legal trigger to enable."
 *
 *   | Switch                  | Legal trigger to enable                        |
 *   |-------------------------|------------------------------------------------|
 *   | 80G tax receipts        | 80G grant obtained                             |
 *   | International payments  | FCRA obtained (otherwise gateway-blocked)      |
 *   | CSR grant acceptance    | Entity registration + NGO Darpan + MCA CSR-1   |
 *   | Public commerce         | Entity / trade licensing decision              |
 *
 * WHY THIS IS A MODULE AND NOT FOUR `if` STATEMENTS
 * -------------------------------------------------
 * A compliance gate that lives in one place is auditable; one that lives in
 * eleven places is a liability. Every gated capability asks this module, and
 * the module refuses when the switch is off. There is no second opinion.
 *
 * Every flip is logged with who/when/why, because "we didn't know 80G was on"
 * is precisely the conversation this must survive.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\switches;

if (!defined('ABSPATH')) {
    exit;
}

const OPTION = 'a2_compliance_switches';
const LOG_OPTION = 'a2_compliance_switch_log';

/**
 * The switches and the legal event each one waits for.
 *
 * @return array<string, array{label:string,danger:string,trigger:string,default:bool}>
 */
function definitions(): array
{
    return [
        'tax_receipts_80g' => [
            'label'   => __('80G tax receipts', 'a2-core'),
            'danger'  => __('Enables 80G language, receipt PDFs and the non-80G clause override. Prohibited until the 80G grant is obtained.', 'a2-core'),
            'trigger' => '80G grant obtained',
            'default' => false,
        ],
        'international_payments' => [
            'label'   => __('International contributions', 'a2-core'),
            'danger'  => __('Enables non-domestic cards on the gateway. Prohibited until FCRA registration; the gateway blocks them at source.', 'a2-core'),
            'trigger' => 'FCRA obtained',
            'default' => false,
        ],
        'csr_grant_acceptance' => [
            'label'   => __('CSR grant acceptance', 'a2-core'),
            'danger'  => __('Permits recording a CSR grant as received. Requires entity registration + NGO Darpan + MCA Form CSR-1.', 'a2-core'),
            'trigger' => 'Entity registration + NGO Darpan + MCA CSR-1',
            'default' => false,
        ],
        'public_commerce' => [
            'label'   => __('Public commerce surfaces', 'a2-core'),
            'danger'  => __('Enables a public /products route and craft checkout. Requires an entity/trade-licensing decision; blueprint §0.2(4) deletes the public surface.', 'a2-core'),
            'trigger' => 'Entity / trade licensing decision',
            'default' => false,
        ],
    ];
}

/**
 * Install the defaults. Called on activation, and idempotent.
 */
function install_defaults(): void
{
    $current = get_option(OPTION, null);
    if (!is_array($current)) {
        $defaults = [];
        foreach (definitions() as $key => $def) {
            $defaults[$key] = $def['default'];
        }
        update_option(OPTION, $defaults, false);
        return;
    }

    // A switch added by a plugin update must appear OFF, never inherit a truthy
    // value from an unrelated old key.
    foreach (definitions() as $key => $def) {
        if (!array_key_exists($key, $current)) {
            $current[$key] = $def['default'];
        }
    }
    update_option(OPTION, $current, false);
}

/**
 * Is a switch on? Fails closed: an unknown key returns false.
 */
function enabled(string $key): bool
{
    $all = get_option(OPTION, []);
    if (!is_array($all)) {
        return false;
    }
    return array_key_exists($key, $all) ? (bool) $all[$key] : false;
}

/**
 * Flip a switch. Administrator capability is checked by the caller AND here,
 * so a future caller that forgets cannot bypass it.
 *
 * @return bool Whether the state changed.
 */
function set(string $key, bool $on, string $reason = ''): bool
{
    $defs = definitions();
    if (!array_key_exists($key, $defs)) {
        return false;
    }
    if (!current_user_can('manage_options')) {
        return false;
    }

    $all = (array) get_option(OPTION, []);
    $was = (bool) ($all[$key] ?? false);

    if ($was === $on) {
        return false;
    }

    $all[$key] = $on;
    update_option(OPTION, $all, false);

    // Immutable-ish audit trail, capped so it cannot grow without bound.
    $log   = (array) get_option(LOG_OPTION, []);
    $log[] = [
        'switch' => $key,
        'from'   => $was,
        'to'     => $on,
        'user'   => get_current_user_id(),
        'reason' => sanitize_text_field($reason),
        'at'     => current_time('mysql', true),
    ];
    if (count($log) > 200) {
        $log = array_slice($log, -200);
    }
    update_option(LOG_OPTION, $log, false);

    error_log(sprintf(
        '[a2-core] compliance switch %s: %s -> %s by user %d. Reason: %s',
        $key,
        $was ? 'on' : 'off',
        $on ? 'on' : 'off',
        get_current_user_id(),
        $reason !== '' ? $reason : '(none given)'
    ));

    /**
     * Fires when a compliance switch changes.
     *
     * @param string $key
     * @param bool   $was
     * @param bool   $on
     */
    do_action('a2_compliance_switch_changed', $key, $was, $on);

    // Everything cached about money changes when a money switch moves.
    wp_cache_flush();

    return true;
}

/**
 * All switch states, for the health endpoint and the admin screen.
 *
 * @return array<string, bool>
 */
function all(): array
{
    $all = get_option(OPTION, []);
    $out = [];
    foreach (array_keys(definitions()) as $key) {
        $out[$key] = is_array($all) && array_key_exists($key, $all) ? (bool) $all[$key] : false;
    }
    return $out;
}

/**
 * @return array<int, array<string, mixed>>
 */
function log_entries(): array
{
    $log = get_option(LOG_OPTION, []);
    return is_array($log) ? array_reverse($log) : [];
}

/**
 * The bilingual footer disclosure (§13.2). Rendered on every page; its wording
 * changes only when the 80G switch moves, and it is never hand-edited.
 */
function footer_disclosure(): string
{
    if (enabled('tax_receipts_80g')) {
        return __('A2 Foundation is a registered voluntary organisation. Contributions may be eligible for a section 80G tax benefit; a receipt is issued per contribution.', 'a2-core');
    }

    return __('A2 Foundation is a voluntary initiative; statutory registration is in process. Contributions are voluntary and currently carry no section 80G tax benefit.', 'a2-core');
}
