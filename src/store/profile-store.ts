import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CategoryId, RunResult } from '@/game/types';
import type { QuizCategoryId } from '@/backend/types';

type Settings = { sound: boolean; haptics: boolean; reducedMotion: boolean };
export type GuestProfile = { id: string; name: string; avatar: string; color: string };
export type CategoryRecord = { highScore: number; gamesPlayed: number; totalCorrect: number; bestStreak: number };

type ProfileState = {
  profile: GuestProfile;
  nameSetupComplete: boolean;
  settings: Settings;
  records: Partial<Record<CategoryId, CategoryRecord>>;
  lastPlayedCasualQuizId?: QuizCategoryId;
  recentCasualQuestionIds: Partial<Record<QuizCategoryId, string[]>>;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setPlayerName: (name: string) => void;
  toggleSetting: (setting: keyof Settings) => void;
  recordResult: (result: RunResult) => void;
  markCasualQuizPlayed: (quizId: QuizCategoryId, questionIds: readonly string[]) => void;
  resetAfterAccountDeletion: () => void;
};

export const PLAYER_NAME_MIN_LENGTH = 3;
export const PLAYER_NAME_MAX_LENGTH = 32;

export function normalizePlayerName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function getPlayerNameError(value: string): string | null {
  const normalized = normalizePlayerName(value);
  const length = [...normalized].length;
  if (length < PLAYER_NAME_MIN_LENGTH) return `Use at least ${PLAYER_NAME_MIN_LENGTH} characters.`;
  if (length > PLAYER_NAME_MAX_LENGTH) return `Use ${PLAYER_NAME_MAX_LENGTH} characters or fewer.`;
  if (/[\u0000-\u001f\u007f]/u.test(value)) return 'Remove line breaks or control characters.';
  const moderationText = normalized.toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, ' ').trim();
  const prohibited = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'retard', 'kike'];
  if (moderationText.split(/\s+/u).some((token) => prohibited.includes(token))) {
    return 'Choose a respectful player name.';
  }
  return null;
}

export function playerNameUpdate(profile: GuestProfile, name: string) {
  return {
    profile: { ...profile, name: normalizePlayerName(name) },
    nameSetupComplete: true as const,
  };
}

const adjectives = ['Sunny', 'Brave', 'Lucky', 'Bubbly', 'Swift', 'Clever', 'Mighty', 'Happy'];
const animals = [
  { name: 'Fox', avatar: '🦊', color: '#FF8A65' }, { name: 'Panda', avatar: '🐼', color: '#A88BEB' },
  { name: 'Otter', avatar: '🦦', color: '#54D6A8' }, { name: 'Tiger', avatar: '🐯', color: '#FFD447' },
  { name: 'Koala', avatar: '🐨', color: '#74B9FF' }, { name: 'Lion', avatar: '🦁', color: '#FFB05C' },
];

function createGuestProfile(): GuestProfile {
  const animal = animals[Math.floor(Math.random() * animals.length)]!;
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]!;
  const suffix = Math.floor(100 + Math.random() * 900);
  return { id: `guest-${Date.now().toString(36)}-${suffix}`, name: `${adjective} ${animal.name} ${suffix}`, avatar: animal.avatar, color: animal.color };
}

export function updateCategoryRecords(
  records: Partial<Record<CategoryId, CategoryRecord>>,
  result: RunResult,
): Partial<Record<CategoryId, CategoryRecord>> {
  const current = records[result.categoryId] ?? { highScore: 0, gamesPlayed: 0, totalCorrect: 0, bestStreak: 0 };
  return {
    ...records,
    [result.categoryId]: {
      highScore: Math.max(current.highScore, result.score),
      gamesPlayed: current.gamesPlayed + 1,
      totalCorrect: current.totalCorrect + result.correctAnswers,
      bestStreak: Math.max(current.bestStreak, result.bestStreak),
    },
  };
}

export function migrateProfileState(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== 'object') return persistedState;
  const state = persistedState as {
    records?: Partial<Record<CategoryId, CategoryRecord>>;
    lastPlayedCasualQuizId?: QuizCategoryId;
    recentCasualQuestionIds?: Partial<Record<QuizCategoryId, string[]>>;
    nameSetupComplete?: boolean;
  };
  return {
    ...state,
    records: state.records ?? {},
    lastPlayedCasualQuizId: state.lastPlayedCasualQuizId,
    recentCasualQuestionIds: state.recentCasualQuestionIds ?? {},
    // Existing installs already received a generated identity. Avoid interrupting
    // them after upgrade; only genuinely new installs see first-launch setup.
    nameSetupComplete: state.nameSetupComplete ?? true,
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: createGuestProfile(),
      nameSetupComplete: false,
      settings: { sound: true, haptics: true, reducedMotion: false },
      records: {},
      lastPlayedCasualQuizId: undefined,
      recentCasualQuestionIds: {},
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setPlayerName: (name) => set((state) => playerNameUpdate(state.profile, name)),
      toggleSetting: (setting) => set((state) => ({ settings: { ...state.settings, [setting]: !state.settings[setting] } })),
      markCasualQuizPlayed: (lastPlayedCasualQuizId, questionIds) => set((state) => ({
        lastPlayedCasualQuizId,
        recentCasualQuestionIds: {
          ...state.recentCasualQuestionIds,
          [lastPlayedCasualQuizId]: [...questionIds],
        },
      })),
      resetAfterAccountDeletion: () => set({
        profile: createGuestProfile(),
        nameSetupComplete: false,
        settings: { sound: true, haptics: true, reducedMotion: false },
        records: {},
        lastPlayedCasualQuizId: undefined,
        recentCasualQuestionIds: {},
        hydrated: true,
      }),
      recordResult: (result) => set((state) => {
        return { records: updateCategoryRecords(state.records, result) };
      }),
    }),
    {
      name: 'guessr-player-v1',
      version: 4,
      migrate: migrateProfileState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profile, nameSetupComplete, settings, records, lastPlayedCasualQuizId, recentCasualQuestionIds }) => ({
        profile,
        nameSetupComplete,
        settings,
        records,
        lastPlayedCasualQuizId,
        recentCasualQuestionIds,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
