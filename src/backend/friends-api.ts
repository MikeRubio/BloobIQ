import { randomUUID } from 'expo-crypto';
import type { FriendRoomSnapshot, GuestProfilePayload, QuizCategoryId } from './types';
import { BackendUnavailableError, ensureAnonymousSession, supabase } from './supabase';

const pendingAnswers = new Map<string, string>();

function snapshot(data: unknown, error: { message: string } | null, requestStartedAtMs: number): FriendRoomSnapshot {
  if (error) throw new BackendUnavailableError(error.message);
  if (!data || typeof data !== 'object') throw new BackendUnavailableError('The friends service returned an invalid response.');
  const requestFinishedAtMs = Date.now();
  return {
    ...(data as FriendRoomSnapshot),
    // Midpoint compensation avoids making a slower device lag by its full response time.
    localServerAnchorMs: requestStartedAtMs + (requestFinishedAtMs - requestStartedAtMs) / 2,
  };
}

export async function createFriendRoom(profile: GuestProfilePayload, categoryId: QuizCategoryId) {
  await ensureAnonymousSession(profile);
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('create_friend_room', { p_category_id: categoryId });
  return snapshot(data, error, requestStartedAtMs);
}

export async function joinFriendRoom(profile: GuestProfilePayload, code: string) {
  await ensureAnonymousSession(profile);
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('join_friend_room', { p_code: code.toUpperCase().replace(/[^A-Z2-9]/g, '') });
  return snapshot(data, error, requestStartedAtMs);
}

export async function fetchFriendRoom(profile: GuestProfilePayload, roomId: string) {
  await ensureAnonymousSession(profile);
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('get_friend_room_state', { p_room_id: roomId });
  return snapshot(data, error, requestStartedAtMs);
}

export async function setFriendReady(roomId: string, ready: boolean) {
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('set_friend_ready', { p_room_id: roomId, p_ready: ready });
  return snapshot(data, error, requestStartedAtMs);
}

export async function startFriendMatch(roomId: string) {
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('start_friend_match', { p_room_id: roomId });
  return snapshot(data, error, requestStartedAtMs);
}

export async function submitFriendAnswer(current: FriendRoomSnapshot, choiceId: string | null) {
  if (!current.matchId || current.questionIndex === null || current.questionIndex === undefined) {
    throw new BackendUnavailableError('No friend question is accepting answers.');
  }
  const key = `${current.matchId}:${current.questionIndex}`;
  const requestId = pendingAnswers.get(key) ?? randomUUID();
  pendingAnswers.set(key, requestId);
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('submit_friend_answer', {
    p_room_id: current.roomId,
    p_match_id: current.matchId,
    p_question_index: current.questionIndex,
    p_choice_id: choiceId,
    p_request_id: requestId,
  });
  const result = snapshot(data, error, requestStartedAtMs);
  pendingAnswers.delete(key);
  return result;
}

export async function leaveFriendRoom(roomId: string) {
  const { error } = await supabase!.rpc('leave_friend_room', { p_room_id: roomId });
  if (error) throw new BackendUnavailableError(error.message);
}

export async function rematchFriendRoom(roomId: string) {
  const requestStartedAtMs = Date.now();
  const { data, error } = await supabase!.rpc('rematch_friend_room', { p_room_id: roomId });
  return snapshot(data, error, requestStartedAtMs);
}
