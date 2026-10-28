import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { baseballTeams, basketballTeams, sameDivisionDistractors, teamDifficulty } from './team-logo-packs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const stagingRoot = path.join(root, '.quiz-assets');
const manifestPath = path.join(root, 'supabase', 'content', 'quiz-content.json');
const migrationsPath = path.join(root, 'supabase', 'migrations');
const flagCommit = 'c09927e63705529bbf59ca6684cd9b23225dddad';
const flagPackageVersion = '1.2.10';

const countryCodes = `
AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ
CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ
FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP
KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML
MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW
PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM
TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW
`.trim().split(/\s+/).map((code) => code.toLowerCase());

const easyFlags = new Set('ar au at be br ca ch cn de dk eg es fi fr gb gr ie il in it jp kr mx nl no nz pl pt ru sa se tr ua us za'.split(' '));
const hardFlags = new Set('ad ag bb bz bt cv dm fj fm gd gw ki km kn lc li mh mc nr pw sm sb st sc sr sz tl to tv va vc vu ws'.split(' '));
const countryNameOverrides = {
  BO: 'Bolivia', CD: 'Democratic Republic of the Congo', CG: 'Republic of the Congo',
  CN: 'China', CV: 'Cabo Verde', CZ: 'Czechia', FM: 'Micronesia', IR: 'Iran',
  KP: 'North Korea', KR: 'South Korea', LA: 'Laos', MD: 'Moldova',
  SY: 'Syria', SZ: 'Eswatini', TR: 'Türkiye', TZ: 'Tanzania',
  VA: 'Vatican City', VE: 'Venezuela',
};

const footballItems = [
  ['uefa', 'UEFA', 'confederation', 'easy', 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9d/UEFA_full_logo.svg/330px-UEFA_full_logo.svg.png', 'https://en.wikipedia.org/wiki/UEFA'],
  ['caf', 'CAF', 'confederation', 'medium', 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/72/Confederation_of_African_Football_logo.svg/330px-Confederation_of_African_Football_logo.svg.png', 'https://en.wikipedia.org/wiki/Confederation_of_African_Football'],
  ['afc', 'AFC', 'confederation', 'medium', 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/28/Asian_Football_Confederation_logo_2025.svg/500px-Asian_Football_Confederation_logo_2025.svg.png', 'https://en.wikipedia.org/wiki/Asian_Football_Confederation'],
  ['concacaf', 'CONCACAF', 'confederation', 'medium', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Concacaf_logo.svg/500px-Concacaf_logo.svg.png', 'https://en.wikipedia.org/wiki/CONCACAF'],
  ['conmebol', 'CONMEBOL', 'confederation', 'medium', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a8/CONMEBOL_logo_%282017%29.svg/500px-CONMEBOL_logo_%282017%29.svg.png', 'https://en.wikipedia.org/wiki/CONMEBOL'],
  ['ofc', 'OFC', 'confederation', 'hard', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Oceania_Football_Confederation_logo.svg/500px-Oceania_Football_Confederation_logo.svg.png', 'https://en.wikipedia.org/wiki/Oceania_Football_Confederation'],
  ['premier-league', 'English Premier League', 'league', 'easy', 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/500px-Premier_League_Logo.svg.png', 'https://en.wikipedia.org/wiki/Premier_League'],
  ['la-liga', 'La Liga', 'league', 'easy', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/500px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png', 'https://en.wikipedia.org/wiki/La_Liga'],
  ['bundesliga', 'Bundesliga', 'league', 'easy', 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/500px-Bundesliga_logo_%282017%29.svg.png', 'https://en.wikipedia.org/wiki/Bundesliga'],
  ['serie-a', 'Serie A', 'league', 'easy', 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/ab/Serie_A_ENILIVE_logo.svg/500px-Serie_A_ENILIVE_logo.svg.png', 'https://en.wikipedia.org/wiki/Serie_A'],
  ['ligue-1', 'Ligue 1', 'league', 'easy', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Logo_Ligue_1_McDonald%27s_2024.svg/500px-Logo_Ligue_1_McDonald%27s_2024.svg.png', 'https://en.wikipedia.org/wiki/Ligue_1'],
  ['major-league-soccer', 'Major League Soccer', 'league', 'medium', 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c7/Major_League_Soccer_logo.svg/500px-Major_League_Soccer_logo.svg.png', 'https://en.wikipedia.org/wiki/Major_League_Soccer'],
  ['liga-mx', 'Liga MX', 'league', 'medium', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Liga_MX_logo.svg/500px-Liga_MX_logo.svg.png', 'https://en.wikipedia.org/wiki/Liga_MX'],
  ['brasileirao-serie-a', 'Brasileirão Série A', 'league', 'medium', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg/500px-Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg.png', 'https://en.wikipedia.org/wiki/Campeonato_Brasileiro_S%C3%A9rie_A'],
  ['j1-league', 'J1 League', 'league', 'hard', 'https://www.antlers.co.jp/cdn/shop/articles/pickup_j1_rogo_5b23f6dc-d23b-4e17-bb11-ef5ab1102c24.jpg?v=1781657246&width=1200', 'https://www.antlers.co.jp/blogs/news/260616v8d97u'],
  ['k-league-1', 'K League 1', 'league', 'hard', 'https://pub-3bd35431294c47068cbf31a95d572166.r2.dev/logos/k-league-1-south-korea/k-league-1-south-korea-logo-footylogos.png', 'https://www.kleague.com/about/ci.do'],
  ['saudi-pro-league', 'Saudi Pro League', 'league', 'medium', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Saudi_Pro_League_Logo.svg/500px-Saudi_Pro_League_Logo.svg.png', 'https://commons.wikimedia.org/wiki/File:Saudi_Pro_League_Logo.svg'],
];
const reviewedFootballSlugs = new Set([
  'uefa', 'caf', 'afc', 'concacaf', 'conmebol', 'ofc', 'premier-league',
  'la-liga', 'bundesliga', 'serie-a', 'ligue-1', 'major-league-soccer',
  'liga-mx', 'brasileirao-serie-a', 'j1-league', 'k-league-1', 'saudi-pro-league',
]);

function sql(value) {
  if (value === null) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function download(url, destination) {
  const response = await fetch(url, { headers: { 'User-Agent': 'BloopIQ-content-build/1.0' } });
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Expected image from ${url}, received ${contentType}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length === 0 || data.length > 2_000_000) throw new Error(`Unexpected asset size ${data.length} for ${url}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, data);
  return { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, contentType };
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

async function main() {
  if (countryCodes.length !== 195 || new Set(countryCodes).size !== 195) throw new Error(`Expected 195 unique country codes, received ${countryCodes.length}`);
  const namesResponse = await fetch(`https://raw.githubusercontent.com/hampusborgos/country-flags/${flagCommit}/countries.json`);
  if (!namesResponse.ok) throw new Error(`Could not load pinned country names: ${namesResponse.status}`);
  const names = await namesResponse.json();

  const flags = await mapLimit(countryCodes, 12, async (code) => {
    const displayName = countryNameOverrides[code.toUpperCase()] ?? names[code.toUpperCase()];
    if (!displayName) throw new Error(`Missing country name for ${code}`);
    const sourceAssetUrl = `https://unpkg.com/svg-country-flags@${flagPackageVersion}/png250px/${code}.png`;
    const assetPath = `flags-195-v1/${code}.png`;
    const file = await download(sourceAssetUrl, path.join(stagingRoot, assetPath));
    return {
      categoryId: 'flags', contentVersion: 'flags-195-v1', itemId: `flag-${code}`,
      displayName, assetPath, difficulty: easyFlags.has(code) ? 'easy' : hardFlags.has(code) ? 'hard' : 'medium',
      sourcePageUrl: 'https://github.com/hampusborgos/country-flags', sourceAssetUrl,
      rightsStatus: 'public_domain_national_symbol', attribution: `hampusborgos/country-flags ${flagPackageVersion} (PD)`,
      metadata: { iso2: code.toUpperCase(), sourceCommit: flagCommit }, ...file,
    };
  });

  const football = await mapLimit(footballItems, 4, async ([slug, displayName, scope, difficulty, sourceAssetUrl, sourcePageUrl]) => {
    const extension = sourceAssetUrl.toLowerCase().includes('.jpg') ? 'jpg' : 'png';
    const assetPath = `football-v1/${slug}.${extension}`;
    const file = await download(sourceAssetUrl, path.join(stagingRoot, assetPath));
    return {
      categoryId: 'football', contentVersion: 'football-v1', itemId: `football-${slug}`,
      displayName, assetPath, difficulty, sourcePageUrl, sourceAssetUrl,
      rightsStatus: reviewedFootballSlugs.has(slug) ? 'trademark_reviewed_approved' : 'trademark_review_required',
      attribution: reviewedFootballSlugs.has(slug)
        ? 'Trademark use reviewed and approved by project owner for pre-production quiz use (2026-10-28)'
        : 'Official identity; source page recorded for editorial quiz use',
      metadata: { scope }, ...file,
    };
  });

  if (baseballTeams.length !== 30 || new Set(baseballTeams.map((team) => team[0])).size !== 30) {
    throw new Error(`Expected 30 unique MLB teams, received ${baseballTeams.length}`);
  }
  const mlbResponse = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&hydrate=division');
  if (!mlbResponse.ok) throw new Error(`Could not verify current MLB teams: ${mlbResponse.status}`);
  const mlbOfficial = await mlbResponse.json();
  const mlbById = new Map(mlbOfficial.teams.map((team) => [team.id, team]));
  for (const [, officialId, displayName, , division] of baseballTeams) {
    const official = mlbById.get(officialId);
    if (!official || official.name !== displayName || official.division?.name !== division) {
      throw new Error(`MLB verification mismatch for ${displayName}`);
    }
  }

  const nbaResponse = await fetch('https://www.nba.com/teams', { headers: { 'User-Agent': 'BloopIQ-content-build/1.0' } });
  if (!nbaResponse.ok) throw new Error(`Could not verify current NBA teams: ${nbaResponse.status}`);
  const nbaOfficialPage = await nbaResponse.text();
  if (basketballTeams.length !== 30 || new Set(basketballTeams.map((team) => team[0])).size !== 30) {
    throw new Error(`Expected 30 unique NBA teams, received ${basketballTeams.length}`);
  }
  for (const [, officialId, displayName] of basketballTeams) {
    const officialPair = `https://cdn.nba.com/logos/nba/${officialId}/primary/L/logo.svg\" title=\"${displayName} Logo`;
    if (!nbaOfficialPage.includes(officialPair)) {
      throw new Error(`NBA verification mismatch for ${displayName}`);
    }
  }

  const baseball = await mapLimit(baseballTeams, 6, async ([slug, officialId, displayName, conference, division, aliases], index) => {
    const sourceAssetUrl = `https://www.mlbstatic.com/team-logos/${officialId}.svg`;
    const assetPath = `baseball-mlb-v1/${slug}.svg`;
    const file = await download(sourceAssetUrl, path.join(stagingRoot, assetPath));
    return {
      categoryId: 'baseball', contentVersion: 'baseball-mlb-v1', itemId: `baseball-${slug}`,
      displayName, assetPath, difficulty: teamDifficulty(index), sourcePageUrl: 'https://www.mlb.com/team', sourceAssetUrl,
      rightsStatus: 'trademark_review_required',
      attribution: 'Official MLB team identity; trademark review required before production release',
      metadata: {
        aliases, league: 'MLB', conference, division, scope: division, officialTeamId: officialId,
        distractorIds: sameDivisionDistractors(baseballTeams, slug, division, 'baseball'),
      },
      ...file,
    };
  });

  const basketball = await mapLimit(basketballTeams, 6, async ([slug, officialId, displayName, conference, division, aliases], index) => {
    const sourceAssetUrl = `https://cdn.nba.com/logos/nba/${officialId}/primary/L/logo.svg`;
    const assetPath = `basketball-nba-v1/${slug}.svg`;
    const file = await download(sourceAssetUrl, path.join(stagingRoot, assetPath));
    return {
      categoryId: 'basketball', contentVersion: 'basketball-nba-v1', itemId: `basketball-${slug}`,
      displayName, assetPath, difficulty: teamDifficulty(index), sourcePageUrl: 'https://www.nba.com/teams', sourceAssetUrl,
      rightsStatus: 'trademark_review_required',
      attribution: 'Official NBA team identity; trademark review required before production release',
      metadata: {
        aliases, league: 'NBA', conference, division, scope: division, officialTeamId: officialId,
        distractorIds: sameDivisionDistractors(basketballTeams, slug, division, 'basketball'),
      },
      ...file,
    };
  });

  const items = [...flags, ...football, ...baseball, ...basketball];
  try {
    const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
    const previousByKey = new Map(previous.items.map((item) => [`${item.contentVersion}:${item.itemId}`, item]));
    for (const item of items) {
      const existing = previousByKey.get(`${item.contentVersion}:${item.itemId}`);
      if (!existing) continue;
      const stableFields = ['categoryId', 'contentVersion', 'itemId', 'displayName', 'assetPath', 'sha256', 'sourcePageUrl', 'sourceAssetUrl', 'rightsStatus', 'attribution', 'difficulty', 'metadata'];
      if (stableFields.some((field) => JSON.stringify(existing[field]) !== JSON.stringify(item[field]))) {
        throw new Error(`Immutable content drift detected for ${item.contentVersion}:${item.itemId}; create a new content version instead`);
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ schemaVersion: 1, flagSourceCommit: flagCommit, flagPackageVersion, items }, null, 2)}\n`);

  const migrationName = (await readdir(migrationsPath)).find((name) => name.endsWith('_add_baseball_basketball_quizzes.sql'));
  if (!migrationName) throw new Error('Content catalog migration is missing');
  const migrationPath = path.join(migrationsPath, migrationName);
  const migration = await readFile(migrationPath, 'utf8');
  const start = '-- GENERATED_CONTENT_START';
  const end = '-- GENERATED_CONTENT_END';
  if (!migration.includes(start) || !migration.includes(end)) throw new Error('Migration content markers are missing');
  const rows = [...baseball, ...basketball].map((item) => `  (${[
    sql(item.categoryId), sql(item.contentVersion), sql(item.itemId), sql(item.displayName), sql(item.assetPath),
    sql(item.sha256), sql(item.sourcePageUrl), sql(item.sourceAssetUrl), sql(item.rightsStatus), sql(item.attribution),
    sql(item.difficulty), `${sql(JSON.stringify(item.metadata))}::jsonb`,
  ].join(', ')})`).join(',\n');
  const generated = `${start}\ninsert into private.quiz_content\n  (category_id, content_version, item_id, display_name, asset_path, asset_sha256, source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)\nvalues\n${rows}\non conflict (content_version, item_id) do update set\n  display_name = excluded.display_name, asset_path = excluded.asset_path, asset_sha256 = excluded.asset_sha256,\n  source_page_url = excluded.source_page_url, source_asset_url = excluded.source_asset_url,\n  rights_status = excluded.rights_status, attribution = excluded.attribution, difficulty = excluded.difficulty, metadata = excluded.metadata;\n${end}`;
  await writeFile(migrationPath, migration.replace(new RegExp(`${start}[\\s\\S]*?${end}`), generated));
  console.log(JSON.stringify({
    flags: flags.length, football: football.length, baseball: baseball.length, basketball: basketball.length,
    total: items.length, bytes: items.reduce((sum, item) => sum + item.bytes, 0), migration: migrationName,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
