import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const isProduction = process.env.EAS_BUILD_PROFILE === 'production' || process.argv.includes('--force');
if (!isProduction) {
  console.log('Content-rights release gate skipped outside the production build profile.');
  process.exit(0);
}

const catalog = JSON.parse(readFileSync(resolve('supabase/content/quiz-content.json'), 'utf8'));
const items = Array.isArray(catalog.items) ? catalog.items : [];
const allowedStatuses = new Set(['public_domain_national_symbol', 'production_cleared']);
const genericAttribution = /wikimedia commons (contributor|license)/i;
const blocked = items.filter((item) =>
  !allowedStatuses.has(item.rightsStatus) || genericAttribution.test(item.attribution ?? ''),
);

if (blocked.length) {
  const counts = blocked.reduce((result, item) => {
    const key = item.rightsStatus ?? 'missing_rights_status';
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  console.error(`Production content-rights gate failed: ${blocked.length} catalog entries are not cleared.`);
  for (const [status, count] of Object.entries(counts)) console.error(`- ${status}: ${count}`);
  console.error('Replace/remove these entries or mark individually verified assets as production_cleared with accurate attribution and license metadata.');
  process.exit(1);
}

console.log(`Production content-rights gate passed for ${items.length} catalog entries.`);
