import { randomUUID } from 'expo-crypto';
import type { DailySnapshot, GuestProfilePayload, LeaderboardResponse, QuizCategoryId } from './types';
import { BackendUnavailableError, ensureAnonymousSession, supabase } from './supabase';

const pendingSubmissions = new Map<string, { requestId: string; choiceId: string | null }>();

function assertData<T>(data: unknown, error: { message: string } | null): T {
  if (error) throw new BackendUnavailableError(error.message);
  if (!data || typeof data !== 'object') throw new BackendUnavailableError('The ranked service returned an invalid response.');
  return data as T;
}

export async function fetchDailyState(
  profile: GuestProfilePayload,
  categoryId: QuizCategoryId,
  signal?: AbortSignal,
): Promise<DailySnapshot> {
  await ensureAnonymousSession(profile);
  let request = supabase!.rpc('get_daily_state', { p_category_id: categoryId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  return assertData<DailySnapshot>(data, error);
}

export async function startDailyAttempt(profile: GuestProfilePayload, categoryId: QuizCategoryId, signal?: AbortSignal): Promise<DailySnapshot> {
  await ensureAnonymousSession(profile);
  let request = supabase!.rpc('start_daily_attempt', { p_category_id: categoryId });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  return assertData<DailySnapshot>(data, error);
}

export async function submitDailyAnswer(snapshot: DailySnapshot, choiceId: string | null, signal?: AbortSignal): Promise<DailySnapshot> {
  if (!supabase || !snapshot.attemptId || snapshot.questionIndex === undefined) {
    throw new BackendUnavailableError('No ranked attempt is active.');
  }
  const submissionKey = `${snapshot.attemptId}:${snapshot.questionIndex}`;
  const pending = pendingSubmissions.get(submissionKey) ?? { requestId: randomUUID(), choiceId };
  pendingSubmissions.set(submissionKey, pending);
  let request = supabase.rpc('submit_daily_answer', {
    p_attempt_id: snapshot.attemptId,
    p_question_index: snapshot.questionIndex,
    p_choice_id: pending.choiceId,
    p_request_id: pending.requestId,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  const result = assertData<DailySnapshot>(data, error);
  pendingSubmissions.delete(submissionKey);
  return result;
}

export async function fetchLeaderboard(profile: GuestProfilePayload, period: 'today' | 'week', categoryId: QuizCategoryId): Promise<LeaderboardResponse> {
  await ensureAnonymousSession(profile);
  const { data, error } = await supabase!.rpc('get_leaderboard', { p_category_id: categoryId, p_period: period, p_limit: 20 });
  return assertData<LeaderboardResponse>(data, error);
}
