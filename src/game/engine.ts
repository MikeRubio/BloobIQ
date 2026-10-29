import { calculateScore, QUESTION_DURATION_MS } from './scoring';
import { shuffle, type RandomSource } from './random';
import type { GameRunState, QuestionRound, QuizQuestion, RunResult } from './types';

export const initialGameState: GameRunState = {
  runId: '', categoryId: 'flags', phase: 'idle', questions: [], rounds: [], currentIndex: 0, hearts: 3, score: 0, streak: 0, bestStreak: 0,
  correctAnswers: 0, answeredQuestions: 0, selectedOptionId: null, feedback: null,
  deadlineAt: null, pausedRemainingMs: null, reviveUsed: false, adMessage: null, result: null,
};

export function createRounds(questions: QuizQuestion[], random: RandomSource = Math.random): QuestionRound[] {
  const ids = new Set(questions.map((question) => question.id));
  return shuffle(questions, random).map((question) => {
    const candidates = question.distractorCandidates.filter((id) => id !== question.id && ids.has(id));
    const fallback = questions.map((item) => item.id).filter((id) => id !== question.id && !candidates.includes(id));
    const distractors = [...shuffle(candidates, random), ...shuffle(fallback, random)].slice(0, 3);
    return { questionId: question.id, optionIds: shuffle([question.id, ...distractors], random) };
  });
}

export function startRun(questions: QuizQuestion[], now = Date.now(), random: RandomSource = Math.random, runId = ''): GameRunState {
  if (questions.length < 4) throw new Error('A quiz pack needs at least four questions.');
  const categoryId = questions[0]!.categoryId;
  if (!questions.every((question) => question.categoryId === categoryId)) throw new Error('A quiz run cannot mix categories.');
  return { ...initialGameState, runId, categoryId, phase: 'loading', questions, rounds: createRounds(questions, random), deadlineAt: null };
}

export function beginQuestion(state: GameRunState, now = Date.now()): GameRunState {
  if (state.phase !== 'loading') return state;
  return { ...state, phase: 'answering', deadlineAt: now + QUESTION_DURATION_MS, pausedRemainingMs: null };
}

export function submitAnswer(state: GameRunState, optionId: string | null, now = Date.now()): GameRunState {
  if (state.phase !== 'answering' || state.pausedRemainingMs !== null) return state;
  const round = state.rounds[state.currentIndex];
  if (!round) return state;

  const isCorrect = optionId === round.questionId;
  const remainingMs = Math.max(0, (state.deadlineAt ?? now) - now);
  const points = isCorrect ? calculateScore(remainingMs) : 0;
  const nextStreak = isCorrect ? state.streak + 1 : 0;
  return {
    ...state,
    phase: 'feedback',
    hearts: isCorrect ? state.hearts : Math.max(0, state.hearts - 1),
    score: state.score + points,
    streak: nextStreak,
    bestStreak: Math.max(state.bestStreak, nextStreak),
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    answeredQuestions: state.answeredQuestions + 1,
    selectedOptionId: optionId,
    feedback: { kind: isCorrect ? 'correct' : optionId === null ? 'timeout' : 'wrong', selectedId: optionId, correctId: round.questionId, points },
    deadlineAt: null,
  };
}

export function finishRun(state: GameRunState, previousBest: number, completedPack = false, now = Date.now()): GameRunState {
  const result: RunResult = {
    categoryId: state.categoryId, score: state.score, correctAnswers: state.correctAnswers,
    answeredQuestions: state.answeredQuestions, bestStreak: state.bestStreak,
    totalQuestions: state.rounds.length, completedPack, finishedAt: now, previousBest,
    isNewPersonalBest: state.score > previousBest,
  };
  return { ...state, phase: 'complete', deadlineAt: null, pausedRemainingMs: null, result };
}

export function advanceAfterFeedback(state: GameRunState, previousBest: number, now = Date.now()): GameRunState {
  if (state.phase !== 'feedback') return state;
  const isLastQuestion = state.currentIndex >= state.rounds.length - 1;
  if (isLastQuestion) return finishRun(state, previousBest, true, now);
  if (state.hearts <= 0) {
    return state.reviveUsed ? finishRun(state, previousBest, false, now) : { ...state, phase: 'revive-offer', adMessage: null };
  }
  return {
    ...state, phase: 'loading', currentIndex: state.currentIndex + 1, selectedOptionId: null,
    feedback: null, deadlineAt: null, pausedRemainingMs: null,
  };
}

export function pauseRun(state: GameRunState, now = Date.now()): GameRunState {
  if (state.phase !== 'answering' || state.pausedRemainingMs !== null) return state;
  return { ...state, deadlineAt: null, pausedRemainingMs: Math.max(0, (state.deadlineAt ?? now) - now) };
}

export function resumeRun(state: GameRunState, now = Date.now()): GameRunState {
  if (state.phase !== 'answering' || state.pausedRemainingMs === null) return state;
  return { ...state, deadlineAt: now + state.pausedRemainingMs, pausedRemainingMs: null };
}

export function beginAd(state: GameRunState): GameRunState {
  return state.phase === 'revive-offer' ? { ...state, phase: 'ad-in-progress', adMessage: null } : state;
}

export function returnToReviveOffer(state: GameRunState, message: string): GameRunState {
  return state.phase === 'ad-in-progress' ? { ...state, phase: 'revive-offer', adMessage: message } : state;
}

export function grantRevive(state: GameRunState, now = Date.now()): GameRunState {
  if (state.phase !== 'ad-in-progress' || state.reviveUsed || state.currentIndex >= state.rounds.length - 1) return state;
  return {
    ...state, phase: 'loading', hearts: 1, reviveUsed: true, currentIndex: state.currentIndex + 1,
    selectedOptionId: null, feedback: null, deadlineAt: null,
    pausedRemainingMs: null, adMessage: null,
  };
}
