import { describe, expect, it } from 'vitest';
import type { RunResult } from '@/game/types';
import { migrateProfileState, updateCategoryRecords } from './profile-store';

const baseResult: RunResult = {
  categoryId: 'football', score: 1250, correctAnswers: 9, answeredQuestions: 12,
  bestStreak: 5, totalQuestions: 17, completedPack: false, finishedAt: 1,
  previousBest: 0, isNewPersonalBest: true,
};

describe('profile record compatibility', () => {
  it('adds Football without changing an existing Flags record', () => {
    const flags = { highScore: 900, gamesPlayed: 3, totalCorrect: 20, bestStreak: 6 };
    const updated = updateCategoryRecords({ flags }, baseResult);
    expect(updated.flags).toEqual(flags);
    expect(updated.football).toEqual({ highScore: 1250, gamesPlayed: 1, totalCorrect: 9, bestStreak: 5 });
  });

  it('migrates a Flags-only persisted guest without changing identity or records', () => {
    const legacy = {
      profile: { id: 'guest-1', name: 'Sunny Fox 123', avatar: 'fox', color: '#FF8A65' },
      settings: { sound: true, haptics: true, reducedMotion: false },
      records: { flags: { highScore: 700, gamesPlayed: 2, totalCorrect: 10, bestStreak: 4 } },
    };
    expect(migrateProfileState(legacy)).toMatchObject(legacy);
  });

  it.each(['baseball', 'basketball'] as const)('stores %s records independently from every existing quiz', (categoryId) => {
    const records = {
      flags: { highScore: 700, gamesPlayed: 2, totalCorrect: 10, bestStreak: 4 },
      football: { highScore: 900, gamesPlayed: 1, totalCorrect: 8, bestStreak: 3 },
    };
    const updated = updateCategoryRecords(records, { ...baseResult, categoryId, score: 1500 });
    expect(updated.flags).toEqual(records.flags);
    expect(updated.football).toEqual(records.football);
    expect(updated[categoryId]).toEqual({ highScore: 1500, gamesPlayed: 1, totalCorrect: 9, bestStreak: 5 });
  });
});
