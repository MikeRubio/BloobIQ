import { create } from 'zustand';
import { fetchDailyState, startDailyAttempt, submitDailyAnswer } from '../backend/daily-api';
import type { DailyRound, DailySnapshot, GuestProfilePayload, QuizCategoryId } from '../backend/types';
import { BackendUnavailableError } from '../backend/supabase';

type DailyFeedback = {
  round: DailyRound;
  choiceId: string | null;
  correctChoiceId: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
  points: number;
  revealAssetPath: string | null;
};
type DailyStore = {
  status: 'idle' | 'loading' | 'ready' | 'unconfigured' | 'error';
  refreshing: boolean;
  snapshot: DailySnapshot | null;
  feedback: DailyFeedback | null;
  message: string | null;
  activeCategoryId: QuizCategoryId | null;
  load: (profile: GuestProfilePayload, categoryId?: QuizCategoryId, ownerId?: string) => Promise<DailySnapshot | null>;
  start: (profile: GuestProfilePayload, categoryId?: QuizCategoryId) => Promise<DailySnapshot | null>;
  submit: (choiceId: string | null) => Promise<DailySnapshot | null>;
  clearFeedback: () => void;
  cancelLoad: (categoryId: QuizCategoryId, ownerId?: string) => void;
};

function errorState(error: unknown) {
  if (error instanceof BackendUnavailableError && error.reason === 'configuration') {
    return { status: 'unconfigured' as const, message: error.message };
  }
  return { status: 'error' as const, message: error instanceof Error ? error.message : 'Ranked play is temporarily unavailable.' };
}

const requestTimeoutMs = 12_000;
let requestSerial = 0;
let activeLoad: {
  categoryId: QuizCategoryId;
  requestId: number;
  ownerId?: string;
  controller: AbortController;
  promise: Promise<DailySnapshot | null>;
} | null = null;

function timeoutError() {
  return new BackendUnavailableError('Ranked play took too long to respond. Check your connection and try again.');
}

async function withTimeout<T>(promise: Promise<T>, controller: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError());
    }, requestTimeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  status: 'idle', refreshing: false, snapshot: null, feedback: null, message: null, activeCategoryId: null,
  load: async (profile, categoryId = 'flags', ownerId) => {
    if (activeLoad?.categoryId === categoryId) {
      activeLoad.ownerId = ownerId;
      return activeLoad.promise;
    }
    activeLoad?.controller.abort();
    const requestId = ++requestSerial;
    const controller = new AbortController();
    const hasSnapshot = get().snapshot?.categoryId === categoryId;
    set({
      status: hasSnapshot ? get().status : 'loading',
      refreshing: hasSnapshot,
      message: null,
      feedback: null,
      activeCategoryId: categoryId,
    });
    const promise = withTimeout(fetchDailyState(profile, categoryId, controller.signal), controller)
      .then((snapshot) => {
        if (requestId !== requestSerial) return null;
        set({ snapshot, status: 'ready', refreshing: false, message: null });
        return snapshot;
      })
      .catch((error: unknown) => {
        if (requestId !== requestSerial) return null;
        const surfacedError = controller.signal.aborted && !(error instanceof BackendUnavailableError) ? timeoutError() : error;
        set({ ...errorState(surfacedError), refreshing: false });
        return null;
      })
      .finally(() => {
        if (activeLoad?.requestId === requestId) activeLoad = null;
      });
    activeLoad = { categoryId, requestId, ownerId, controller, promise };
    return promise;
  },
  start: async (profile, categoryId = 'flags') => {
    activeLoad?.controller.abort();
    activeLoad = null;
    const requestId = ++requestSerial;
    const controller = new AbortController();
    set({ status: 'loading', refreshing: false, message: null, feedback: null, activeCategoryId: categoryId });
    try {
      const snapshot = await withTimeout(startDailyAttempt(profile, categoryId, controller.signal), controller);
      if (requestId !== requestSerial) return null;
      set({ snapshot, status: 'ready', refreshing: false });
      return snapshot;
    } catch (error) {
      if (requestId === requestSerial) set({ ...errorState(controller.signal.aborted ? timeoutError() : error), refreshing: false });
      return null;
    }
  },
  submit: async (choiceId) => {
    const current = get().snapshot;
    const round = current?.currentRound;
    if (!current || !round || get().status === 'loading') return null;
    activeLoad?.controller.abort();
    activeLoad = null;
    const requestId = ++requestSerial;
    const controller = new AbortController();
    set({ status: 'loading', refreshing: false, message: null });
    try {
      const snapshot = await withTimeout(submitDailyAnswer(current, choiceId, controller.signal), controller);
      if (requestId !== requestSerial) return null;
      set({
        snapshot,
        status: 'ready',
        refreshing: false,
        feedback: {
          round,
          choiceId,
          correctChoiceId: snapshot.lastAnswer?.correctChoiceId ?? null,
          correctLabel: snapshot.lastAnswer?.correctLabel ?? null,
          isCorrect: snapshot.lastAnswer?.isCorrect ?? false,
          points: snapshot.lastAnswer?.points ?? 0,
          revealAssetPath: snapshot.lastAnswer?.revealAssetPath ?? null,
        },
      });
      return snapshot;
    } catch (error) {
      if (requestId === requestSerial) set({ ...errorState(controller.signal.aborted ? timeoutError() : error), refreshing: false, snapshot: current });
      return null;
    }
  },
  clearFeedback: () => set({ feedback: null }),
  cancelLoad: (categoryId, ownerId) => {
    if (activeLoad?.categoryId !== categoryId || (ownerId !== undefined && activeLoad.ownerId !== ownerId)) return;
    activeLoad.controller.abort();
    activeLoad = null;
    requestSerial += 1;
    const current = get();
    set({
      status: current.snapshot?.categoryId === categoryId ? 'ready' : 'idle',
      refreshing: false,
      message: null,
    });
  },
}));
