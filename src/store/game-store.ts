import { create } from 'zustand';
import { flagQuestions } from '@/content/flags';
import {
  advanceAfterFeedback, beginAd, finishRun, grantRevive, initialGameState, pauseRun,
  resumeRun, returnToReviveOffer, startRun, submitAnswer,
} from '@/game/engine';
import type { GameRunState } from '@/game/types';
import { useProfileStore } from './profile-store';

type GameActions = {
  start: (now?: number) => void;
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

function previousBest(): number {
  return useProfileStore.getState().records.flags?.highScore ?? 0;
}

function commitCompleted(previous: GameRunState, next: GameRunState): void {
  if (previous.phase !== 'complete' && next.phase === 'complete' && next.result) {
    useProfileStore.getState().recordResult(next.result);
  }
}

export const useGameStore = create<GameRunState & GameActions>((set) => ({
  ...initialGameState,
  start: (now) => set(startRun(flagQuestions, now)),
  answer: (optionId, now) => set((state) => submitAnswer(state, optionId, now)),
  advance: (now) => set((state) => {
    const next = advanceAfterFeedback(state, previousBest(), now);
    commitCompleted(state, next);
    return next;
  }),
  pause: (now) => set((state) => pauseRun(state, now)),
  resume: (now) => set((state) => resumeRun(state, now)),
  startAd: () => set((state) => beginAd(state)),
  adDidNotReward: (message) => set((state) => returnToReviveOffer(state, message)),
  revive: (now) => set((state) => grantRevive(state, now)),
  finish: (now) => set((state) => {
    const next = finishRun(state, previousBest(), false, now);
    commitCompleted(state, next);
    return next;
  }),
  reset: () => set(initialGameState),
}));
