import { describe, expect, it } from 'vitest';
import { BASE_POINTS, calculateScore, MAX_SPEED_BONUS, QUESTION_DURATION_MS } from './scoring';

describe('calculateScore', () => {
  it('awards the full speed bonus at the start', () => {
    expect(calculateScore(QUESTION_DURATION_MS)).toBe(BASE_POINTS + MAX_SPEED_BONUS);
  });

  it('awards no speed bonus when time has run out', () => {
    expect(calculateScore(0)).toBe(BASE_POINTS);
    expect(calculateScore(-100)).toBe(BASE_POINTS);
  });

  it('clamps excess time and rounds proportional bonuses', () => {
    expect(calculateScore(20_000)).toBe(150);
    expect(calculateScore(5_000)).toBe(125);
  });
});
