import type { QuizCategoryId } from '@/backend/types';
import { hostedAssetPathsByQuiz } from './hosted-assets';
import { assertQuizAvailable, isQuizAvailable } from './release-policy';

export function startupQuizAssetPaths(): string[] {
  return Object.entries(hostedAssetPathsByQuiz)
    .filter(([id]) => isQuizAvailable(id)).flatMap(([, paths]) => paths.slice(0, 4));
}

export function friendQuizAssetPaths(categoryId: QuizCategoryId): readonly string[] {
  assertQuizAvailable(categoryId);
  return hostedAssetPathsByQuiz[categoryId].slice(0, 12);
}
