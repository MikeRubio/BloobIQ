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
  settings: Settings;
  records: Partial<Record<CategoryId, CategoryRecord>>;
  lastPlayedCasualQuizId?: QuizCategoryId;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  toggleSetting: (setting: keyof Settings) => void;
  recordResult: (result: RunResult) => void;
  markCasualQuizPlayed: (quizId: QuizCategoryId) => void;
};

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
  const state = persistedState as { records?: Partial<Record<CategoryId, CategoryRecord>>; lastPlayedCasualQuizId?: QuizCategoryId };
  return { ...state, records: state.records ?? {}, lastPlayedCasualQuizId: state.lastPlayedCasualQuizId };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: createGuestProfile(),
      settings: { sound: true, haptics: true, reducedMotion: false },
      records: {},
      lastPlayedCasualQuizId: undefined,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      toggleSetting: (setting) => set((state) => ({ settings: { ...state.settings, [setting]: !state.settings[setting] } })),
      markCasualQuizPlayed: (lastPlayedCasualQuizId) => set({ lastPlayedCasualQuizId }),
      recordResult: (result) => set((state) => {
        return { records: updateCategoryRecords(state.records, result) };
      }),
    }),
    {
      name: 'guessr-player-v1',
      version: 2,
      migrate: migrateProfileState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profile, settings, records, lastPlayedCasualQuizId }) => ({ profile, settings, records, lastPlayedCasualQuizId }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
