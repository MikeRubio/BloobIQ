import { BackendUnavailableError, isSupabaseConfigured, supabase } from './supabase';

export async function deleteAccountAndServerData(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new BackendUnavailableError(sessionError.message, 'auth');
  if (!sessionData.session) return;

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: true },
  });
  if (error) throw new BackendUnavailableError('Your account could not be deleted. Nothing was cleared from this device; please retry.');

  // The server has removed auth.users and its refresh tokens. Remove the
  // now-invalid session from this device without making another network call.
  await supabase.auth.signOut({ scope: 'local' });
}
