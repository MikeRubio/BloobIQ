import type { CategoryId } from '@/game/types';
import { BackendUnavailableError, ensureAnonymousSession, supabase } from './supabase';
import { useProfileStore } from '@/store/profile-store';

export async function issueAdRewardReference(runId: string, categoryId: CategoryId): Promise<string> {
  if (!runId) throw new BackendUnavailableError('The casual run does not have a reward reference.', 'configuration');
  const profile = useProfileStore.getState().profile;
  await ensureAnonymousSession({ name: profile.name, avatar: profile.avatar, color: profile.color });
  const { data, error } = await supabase!.rpc('issue_ad_reward_reference', {
    p_run_id: runId,
    p_category_id: categoryId,
  });
  if (error) throw new BackendUnavailableError(error.message);
  if (typeof data !== 'string' || !data) throw new BackendUnavailableError('The reward service returned an invalid reference.');
  return data;
}

export async function markAdRewardClientEarned(reference: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('mark_ad_reward_client_earned', { p_reference: reference });
  if (error) throw new BackendUnavailableError(error.message);
}
