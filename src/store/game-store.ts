import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { loadCasualQuestions } from '@/backend/casual-api';
import type { QuizCategoryId } from '@/backend/types';
import {
  advanceAfterFeedback, beginAd, beginQuestion, finishRun, grantRevive, initialGameState, pauseRun,
  resumeRun, returnToReviveOffer, startRun, submitAnswer,
} from '@/game/engine';
import type { GameRunState } from '@/game/types';
import { useProfileStore } from './profile-store';

type GameActions = {
  launching: boolean;
  launchError: string | null;
  start: (categoryId?: QuizCategoryId, now?: number, forceRefresh?: boolean) => Promise<boolean>;
  questionReady: (now?: number) => void;
  answer: (optionId: string | null, now?: number) => void;
  advance: (now?: number) => void;
  pause: (now?: number) => void;
  resume: (now?: number) => void;
  startAd: () => void;
  adDidNotReward: (message: string) => void;
  revive: (now?: number) => void;
  finish: (now?: number) => void;
  reset: () => void;
};

function previousBest(categoryId: GameRunState['categoryId']): number {
  return useProfileStore.getState().records[categoryId]?.highScore ?? 0;
}

function commitCompleted(previous: GameRunState, next: GameRunState): void {
  if (previous.phase !== 'complete' && next.phase === 'complete' && next.result) {
    useProfileStore.getState().recordResult(next.result);
  }
}

export const useGameStore = create<GameRunState & GameActions>((set) => ({
  ...initialGameState,
  launching: false,
  launchError: null,
  start: async (categoryId = 'flags', now, forceRefresh = false) => {
    set({ launching: true, launchError: null });
    try {
      const profile = useProfileStore.getState().profile;
      const questions = await loadCasualQuestions(categoryId, { name: profile.name, avatar: profile.avatar, color: profile.color }, forceRefresh);
      useProfileStore.getState().markCasualQuizPlayed(categoryId);
      set({ ...startRun(questions, now, Math.random, randomUUID()), launching: false, launchError: null });
      return true;
    } catch (error) {
      set({ launching: false, launchError: error instanceof Error ? error.message : 'This quiz could not be loaded.' });
      return false;
    }
  },
  questionReady: (now) => set((state) => beginQuestion(state, now)),
  answer: (optionId, now) => set((state) => submitAnswer(state, optionId, now)),
  advance: (now) => set((state) => {
    const next = advanceAfterFeedback(state, previousBest(state.categoryId), now);
    commitCompleted(state, next);
    return next;
  }),
  pause: (now) => set((state) => pauseRun(state, now)),
  resume: (now) => set((state) => resumeRun(state, now)),
  startAd: () => set((state) => beginAd(state)),
  adDidNotReward: (message) => set((state) => returnToReviveOffer(state, message)),
  revive: (now) => set((state) => grantRevive(state, now)),
  finish: (now) => set((state) => {
    const next = finishRun(state, previousBest(state.categoryId), false, now);
    commitCompleted(state, next);
    return next;
  }),
  reset: () => set({ ...initialGameState, launching: false, launchError: null }),
}));
