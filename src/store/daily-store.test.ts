import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailySnapshot, QuizCategoryId } from '../backend/types';
import { useDailyStore } from './daily-store';

const dailyApi = vi.hoisted(() => ({
  fetchDailyState: vi.fn(),
  startDailyAttempt: vi.fn(),
  submitDailyAnswer: vi.fn(),
}));

vi.mock('../backend/daily-api', () => dailyApi);
vi.mock('../backend/supabase', () => ({
  BackendUnavailableError: class BackendUnavailableError extends Error {
    constructor(message: string, readonly reason: 'configuration' | 'network' | 'auth' = 'network') {
      super(message);
    }
  },
}));

const profile = { name: 'Player', avatar: '1', color: '#2D9CDB' };

function snapshot(categoryId: QuizCategoryId, state: DailySnapshot['state'] = 'not_started'): DailySnapshot {
  return {
    state,
    categoryId,
    challengeDate: '2026-10-29',
    contentVersion: categoryId === 'football' ? 'football-symbols-v2' : `${categoryId}-v1`,
    serverNow: '2026-10-29T10:00:00Z',
    resetAt: '2026-10-30T00:00:00Z',
    score: 0,
    correctCount: 0,
    answeredCount: 0,
    dailyStreak: 0,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  for (const category of ['flags', 'football', 'baseball', 'basketball'] as const) {
    useDailyStore.getState().cancelLoad(category);
  }
  useDailyStore.setState({
    status: 'idle', refreshing: false, snapshot: null, feedback: null, message: null, activeCategoryId: null,
  });
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('daily state request lifecycle', () => {
  it('turns a not-started response into a visible ready state', async () => {
    dailyApi.fetchDailyState.mockResolvedValueOnce(snapshot('flags'));

    const result = await useDailyStore.getState().load(profile, 'flags', 'home');

    expect(result?.state).toBe('not_started');
    expect(useDailyStore.getState()).toMatchObject({ status: 'ready', refreshing: false, activeCategoryId: 'flags' });
  });

  it('coalesces overlapping fetches for the same category', async () => {
    const pending = deferred<DailySnapshot>();
    dailyApi.fetchDailyState.mockReturnValueOnce(pending.promise);

    const first = useDailyStore.getState().load(profile, 'football', 'home');
    const second = useDailyStore.getState().load(profile, 'football', 'intro');
    useDailyStore.getState().cancelLoad('football', 'home');
    pending.resolve(snapshot('football'));

    await expect(first).resolves.toMatchObject({ categoryId: 'football' });
    await expect(second).resolves.toMatchObject({ categoryId: 'football' });
    expect(dailyApi.fetchDailyState).toHaveBeenCalledTimes(1);
    expect(useDailyStore.getState().status).toBe('ready');
  });

  it('ignores a stale response after the category changes', async () => {
    const flags = deferred<DailySnapshot>();
    const football = deferred<DailySnapshot>();
    dailyApi.fetchDailyState.mockReturnValueOnce(flags.promise).mockReturnValueOnce(football.promise);

    const oldRequest = useDailyStore.getState().load(profile, 'flags', 'home');
    const currentRequest = useDailyStore.getState().load(profile, 'football', 'intro');
    football.resolve(snapshot('football'));
    await currentRequest;
    flags.resolve(snapshot('flags'));
    await oldRequest;

    expect(useDailyStore.getState().snapshot?.categoryId).toBe('football');
    expect(useDailyStore.getState().activeCategoryId).toBe('football');
  });

  it('surfaces a timeout instead of leaving an indefinite spinner', async () => {
    vi.useFakeTimers();
    dailyApi.fetchDailyState.mockReturnValueOnce(new Promise(() => undefined));

    const request = useDailyStore.getState().load(profile, 'basketball', 'intro');
    await vi.advanceTimersByTimeAsync(12_001);

    await expect(request).resolves.toBeNull();
    expect(useDailyStore.getState().status).toBe('error');
    expect(useDailyStore.getState().message).toMatch(/too long/i);
    expect(useDailyStore.getState().refreshing).toBe(false);
  });
});
