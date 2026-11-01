import { getRandomBytesAsync } from 'expo-crypto';
import { supabase } from './client';
import { NO_ACCESS, NOTICE_VERSION, parseAccess, requestIsCurrent } from '../privacy/rules';
import { useConsentStore } from '../store/consent-store';
let pending: Promise<string> | null = null;
export async function createParentRequest(): Promise<string> {
  const s = useConsentStore.getState();
  // Keep the bound code for annual renewal, even after its initial request window.
  if (s.requestCode && (s.requestLinked || requestIsCurrent(s.requestCode, s.requestCreatedAt))) return s.requestCode;
  const bytes = await getRandomBytesAsync(32);
  const code = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  s.setRequest(code); return code;
}
async function getSessionUser(): Promise<string> {
  if (!supabase) throw new Error('Online play is not configured. You can still play offline Flags.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) {
    // Refresh only after an explicit age/permission decision, never at cold start for unknown players.
    if (data.session.expires_at && data.session.expires_at * 1000 < Date.now() + 60_000) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.user) throw refreshed.error ?? new Error('Please reconnect.');
      return refreshed.data.user.id;
    }
    return data.session.user.id;
  }
  const created = await supabase.auth.signInAnonymously();
  if (created.error || !created.data.user) throw created.error ?? new Error('Online access could not be started.');
  return created.data.user.id;
}
export async function requireOnlineAccess(force = false): Promise<string> {
  if (pending) return pending;
  const deadline = Date.now() + 12_000;
  const checkDeadline = () => { if (Date.now() >= deadline) throw new Error('Online access timed out. You can keep playing offline Flags and retry later.'); };
  const operation = (async () => {
    const state = useConsentStore.getState();
    if (!state.hydrated || !['adult', 'under18'].includes(state.age)) {
      state.openGate(); throw new Error('Open Online access in Settings to enable Daily and Friends. Offline Flags is ready to play.');
    }
    if (state.age === 'adult' && state.acceptedNoticeVersion !== NOTICE_VERSION) { state.openGate(); throw new Error('Please review the updated privacy notice in Online access.'); }
    if (!supabase) throw new Error('Online play is not configured. Offline Flags is ready to play.');
    try {
      if (state.age === 'under18' && !state.access.onlineAllowed) {
        if (!state.requestCode) throw new Error('Ask a parent to complete the signed approval form in Online access.');
        // This capability request contains only the random code. No anonymous user/profile is created before approval.
        const { data, error } = await supabase.functions.invoke('parent-consent', { body: { action: 'status', code: state.requestCode } });
        if (error || data?.approved !== true) throw new Error('Parental approval is pending or expired. You can keep playing offline Flags.');
      }
      checkDeadline();
      const userId = await getSessionUser();
      checkDeadline();
      if (!force && state.access.onlineAllowed && Date.now() - state.checkedAt < 30_000) return userId;
      const result = state.age === 'adult'
        ? await supabase.rpc('register_adult_online_access', { p_notice_version: NOTICE_VERSION })
        : await supabase.rpc('claim_parental_consent', { p_request_secret: state.requestCode!, p_notice_version: NOTICE_VERSION });
      checkDeadline();
      if (result.error) throw result.error;
      const access = parseAccess(result.data); state.setAccess(access);
      if (!access.onlineAllowed) throw new Error('Online permission is no longer active. Ask a parent to review it.');
      return userId;
    } catch (error) {
      state.setAccess(NO_ACCESS);
      if (error && typeof error === 'object' && 'code' in error && error.code === '28000') await supabase.auth.signOut({ scope: 'local' });
      throw error;
    }
  })();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { useConsentStore.getState().setAccess(NO_ACCESS); reject(new Error('Online access timed out. Play offline Flags or retry later.')); }, 12_000); });
  pending = Promise.race([operation, timeout]).finally(() => { clearTimeout(timer); pending = null; });
  return pending;
}
export async function refreshOnlineAccess(): Promise<void> {
  const s = useConsentStore.getState();
  if (s.age !== 'adult' && s.age !== 'under18') return;
  // Pending children check explicitly; a restart with a request may restore a reviewed approval.
  if (s.age === 'under18' && (!s.requestCode || !s.requestLinked)) return;
  await requireOnlineAccess(true).catch(() => undefined);
}
