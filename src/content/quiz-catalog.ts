import type { QuizCategoryId } from '@/backend/types';
import { flagQuestions } from './flags';
import { baseballAssetPaths, basketballAssetPaths, flagAssetPaths, footballAssetPaths } from './hosted-assets';

export type BrowseGroupId = 'flags' | 'sports' | 'brands' | 'people';
export type GameModeId = 'casual' | 'daily' | 'friends';

export type QuizDefinition = {
  id: QuizCategoryId;
  groupId: Extract<BrowseGroupId, 'flags' | 'sports'>;
  label: string;
  packLabel: string;
  icon: string;
  description: string;
  accent: 'sky' | 'mint' | 'lilac' | 'orange';
  supportedModes: readonly GameModeId[];
  bundledCount: number;
  onlineCount: number;
};

export type BrowseGroup = {
  id: BrowseGroupId;
  label: string;
  icon: string;
  color: 'sky' | 'mint' | 'coral' | 'lilac';
  description: string;
  available: boolean;
  quizIds: readonly QuizCategoryId[];
  futureItems: readonly string[];
};

export const quizzes = {
  flags: {
    id: 'flags', groupId: 'flags', label: 'Flags', packLabel: 'All Flags', icon: '🌍',
    description: 'Country flags from around the world.', accent: 'sky', supportedModes: ['casual', 'daily', 'friends'],
    bundledCount: flagQuestions.length, onlineCount: flagAssetPaths.length,
  },
  football: {
    id: 'football', groupId: 'sports', label: 'Football', packLabel: 'Leagues & Confederations', icon: '⚽',
    description: 'League and continental-confederation identities.', accent: 'mint', supportedModes: ['casual', 'daily', 'friends'],
    bundledCount: 0, onlineCount: footballAssetPaths.length,
  },
  baseball: {
    id: 'baseball', groupId: 'sports', label: 'Baseball', packLabel: 'MLB Team Logos', icon: '⚾',
    description: 'Current Major League Baseball team identities.', accent: 'lilac', supportedModes: ['casual', 'daily', 'friends'],
    bundledCount: 0, onlineCount: baseballAssetPaths.length,
  },
  basketball: {
    id: 'basketball', groupId: 'sports', label: 'Basketball', packLabel: 'NBA Team Logos', icon: '🏀',
    description: 'Current National Basketball Association team identities.', accent: 'orange', supportedModes: ['casual', 'daily', 'friends'],
    bundledCount: 0, onlineCount: basketballAssetPaths.length,
  },
} as const satisfies Record<QuizCategoryId, QuizDefinition>;

export const browseGroups: readonly BrowseGroup[] = [
  { id: 'flags', label: 'Flags', icon: '🌍', color: 'sky', description: 'Countries and world geography', available: true, quizIds: ['flags'], futureItems: ['Regional packs'] },
  { id: 'sports', label: 'Sports', icon: '⚽', color: 'mint', description: 'Football, baseball, and basketball', available: true, quizIds: ['football', 'baseball', 'basketball'], futureItems: ['American Football', 'Hockey'] },
  { id: 'brands', label: 'Brands', icon: '✦', color: 'coral', description: 'Brand-logo quizzes', available: false, quizIds: [], futureItems: ['Brand Logos'] },
  { id: 'people', label: 'People', icon: '★', color: 'lilac', description: 'Famous people through history', available: false, quizIds: [], futureItems: ['Celebrities', 'Historical Figures'] },
];

export function getBrowseGroup(id: string | string[] | undefined): BrowseGroup | undefined {
  const value = Array.isArray(id) ? id[0] : id;
  return browseGroups.find((group) => group.id === value);
}

export function getQuiz(id: string | string[] | undefined): QuizDefinition {
  const value = Array.isArray(id) ? id[0] : id;
  return value === 'football' || value === 'baseball' || value === 'basketball' ? quizzes[value] : quizzes.flags;
}

export function quizzesForGroup(groupId: BrowseGroupId): QuizDefinition[] {
  const group = browseGroups.find((candidate) => candidate.id === groupId);
  return (group?.quizIds ?? []).map((id) => quizzes[id]);
}

export function quizzesForMode(mode: GameModeId): QuizDefinition[] {
  return Object.values(quizzes).filter((quiz) => (quiz.supportedModes as readonly GameModeId[]).includes(mode));
}

export function supportsMode(quizId: QuizCategoryId, mode: GameModeId): boolean {
  return (quizzes[quizId].supportedModes as readonly GameModeId[]).includes(mode);
}

export function quickPlayQuiz(lastPlayed: QuizCategoryId | undefined): QuizDefinition {
  return lastPlayed && supportsMode(lastPlayed, 'casual') ? quizzes[lastPlayed] : quizzes.flags;
}

export function quizPath(quizId: QuizCategoryId) {
  return { pathname: '/quiz' as const, params: { quiz: quizId } };
}

export function browsePath(groupId: BrowseGroupId) {
  return groupId === 'flags' ? quizPath('flags') : { pathname: '/category' as const, params: { group: groupId } };
}
