import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { baseballTeams, basketballTeams, sameDivisionDistractors, teamDifficulty } from './team-logo-packs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const stagingRoot = path.join(root, '.quiz-assets');
const manifestPath = path.join(root, 'supabase', 'content', 'quiz-content.json');
const footballVariantRoot = path.join(root, 'supabase', 'content', 'football-symbols-v2');
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

const footballQuestionVariants = [
  { slug: 'uefa', opaqueName: 'q-01.svg', viewBox: '74 74 161 161', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9d/UEFA_full_logo.svg', removeLastPaths: 2, edit: 'Remove both outlined UEFA lettering paths and crop to the central striped globe.' },
  { slug: 'caf', opaqueName: 'q-02.svg', viewBox: '0 0 566 430', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/7/72/Confederation_of_African_Football_logo.svg', removeLastPaths: 4, edit: 'Remove the final four outlined CAF and registration-mark paths, then crop to the globe-and-continent crest.' },
  { slug: 'concacaf', opaqueName: 'q-03.svg', viewBox: '0 0 1042 650', vectorUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Concacaf_logo.svg', removeGroupIds: ['type'], edit: 'Remove the outlined wordmark group and retain the official gold radial symbol.' },
  { slug: 'conmebol', opaqueName: 'q-04.svg', viewBox: '25 0 135 120', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a8/CONMEBOL_logo_%282017%29.svg', edit: 'Crop to the shield-and-continent crest above the outlined CONMEBOL wordmark.' },
  { slug: 'premier-league', opaqueName: 'q-05.svg', viewBox: '0 0 75 86.213023', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg', edit: 'Crop to the crowned lion symbol left of the outlined Premier League wordmark.' },
  { slug: 'la-liga', opaqueName: 'q-06.svg', viewBox: '90 0 250 220', vectorUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg', edit: 'Crop to the red geometric competition symbol above the outlined LaLiga and sponsor wordmarks.' },
  { slug: 'bundesliga', opaqueName: 'q-07.svg', viewBox: '0 0 75 63', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg', removeLastPaths: 1, edit: 'Remove the final outlined BUNDESLIGA lettering path and retain the red player-and-ball panel.' },
  { slug: 'major-league-soccer', opaqueName: 'q-08.svg', viewBox: '0 0 100.77289 106.48469', vectorUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Major_League_Soccer_logo.svg', removeIds: ['path11', 'path13', 'path14', 'path15'], edit: 'Remove the outlined MLS acronym and trademark paths while preserving the official shield, slash, and stars.' },
  { slug: 'brasileirao-serie-a', opaqueName: 'q-09.svg', viewBox: '0 0 98.453751 100', vectorUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg', edit: 'Crop to the trophy-and-ball symbol above the outlined Brasileirão and sponsor wordmarks.' },
  { slug: 'saudi-pro-league', opaqueName: 'q-10.svg', rasterFilter: true, edit: 'Use the original raster artwork and deterministically make black lettering transparent, preserving the multicolor league symbol.' },
];

function sql(value) {
  if (value === null) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function fetchImage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'BloopIQ-content-build/1.0' } });
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Expected image from ${url}, received ${contentType}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length === 0 || data.length > 2_000_000) throw new Error(`Unexpected asset size ${data.length} for ${url}`);
  return { data, contentType };
}

function fileMetadata(data, contentType) {
  return { sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, contentType };
}

async function download(url, destination) {
  const { data, contentType } = await fetchImage(url);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, data);
  return fileMetadata(data, contentType);
}

function croppedSvg(source, viewBox, { removeGroupIds = [], removeIds = [], removeLastPaths = 0 } = {}) {
  const open = source.match(/<svg\b[\s\S]*?>/i)?.[0];
  if (!open) throw new Error('Question variant source is not an SVG.');
  let replacement = open
    .replace(/\s(?:width|height)=("[^"]*"|'[^']*')/gi, '')
    .replace(/\sviewBox=("[^"]*"|'[^']*')/i, '');
  replacement = replacement.replace(/>$/, ` width="100%" height="100%" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" overflow="hidden">`);
  let result = source
    .replace(open, replacement)
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/gi, '')
    .replace(/sodipodi:docname=("[^"]*"|'[^']*')/gi, '');
  for (const id of removeIds) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`<[^>]+\\bid=(?:"${escaped}"|'${escaped}')[^>]*/>`, 'gi'), '');
  }
  for (const id of removeGroupIds) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`<g\\b[^>]*\\bid=(?:"${escaped}"|'${escaped}')[^>]*>[\\s\\S]*?<\\/g>`, 'gi'), '');
  }
  if (removeLastPaths) {
    const paths = [...result.matchAll(/<path\b[\s\S]*?\/>/gi)];
    for (const match of paths.slice(-removeLastPaths).reverse()) {
      result = `${result.slice(0, match.index)}${result.slice((match.index ?? 0) + match[0].length)}`;
    }
  }
  return result;
}

function pngDimensions(data) {
  const pngSignature = '89504e470d0a1a0a';
  if (data.subarray(0, 8).toString('hex') !== pngSignature) throw new Error('Expected PNG artwork for raster question variant.');
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function blackTransparentSvg(data, contentType) {
  const { width, height } = pngDimensions(data);
  const encoded = data.toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"><defs><filter id="remove-black" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 1 1 1 0 0"/></filter></defs><image width="${width}" height="${height}" href="data:${contentType};base64,${encoded}" filter="url(#remove-black)"/></svg>\n`;
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

  const footballBySlug = new Map(football.map((item) => [item.itemId.replace('football-', ''), item]));
  const footballSymbols = await mapLimit(footballQuestionVariants, 3, async (variant) => {
    const original = footballBySlug.get(variant.slug);
    if (!original) throw new Error(`Missing original Football identity for ${variant.slug}`);
    let svg;
    let questionSourceAssetUrl;
    if (variant.rasterFilter) {
      const raster = await fetchImage(original.sourceAssetUrl);
      svg = blackTransparentSvg(raster.data, raster.contentType);
      questionSourceAssetUrl = original.sourceAssetUrl;
    } else {
      const vector = await fetchImage(variant.vectorUrl);
      if (vector.contentType !== 'image/svg+xml') throw new Error(`Expected SVG source for ${variant.slug}`);
      svg = croppedSvg(vector.data.toString('utf8'), variant.viewBox, variant);
      questionSourceAssetUrl = variant.vectorUrl;
    }
    const data = Buffer.from(svg);
    const assetPath = `football-symbols-v2/${variant.opaqueName}`;
    await mkdir(footballVariantRoot, { recursive: true });
    await mkdir(path.join(stagingRoot, 'football-symbols-v2'), { recursive: true });
    await writeFile(path.join(footballVariantRoot, variant.opaqueName), data);
    await writeFile(path.join(stagingRoot, assetPath), data);
    const sameScope = footballQuestionVariants
      .filter((candidate) => candidate.slug !== variant.slug && footballBySlug.get(candidate.slug)?.metadata.scope === original.metadata.scope)
      .map((candidate) => `football-${candidate.slug}`);
    return {
      categoryId: 'football', contentVersion: 'football-symbols-v2', itemId: original.itemId,
      displayName: original.displayName, assetPath, revealAssetPath: original.assetPath,
      difficulty: original.difficulty, sourcePageUrl: original.sourcePageUrl, sourceAssetUrl: original.sourceAssetUrl,
      questionSourceAssetUrl, rightsStatus: original.rightsStatus, attribution: original.attribution,
      metadata: {
        scope: original.metadata.scope,
        distractorIds: sameScope,
        questionAssetRole: 'symbol_only_quiz_variant',
        revealAssetRole: 'complete_original_identity',
        editRecipe: variant.edit,
      },
      revealSha256: original.sha256,
      ...fileMetadata(data, 'image/svg+xml'),
    };
  });
  const expectedQuestionFiles = new Set(footballQuestionVariants.map((variant) => variant.opaqueName));
  for (const directory of [footballVariantRoot, path.join(stagingRoot, 'football-symbols-v2')]) {
    for (const name of await readdir(directory)) {
      if (name.endsWith('.svg') && !expectedQuestionFiles.has(name)) await unlink(path.join(directory, name));
    }
  }

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

  const items = [...flags, ...football, ...footballSymbols, ...baseball, ...basketball];
  try {
    const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
    const previousByKey = new Map(previous.items.map((item) => [`${item.contentVersion}:${item.itemId}`, item]));
    for (const item of items) {
      const existing = previousByKey.get(`${item.contentVersion}:${item.itemId}`);
      if (!existing) continue;
      const stableFields = ['categoryId', 'contentVersion', 'itemId', 'displayName', 'assetPath', 'revealAssetPath', 'sha256', 'revealSha256', 'sourcePageUrl', 'sourceAssetUrl', 'questionSourceAssetUrl', 'rightsStatus', 'attribution', 'difficulty', 'metadata'];
      if (stableFields.some((field) => JSON.stringify(existing[field]) !== JSON.stringify(item[field]))) {
        throw new Error(`Immutable content drift detected for ${item.contentVersion}:${item.itemId}; create a new content version instead`);
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ schemaVersion: 2, flagSourceCommit: flagCommit, flagPackageVersion, items }, null, 2)}\n`);

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
    flags: flags.length, footballOriginals: football.length, footballSymbols: footballSymbols.length, baseball: baseball.length, basketball: basketball.length,
    total: items.length, bytes: items.reduce((sum, item) => sum + item.bytes, 0), migration: migrationName,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
