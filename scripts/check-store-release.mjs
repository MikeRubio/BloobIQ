import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const production = process.env.EAS_BUILD_PROFILE === 'production'
  || process.env.BLOOPIQ_ADS_ENV === 'production' || process.argv.includes('--force');
if (!production) {
  console.log('Public store-release checks skipped for internal QA.');
  process.exit(0);
}
const rights = spawnSync(process.execPath, ['scripts/check-release-content-rights.mjs', '--force'], { stdio: 'inherit' });
if (rights.status !== 0) process.exit(rights.status ?? 1);
const release = JSON.parse(readFileSync('config/store-release.json', 'utf8'));
if (release.audience !== 'all-ages-online' || release.allAgesOnlinePrivacyReady !== true) {
  console.error(`Public release blocked: ${release.reason}`);
  process.exit(1);
}
console.log('Public release checks passed. Signed archives, store forms, and device acceptance must still be verified.');
