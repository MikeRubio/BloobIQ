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
  metadata: { iso2?: string; scope?: string; league?: string; conference?: string; division?: string; aliases?: string[]; officialTeamId?: number; distractorIds?: string[]; questionAssetRole?: string; revealAssetRole?: string; editRecipe?: string };
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

  it('records unique immutable assets and source provenance', () => {
    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.items).toHaveLength(282);
    expect(new Set(manifest.items.map((item) => item.assetPath)).size).toBe(282);
    expect(new Set(manifest.items.map((item) => item.sha256)).size).toBe(282);
    for (const item of manifest.items) {
      expect(item.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(item.sourcePageUrl).toMatch(/^https:\/\//);
      expect(item.sourceAssetUrl).toMatch(/^https:\/\//);
      expect(['public_domain_national_symbol', 'trademark_review_required', 'trademark_reviewed_approved']).toContain(item.rightsStatus);
    }
  });

  it('keeps the startup preload registry aligned with the hosted packs', () => {
    expect(flagAssetPaths).toHaveLength(195);
    expect(footballAssetPaths).toHaveLength(10);
    expect(footballRevealAssetPaths).toHaveLength(10);
    expect(baseballAssetPaths).toHaveLength(30);
    expect(basketballAssetPaths).toHaveLength(30);
    const questionPaths = [...flagAssetPaths, ...footballAssetPaths, ...baseballAssetPaths, ...basketballAssetPaths];
    expect(new Set(questionPaths).size).toBe(265);
    const activeItems = manifest.items.filter((item) => item.contentVersion !== 'football-v1');
    expect(questionPaths).toEqual(expect.arrayContaining(activeItems.map((item) => item.assetPath)));
    expect(footballRevealAssetPaths).toEqual(expect.arrayContaining(footballSymbols.map((item) => item.revealAssetPath!)));
  });
});
