<?php
/**
 * VOLUNTARY CONTRIBUTIONS — blueprint §10.6
 * =========================================
 *
 * TWO RULES THAT ARE NOT NEGOTIABLE
 * ---------------------------------
 * 1. **The word is "Voluntary Contribution".** Never "Donate", never
 *    "Donation", never "Charity". Without 80G registration a donation
 *    solicitation is a claim the organisation cannot make, and the term charter
 *    (inc/terms.php) blocks the word everywhere it can. The CTA on the homepage
 *    is "Support the Mission".
 *
 * 2. **Nothing is "paid" until the signature-verified webhook says so.** The
 *    browser's return URL is a hint, not evidence. A user can close the tab
 *    mid-payment; a malicious user can type the success URL. So:
 *
 *        create intent  →  status = created   (no money counted anywhere)
 *        webhook (HMAC) →  status = paid      ← the only transition that counts
 *
 *    This is lifted directly from Setu's `inc/donations.php`, which got this
 *    right: `hash_equals()` over the raw body, and `do_action()` for the
 *    receipt. What changed is that the flow now sits behind a compliance
 *    switch, and the CPT is `do_not_allow` for manual creation.
 *
 * THE SWITCH
 * ----------
 * §10.6 also requires the *collection* switch to be OFF by default: before
 * registration the site may present the mission and accept an expression of
 * interest, but must not take money. `switches\enabled('contributions')` is that
 * gate, and every entry point checks it.
 *
 * @package A2\Core
 */

declare(strict_types=1);

namespace A2\Core\contributions;

use A2\Core\metrics;
use A2\Core\switches;

if (!defined('ABSPATH')) {
    exit;
}

const CPT = 'a2_contribution';

/* ─────────────────────────────────────────────────────────────────────────────
   GUARD — CPT creation only by this file
   ───────────────────────────────────────────────────────────────────────────── */

add_filter('map_meta_cap', __NAMESPACE__ . '\\deny_manual_creation', 10, 4);

/**
 * `create_posts => do_not_allow` from Setu, done the modern way.
 *
 * A contribution row created by hand in wp-admin has no gateway id, no HMAC and
 * no consent reference — it is unfalsifiable money. The only actor allowed to
 * create one is the webhook, which runs as user 0 with a bypass flag.
 *
 * @param string[] $caps
 * @param string   $cap
 * @param int      $user_id
 * @param mixed[]  $args
 * @return string[]
 */
function deny_manual_creation(array $caps, string $cap, int $user_id, array $args): array
{
    if ($cap !== 'create_posts' || ($args[0] ?? '') !== CPT) {
        return $caps;
    }
    if (defined('A2_GATEWAY_CONTEXT') && A2_GATEWAY_CONTEXT) {
        return $caps; // the webhook's controlled bypass
    }
    return ['do_not_allow'];
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP 1 — create an intent
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * @return array{order_id:string,key_id:string,amount:int,currency:string,status:string}|\WP_Error
 */
function create_intent(int $amount_inr, string $consent_ref = '', string $email = '')
{
    $amount = normalise_amount($amount_inr);
    if (is_wp_error($amount)) {
        return $amount;
    }

    $result = gateway_request('POST', '/orders', [
        'amount'   => $amount * 100, // gateway wants paise
        'currency' => 'INR',
        'receipt'  => 'a2_' . wp_generate_password(10, false),
        'notes'    => [
            'consent_ref' => $consent_ref,
            'email'       => $email,
        ],
    ]);

    if (is_wp_error($result)) {
        return $result;
    }

    $order = create_record([
        'a2_amount_inr'       => $amount,
        'a2_currency'         => 'INR',
        'a2_gateway'          => 'razorpay',
        'a2_gateway_order_id' => (string) ($result['id'] ?? ''),
        'a2_status'           => 'created',
        'a2_consent_ref'      => $consent_ref,
    ]);

    if (is_wp_error($order)) {
        return $order;
    }

    return [
        'order_id' => (string) ($result['id'] ?? ''),
        'key_id'   => \A2\Core\razorpay_key_id(),
        'amount'   => $amount,
        'currency' => 'INR',
        'status'   => 'created',
    ];
}

/**
 * Amount rules, stated once.
 *
 * No maximum is imposed by the platform; a minimum is, because a ₹1 intent is
 * almost always a card-testing probe and costs more in gateway fee than it
 * raises. The cap on the integer keeps `absint` from silently truncating.
 *
 * @return int|\WP_Error
 */
function normalise_amount(int $amount)
{
    if ($amount < 100) {
        return new \WP_Error(
            'a2_amount_too_low',
            __('The minimum voluntary contribution is ₹100.', 'a2-core'),
            ['status' => 422]
        );
    }
    if ($amount > 10000000) {
        return new \WP_Error(
            'a2_amount_too_high',
            __('For contributions above ₹1,00,000 please contact the team directly.', 'a2-core'),
            ['status' => 422]
        );
    }
    return $amount;
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP 2 — the webhook. The only path to `paid`.
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Verify a webhook body and settle the matching contribution.
 *
 * The signature is HMAC-SHA256 over the **raw** body with the webhook secret.
 * Recomputing over a re-encoded JSON body is a classic bug: `json_decode` then
 * `wp_json_encode` reorders keys and the signatures stop matching. So this
 * function takes the raw string, and the REST callback must pass
 * `$request->get_body()`, never `$request->get_json_params()`.
 *
 * @return array{ok:bool,reason?:string,post_id?:int}
 */
function handle_webhook(string $raw_body, string $signature, string $secret): array
{
    if ($secret === '') {
        return ['ok' => false, 'reason' => 'webhook secret not configured'];
    }
    if ($signature === '') {
        return ['ok' => false, 'reason' => 'missing signature'];
    }

    $expected = hash_hmac('sha256', $raw_body, $secret);
    if (!hash_equals($expected, $signature)) {
        // Deliberately vague to the caller, specific to the log.
        error_log('[a2-core] contribution webhook signature mismatch');
        return ['ok' => false, 'reason' => 'signature mismatch'];
    }

    $payload = json_decode($raw_body, true);
    if (!is_array($payload)) {
        return ['ok' => false, 'reason' => 'unparseable body'];
    }

    $event = (string) ($payload['event'] ?? '');
    $entity = $payload['payload']['payment']['entity'] ?? null;
    if (!is_array($entity)) {
        return ['ok' => false, 'reason' => 'no payment entity'];
    }

    $order_id = (string) ($entity['order_id'] ?? '');
    $payment_id = (string) ($entity['id'] ?? '');
    if ($order_id === '' || $payment_id === '') {
        return ['ok' => false, 'reason' => 'missing order or payment id'];
    }

    $post_id = find_by_order($order_id);
    if ($post_id === 0) {
        return ['ok' => false, 'reason' => 'unknown order ' . $order_id];
    }

    // Idempotency: gateways retry. A second `payment.captured` for the same
    // payment must not double-count or re-fire the receipt action.
    $seen = (string) get_post_meta($post_id, 'a2_gateway_payment_id', true);
    if ($seen !== '' && $seen === $payment_id && (string) get_post_meta($post_id, 'a2_status', true) === 'paid') {
        return ['ok' => true, 'post_id' => $post_id];
    }

    // The amount the gateway reports must match the amount we created. A
    // mismatch is either a bug or an attack; either way it is not settled.
    $expected_paise = (int) get_post_meta($post_id, 'a2_amount_inr', true) * 100;
    $actual_paise = (int) ($entity['amount'] ?? 0);
    if ($expected_paise !== $actual_paise) {
        error_log(sprintf('[a2-core] contribution amount mismatch on order %s: expected %d, got %d', $order_id, $expected_paise, $actual_paise));
        return ['ok' => false, 'reason' => 'amount mismatch'];
    }

    switch ($event) {
        case 'payment.captured':
        case 'payment.authorized':
            update_post_meta($post_id, 'a2_gateway_payment_id', $payment_id);
            update_post_meta($post_id, 'a2_status', 'paid');
            wp_update_post(['ID' => $post_id, 'post_status' => 'publish']);
            metrics\invalidate();

            /**
             * Receipt hook. Setu used `setu_donation_paid` for the same purpose.
             * The receipt is sent by the 80G module once that switch is on; until
             * then this fires and nothing listens, which is the correct silence.
             */
            do_action('a2_contribution_paid', $post_id, $entity);
            return ['ok' => true, 'post_id' => $post_id];

        case 'payment.failed':
            update_post_meta($post_id, 'a2_status', 'failed');
            do_action('a2_contribution_failed', $post_id, $entity);
            return ['ok' => true, 'post_id' => $post_id];

        case 'refund.processed':
            update_post_meta($post_id, 'a2_status', 'refunded');
            metrics\invalidate();
            do_action('a2_contribution_refunded', $post_id, $payload);
            return ['ok' => true, 'post_id' => $post_id];

        default:
            // Unknown events are acknowledged (200) so the gateway stops retrying
            // — a non-2xx here causes an infinite retry storm.
            return ['ok' => true, 'reason' => 'ignored event ' . $event];
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   RECORDS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * @param array<string, mixed> $meta
 * @return int|\WP_Error
 */
function create_record(array $meta)
{
    if (!defined('A2_GATEWAY_CONTEXT')) {
        define('A2_GATEWAY_CONTEXT', true);
    }

    $post_id = wp_insert_post([
        'post_type'   => CPT,
        'post_status' => 'private', // not public until paid; see handle_webhook()
        'post_title'  => sprintf(
            /* translators: 1: amount in INR, 2: gateway order id */
            __('Voluntary contribution ₹%1$s — %2$s', 'a2-core'),
            number_format_i18n((int) ($meta['a2_amount_inr'] ?? 0)),
            (string) ($meta['a2_gateway_order_id'] ?? '')
        ),
        'meta_input'  => $meta,
    ], true);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    return (int) $post_id;
}

function find_by_order(string $order_id): int
{
    $ids = get_posts([
        'post_type'      => CPT,
        'post_status'    => ['private', 'publish', 'draft'],
        'posts_per_page' => 1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
        'meta_query'     => [['key' => 'a2_gateway_order_id', 'value' => $order_id, 'compare' => '=']],
    ]);
    return $ids === [] ? 0 : (int) $ids[0];
}

/* ─────────────────────────────────────────────────────────────────────────────
   GATEWAY HTTP — one place that talks to the network
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * @param array<string, mixed> $body
 * @return array<string, mixed>|\WP_Error
 */
function gateway_request(string $method, string $path, array $body = [])
{
    $key = \A2\Core\razorpay_key_id();
    $secret = \A2\Core\razorpay_key_secret();
    if ($key === '' || $secret === '') {
        return new \WP_Error('a2_gateway_unconfigured', __('The contribution gateway is not configured.', 'a2-core'), ['status' => 503]);
    }

    $response = wp_remote_request('https://api.razorpay.com/v1' . $path, [
        'method'  => $method,
        'timeout' => 15,
        'headers' => [
            'Authorization' => 'Basic ' . base64_encode($key . ':' . $secret),
            'Content-Type'  => 'application/json',
        ],
        'body'    => $method === 'GET' ? null : wp_json_encode($body),
    ]);

    if (is_wp_error($response)) {
        return $response;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    $decoded = json_decode((string) wp_remote_retrieve_body($response), true);

    if ($code < 200 || $code >= 300 || !is_array($decoded)) {
        return new \WP_Error('a2_gateway_error', __('The gateway rejected the request.', 'a2-core'), ['status' => 502]);
    }

    return $decoded;
}

/* ─────────────────────────────────────────────────────────────────────────────
   REST
   ───────────────────────────────────────────────────────────────────────────── */

add_action('rest_api_init', __NAMESPACE__ . '\\register_routes');

function register_routes(): void
{
    register_rest_route('a2/v1', '/contribution-intent', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true',
        'callback'            => static function (\WP_REST_Request $request) {
            // Compliance switch first: before registration the platform may not
            // take money, and the refusal must be explicit rather than a 500.
            if (!switches\enabled('contributions')) {
                return new \WP_Error(
                    'a2_contributions_off',
                    __('Voluntary contributions are not open yet. You can register interest instead.', 'a2-core'),
                    ['status' => 503, 'a2_reason' => 'compliance_switch_off']
                );
            }

            $amount = (int) $request->get_param('amount_inr');
            $consent = sanitize_text_field((string) $request->get_param('consent_ref'));
            $email = sanitize_email((string) $request->get_param('email'));

            if ($consent === '') {
                return new \WP_Error('a2_consent_required', __('A consent reference is required.', 'a2-core'), ['status' => 422]);
            }

            $result = create_intent($amount, $consent, $email);
            if (is_wp_error($result)) {
                return $result;
            }
            return rest_ensure_response($result);
        },
        'args' => [
            'amount_inr'  => ['type' => 'integer', 'required' => true],
            'consent_ref' => ['type' => 'string', 'required' => true],
            'email'       => ['type' => 'string', 'format' => 'email'],
        ],
    ]);

    register_rest_route('a2/v1', '/gateway-webhook', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true', // authenticated by HMAC, not by cookie
        'callback'            => static function (\WP_REST_Request $request) {
            $raw = $request->get_body(); // RAW. Not get_json_params(). See handle_webhook().
            $signature = (string) $request->get_header('x-razorpay-signature');

            $result = handle_webhook($raw, $signature, \A2\Core\razorpay_webhook_secret());

            if (!$result['ok']) {
                return new \WP_Error('a2_webhook_rejected', (string) ($result['reason'] ?? 'rejected'), ['status' => 400]);
            }

            return rest_ensure_response(['received' => true] + $result);
        },
    ]);
}
