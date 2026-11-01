import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { celebrityNames, historyNames, peopleDisplayNames, personSearchOverrides } from './people-pack-data.mjs';

const root = path.resolve(import.meta.dirname, '..');
const contentRoot = path.join(root, 'supabase', 'content');
const stagingRoot = path.join(root, '.quiz-assets');
const sidecarPath = path.join(contentRoot, 'people-content.json');
const sourceCachePath = path.join(contentRoot, 'people-source-cache.json');
const migrationPath = path.join(root, 'supabase', 'migrations', '20261031211238_add_brands_history_celebrities.sql');
const userAgent = 'BloopIQ-content-build/1.0 (quiz content provenance)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value = '') => value.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
const sql = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;

async function fetchJson(url, tries = 8) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, 'Api-User-Agent': userAgent } });
  if ((response.status === 429 || response.status >= 500) && tries > 1) {
    await sleep(Math.min(8000, (9 - tries) * 1000));
    return fetchJson(url, tries - 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function mapLimit(values, limit, task) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      results[index] = await task(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

async function resolvePerson(name) {
  const query = personSearchOverrides.get(name) ?? name;
  const url = new URL('https://www.wikidata.org/w/api.php');
  Object.entries({ action: 'wbsearchentities', search: query, language: 'en', uselang: 'en', type: 'item', limit: '8', format: 'json', origin: '*' })
    .forEach(([key, value]) => url.searchParams.set(key, value));
  const data = await fetchJson(url);
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const exact = data.search.find((candidate) => candidate.label?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized);
  const human = data.search.find((candidate) => /actor|actress|filmmaker|person|king|queen|emperor|philosopher|scientist|politician|artist|writer|leader|ruler|monarch|singer|comedian/i.test(candidate.description ?? ''));
  const match = exact ?? human ?? data.search[0];
  if (!match) throw new Error(`No Wikidata result for ${name}`);
  return { name, wikidataId: match.id, wikidataLabel: match.label, wikidataDescription: match.description ?? '' };
}

async function resolvePeople(names) {
  let cache = {};
  try { cache = JSON.parse(await readFile(sourceCachePath, 'utf8')); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  return mapLimit(names, 1, async (name) => {
    if (cache[name]) return cache[name];
    await sleep(350);
    const title = personSearchOverrides.get(name) ?? name;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
    const summary = await fetchJson(url);
    const sourceUrl = summary.thumbnail?.source ?? summary.originalimage?.source;
    let resolvedSourceUrl = sourceUrl;
    let commonsTitle = '';
    if (!resolvedSourceUrl && summary.wikibase_item) {
      const entity = await fetchJson(`https://www.wikidata.org/wiki/Special:EntityData/${summary.wikibase_item}.json`);
      commonsTitle = entity.entities?.[summary.wikibase_item]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? '';
      if (commonsTitle) resolvedSourceUrl = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(commonsTitle)}?width=700`;
    }
    if (!summary.wikibase_item || !resolvedSourceUrl) return { name, wikidataId: summary.wikibase_item, wikidataLabel: summary.title, imageInfo: null };
    const cleanUrl = resolvedSourceUrl.replace(/\?.*$/, '');
    const marker = cleanUrl.includes('/thumb/') ? cleanUrl.split('/thumb/')[1]?.split('/').slice(2, -1).join('/') : cleanUrl.split('/commons/')[1]?.split('/').slice(2).join('/');
    commonsTitle ||= decodeURIComponent(marker ?? '').replaceAll('_', ' ');
    const result = {
      name, wikidataId: summary.wikibase_item, wikidataLabel: summary.title,
      wikidataDescription: summary.description ?? '', commonsTitle,
      imageInfo: {
        title: `File:${commonsTitle}`, thumburl: resolvedSourceUrl,
        descriptionurl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsTitle.replaceAll(' ', '_'))}`,
        extmetadata: {},
      },
    };
    cache[name] = result;
    await writeFile(sourceCachePath, `${JSON.stringify(cache, null, 2)}\n`);
    return result;
  });
}

async function entityImages(resolved) {
  const ids = resolved.map((entry) => entry.wikidataId);
  const byId = new Map();
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const url = new URL('https://www.wikidata.org/w/api.php');
    Object.entries({ action: 'wbgetentities', ids: batch.join('|'), props: 'claims', format: 'json', origin: '*' })
      .forEach(([key, value]) => url.searchParams.set(key, value));
    const data = await fetchJson(url);
    for (const [id, entity] of Object.entries(data.entities)) {
      byId.set(id, entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null);
    }
  }
  return resolved.map((entry) => ({ ...entry, commonsTitle: byId.get(entry.wikidataId) }));
}

async function commonsInfo(entries) {
  const withImages = entries.filter((entry) => entry.commonsTitle);
  const byTitle = new Map();
  for (let index = 0; index < withImages.length; index += 30) {
    const batch = withImages.slice(index, index + 30);
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    Object.entries({
      action: 'query', titles: batch.map((entry) => `File:${entry.commonsTitle}`).join('|'), prop: 'imageinfo',
      iiprop: 'url|mime|size|extmetadata', iiurlwidth: '900', format: 'json', origin: '*',
    }).forEach(([key, value]) => url.searchParams.set(key, value));
    const data = await fetchJson(url);
    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (info) byTitle.set(page.title.replace(/^File:/, '').replaceAll('_', ' '), { title: page.title, ...info });
    }
  }
  return entries.map((entry) => ({
    ...entry,
    imageInfo: entry.commonsTitle ? byTitle.get(entry.commonsTitle.replaceAll('_', ' ')) : null,
  }));
}

async function downloadPortrait(entry, categoryId, index) {
  if (!entry.imageInfo) throw new Error(`No Commons P18 image for ${entry.name} (${entry.wikidataId})`);
  const sourceUrl = entry.imageInfo.thumburl ?? entry.imageInfo.url;
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`${response.status} downloading portrait for ${entry.name}`);
  const input = Buffer.from(await response.arrayBuffer());
  const data = await sharp(input, { density: 180 })
    .rotate().resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#f7fbfc' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const version = categoryId === 'history' ? 'people-history-v1' : 'people-celebrities-v1';
  const filename = `q-${String(index + 1).padStart(3, '0')}.jpg`;
  const assetPath = `${version}/${filename}`;
  await mkdir(path.join(contentRoot, version), { recursive: true });
  await mkdir(path.join(stagingRoot, version), { recursive: true });
  await writeFile(path.join(contentRoot, assetPath), data);
  await writeFile(path.join(stagingRoot, assetPath), data);
  const metadata = entry.imageInfo.extmetadata ?? {};
  const license = clean(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || 'Wikimedia Commons license');
  const licenseUrl = metadata.LicenseUrl?.value || `https://commons.wikimedia.org/wiki/${encodeURIComponent(entry.imageInfo.title.replaceAll(' ', '_'))}`;
  const artist = clean(metadata.Artist?.value || metadata.Credit?.value || 'Wikimedia Commons contributor');
  const displayName = peopleDisplayNames.get(entry.name) ?? entry.name;
  const scope = categoryId === 'history' ? 'historical-person' : 'celebrity';
  return {
    categoryId, contentVersion: version, itemId: `${categoryId}-${String(index + 1).padStart(3, '0')}`,
    displayName, assetPath, revealAssetPath: assetPath,
    difficulty: index < Math.ceil((categoryId === 'history' ? historyNames.length : celebrityNames.length) / 3) ? 'easy' : index % 2 ? 'medium' : 'hard',
    sourcePageUrl: `https://www.wikidata.org/wiki/${entry.wikidataId}`,
    sourceAssetUrl: entry.imageInfo.descriptionurl,
    rightsStatus: 'wikimedia_commons_licensed',
    attribution: `${artist}; ${license}; ${licenseUrl}`,
    metadata: {
      scope, selectionGroup: scope, competitionKey: scope, wikidataId: entry.wikidataId,
      commonsFile: entry.imageInfo.title, license, licenseUrl, artist,
      distractorIds: null,
      questionPrompt: categoryId === 'history' ? 'Who is this historical figure?' : 'Who is this celebrity?',
      questionDescription: categoryId === 'history' ? 'Portrait artwork of a historical figure' : 'Photograph of a public figure',
    },
    sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, contentType: 'image/jpeg',
  };
}

async function buildPack(categoryId, names, resolved) {
  const missing = resolved.filter((entry) => !entry.imageInfo);
  if (missing.length) throw new Error(`Missing portraits: ${missing.map((entry) => `${entry.name} (${entry.wikidataId})`).join(', ')}`);
  return mapLimit(resolved, 5, (entry, index) => downloadPortrait(entry, categoryId, index));
}

function migrationRows(items) {
  return items.map((item) => `  (${[
    sql(item.categoryId), sql(item.contentVersion), sql(item.itemId), sql(item.displayName), sql(item.assetPath), sql(item.revealAssetPath),
    sql(item.sha256), sql(item.sourcePageUrl), sql(item.sourceAssetUrl), sql(item.rightsStatus), sql(item.attribution),
    sql(item.difficulty), `${sql(JSON.stringify(item.metadata))}::jsonb`,
  ].join(', ')})`).join(',\n');
}

async function main() {
  const allNames = [...historyNames, ...celebrityNames];
  const allResolved = await resolvePeople(allNames);
  const [history, celebrities] = await Promise.all([
    buildPack('history', historyNames, allResolved.slice(0, historyNames.length)),
    buildPack('celebrities', celebrityNames, allResolved.slice(historyNames.length)),
  ]);
  const items = [...history, ...celebrities];
  await writeFile(sidecarPath, `${JSON.stringify({ schemaVersion: 1, items }, null, 2)}\n`);
  const migration = await readFile(migrationPath, 'utf8');
  const start = '-- GENERATED_PEOPLE_CONTENT_START';
  const end = '-- GENERATED_PEOPLE_CONTENT_END';
  if (!migration.includes(start) || !migration.includes(end)) throw new Error('People migration markers are missing');
  const generated = `${start}\ninsert into private.quiz_content\n  (category_id, content_version, item_id, display_name, asset_path, reveal_asset_path, asset_sha256, source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)\nvalues\n${migrationRows(items)}\non conflict (content_version, item_id) do update set\n  display_name = excluded.display_name, asset_path = excluded.asset_path, reveal_asset_path = excluded.reveal_asset_path,\n  asset_sha256 = excluded.asset_sha256, source_page_url = excluded.source_page_url, source_asset_url = excluded.source_asset_url,\n  rights_status = excluded.rights_status, attribution = excluded.attribution, difficulty = excluded.difficulty, metadata = excluded.metadata;\n${end}`;
  await writeFile(migrationPath, migration.replace(new RegExp(`${start}[\\s\\S]*?${end}`), generated));
  console.log(JSON.stringify({ history: history.length, celebrities: celebrities.length, total: items.length }));
}

main().catch((error) => { console.error(error); process.exit(1); });
