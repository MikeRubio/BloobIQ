import type { QuizCategoryId } from '@/backend/types';

// Expo inlines this public value into the standalone JavaScript bundle.
// Store profiles explicitly set flags-only; development retains the full catalogue.
export const flagsOnlyRelease = process.env.EXPO_PUBLIC_RELEASE_CATALOG === 'flags-only';
export const availableQuizIds: readonly QuizCategoryId[] = flagsOnlyRelease
  ? ['flags']
  : ['flags', 'football', 'baseball', 'basketball', 'brands', 'history', 'celebrities'];

export function isQuizAvailable(id: string | undefined): id is QuizCategoryId {
  return availableQuizIds.some((candidate) => candidate === id);
}

export function assertQuizAvailable(id: string): asserts id is QuizCategoryId {
  if (!isQuizAvailable(id)) throw new Error('This quiz is not available in this version of BloopIQ. Choose Flags.');
}
