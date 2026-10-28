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

export class BackendUnavailableError extends Error {
  constructor(message: string, readonly reason: 'configuration' | 'network' | 'auth' = 'network') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

export async function ensureAnonymousSession(profile: GuestProfilePayload): Promise<string> {
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
    const { error: profileError } = await supabase.rpc('sync_guest_profile', {
      p_display_name: profile.name,
      p_avatar: profile.avatar,
      p_avatar_color: profile.color,
    });
    if (profileError) throw new BackendUnavailableError(profileError.message);
    return userId;
  })().finally(() => { sessionPromise = null; });
  return sessionPromise;
}
