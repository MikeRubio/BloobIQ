import { describe, expect, it } from 'vitest';
import { backendProfileFromLocal } from '../backend/profile-migration';
import { competitionRanks } from './ranking';
import { evaluateRankedAnswer, interruptionOutcome } from './rules';
import { formatCountdown, localDeadline, utcDayKey, utcWeekBounds } from './time';

describe('daily UTC boundaries', () => {
  it('uses UTC day boundaries independent of local offset', () => {
    expect(utcDayKey(new Date('2026-10-28T23:59:59.999Z'))).toBe('2026-10-28');
    expect(utcDayKey(new Date('2026-10-29T00:00:00.000Z'))).toBe('2026-10-29');
  });
  it('uses Monday-to-Monday UTC weeks', () => {
    expect(utcWeekBounds(new Date('2026-10-28T12:00:00Z'))).toEqual({ start: '2026-10-26', endExclusive: '2026-11-02' });
    expect(utcWeekBounds(new Date('2026-11-01T23:59:59Z'))).toEqual({ start: '2026-10-26', endExclusive: '2026-11-02' });
  });
  it('projects server deadlines without trusting the device clock', () => {
    expect(localDeadline('2026-10-28T10:00:00Z', '2026-10-28T10:00:10Z', 5000)).toBe(15000);
    expect(formatCountdown(65_000, 0)).toBe('1m 5s');
  });
});

describe('ranked evaluation and interruption', () => {
  it('awards exactly 100 points at the deadline boundary', () => {
    expect(evaluateRankedAnswer({ questionStartedAt: 0, receivedAt: 10_000, choiceId: 'a', correctChoiceId: 'a' })).toEqual({ isCorrect: true, points: 100, elapsedMs: 10_000, timedOut: false });
  });
  it('scores a late response as zero and caps measured duration', () => {
    expect(evaluateRankedAnswer({ questionStartedAt: 0, receivedAt: 10_001, choiceId: 'a', correctChoiceId: 'a' })).toEqual({ isCorrect: false, points: 0, elapsedMs: 10_000, timedOut: true });
  });
  it('does not pause ranked time during interruption', () => {
    expect(interruptionOutcome({ now: 9000, questionDeadline: 10_000, attemptExpiry: 30_000 })).toBe('resume');
    expect(interruptionOutcome({ now: 11_000, questionDeadline: 10_000, attemptExpiry: 30_000 })).toBe('timeout_current');
    expect(interruptionOutcome({ now: 30_000, questionDeadline: 10_000, attemptExpiry: 30_000 })).toBe('expired');
  });
});

describe('leaderboard ordering', () => {
  it('orders score then duration and shares exact ties', () => {
    expect(competitionRanks([
      { id: 'slow', score: 900, durationMs: 40_000 },
      { id: 'low', score: 800, durationMs: 20_000 },
      { id: 'fast', score: 900, durationMs: 30_000 },
      { id: 'tie', score: 900, durationMs: 30_000 },
    ])).toEqual([
      { id: 'fast', score: 900, durationMs: 30_000, position: 1 },
      { id: 'tie', score: 900, durationMs: 30_000, position: 1 },
      { id: 'slow', score: 900, durationMs: 40_000, position: 3 },
      { id: 'low', score: 800, durationMs: 20_000, position: 4 },
    ]);
  });
});

describe('local guest migration', () => {
  it('extracts backend profile fields without mutating casual records', () => {
    const local = { id: 'local-1', name: 'Sunny Fox 123', avatar: '🦊', color: '#FF8A65' };
    const records = { flags: { highScore: 450, gamesPlayed: 3, totalCorrect: 9, bestStreak: 4 } };
    expect(backendProfileFromLocal(local)).toEqual({ name: local.name, avatar: local.avatar, color: local.color });
    expect(records.flags.highScore).toBe(450);
  });
});
