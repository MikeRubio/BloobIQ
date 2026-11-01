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
if (release.audience !== 'general-audience' || release.ageGateRequired !== false) {
  console.error(`Public release blocked: ${release.reason}`);
  process.exit(1);
}
if (release.advertisingTreatment !== 'child-safe-non-personalized') {
  throw new Error('Production advertising must keep the conservative child-safe, non-personalized treatment.');
}
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
const adsEnabled = eas.build.production.env.BLOOPIQ_ENABLE_PRODUCTION_ADS === 'true';
if (adsEnabled !== release.productionAdsEnabled) {
  throw new Error('The production ad setting must match config/store-release.json.');
}
const nativeAds = readFileSync('src/services/mobile-ads-adapter.native.ts', 'utf8');
for (const safeguard of [
  'MaxAdContentRating.G',
  'tagForChildDirectedTreatment: true',
  'tagForUnderAgeOfConsent: true',
  'requestNonPersonalizedAdsOnly: true',
]) {
  if (!nativeAds.includes(safeguard)) throw new Error(`Missing advertising safeguard: ${safeguard}`);
}
console.log('Public release checks passed. Signed archives, store forms, and device acceptance must still be verified.');
