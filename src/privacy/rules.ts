export const NOTICE_VERSION = '2026-11-01-v1';
export const POLICY_URL = 'https://bloopiq-privacy.merry-coin-3817.chatgpt.site/';
export const REQUEST_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
export type AgeChoice = 'unknown' | 'adult' | 'under18' | 'offline';
export type AccessState = { onlineAllowed: boolean; sharingAllowed: boolean; kind: 'adult' | 'child' | null; expiresAt: string | null };
export const NO_ACCESS: AccessState = { onlineAllowed: false, sharingAllowed: false, kind: null, expiresAt: null };
export function validRequestCode(value: string): boolean { return /^[a-f0-9]{64}$/.test(value); }
export function requestIsCurrent(code: string | null, createdAt: number | null, now = Date.now()): boolean {
  return Boolean(code && validRequestCode(code) && createdAt && createdAt <= now && now - createdAt < REQUEST_LIFETIME_MS);
}
export function parseAccess(value: unknown): AccessState {
  if (!value || typeof value !== 'object') throw new Error('Online permission could not be checked. Please retry.');
  const v = value as Record<string, unknown>;
  if (v.noticeVersion !== NOTICE_VERSION) return NO_ACCESS;
  const kind = v.kind === 'adult' || v.kind === 'child' ? v.kind : null;
  const expiresAt = typeof v.expiresAt === 'string' ? v.expiresAt : null;
  const approved = v.onlineAllowed === true && Boolean(kind) && (kind === 'adult' || Boolean(expiresAt && Date.parse(expiresAt) > Date.now()));
  return { onlineAllowed: approved, sharingAllowed: approved && v.sharingAllowed === true, kind, expiresAt };
}
export function adsPermitted(age: AgeChoice, access: AccessState): boolean {
  return age === 'adult' && access.kind === 'adult' && access.onlineAllowed;
}
