import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAccountAndServerData } from './account-api';

const backend = vi.hoisted(() => ({
  getSession: vi.fn(),
  invoke: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('./supabase', () => ({
  BackendUnavailableError: class BackendUnavailableError extends Error {},
  isSupabaseConfigured: true,
  supabase: {
    auth: { getSession: backend.getSession, signOut: backend.signOut },
    functions: { invoke: backend.invoke },
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('account deletion client', () => {
  it('requires server deletion to succeed before clearing the local session', async () => {
    backend.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'user-1' } } }, error: null });
    backend.invoke.mockResolvedValueOnce({ data: null, error: new Error('failed') });

    await expect(deleteAccountAndServerData()).rejects.toThrow('could not be deleted');
    expect(backend.signOut).not.toHaveBeenCalled();
  });

  it('deletes server data and then removes the local session', async () => {
    backend.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'user-1' } } }, error: null });
    backend.invoke.mockResolvedValueOnce({ data: { deleted: true }, error: null });
    backend.signOut.mockResolvedValueOnce({ error: null });

    await deleteAccountAndServerData();

    expect(backend.invoke).toHaveBeenCalledWith('delete-account', { body: { confirm: true } });
    expect(backend.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
