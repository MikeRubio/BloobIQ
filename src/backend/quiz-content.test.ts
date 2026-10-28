import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flagAssetPaths, footballAssetPaths } from '../content/hosted-assets';

type ManifestItem = {
  categoryId: 'flags' | 'football';
  contentVersion: string;
  itemId: string;
  displayName: string;
  assetPath: string;
  sha256: string;
  sourcePageUrl: string;
  sourceAssetUrl: string;
  rightsStatus: string;
  metadata: { iso2?: string; scope?: string };
};

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'supabase', 'content', 'quiz-content.json'), 'utf8')) as {
  schemaVersion: number;
  flagSourceCommit: string;
  flagPackageVersion: string;
  items: ManifestItem[];
};
const flags = manifest.items.filter((item) => item.categoryId === 'flags');
const football = manifest.items.filter((item) => item.categoryId === 'football');

describe('hosted quiz content manifest', () => {
  it('pins a complete 195-sovereign-state flag pack', () => {
    expect(manifest.flagPackageVersion).toBe('1.2.10');
    expect(manifest.flagSourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(flags).toHaveLength(195);
    expect(new Set(flags.map((item) => item.metadata.iso2)).size).toBe(195);
    expect(flags.map((item) => item.metadata.iso2)).toEqual(expect.arrayContaining(['PS', 'VA']));
    expect(flags.every((item) => item.contentVersion === 'flags-195-v1')).toBe(true);
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
    expect(manifest.items).toHaveLength(212);
    expect(new Set(manifest.items.map((item) => item.assetPath)).size).toBe(212);
    expect(new Set(manifest.items.map((item) => item.sha256)).size).toBe(212);
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
    expect(new Set([...flagAssetPaths, ...footballAssetPaths]).size).toBe(212);
    expect([...flagAssetPaths, ...footballAssetPaths]).toEqual(expect.arrayContaining(manifest.items.map((item) => item.assetPath)));
  });
});
