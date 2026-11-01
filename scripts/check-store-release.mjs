import { existsSync, readFileSync } from 'node:fs';
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
if (release.parentalConsentMethod !== 'reviewed-signed-form' || release.parentNoticeVersion !== '2026-11-01-v1' || release.productionAdsEnabled !== false) {
  throw new Error('The parental notice/method and disabled-advertising release configuration must be reviewed together.');
}
for (const file of ['src/components/online-access-gate.tsx', 'src/backend/online-access.ts', 'supabase/functions/parent-consent/index.ts', 'docs/PARENTAL_CONSENT.md', 'supabase/tests/database/bloopiq_parental_consent.test.sql']) {
  if (!existsSync(file)) throw new Error(`Required parental-consent release file missing: ${file}`);
}
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
if (eas.build.production.env.BLOOPIQ_ENABLE_PRODUCTION_ADS !== 'false') throw new Error('This release requires production advertising to remain disabled.');
console.log('Public release checks passed. Signed archives, store forms, and device acceptance must still be verified.');
