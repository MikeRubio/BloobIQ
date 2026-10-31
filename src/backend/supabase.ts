import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { GuestProfilePayload } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getQuizAssetUrl(assetPath: string): string | null {
  if (!supabase) return null;
  return supabase.storage.from('quiz-assets').getPublicUrl(assetPath).data.publicUrl;
}

let sessionPromise: Promise<string> | null = null;
let profileSyncPromise: Promise<string> | null = null;
let syncedProfileKey: string | null = null;

export class BackendUnavailableError extends Error {
  constructor(message: string, readonly reason: 'configuration' | 'network' | 'auth' = 'network') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

async function ensureAnonymousUser(): Promise<string> {
  if (!supabase) throw new BackendUnavailableError('Add Supabase environment variables to enable ranked play.', 'configuration');
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    const { data: existing, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new BackendUnavailableError(sessionError.message, 'auth');
    let userId = existing.session?.user.id;
    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) throw new BackendUnavailableError(error?.message ?? 'Anonymous sign-in failed.', 'auth');
      userId = data.user.id;
    }
    return userId;
  })().finally(() => { sessionPromise = null; });
  return sessionPromise;
}

function profileKey(userId: string, profile: GuestProfilePayload): string {
  return `${userId}\u0000${profile.name}\u0000${profile.avatar}\u0000${profile.color}`;
}

export async function syncGuestProfile(profile: GuestProfilePayload): Promise<string> {
  const client = supabase;
  const userId = await ensureAnonymousUser();
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
    const { error } = await client!.rpc('sync_guest_profile', {
      p_display_name: profile.name,
      p_avatar: profile.avatar,
      p_avatar_color: profile.color,
    });
    if (error) throw new BackendUnavailableError(error.message);
    syncedProfileKey = key;
    return userId;
  })().finally(() => { profileSyncPromise = null; });

  return profileSyncPromise;
}

export async function ensureAnonymousSession(profile: GuestProfilePayload): Promise<string> {
  return syncGuestProfile(profile);
}
