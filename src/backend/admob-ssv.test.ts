import { describe, expect, it } from 'vitest';
import {
  isAdmobConsoleVerification,
  isAllowedAdmobUnit,
  parseSsvUrl,
  verifySsvSignature,
} from '../../supabase/functions/_shared/admob-ssv';

const base64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');

function p1363ToDer(raw: Uint8Array): Uint8Array {
  const integer = (source: Uint8Array) => {
    let start = 0;
    while (start < source.length - 1 && source[start] === 0) start += 1;
    let value = source.slice(start);
    if ((value[0]! & 0x80) !== 0) value = Uint8Array.from([0, ...value]);
    return Uint8Array.from([0x02, value.length, ...value]);
  };
  const r = integer(raw.slice(0, 32));
  const s = integer(raw.slice(32));
  return Uint8Array.from([0x30, r.length + s.length, ...r, ...s]);
}

const pem = (bytes: ArrayBuffer) => {
  const body = Buffer.from(bytes).toString('base64').match(/.{1,64}/g)!.join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
};

async function signedUrl(query: string) {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const rawSignature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(query)));
  const signature = rawSignature[0] === 0x30 ? rawSignature : p1363ToDer(rawSignature);
  const publicKey = pem(await crypto.subtle.exportKey('spki', keys.publicKey));
  return { url: `https://example.com?${query}&signature=${encodeURIComponent(base64Url(signature))}&key_id=7`, publicKey };
}

describe('AdMob SSV signature verification', () => {
  it('verifies the exact unmodified query bytes', async () => {
    const signed = await signedUrl('ad_unit=test%2Funit&reward_amount=1&reward_item=revive&transaction_id=abc&custom_data=ref');
    await expect(verifySsvSignature(parseSsvUrl(signed.url), signed.publicKey)).resolves.toBe(true);
  });

  it('rejects a callback changed after signing', async () => {
    const signed = await signedUrl('reward_amount=1&reward_item=revive&transaction_id=abc');
    const tampered = signed.url.replace('reward_amount=1', 'reward_amount=2');
    await expect(verifySsvSignature(parseSsvUrl(tampered), signed.publicKey)).resolves.toBe(false);
  });

  it('requires signature and key_id to be the final parameters', async () => {
    expect(() => parseSsvUrl('https://example.com?x=1&signature=abc&key_id=7&extra=1')).toThrow('final parameters');
  });
});

describe('AdMob SSV callback classification', () => {
  const consoleProbe = new URLSearchParams({
    ad_network: '5450213213286189855',
    ad_unit: '1234567890',
    transaction_id: '123456789',
    reward_item: 'revive',
    reward_amount: '1',
    custom_data: 'b1000000-0000-4000-8000-000000000001',
    user_id: 'b1000000-0000-4000-8000-000000000001',
  });

  it('recognises only the narrowly identified signed console probe shape', () => {
    expect(isAdmobConsoleVerification(consoleProbe)).toBe(true);
    const changed = new URLSearchParams(consoleProbe);
    changed.set('transaction_id', 'real-transaction');
    expect(isAdmobConsoleVerification(changed)).toBe(false);
  });

  it('rejects a console probe when user_id conflicts with custom_data', () => {
    const changed = new URLSearchParams(consoleProbe);
    changed.set('user_id', 'b1000000-0000-4000-8000-000000000002');
    expect(isAdmobConsoleVerification(changed)).toBe(false);
  });

  it('accepts configured units in full-ID and numeric-suffix callback forms', () => {
    const allowed = ['ca-app-pub-6478004441965465/1234567890'];
    expect(isAllowedAdmobUnit('ca-app-pub-6478004441965465/1234567890', allowed)).toBe(true);
    expect(isAllowedAdmobUnit('1234567890', allowed)).toBe(true);
    expect(isAllowedAdmobUnit('0987654321', allowed)).toBe(false);
  });

  it('does not broaden malformed configured allowlist entries into suffix matches', () => {
    expect(isAllowedAdmobUnit('1234567890', ['1234567890'])).toBe(true);
    expect(isAllowedAdmobUnit('1234567890', ['publisher/1234567890'])).toBe(false);
  });
});
