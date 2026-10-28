import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from './types';
import { advanceAfterFeedback, beginAd, grantRevive, pauseRun, resumeRun, startRun, submitAnswer } from './engine';

const pack: QuizQuestion[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id, categoryId: 'flags', displayName: id.toUpperCase(), assetKey: id, difficulty: 'easy',
  distractorCandidates: ['a', 'b', 'c', 'd', 'e'].filter((other) => other !== id),
  provenance: { sourceName: 'test', sourceUrl: 'test', license: 'test' },
}));

function wrongOption(state: ReturnType<typeof startRun>) {
  const round = state.rounds[state.currentIndex]!;
  return round.optionIds.find((id) => id !== round.questionId)!;
}

describe('game lifecycle', () => {
  it('loses one heart for wrong answers and offers one revive after the third', () => {
    let state = startRun(pack, 0, () => 0.42);
    for (let index = 0; index < 3; index += 1) {
      state = submitAnswer(state, wrongOption(state), 1000 + index);
      expect(state.hearts).toBe(2 - index);
      state = advanceAfterFeedback(state, 0, 2000 + index);
    }
    expect(state.phase).toBe('revive-offer');
  });

  it('locks a question after the first answer and processes a timeout once', () => {
    const started = startRun(pack, 0, () => 0.2);
    const timedOut = submitAnswer(started, null, 10_000);
    expect(timedOut.hearts).toBe(2);
    expect(timedOut.answeredQuestions).toBe(1);
    expect(timedOut.feedback?.kind).toBe('timeout');
    expect(submitAnswer(timedOut, timedOut.rounds[0]!.questionId, 10_001)).toBe(timedOut);
  });

  it('grants only one revive and never returns to a second offer', () => {
    let state = startRun(pack, 0, () => 0.42);
    for (let index = 0; index < 3; index += 1) {
      state = advanceAfterFeedback(submitAnswer(state, wrongOption(state), 1000), 0, 2000);
    }
    state = grantRevive(beginAd(state), 3000);
    expect(state.hearts).toBe(1);
    expect(state.reviveUsed).toBe(true);
    const afterDuplicateGrant = grantRevive(state, 3001);
    expect(afterDuplicateGrant).toBe(state);
    state = advanceAfterFeedback(submitAnswer(state, wrongOption(state), 3500), 0, 4000);
    expect(state.phase).toBe('complete');
  });

  it('pauses and resumes from stored remaining time without duplicate timeout damage', () => {
    const started = startRun(pack, 1000, () => 0.1);
    const paused = pauseRun(started, 4000);
    expect(paused.pausedRemainingMs).toBe(7000);
    expect(paused.deadlineAt).toBeNull();
    const resumed = resumeRun(paused, 100_000);
    expect(resumed.deadlineAt).toBe(107_000);
    const timedOut = submitAnswer(resumed, null, 107_000);
    expect(timedOut.hearts).toBe(2);
    expect(submitAnswer(timedOut, null, 107_001)).toBe(timedOut);
  });
});
