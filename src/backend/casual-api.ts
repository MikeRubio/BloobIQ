import { flagQuestions } from '../content/flags';
import { useConsentStore } from '../store/consent-store';
import { casualPackQuestions, parseCasualPack } from '../content/casual-pack';
import { assertQuizAvailable } from '../content/release-policy';
import type { QuizQuestion } from '../game/types';
import type { GuestProfilePayload, QuizCategoryId } from './types';
import { BackendUnavailableError, ensureAnonymousSession, getQuizAssetUrl, supabase } from './supabase';

const cached = new Map<QuizCategoryId, QuizQuestion[]>();

export async function loadCasualQuestions(
  categoryId: QuizCategoryId,
  profile: GuestProfilePayload,
  forceRefresh = false,
): Promise<QuizQuestion[]> {
  assertQuizAvailable(categoryId);
  if (!useConsentStore.getState().access.onlineAllowed && categoryId === 'flags') return [...flagQuestions];
  try { await ensureAnonymousSession(profile); } catch (error) {
    if (categoryId === 'flags') return [...flagQuestions];
    throw error;
  }
  if (!forceRefresh) {
    const existing = cached.get(categoryId);
    if (existing) return existing;
  }
  const { data, error } = await supabase!.rpc('get_casual_quiz_pack', { p_category_id: categoryId });
  if (error) { if (categoryId === 'flags') return [...flagQuestions]; throw new BackendUnavailableError(error.message); }
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
