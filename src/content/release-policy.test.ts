import { afterEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('flags-only store release', () => {
  it('hides uncleared quizzes from browsing, all modes, deep links, and saved quick play', async () => {
    vi.stubEnv('EXPO_PUBLIC_RELEASE_CATALOG', 'flags-only');
    vi.resetModules();
    const catalog = await import('./quiz-catalog');
    const { normalizeQuizCategory } = await import('../backend/categories');
    expect(catalog.browseGroups.map((group) => group.id)).toEqual(['flags']);
    for (const mode of ['casual', 'daily', 'friends'] as const) {
      expect(catalog.quizzesForMode(mode).map((quiz) => quiz.id)).toEqual(['flags']);
    }
    for (const id of ['football', 'baseball', 'basketball', 'brands', 'history', 'celebrities'] as const) {
      expect(catalog.getQuiz(id).id).toBe('flags');
      expect(catalog.supportsMode(id, 'casual')).toBe(false);
      expect(catalog.quickPlayQuiz(id).id).toBe('flags');
      expect(normalizeQuizCategory(id)).toBe('flags');
    }
    expect(catalog.quizzesForGroup('sports')).toEqual([]);
    expect(catalog.browsePath('sports')).toEqual(catalog.quizPath('flags'));
  });

  it('does not warm non-flag artwork at startup or for an old Friends room', async () => {
    vi.stubEnv('EXPO_PUBLIC_RELEASE_CATALOG', 'flags-only');
    vi.resetModules();
    const { startupQuizAssetPaths, friendQuizAssetPaths } = await import('./startup-assets');
    const { flagAssetPaths } = await import('./hosted-assets');
    expect(startupQuizAssetPaths()).toEqual(flagAssetPaths.slice(0, 4));
    expect(friendQuizAssetPaths('flags')).toEqual(flagAssetPaths.slice(0, 12));
    expect(() => friendQuizAssetPaths('celebrities')).toThrow('not available');
  });

  it('permits cleared flags but still blocks the full catalogue instead of relabelling rights', () => {
    const run = (mode: string) => spawnSync(process.execPath, ['scripts/check-release-content-rights.mjs', '--force'], {
      cwd: process.cwd(), env: { ...process.env, EXPO_PUBLIC_RELEASE_CATALOG: mode }, encoding: 'utf8',
    });
    expect(run('flags-only').status).toBe(0);
    const full = run('full');
    expect(full.status).toBe(1);
    expect(full.stderr).toContain('601 catalog entries are not cleared');
    expect(run('invalid').status).not.toBe(0);
  });

  it('keeps public release blocked until the chosen all-ages online privacy flow is ready', () => {
    const result = spawnSync(process.execPath, ['scripts/check-store-release.mjs', '--force'], {
      cwd: process.cwd(), env: { ...process.env, EXPO_PUBLIC_RELEASE_CATALOG: 'flags-only' }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('195 flags-only');
    expect(result.stderr).toContain('Public release blocked');
    expect(result.stderr).toContain('parental-consent');
    const inherited = spawnSync(process.execPath, ['scripts/check-store-release.mjs'], {
      cwd: process.cwd(), env: { ...process.env, EAS_BUILD_PROFILE: 'custom-release', BLOOPIQ_ADS_ENV: 'production', EXPO_PUBLIC_RELEASE_CATALOG: 'flags-only' }, encoding: 'utf8',
    });
    expect(inherited.status).toBe(1);
    expect(inherited.stderr).toContain('Public release blocked');
  });
});
