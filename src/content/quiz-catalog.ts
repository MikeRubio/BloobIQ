import type { QuizCategoryId } from '@/backend/types';
import { isQuizAvailable } from './release-policy';
import { baseballAssetPaths, basketballAssetPaths, brandAssetPaths, celebrityAssetPaths, flagAssetPaths, footballAssetPaths, historyAssetPaths } from './hosted-assets';

export type BrowseGroupId = 'flags' | 'sports' | 'brands' | 'people';
export type GameModeId = 'casual' | 'daily' | 'friends';

export type QuizDefinition = {
  id: QuizCategoryId;
  groupId: BrowseGroupId;
  label: string;
  packLabel: string;
  icon: string;
  description: string;
  accent: 'sky' | 'mint' | 'lilac' | 'orange';
  supportedModes: readonly GameModeId[];
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
    onlineCount: flagAssetPaths.length,
  },
  football: {
    id: 'football', groupId: 'sports', label: 'Football', packLabel: 'Leagues & Confederations', icon: '⚽',
    description: 'League and continental-confederation identities.', accent: 'mint', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: footballAssetPaths.length,
  },
  baseball: {
    id: 'baseball', groupId: 'sports', label: 'Baseball', packLabel: 'MLB & Caribbean Teams', icon: '⚾',
    description: 'MLB, Dominican, Venezuelan, and Mexican Pacific team identities.', accent: 'lilac', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: baseballAssetPaths.length,
  },
  basketball: {
    id: 'basketball', groupId: 'sports', label: 'Basketball', packLabel: 'NBA Teams & Trivia', icon: '🏀',
    description: 'NBA teams, mascots, arenas, retired numbers, and franchise legends.', accent: 'orange', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: basketballAssetPaths.length,
  },
  brands: {
    id: 'brands', groupId: 'brands', label: 'Brands', packLabel: 'Cars, Watches & Food', icon: '✦',
    description: 'American and European cars, watchmakers, and food brands.', accent: 'orange', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: brandAssetPaths.length,
  },
  history: {
    id: 'history', groupId: 'people', label: 'History', packLabel: 'Historical Figures', icon: '⌛',
    description: 'Leaders, thinkers, artists, explorers, and innovators across history.', accent: 'lilac', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: historyAssetPaths.length,
  },
  celebrities: {
    id: 'celebrities', groupId: 'people', label: 'Celebrities', packLabel: 'Film & Television', icon: '★',
    description: 'Recognisable actors and screen personalities.', accent: 'sky', supportedModes: ['casual', 'daily', 'friends'],
    onlineCount: celebrityAssetPaths.length,
  },
} as const satisfies Record<QuizCategoryId, QuizDefinition>;

const allBrowseGroups: readonly BrowseGroup[] = [
  { id: 'flags', label: 'Flags', icon: '🌍', color: 'sky', description: 'Countries and world geography', available: true, quizIds: ['flags'], futureItems: ['Regional packs'] },
  { id: 'sports', label: 'Sports', icon: '⚽', color: 'mint', description: 'Football, baseball, and basketball', available: true, quizIds: ['football', 'baseball', 'basketball'], futureItems: ['American Football', 'Hockey'] },
  { id: 'brands', label: 'Brands', icon: '✦', color: 'coral', description: 'Cars, watches, and food', available: true, quizIds: ['brands'], futureItems: [] },
  { id: 'people', label: 'People', icon: '★', color: 'lilac', description: 'History and celebrities', available: true, quizIds: ['history', 'celebrities'], futureItems: [] },
];

export const browseGroups = allBrowseGroups.filter((group) => group.quizIds.some(isQuizAvailable));

export function getBrowseGroup(id: string | string[] | undefined): BrowseGroup | undefined {
  const value = Array.isArray(id) ? id[0] : id;
  return browseGroups.find((group) => group.id === value);
}

export function getQuiz(id: string | string[] | undefined): QuizDefinition {
  const value = Array.isArray(id) ? id[0] : id;
  return isQuizAvailable(value) ? quizzes[value] : quizzes.flags;
}

export function quizzesForGroup(groupId: BrowseGroupId): QuizDefinition[] {
  const group = browseGroups.find((candidate) => candidate.id === groupId);
  return (group?.quizIds ?? []).filter(isQuizAvailable).map((id) => quizzes[id]);
}

export function quizzesForMode(mode: GameModeId): QuizDefinition[] {
  return Object.values(quizzes).filter((quiz) => isQuizAvailable(quiz.id) && (quiz.supportedModes as readonly GameModeId[]).includes(mode));
}

export function supportsMode(quizId: QuizCategoryId, mode: GameModeId): boolean {
  return isQuizAvailable(quizId) && (quizzes[quizId].supportedModes as readonly GameModeId[]).includes(mode);
}

export function quickPlayQuiz(lastPlayed: QuizCategoryId | undefined): QuizDefinition {
  return lastPlayed && supportsMode(lastPlayed, 'casual') ? quizzes[lastPlayed] : quizzes.flags;
}

export function quizPath(quizId: QuizCategoryId) {
  return { pathname: '/quiz' as const, params: { quiz: getQuiz(quizId).id } };
}

export function browsePath(groupId: BrowseGroupId) {
  return groupId === 'flags' || !getBrowseGroup(groupId) ? quizPath('flags') : { pathname: '/category' as const, params: { group: groupId } };
}
