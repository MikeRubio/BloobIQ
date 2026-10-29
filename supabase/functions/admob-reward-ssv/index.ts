import { createClient } from 'npm:@supabase/supabase-js@2';
import { isAdmobConsoleVerification, isAllowedAdmobUnit, parseSsvUrl, verifySsvSignature } from '../_shared/admob-ssv.ts';

type GoogleKey = { keyId?: number | string; key_id?: number | string; pem: string };
const GOOGLE_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
let keyCache: { expiresAt: number; keys: Map<string, string> } | null = null;

const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function googleKeys(force = false): Promise<Map<string, string>> {
  if (!force && keyCache && keyCache.expiresAt > Date.now()) return keyCache.keys;
  const response = await fetch(GOOGLE_KEYS_URL, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Google verifier keys returned ${response.status}.`);
  const payload = await response.json() as { keys?: GoogleKey[] };
  const keys = new Map((payload.keys ?? []).map((key) => [String(key.keyId ?? key.key_id), key.pem]));
  if (!keys.size) throw new Error('Google verifier keys were empty.');
  const maxAge = /max-age=(\d+)/i.exec(response.headers.get('cache-control') ?? '')?.[1];
  keyCache = { keys, expiresAt: Date.now() + Math.min(Number(maxAge ?? 3600), 21600) * 1000 };
  return keys;
}

function required(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method !== 'GET') return json(405, { error: 'method_not_allowed' });
  try {
    const parsed = parseSsvUrl(request.url);
    let pem = (await googleKeys()).get(parsed.keyId);
    if (!pem) pem = (await googleKeys(true)).get(parsed.keyId);
    if (!pem || !(await verifySsvSignature(parsed, pem))) {
      console.warn(JSON.stringify({ event: 'admob_ssv_rejected', reason: 'invalid_signature', keyId: parsed.keyId }));
      return json(401, { error: 'invalid_signature' });
    }

    const transactionId = parsed.params.get('transaction_id')?.trim();
    const reference = parsed.params.get('custom_data')?.trim();
    const userId = parsed.params.get('user_id')?.trim();
    const adUnitId = parsed.params.get('ad_unit')?.trim();
    const rewardType = parsed.params.get('reward_item')?.trim();
    const rewardAmountText = parsed.params.get('reward_amount')?.trim();
    const callbackTimestampText = parsed.params.get('timestamp')?.trim();
    if (!transactionId || !reference || !adUnitId || !rewardType || !rewardAmountText || !callbackTimestampText) {
      return json(400, { error: 'missing_callback_parameter' });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)) {
      return json(400, { error: 'invalid_reward_reference' });
    }
    const rewardAmount = Number(rewardAmountText);
    const callbackTimestamp = Number(callbackTimestampText);
    if (!Number.isFinite(rewardAmount) || rewardAmount <= 0 || !Number.isSafeInteger(callbackTimestamp)) {
      return json(400, { error: 'invalid_callback_parameter' });
    }

    // Signature and callback shape have already been verified above.
    // A console probe must never enter the reward-processing database path.
    if (isAdmobConsoleVerification(parsed.params)) {
      console.info(JSON.stringify({ event: 'admob_ssv_console_verified', rewardGranted: false }));
      return json(200, { ok: true, result: 'console_verification', reward_granted: false });
    }

    const allowedUnits = required('ADMOB_SSV_ALLOWED_AD_UNIT_IDS').split(',').map((value) => value.trim()).filter(Boolean);
    const expectedType = required('ADMOB_SSV_REWARD_TYPE');
    const expectedAmount = Number(required('ADMOB_SSV_REWARD_AMOUNT'));
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) throw new Error('ADMOB_SSV_REWARD_AMOUNT must be positive.');
    const mismatches = [
      Boolean(userId && userId !== reference) && 'reward_reference_mismatch',
      !isAllowedAdmobUnit(adUnitId, allowedUnits) && 'unexpected_ad_unit',
      rewardType !== expectedType && 'unexpected_reward_type',
      rewardAmount !== expectedAmount && 'unexpected_reward_amount',
    ].filter(Boolean) as string[];
    const verified = mismatches.length === 0;

    const client = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc('process_admob_ssv', {
      p_transaction_id: transactionId,
      p_reference: reference,
      p_ad_unit_id: adUnitId,
      p_reward_type: rewardType,
      p_reward_amount: rewardAmount,
      p_callback_timestamp: callbackTimestamp,
      p_signed_query: parsed.signedQuery,
      p_verified: verified,
      p_rejection_reason: mismatches.join(',') || null,
    });
    if (error) throw error;
    if (!verified) return json(400, { error: 'reward_mismatch', reasons: mismatches });
    return json(200, { ok: true, result: data });
  } catch (error) {
    console.error(JSON.stringify({ event: 'admob_ssv_error', message: error instanceof Error ? error.message : String(error) }));
    return json(500, { error: 'internal_error' });
  }
});
