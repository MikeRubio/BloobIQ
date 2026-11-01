import { supabase } from './client';
import { requireOnlineAccess } from './online-access';
import { useProfileStore } from '../store/profile-store';
import type { GuestProfilePayload } from './types';
export { supabase, isSupabaseConfigured, getQuizAssetUrl } from './client';
let profileSyncPromise: Promise<string> | null = null;
let syncedProfileKey: string | null = null;

export class BackendUnavailableError extends Error {
  constructor(message: string, readonly reason: 'configuration' | 'network' | 'auth' = 'network') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

function profileKey(userId: string, profile: GuestProfilePayload): string {
  return `${userId}\u0000${profile.name}\u0000${profile.avatar}\u0000${profile.color}`;
}

export async function syncGuestProfile(profile: GuestProfilePayload): Promise<string> {
  const client = supabase;
  const userId = await requireOnlineAccess();
  const key = profileKey(userId, profile);
  if (syncedProfileKey === key) return userId;

  // Serialize profile writes. If a second name arrives while the first is in
  // flight, it waits and then writes the newest value instead of being dropped.
  while (profileSyncPromise) {
    try {
      await profileSyncPromise;
    } catch {
      // A newer profile still gets its own attempt after an older sync fails.
    }
    if (syncedProfileKey === key) return userId;
  }

  profileSyncPromise = (async () => {
    const { data, error } = await client!.rpc('sync_guest_profile', {
      p_display_name: profile.name,
      p_avatar: profile.avatar,
      p_avatar_color: profile.color,
    });
    if (error) throw new BackendUnavailableError(error.message);
    if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.displayName === 'string') {
      const current = useProfileStore.getState();
      const name = data.displayName;
      const avatar = typeof data.avatar === 'string' ? data.avatar : current.profile.avatar;
      const color = typeof data.avatarColor === 'string' ? data.avatarColor : current.profile.color;
      if (current.profile.name !== name || current.profile.avatar !== avatar || current.profile.color !== color) {
        useProfileStore.setState({ profile: { ...current.profile, name, avatar, color }, nameSetupComplete: true });
      }
    }
    syncedProfileKey = key;
    return userId;
  })().finally(() => { profileSyncPromise = null; });

  return profileSyncPromise;
}

export async function ensureAnonymousSession(profile: GuestProfilePayload): Promise<string> {
  return syncGuestProfile(profile);
}
