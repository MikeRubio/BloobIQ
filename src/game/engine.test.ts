import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from './types';
import { advanceAfterFeedback, beginAd, beginQuestion, createRounds, grantRevive, pauseRun, resumeRun, startRun, submitAnswer } from './engine';

const pack: QuizQuestion[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id, categoryId: 'flags', displayName: id.toUpperCase(), assetKey: id, difficulty: 'easy',
  distractorCandidates: ['a', 'b', 'c', 'd', 'e'].filter((other) => other !== id),
  provenance: { sourceName: 'test', sourceUrl: 'test', license: 'test' },
}));

function wrongOption(state: ReturnType<typeof startRun>) {
  const round = state.rounds[state.currentIndex]!;
  return round.optionIds.find((id) => id !== round.questionId)!;
}

function startReady(questions = pack, now = 0) {
  return beginQuestion(startRun(questions, now, () => 0.42), now);
}

function readyIfNeeded(state: ReturnType<typeof startRun>, now: number) {
  return state.phase === 'loading' ? beginQuestion(state, now) : state;
}

describe('game lifecycle', () => {
  it('loses one heart for wrong answers and offers one revive after the third', () => {
    let state = startReady();
    for (let index = 0; index < 3; index += 1) {
      state = submitAnswer(state, wrongOption(state), 1000 + index);
      expect(state.hearts).toBe(2 - index);
      state = advanceAfterFeedback(state, 0, 2000 + index);
      state = readyIfNeeded(state, 2500 + index);
    }
    expect(state.phase).toBe('revive-offer');
  });

  it('locks a question after the first answer and processes a timeout once', () => {
    const started = startReady();
    const timedOut = submitAnswer(started, null, 10_000);
    expect(timedOut.hearts).toBe(2);
    expect(timedOut.answeredQuestions).toBe(1);
    expect(timedOut.feedback?.kind).toBe('timeout');
    expect(submitAnswer(timedOut, timedOut.rounds[0]!.questionId, 10_001)).toBe(timedOut);
  });

  it('grants only one revive and never returns to a second offer', () => {
    let state = startReady();
    for (let index = 0; index < 3; index += 1) {
      state = advanceAfterFeedback(submitAnswer(state, wrongOption(state), 1000), 0, 2000);
      state = readyIfNeeded(state, 2500);
    }
    state = grantRevive(beginAd(state), 3000);
    expect(state.hearts).toBe(1);
    expect(state.reviveUsed).toBe(true);
    const afterDuplicateGrant = grantRevive(state, 3001);
    expect(afterDuplicateGrant).toBe(state);
    state = readyIfNeeded(state, 3000);
    state = advanceAfterFeedback(submitAnswer(state, wrongOption(state), 3500), 0, 4000);
    expect(state.phase).toBe('complete');
  });

  it('pauses and resumes from stored remaining time without duplicate timeout damage', () => {
    const started = beginQuestion(startRun(pack, 1000, () => 0.1), 1000);
    const paused = pauseRun(started, 4000);
    expect(paused.pausedRemainingMs).toBe(7000);
    expect(paused.deadlineAt).toBeNull();
    const resumed = resumeRun(paused, 100_000);
    expect(resumed.deadlineAt).toBe(107_000);
    const timedOut = submitAnswer(resumed, null, 107_000);
    expect(timedOut.hearts).toBe(2);
    expect(submitAnswer(timedOut, null, 107_001)).toBe(timedOut);
  });

  it('does not start the timer or consume a heart until artwork is ready', () => {
    const loading = startRun(pack, 1000, () => 0.2);
    expect(loading.phase).toBe('loading');
    expect(loading.deadlineAt).toBeNull();
    expect(submitAnswer(loading, null, 50_000)).toBe(loading);
    expect(loading.hearts).toBe(3);
    const ready = beginQuestion(loading, 50_000);
    expect(ready.deadlineAt).toBe(60_000);
    expect(ready.hearts).toBe(3);
  });

  it('uses every Football identity once and completes after all 17', () => {
    const football = Array.from({ length: 17 }, (_, index): QuizQuestion => ({
      id: `football-${index}`, categoryId: 'football', displayName: `Football ${index}`, assetKey: `football-${index}`,
      contentType: index < 6 ? 'confederation' : 'league', difficulty: 'easy',
      distractorCandidates: Array.from({ length: 17 }, (__, other) => `football-${other}`).filter((id) => id !== `football-${index}`),
      provenance: { sourceName: 'test', sourceUrl: 'test', license: 'test' },
    }));
    let state = beginQuestion(startRun(football, 0, () => 0.31), 0);
    expect(new Set(state.rounds.map((round) => round.questionId)).size).toBe(17);
    while (state.phase !== 'complete') {
      const round = state.rounds[state.currentIndex]!;
      state = submitAnswer(state, round.questionId, (state.deadlineAt ?? 10_000) - 5000);
      state = advanceAfterFeedback(state, 0, 20_000 + state.currentIndex);
      state = readyIfNeeded(state, 30_000 + state.currentIndex);
    }
    expect(state.result).toMatchObject({ categoryId: 'football', answeredQuestions: 17, correctAnswers: 17, completedPack: true });
  });

  it('prefers same-type Football distractors and keeps four distinct choices', () => {
    const football = Array.from({ length: 17 }, (_, index): QuizQuestion => ({
      id: `football-${index}`, categoryId: 'football', displayName: `Football ${index}`, assetKey: `football-${index}`,
      contentType: index < 6 ? 'confederation' : 'league', difficulty: 'easy',
      distractorCandidates: Array.from({ length: 17 }, (__, other) => other)
        .filter((other) => other !== index && (other < 6) === (index < 6)).map((other) => `football-${other}`),
      provenance: { sourceName: 'test', sourceUrl: 'test', license: 'test' },
    }));
    const byId = Object.fromEntries(football.map((question) => [question.id, question]));
    for (const round of createRounds(football, () => 0.27)) {
      expect(new Set(round.optionIds).size).toBe(4);
      expect(round.optionIds.filter((id) => id === round.questionId)).toHaveLength(1);
      expect(new Set(round.optionIds.map((id) => byId[id]!.contentType))).toEqual(new Set([byId[round.questionId]!.contentType]));
    }
  });

  it.each(['baseball', 'basketball'] as const)('uses every %s team once, then completes the 30-team pack', (categoryId) => {
    const teams = Array.from({ length: 30 }, (_, index): QuizQuestion => ({
      id: `${categoryId}-${index}`, categoryId, displayName: `Team ${index}`, assetKey: `${categoryId}-${index}`,
      contentType: `division-${Math.floor(index / 5)}`, difficulty: 'medium',
      distractorCandidates: Array.from({ length: 5 }, (__, offset) => Math.floor(index / 5) * 5 + offset)
        .filter((other) => other !== index).map((other) => `${categoryId}-${other}`),
      provenance: { sourceName: 'test', sourceUrl: 'test', license: 'test' },
    }));
    let state = beginQuestion(startRun(teams, 0, () => 0.41), 0);
    expect(new Set(state.rounds.map((round) => round.questionId)).size).toBe(30);
    while (state.phase !== 'complete') {
      const round = state.rounds[state.currentIndex]!;
      expect(new Set(round.optionIds).size).toBe(4);
      expect(round.optionIds.filter((id) => id === round.questionId)).toHaveLength(1);
      state = submitAnswer(state, round.questionId, (state.deadlineAt ?? 10_000) - 5000);
      state = advanceAfterFeedback(state, 0, 20_000 + state.currentIndex);
      state = readyIfNeeded(state, 30_000 + state.currentIndex);
    }
    expect(state.result).toMatchObject({ categoryId, answeredQuestions: 30, correctAnswers: 30, completedPack: true });
  });
});
