import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCasualPackCache, loadCasualQuestions } from './casual-api';

const backend = vi.hoisted(() => ({
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
  clearCasualPackCache();
  vi.clearAllMocks();
});

describe('Casual hosted pack loading', () => {
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
