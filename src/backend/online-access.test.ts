import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTICE_VERSION, NO_ACCESS, type AccessState, type AgeChoice } from '../privacy/rules';
import { requireOnlineAccess, refreshOnlineAccess } from './online-access';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), signup: vi.fn(), refresh: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), signOut: vi.fn(), openGate: vi.fn() }));
const local = vi.hoisted(() => ({ state: {} as Record<string, unknown> }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: async () => new Uint8Array(32) }));
vi.mock('./client', () => ({ supabase: { auth: { getSession: mocks.getSession, signInAnonymously: mocks.signup, refreshSession: mocks.refresh, signOut: mocks.signOut }, rpc: mocks.rpc, functions: { invoke: mocks.invoke } } }));
vi.mock('../store/consent-store', () => ({ useConsentStore: { getState: () => local.state } }));
beforeEach(() => {
  vi.clearAllMocks();
  local.state = { age: 'unknown' as AgeChoice, hydrated: true, acceptedNoticeVersion: NOTICE_VERSION, requestCode: 'a'.repeat(64), requestLinked: false, access: { ...NO_ACCESS }, checkedAt: 0, openGate: mocks.openGate, setAccess: (access: AccessState) => { local.state.access = access; } };
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.signup.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
  mocks.rpc.mockResolvedValue({ data: { noticeVersion: NOTICE_VERSION, onlineAllowed: true, sharingAllowed: false, kind: 'child', expiresAt: '2099-01-01' }, error: null });
});
describe('online permission boundary', () => {
  it('does not contact Auth, the database or parent endpoint for an unknown player', async () => {
    await expect(requireOnlineAccess()).rejects.toThrow('Online access');
    expect(mocks.getSession).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('does not create an anonymous account while child approval is pending', async () => {
    local.state.age = 'under18'; mocks.invoke.mockResolvedValue({ data: { approved: false }, error: null });
    await expect(requireOnlineAccess()).rejects.toThrow('pending');
    expect(mocks.signup).not.toHaveBeenCalled(); expect(mocks.getSession).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('checks the parent capability before child signup and keeps sharing independent', async () => {
    local.state.age = 'under18'; mocks.invoke.mockResolvedValue({ data: { approved: true }, error: null });
    await expect(requireOnlineAccess()).resolves.toBe('test-user');
    expect(mocks.invoke.mock.invocationCallOrder[0]).toBeLessThan(mocks.signup.mock.invocationCallOrder[0]!);
    expect(mocks.rpc).toHaveBeenCalledWith('claim_parental_consent', { p_request_secret: 'a'.repeat(64), p_notice_version: NOTICE_VERSION });
    expect(local.state.access).toMatchObject({ onlineAllowed: true, sharingAllowed: false });
  });
  it('does not poll or silently enroll a pending child in the background', async () => {
    local.state.age = 'under18'; await refreshOnlineAccess(); expect(mocks.invoke).not.toHaveBeenCalled(); expect(mocks.signup).not.toHaveBeenCalled();
  });
  it('requires a new adult acknowledgement for a changed notice', async () => {
    local.state.age = 'adult'; local.state.acceptedNoticeVersion = 'old';
    await expect(requireOnlineAccess()).rejects.toThrow('updated privacy notice'); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.signup).not.toHaveBeenCalled();
  });
  it('clears live permission when the server rejects a revoked child grant', async () => {
    local.state.age = 'under18'; local.state.access = { ...NO_ACCESS, onlineAllowed: true, kind: 'child' };
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('Revoked') });
    await expect(requireOnlineAccess(true)).rejects.toThrow('Revoked'); expect(local.state.access).toEqual(NO_ACCESS);
  });
  it('ends a stalled connection instead of leaving the permission screen loading', async () => {
    vi.useFakeTimers(); local.state.age = 'under18'; mocks.invoke.mockReturnValue(new Promise(() => undefined));
    try { const result = expect(requireOnlineAccess()).rejects.toThrow('timed out'); await vi.advanceTimersByTimeAsync(12_000); await result; expect(local.state.access).toEqual(NO_ACCESS); }
    finally { vi.useRealTimers(); }
  });
});
