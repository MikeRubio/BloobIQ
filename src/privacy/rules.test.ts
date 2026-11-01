import { describe, expect, it } from 'vitest';
import { adsPermitted, NO_ACCESS, NOTICE_VERSION, parseAccess, requestIsCurrent, REQUEST_LIFETIME_MS } from './rules';
describe('age and parental permission rules', () => {
  it('does not initialize ads for unknown, offline or under-18 players, including approved children', () => {
    for (const age of ['unknown', 'offline', 'under18'] as const) {
      expect(adsPermitted(age, { onlineAllowed: true, sharingAllowed: true, kind: 'child', expiresAt: '2099-01-01' })).toBe(false);
    }
    expect(adsPermitted('adult', NO_ACCESS)).toBe(false);
    expect(adsPermitted('adult', { ...NO_ACCESS, kind: 'adult', onlineAllowed: true })).toBe(true);
  });
  it('fails closed for missing notice, expired child grants and malformed responses', () => {
    expect(parseAccess({ onlineAllowed: true, kind: 'child', expiresAt: '2000-01-01', noticeVersion: NOTICE_VERSION }).onlineAllowed).toBe(false);
    expect(parseAccess({ onlineAllowed: true, kind: 'adult', noticeVersion: 'old' })).toEqual(NO_ACCESS);
    expect(() => parseAccess(null)).toThrow();
  });
  it('keeps public sharing separate from core online consent', () => {
    expect(parseAccess({ onlineAllowed: true, sharingAllowed: false, kind: 'child', expiresAt: '2099-01-01', noticeVersion: NOTICE_VERSION })).toMatchObject({ onlineAllowed: true, sharingAllowed: false });
  });
  it('expires unapproved local requests after 30 days and rejects guessable or future codes', () => {
    const code = 'a'.repeat(64), now = Date.now();
    expect(requestIsCurrent(code, now - 1000, now)).toBe(true);
    expect(requestIsCurrent(code, now - REQUEST_LIFETIME_MS, now)).toBe(false);
    expect(requestIsCurrent('123456', now, now)).toBe(false);
    expect(requestIsCurrent(code, now + 1, now)).toBe(false);
  });
});
