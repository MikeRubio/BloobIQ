import { BackendUnavailableError, supabase } from './supabase';

export async function reportAndBlockPlayer(
  reportedUserId: string,
  context: 'rankings' | 'friends',
  roomId: string | null = null,
): Promise<void> {
  if (!supabase) throw new BackendUnavailableError('Moderation tools require a connection.', 'configuration');
  const { error } = await supabase.rpc('report_and_block_player', {
    p_reported_user_id: reportedUserId,
    p_context: context,
    p_room_id: roomId,
  });
  if (error) throw new BackendUnavailableError(error.message);
}
