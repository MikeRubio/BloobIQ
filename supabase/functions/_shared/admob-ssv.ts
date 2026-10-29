export type ParsedSsvCallback = {
  signedQuery: string;
  signature: Uint8Array;
  keyId: string;
  params: URLSearchParams;
};

const textEncoder = new TextEncoder();
const arrayBuffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;

function base64UrlBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function trimInteger(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start += 1;
  const value = bytes.slice(start);
  if (value.length > 32) throw new Error('ECDSA integer is too large.');
  const padded = new Uint8Array(32);
  padded.set(value, 32 - value.length);
  return padded;
}

/** Converts Google's ASN.1 DER ECDSA signature to the P1363 form WebCrypto expects. */
export function derEcdsaToP1363(signature: Uint8Array): Uint8Array {
  if (signature[0] !== 0x30) {
    if (signature.length === 64) return signature;
    throw new Error('Invalid ECDSA signature sequence.');
  }
  let offset = 1;
  let sequenceLength = signature[offset++]!;
  if (sequenceLength & 0x80) {
    const count = sequenceLength & 0x7f;
    sequenceLength = 0;
    for (let index = 0; index < count; index += 1) sequenceLength = (sequenceLength << 8) | signature[offset++]!;
  }
  if (offset + sequenceLength !== signature.length || signature[offset++] !== 0x02) throw new Error('Invalid ECDSA signature length.');
  const rLength = signature[offset++]!;
  const r = trimInteger(signature.slice(offset, offset += rLength));
  if (signature[offset++] !== 0x02) throw new Error('Invalid ECDSA signature component.');
  const sLength = signature[offset++]!;
  const s = trimInteger(signature.slice(offset, offset += sLength));
  if (offset !== signature.length) throw new Error('Unexpected ECDSA signature bytes.');
  const raw = new Uint8Array(64); raw.set(r, 0); raw.set(s, 32); return raw;
}

export function parseSsvUrl(url: string): ParsedSsvCallback {
  const query = new URL(url).search.slice(1);
  const marker = query.lastIndexOf('&signature=');
  if (marker < 1) throw new Error('Missing SSV signature.');
  const signatureAndKey = query.slice(marker + 1);
  const match = /^signature=([^&]+)&key_id=([^&]+)$/.exec(signatureAndKey);
  if (!match) throw new Error('SSV signature and key_id must be the final parameters.');
  const params = new URLSearchParams(query);
  return {
    signedQuery: query.slice(0, marker),
    signature: base64UrlBytes(decodeURIComponent(match[1]!)),
    keyId: decodeURIComponent(match[2]!),
    params,
  };
}

function pemBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function verifySsvSignature(parsed: ParsedSsvCallback, publicKeyPem: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'spki', arrayBuffer(pemBytes(publicKeyPem)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
  );
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, key, arrayBuffer(derEcdsaToP1363(parsed.signature)), arrayBuffer(textEncoder.encode(parsed.signedQuery)),
  );
}

/** Console verification is a signed connectivity probe, never a reward. */
export function isAdmobConsoleVerification(params: URLSearchParams): boolean {
  const reference = params.get('custom_data');
  return params.get('ad_network') === '5450213213286189855'
    && params.get('ad_unit') === '1234567890'
    && params.get('transaction_id') === '123456789'
    && params.get('reward_item') === 'revive'
    && params.get('reward_amount') === '1'
    && (reference === 'b1000000-0000-4000-8000-000000000001'
      || reference === 'b1000000-0000-4000-8000-000000000002')
    && (!params.get('user_id') || params.get('user_id') === reference);
}

/** Google SSV may send the numeric unit suffix instead of the SDK's full ID. */
export function isAllowedAdmobUnit(adUnitId: string, configuredUnits: string[]): boolean {
  return configuredUnits.some((configured) => {
    const unit = configured.trim();
    if (adUnitId === unit) return true;
    const match = /^ca-app-pub-\d+\/(\d+)$/.exec(unit);
    return Boolean(match && adUnitId === match[1]);
  });
}
