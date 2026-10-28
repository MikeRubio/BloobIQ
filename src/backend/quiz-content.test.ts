import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { baseballAssetPaths, basketballAssetPaths, flagAssetPaths, footballAssetPaths } from '../content/hosted-assets';

type ManifestItem = {
  categoryId: 'flags' | 'football' | 'baseball' | 'basketball';
  contentVersion: string;
  itemId: string;
  displayName: string;
  assetPath: string;
  sha256: string;
  sourcePageUrl: string;
  sourceAssetUrl: string;
  rightsStatus: string;
  metadata: { iso2?: string; scope?: string; league?: string; conference?: string; division?: string; aliases?: string[]; officialTeamId?: number; distractorIds?: string[] };
};

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'supabase', 'content', 'quiz-content.json'), 'utf8')) as {
  schemaVersion: number;
  flagSourceCommit: string;
  flagPackageVersion: string;
  items: ManifestItem[];
};
const flags = manifest.items.filter((item) => item.categoryId === 'flags');
const football = manifest.items.filter((item) => item.categoryId === 'football');
const baseball = manifest.items.filter((item) => item.categoryId === 'baseball');
const basketball = manifest.items.filter((item) => item.categoryId === 'basketball');

describe('hosted quiz content manifest', () => {
  it('pins a complete 195-sovereign-state flag pack', () => {
    expect(manifest.flagPackageVersion).toBe('1.2.10');
    expect(manifest.flagSourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(flags).toHaveLength(195);
    expect(new Set(flags.map((item) => item.metadata.iso2)).size).toBe(195);
    expect(flags.map((item) => item.metadata.iso2)).toEqual(expect.arrayContaining(['PS', 'VA']));
    expect(flags.every((item) => item.contentVersion === 'flags-195-v1')).toBe(true);
  });

  it.each([
    ['baseball', baseball, 'baseball-mlb-v1', 'MLB'],
    ['basketball', basketball, 'basketball-nba-v1', 'NBA'],
  ] as const)('contains all 30 current %s teams with official identity metadata', (_, teams, version, league) => {
    expect(teams).toHaveLength(30);
    expect(new Set(teams.map((item) => item.itemId)).size).toBe(30);
    expect(new Set(teams.map((item) => item.displayName)).size).toBe(30);
    expect(teams.every((item) => item.contentVersion === version)).toBe(true);
    expect(teams.every((item) => item.rightsStatus === 'trademark_review_required')).toBe(true);
    expect(teams.every((item) => item.metadata.league === league && item.metadata.conference && item.metadata.division)).toBe(true);
    expect(teams.every((item) => item.metadata.distractorIds?.length === 4)).toBe(true);
    expect(new Set(teams.map((item) => item.metadata.officialTeamId)).size).toBe(30);
  });

  it('contains the requested confederation and league identities', () => {
    expect(football).toHaveLength(17);
    expect(football.map((item) => item.displayName)).toEqual(expect.arrayContaining([
      'UEFA', 'CAF', 'AFC', 'CONCACAF', 'CONMEBOL', 'OFC',
      'English Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
      'Major League Soccer', 'Liga MX', 'Brasileirão Série A', 'J1 League',
      'K League 1', 'Saudi Pro League',
    ]));
    expect(football.every((item) => item.contentVersion === 'football-v1')).toBe(true);
    expect(football.every((item) => item.rightsStatus === 'trademark_reviewed_approved')).toBe(true);
    expect(football.filter((item) => item.metadata.scope === 'confederation')).toHaveLength(6);
    expect(football.filter((item) => item.metadata.scope === 'league')).toHaveLength(11);
  });

  it('records unique immutable assets and source provenance', () => {
    expect(manifest.items).toHaveLength(272);
    expect(new Set(manifest.items.map((item) => item.assetPath)).size).toBe(272);
    expect(new Set(manifest.items.map((item) => item.sha256)).size).toBe(272);
    for (const item of manifest.items) {
      expect(item.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.sourcePageUrl).toMatch(/^https:\/\//);
      expect(item.sourceAssetUrl).toMatch(/^https:\/\//);
      expect(['public_domain_national_symbol', 'trademark_review_required', 'trademark_reviewed_approved']).toContain(item.rightsStatus);
    }
  });

  it('keeps the startup preload registry aligned with the hosted packs', () => {
    expect(flagAssetPaths).toHaveLength(195);
    expect(footballAssetPaths).toHaveLength(17);
    expect(baseballAssetPaths).toHaveLength(30);
    expect(basketballAssetPaths).toHaveLength(30);
    const allPaths = [...flagAssetPaths, ...footballAssetPaths, ...baseballAssetPaths, ...basketballAssetPaths];
    expect(new Set(allPaths).size).toBe(272);
    expect(allPaths).toEqual(expect.arrayContaining(manifest.items.map((item) => item.assetPath)));
  });
});
