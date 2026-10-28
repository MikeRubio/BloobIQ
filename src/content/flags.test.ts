import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRounds } from '../game/engine';
import { flagQuestions } from './flags';

describe('flags content pack', () => {
  it('contains at least 40 unique, locally bundled flags', () => {
    expect(flagQuestions.length).toBeGreaterThanOrEqual(40);
    const ids = new Set(flagQuestions.map((question) => question.id));
    expect(ids.size).toBe(flagQuestions.length);
    for (const question of flagQuestions) {
      expect(existsSync(resolve(process.cwd(), 'assets', 'flags', `${question.assetKey}.png`))).toBe(true);
      expect(question.displayName.length).toBeGreaterThan(1);
      expect(question.distractorCandidates.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('builds unique rounds with one answer and three valid distractors', () => {
    const rounds = createRounds(flagQuestions, () => 0.314159);
    expect(new Set(rounds.map((round) => round.questionId)).size).toBe(flagQuestions.length);
    for (const round of rounds) {
      expect(round.optionIds).toHaveLength(4);
      expect(new Set(round.optionIds).size).toBe(4);
      expect(round.optionIds).toContain(round.questionId);
      for (const optionId of round.optionIds) {
        expect(flagQuestions.some((question) => question.id === optionId)).toBe(true);
      }
    }
  });
});
