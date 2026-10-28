import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Supabase public environment variables are required.');
const category = process.argv.find((arg) => arg.startsWith('--category='))?.split('=')[1] ?? 'football';
if (!['flags', 'football', 'baseball', 'basketball'].includes(category)) throw new Error(`Unsupported smoke category: ${category}`);

const makeClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false } });
async function player(name, avatar, color) {
  const client = makeClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) throw error ?? new Error('Anonymous session missing');
  const synced = await client.rpc('sync_guest_profile', { p_display_name: name, p_avatar: avatar, p_avatar_color: color });
  if (synced.error) throw synced.error;
  return { client, session: data.session, id: data.user.id };
}
async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
}

let host = await player(`Smoke Host ${Date.now().toString().slice(-5)}`, '🦊', '#FF8A65');
let guest = await player(`Smoke Guest ${Date.now().toString().slice(-5)}`, '🐼', '#A88BEB');
const created = await rpc(host.client, 'create_friend_room', { p_category_id: category });
const joined = await rpc(guest.client, 'join_friend_room', { p_code: created.code });
if (joined.members.length !== 2 || joined.categoryId !== category) throw new Error('Expected two room members in the selected quiz.');
let realtimeEvents = 0;
const realtimeReady = new Promise((resolve, reject) => {
  host.client.channel(`smoke-${created.roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_room_events', filter: `room_id=eq.${created.roomId}` }, () => { realtimeEvents += 1; })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(`Realtime subscription ${status}`));
    });
});
await Promise.race([realtimeReady, new Promise((_, reject) => setTimeout(() => reject(new Error('Realtime subscription timed out')), 10_000))]);
await rpc(host.client, 'set_friend_ready', { p_room_id: created.roomId, p_ready: true });
await rpc(guest.client, 'set_friend_ready', { p_room_id: created.roomId, p_ready: true });
let state = await rpc(host.client, 'start_friend_match', { p_room_id: created.roomId });
console.log(JSON.stringify({ stage: 'started', category, roomId: state.roomId, code: state.code, matchId: state.matchId, startsAt: state.startsAt, hostUserId: host.id, guestUserId: guest.id }));

if (process.argv.includes('--lobby-only')) process.exit(0);
let lastQuestion = -1;
let reconnected = false;
while (true) {
  state = await rpc(host.client, 'get_friend_room_state', { p_room_id: created.roomId });
  if (state.phase === 'results' || state.status === 'results') break;
  if (state.phase === 'question' && state.questionIndex !== lastQuestion && state.round) {
    if (category !== 'flags' && !state.round.assetPath?.startsWith(`${category}-`)) throw new Error(`Wrong asset pack for ${category}: ${state.round.assetPath}`);
    lastQuestion = state.questionIndex;
    const hostChoice = state.round.options[0].id;
    const guestState = await rpc(guest.client, 'get_friend_room_state', { p_room_id: created.roomId });
    const guestChoice = guestState.round.options[1].id;
    await Promise.all([
      rpc(host.client, 'submit_friend_answer', { p_room_id: state.roomId, p_match_id: state.matchId, p_question_index: state.questionIndex, p_choice_id: hostChoice, p_request_id: randomUUID() }),
      rpc(guest.client, 'submit_friend_answer', { p_room_id: state.roomId, p_match_id: state.matchId, p_question_index: state.questionIndex, p_choice_id: guestChoice, p_request_id: randomUUID() }),
    ]);
    console.log(JSON.stringify({ stage: 'answered', question: state.questionIndex + 1 }));
    if (state.questionIndex === 2 && !reconnected) {
      const replacement = makeClient();
      const restored = await replacement.auth.setSession({ access_token: guest.session.access_token, refresh_token: guest.session.refresh_token });
      if (restored.error || restored.data.user?.id !== guest.id) throw restored.error ?? new Error('Reconnect identity changed.');
      guest = { ...guest, client: replacement, session: restored.data.session };
      const recovered = await rpc(guest.client, 'get_friend_room_state', { p_room_id: created.roomId });
      if (!recovered.members.some((member) => member.userId === guest.id && member.isCurrentPlayer)) throw new Error('Reconnect did not restore membership.');
      reconnected = true;
      console.log(JSON.stringify({ stage: 'reconnected', userId: guest.id }));
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
}
state = await rpc(host.client, 'get_friend_room_state', { p_room_id: created.roomId });
if (state.standings?.length !== 2 || !reconnected || realtimeEvents < 1) throw new Error('Final standings, reconnect, or Realtime assertion failed.');
console.log(JSON.stringify({ stage: 'completed', realtimeEvents, standings: state.standings.map(({ rank, displayName, score, correctCount }) => ({ rank, displayName, score, correctCount })) }));
await Promise.all([host.client.removeAllChannels(), guest.client.removeAllChannels()]);
