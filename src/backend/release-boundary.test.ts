import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailySnapshot } from './types';
vi.mock('../store/consent-store', () => ({ useConsentStore: { getState: () => ({ access: { onlineAllowed: true } }) } }));

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), session: vi.fn() }));
vi.mock('./supabase', () => ({
  supabase: { rpc: mocks.rpc }, ensureAnonymousSession: mocks.session,
  getQuizAssetUrl: (path: string) => path,
  BackendUnavailableError: class extends Error {},
}));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'release-request' }));

const profile = { name: 'Test Guest', avatar: '●', color: '#2D9CDB' };
beforeEach(() => {
  vi.stubEnv('EXPO_PUBLIC_RELEASE_CATALOG', 'flags-only');
  vi.resetModules(); vi.clearAllMocks(); mocks.session.mockResolvedValue('test-guest');
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('release API boundaries', () => {
  it('rejects non-flag Casual, Daily, leaderboard, and room creation before network access', async () => {
    const { loadCasualQuestions } = await import('./casual-api');
    const daily = await import('./daily-api');
    const { createFriendRoom } = await import('./friends-api');
    await expect(loadCasualQuestions('football', profile)).rejects.toThrow('not available');
    await expect(daily.fetchDailyState(profile, 'history')).rejects.toThrow('not available');
    await expect(daily.startDailyAttempt(profile, 'baseball')).rejects.toThrow('not available');
    await expect(daily.fetchLeaderboard(profile, 'today', 'brands')).rejects.toThrow('not available');
    await expect(daily.submitDailyAnswer({ categoryId: 'celebrities' } as DailySnapshot, null)).rejects.toThrow('not available');
    await expect(createFriendRoom(profile, 'basketball')).rejects.toThrow('not available');
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('leaves a room from a full-catalogue QA build before surfacing its unavailable quiz', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { categoryId: 'football', roomId: 'qa-room' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const { joinFriendRoom } = await import('./friends-api');
    await expect(joinFriendRoom(profile, 'ABC234')).rejects.toThrow('not available');
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(['join_friend_room', 'leave_friend_room']);
    expect(mocks.rpc).toHaveBeenLastCalledWith('leave_friend_room', { p_room_id: 'qa-room' });
  });
});
