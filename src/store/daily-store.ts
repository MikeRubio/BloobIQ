import { create } from 'zustand';
import { fetchDailyState, startDailyAttempt, submitDailyAnswer } from '@/backend/daily-api';
import type { DailyRound, DailySnapshot, GuestProfilePayload, QuizCategoryId } from '@/backend/types';
import { BackendUnavailableError } from '@/backend/supabase';

type DailyFeedback = {
  round: DailyRound;
  choiceId: string | null;
  correctChoiceId: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
  points: number;
};
type DailyStore = {
  status: 'idle' | 'loading' | 'ready' | 'unconfigured' | 'error';
  snapshot: DailySnapshot | null;
  feedback: DailyFeedback | null;
  message: string | null;
  activeCategoryId: QuizCategoryId | null;
  load: (profile: GuestProfilePayload, categoryId?: QuizCategoryId) => Promise<void>;
  start: (profile: GuestProfilePayload, categoryId?: QuizCategoryId) => Promise<DailySnapshot | null>;
  submit: (choiceId: string | null) => Promise<DailySnapshot | null>;
  clearFeedback: () => void;
};

function errorState(error: unknown) {
  if (error instanceof BackendUnavailableError && error.reason === 'configuration') {
    return { status: 'unconfigured' as const, message: error.message };
  }
  return { status: 'error' as const, message: error instanceof Error ? error.message : 'Ranked play is temporarily unavailable.' };
}

let requestSerial = 0;

export const useDailyStore = create<DailyStore>((set, get) => ({
  status: 'idle', snapshot: null, feedback: null, message: null, activeCategoryId: null,
  load: async (profile, categoryId = 'flags') => {
    const requestId = ++requestSerial;
    set({ status: 'loading', message: null, feedback: null, activeCategoryId: categoryId });
    try {
      const snapshot = await fetchDailyState(profile, categoryId);
      if (requestId === requestSerial) set({ snapshot, status: 'ready' });
    } catch (error) {
      if (requestId === requestSerial) set(errorState(error));
    }
  },
  start: async (profile, categoryId = 'flags') => {
    const requestId = ++requestSerial;
    set({ status: 'loading', message: null, feedback: null, activeCategoryId: categoryId });
    try {
      const snapshot = await startDailyAttempt(profile, categoryId);
      if (requestId !== requestSerial) return null;
      set({ snapshot, status: 'ready' });
      return snapshot;
    } catch (error) {
      if (requestId === requestSerial) set(errorState(error));
      return null;
    }
  },
  submit: async (choiceId) => {
    const current = get().snapshot;
    const round = current?.currentRound;
    if (!current || !round || get().status === 'loading') return null;
    const requestId = ++requestSerial;
    set({ status: 'loading', message: null });
    try {
      const snapshot = await submitDailyAnswer(current, choiceId);
      if (requestId !== requestSerial) return null;
      set({
        snapshot,
        status: 'ready',
        feedback: {
          round,
          choiceId,
          correctChoiceId: snapshot.lastAnswer?.correctChoiceId ?? null,
          correctLabel: snapshot.lastAnswer?.correctLabel ?? null,
          isCorrect: snapshot.lastAnswer?.isCorrect ?? false,
          points: snapshot.lastAnswer?.points ?? 0,
        },
      });
      return snapshot;
    } catch (error) {
      if (requestId === requestSerial) set({ ...errorState(error), snapshot: current });
      return null;
    }
  },
  clearFeedback: () => set({ feedback: null }),
}));
