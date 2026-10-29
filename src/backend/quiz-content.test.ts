import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { baseballAssetPaths, basketballAssetPaths, flagAssetPaths, footballAssetPaths, footballRevealAssetPaths } from '../content/hosted-assets';

type ManifestItem = {
  categoryId: 'flags' | 'football' | 'baseball' | 'basketball';
  contentVersion: string;
  itemId: string;
  displayName: string;
  assetPath: string;
  revealAssetPath?: string;
  sha256: string;
  sourcePageUrl: string;
  sourceAssetUrl: string;
  rightsStatus: string;
  metadata: { iso2?: string; scope?: string; league?: string; leagueKey?: string; country?: string; competition?: string; competitionKey?: string; selectionGroup?: string; identityKey?: string; season?: string; eligibleForQuestion?: boolean; conference?: string; division?: string; aliases?: string[]; officialTeamId?: number | string | null; distractorIds?: string[]; questionAssetRole?: string; revealAssetRole?: string; editRecipe?: string; questionPrompt?: string; questionDescription?: string; teamName?: string; legend?: string | null; retiredNumber?: string | null };
};

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'supabase', 'content', 'quiz-content.json'), 'utf8')) as {
  schemaVersion: number;
  flagSourceCommit: string;
  flagPackageVersion: string;
  items: ManifestItem[];
};
const flags = manifest.items.filter((item) => item.categoryId === 'flags');
const football = manifest.items.filter((item) => item.categoryId === 'football');
const footballSymbols = football.filter((item) => item.contentVersion === 'football-symbols-v2');
const footballMixed = football.filter((item) => item.contentVersion === 'football-mixed-v3');
const footballClubs = footballMixed.filter((item) => item.metadata.scope === 'club');
const footballClubOriginals = football.filter((item) => item.contentVersion === 'football-clubs-v3');
const baseball = manifest.items.filter((item) => item.contentVersion === 'baseball-mlb-v1');
const baseballGlobal = manifest.items.filter((item) => item.contentVersion === 'baseball-global-v2');
const baseballWinter = baseballGlobal.filter((item) => item.metadata.selectionGroup !== 'mlb');
const basketball = manifest.items.filter((item) => item.contentVersion === 'basketball-nba-v1');
const basketballExpanded = manifest.items.filter((item) => item.contentVersion === 'basketball-expanded-v2');
const basketballTrivia = basketballExpanded.filter((item) => item.metadata.scope !== 'team-logo');

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

  it('adds all current Dominican, Venezuelan, and Mexican Pacific winter-league clubs', () => {
    expect(baseballGlobal).toHaveLength(54);
    expect(baseballWinter).toHaveLength(24);
    expect(Object.fromEntries(['lidom', 'lvbp', 'lmp'].map((league) => [
      league,
      baseballWinter.filter((item) => item.metadata.leagueKey === league).length,
    ]))).toEqual({ lidom: 6, lvbp: 8, lmp: 10 });
    expect(new Set(baseballGlobal.map((item) => item.itemId)).size).toBe(54);
    expect(baseballGlobal.every((item) => item.metadata.questionPrompt && item.metadata.questionDescription)).toBe(true);
    expect(baseballWinter.every((item) => item.metadata.distractorIds && item.metadata.distractorIds.length >= 5)).toBe(true);
    expect(baseballWinter.map((item) => item.metadata.country)).toEqual(expect.arrayContaining([
      'Dominican Republic', 'Venezuela', 'Mexico',
    ]));
  });

  it('adds balanced NBA mascot, arena, retired-number, and franchise-legend questions', () => {
    expect(basketballExpanded).toHaveLength(78);
    expect(basketballTrivia).toHaveLength(48);
    expect(Object.fromEntries(['team-logo', 'mascot', 'arena', 'retired-number', 'franchise-legend'].map((scope) => [
      scope,
      basketballExpanded.filter((item) => item.metadata.scope === scope).length,
    ]))).toEqual({ 'team-logo': 30, mascot: 12, arena: 12, 'retired-number': 12, 'franchise-legend': 12 });
    for (const scope of ['mascot', 'arena', 'retired-number', 'franchise-legend']) {
      const questions = basketballTrivia.filter((item) => item.metadata.scope === scope);
      expect(new Set(questions.map((item) => item.displayName)).size).toBe(12);
      expect(questions.every((item) => item.metadata.distractorIds?.length === 11)).toBe(true);
      expect(questions.every((item) => item.metadata.questionPrompt && item.metadata.questionDescription)).toBe(true);
    }
    expect(basketballTrivia.every((item) => item.metadata.questionDescription?.includes(item.displayName) === false)).toBe(true);
  });

  it('keeps originals while exposing ten symbol-only Football questions', () => {
    expect(football.filter((item) => item.contentVersion === 'football-v1')).toHaveLength(17);
    expect(footballSymbols).toHaveLength(10);
    expect(footballSymbols.filter((item) => item.metadata.scope === 'confederation')).toHaveLength(4);
    expect(footballSymbols.filter((item) => item.metadata.scope === 'league')).toHaveLength(6);
    expect(footballSymbols.every((item) => item.rightsStatus === 'trademark_reviewed_approved')).toBe(true);
    expect(footballSymbols.every((item) => item.metadata.questionAssetRole === 'symbol_only_quiz_variant')).toBe(true);
    expect(footballSymbols.every((item) => item.metadata.revealAssetRole === 'complete_original_identity')).toBe(true);
    expect(footballSymbols.every((item) => item.revealAssetPath?.startsWith('football-v1/'))).toBe(true);
    expect(footballSymbols.every((item) => item.assetPath !== item.revealAssetPath)).toBe(true);
    for (const item of footballSymbols) {
      const peers = footballSymbols.filter((candidate) => candidate.metadata.scope === item.metadata.scope && candidate.itemId !== item.itemId);
      expect(peers.length).toBeGreaterThanOrEqual(3);
      expect(item.metadata.distractorIds).toHaveLength(item.metadata.scope === 'confederation' ? 3 : 5);
      expect(item.metadata.distractorIds?.every((id) => peers.some((peer) => peer.itemId === id))).toBe(true);
      expect(item.metadata.editRecipe).toBeTruthy();
      expect(item.assetPath).toMatch(/^football-symbols-v2\/q-\d{2}\.svg$/);
      const asset = readFileSync(join(process.cwd(), 'supabase', 'content', item.assetPath));
      expect(createHash('sha256').update(asset).digest('hex')).toBe(item.sha256);
      expect(asset.toString('utf8')).not.toMatch(/<text\b|<title\b|<metadata\b/i);
    }
  });

  it('mixes balanced text-free club symbols from the four requested competitions into Football', () => {
    expect(footballClubOriginals).toHaveLength(88);
    expect(footballClubOriginals.every((item) => item.metadata.eligibleForQuestion === false)).toBe(true);
    expect(footballClubOriginals.every((item) => item.assetPath === item.revealAssetPath)).toBe(true);
    expect(footballMixed).toHaveLength(30);
    expect(footballMixed.filter((item) => item.metadata.scope !== 'club')).toHaveLength(10);
    expect(footballClubs).toHaveLength(20);
    expect(new Set(footballClubs.map((item) => item.itemId)).size).toBe(20);
    expect(new Set(footballClubs.map((item) => item.displayName)).size).toBe(20);
    expect(Object.fromEntries(
      ['premier-league', 'la-liga', 'mls', 'bundesliga'].map((competition) => [
        competition,
        footballClubs.filter((item) => item.metadata.competitionKey === competition).length,
      ]),
    )).toEqual({ 'premier-league': 5, 'la-liga': 5, mls: 5, bundesliga: 5 });
    expect(footballClubs.every((item) => item.rightsStatus === 'trademark_review_required')).toBe(true);
    expect(footballClubs.every((item) => item.assetPath !== item.revealAssetPath)).toBe(true);
    expect(footballClubs.every((item) => item.metadata.questionAssetRole === 'symbol_only_quiz_variant')).toBe(true);
    expect(footballClubs.every((item) => item.metadata.revealAssetRole === 'complete_official_club_crest')).toBe(true);
    for (const item of footballClubs) {
      const peers = footballClubs.filter((candidate) => candidate.metadata.competitionKey === item.metadata.competitionKey && candidate.itemId !== item.itemId);
      expect(peers).toHaveLength(4);
      expect(item.metadata.distractorIds).toHaveLength(4);
      expect(item.metadata.distractorIds?.every((id) => peers.some((peer) => peer.itemId === id))).toBe(true);
      expect(item.metadata.questionDescription).not.toContain(item.displayName);
      expect(item.metadata.editRecipe).toBeTruthy();
      const asset = readFileSync(join(process.cwd(), 'supabase', 'content', item.assetPath));
      if (item.assetPath.endsWith('.svg')) expect(asset.toString('utf8')).not.toMatch(/<text\b|<title\b|<metadata\b/i);
    }
  });

  it('records unique immutable assets and source provenance', () => {
    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.items).toHaveLength(532);
    expect(new Set(manifest.items.map((item) => item.assetPath)).size).toBe(462);
    expect(new Set(manifest.items.map((item) => item.sha256)).size).toBe(414);
    const shaByPath = new Map<string, string>();
    for (const item of manifest.items) {
      expect(item.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.sourcePageUrl).toMatch(/^https:\/\//);
      expect(item.sourceAssetUrl).toMatch(/^https:\/\//);
      expect(['public_domain_national_symbol', 'trademark_review_required', 'trademark_reviewed_approved']).toContain(item.rightsStatus);
      expect(shaByPath.get(item.assetPath) ?? item.sha256).toBe(item.sha256);
      shaByPath.set(item.assetPath, item.sha256);
    }
  });

  it('keeps the startup preload registry aligned with the hosted packs', () => {
    expect(flagAssetPaths).toHaveLength(195);
    expect(footballAssetPaths).toHaveLength(30);
    expect(footballRevealAssetPaths).toHaveLength(30);
    expect(baseballAssetPaths).toHaveLength(54);
    expect(basketballAssetPaths).toHaveLength(78);
    const questionPaths = [...flagAssetPaths, ...footballAssetPaths, ...baseballAssetPaths, ...basketballAssetPaths];
    expect(new Set(questionPaths).size).toBe(357);
    const activeVersions = new Set(['flags-195-v1', 'football-mixed-v3', 'baseball-global-v2', 'basketball-expanded-v2']);
    const activeItems = manifest.items.filter((item) => activeVersions.has(item.contentVersion));
    expect(questionPaths).toEqual(expect.arrayContaining(activeItems.map((item) => item.assetPath)));
    expect(footballRevealAssetPaths).toEqual(expect.arrayContaining(footballMixed.map((item) => item.revealAssetPath!)));
  });
});
