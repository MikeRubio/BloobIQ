import { flagQuestions } from '@/content/flags';
import { casualPackQuestions, parseCasualPack } from '@/content/casual-pack';
import type { QuizQuestion } from '@/game/types';
import type { GuestProfilePayload, QuizCategoryId } from './types';
import { BackendUnavailableError, ensureAnonymousSession, getQuizAssetUrl, supabase } from './supabase';

const cached = new Map<QuizCategoryId, QuizQuestion[]>();

export async function loadCasualQuestions(
  categoryId: QuizCategoryId,
  profile: GuestProfilePayload,
  forceRefresh = false,
): Promise<QuizQuestion[]> {
  if (categoryId === 'flags') return flagQuestions;
  if (!forceRefresh) {
    const existing = cached.get(categoryId);
    if (existing) return existing;
  }
  await ensureAnonymousSession(profile);
  const { data, error } = await supabase!.rpc('get_casual_quiz_pack', { p_category_id: categoryId });
  if (error) throw new BackendUnavailableError(error.message);
  try {
    const questions = casualPackQuestions(parseCasualPack(data, categoryId), getQuizAssetUrl);
    cached.set(categoryId, questions);
    return questions;
  } catch (error) {
    throw new BackendUnavailableError(error instanceof Error ? error.message : 'The quiz pack could not be loaded.');
  }
}

export function clearCasualPackCache() {
  cached.clear();
}
