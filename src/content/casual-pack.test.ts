import { describe, expect, it } from 'vitest';
import { casualPackQuestions, parseCasualPack } from './casual-pack';

const payload = {
  categoryId: 'football', contentVersion: 'football-symbols-v2',
  items: Array.from({ length: 10 }, (_, index) => ({
    id: `football-${index}`, displayName: `Identity ${index}`, assetPath: `football-symbols-v2/q-${index}.svg`,
    revealAssetPath: `football-v1/${index}.png`,
    difficulty: index < 4 ? 'easy' : 'medium', contentType: index < 4 ? 'confederation' : 'league',
  })),
};

describe('hosted Casual packs', () => {
  it('validates the Football version and ten stable unique identities', () => {
    const pack = parseCasualPack(payload, 'football');
    expect(pack.contentVersion).toBe('football-symbols-v2');
    expect(pack.items).toHaveLength(10);
    expect(new Set(pack.items.map((item) => item.id)).size).toBe(10);
  });

  it('builds same-type-first distractor candidates and hosted asset URLs', () => {
    const questions = casualPackQuestions(parseCasualPack(payload, 'football'), (path) => `https://assets.test/${path}`);
    expect(questions).toHaveLength(10);
    expect(questions[0]!.assetUri).toBe('https://assets.test/football-symbols-v2/q-0.svg');
    expect(questions[0]!.revealAssetUri).toBe('https://assets.test/football-v1/0.png');
    expect(questions[0]!.distractorCandidates.slice(0, 3).every((id) => Number(id.split('-').at(-1)) < 4)).toBe(true);
    expect(questions[4]!.distractorCandidates.slice(0, 5).every((id) => Number(id.split('-').at(-1)) >= 4)).toBe(true);
  });

  it('rejects duplicates and wrong-category responses', () => {
    expect(() => parseCasualPack({ ...payload, categoryId: 'flags' }, 'football')).toThrow(/wrong content pack/i);
    expect(() => parseCasualPack({ ...payload, items: payload.items.map((item, index) => index ? item : { ...item, id: payload.items[1]!.id }) }, 'football')).toThrow(/duplicate identities/i);
  });

  it.each(['baseball', 'basketball'] as const)('supports a complete 30-team %s pack with recorded division distractors', (categoryId) => {
    const teamPayload = {
      categoryId,
      contentVersion: categoryId === 'baseball' ? 'baseball-mlb-v1' : 'basketball-nba-v1',
      items: Array.from({ length: 30 }, (_, index) => ({
        id: `${categoryId}-${index}`,
        displayName: `${categoryId} team ${index}`,
        assetPath: `${categoryId}-v1/${index}.svg`,
        difficulty: 'medium',
        contentType: `division-${Math.floor(index / 5)}`,
        distractorIds: Array.from({ length: 5 }, (__, offset) => Math.floor(index / 5) * 5 + offset)
          .filter((other) => other !== index)
          .map((other) => `${categoryId}-${other}`),
      })),
    };
    const questions = casualPackQuestions(parseCasualPack(teamPayload, categoryId), (path) => `https://assets.test/${path}`);
    expect(questions).toHaveLength(30);
    expect(questions[0]!.distractorCandidates.slice(0, 4)).toEqual([
      `${categoryId}-1`, `${categoryId}-2`, `${categoryId}-3`, `${categoryId}-4`,
    ]);
  });
});
