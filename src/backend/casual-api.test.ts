import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCasualPackCache, loadCasualQuestions } from './casual-api';
vi.mock('../store/consent-store', () => ({ useConsentStore: { getState: () => ({ access: { onlineAllowed: backend.onlineAllowed } }) } }));

const backend = vi.hoisted(() => ({
  onlineAllowed: true,
  ensureAnonymousSession: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('./supabase', () => ({
  BackendUnavailableError: class BackendUnavailableError extends Error {},
  ensureAnonymousSession: backend.ensureAnonymousSession,
  getQuizAssetUrl: (path: string) => `https://quiz-assets.test/${path}`,
  supabase: { rpc: backend.rpc },
}));

const profile = { name: 'Player', avatar: '1', color: '#2D9CDB' };
const hostedFlags = {
  categoryId: 'flags',
  contentVersion: 'flags-hosted-v1',
  items: ['ad', 'ae', 'af', 'ag'].map((id, index) => ({
    id,
    displayName: `Hosted flag ${index + 1}`,
    assetPath: `flags/${id}.svg`,
    difficulty: 'easy',
    contentType: 'country-flag',
  })),
};

beforeEach(() => {
  backend.onlineAllowed = true;
  clearCasualPackCache();
  vi.clearAllMocks();
});

describe('Casual hosted pack loading', () => {
  it('plays bundled Flags without Auth or network for offline/pending players', async () => {
    backend.onlineAllowed = false;
    expect(await loadCasualQuestions('flags', profile)).toHaveLength(48);
    expect(backend.ensureAnonymousSession).not.toHaveBeenCalled(); expect(backend.rpc).not.toHaveBeenCalled();
  });
  it('stops using a cached hosted pack after permission is withdrawn', async () => {
    backend.rpc.mockResolvedValueOnce({ data: hostedFlags, error: null });
    await loadCasualQuestions('flags', profile); backend.onlineAllowed = false;
    expect(await loadCasualQuestions('flags', profile)).toHaveLength(48);
    expect(backend.rpc).toHaveBeenCalledTimes(1);
  });
  it('falls back to bundled Flags if the online session cannot be checked', async () => {
    backend.ensureAnonymousSession.mockRejectedValueOnce(new Error('offline'));
    expect(await loadCasualQuestions('flags', profile)).toHaveLength(48); expect(backend.rpc).not.toHaveBeenCalled();
  });
  it('loads Flags through the authenticated hosted-pack RPC', async () => {
    backend.rpc.mockResolvedValueOnce({ data: hostedFlags, error: null });

    const questions = await loadCasualQuestions('flags', profile);

    expect(backend.ensureAnonymousSession).toHaveBeenCalledWith(profile);
    expect(backend.rpc).toHaveBeenCalledWith('get_casual_quiz_pack', { p_category_id: 'flags' });
    expect(questions).toHaveLength(4);
    expect(questions[0]).toMatchObject({
      displayName: 'Hosted flag 1',
      assetUri: 'https://quiz-assets.test/flags/ad.svg',
    });
  });

  it('reuses a hosted Flags pack without repeating the request', async () => {
    backend.rpc.mockResolvedValueOnce({ data: hostedFlags, error: null });

    await loadCasualQuestions('flags', profile);
    await loadCasualQuestions('flags', profile);

    expect(backend.rpc).toHaveBeenCalledTimes(1);
  });
});
