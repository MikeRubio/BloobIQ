import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const contentRoot = path.join(root, 'supabase', 'content');
const stagingRoot = path.join(root, '.quiz-assets');
const migrationPath = path.join(root, 'supabase', 'migrations', '20261031211238_add_brands_history_celebrities.sql');
const sidecarPath = path.join(contentRoot, 'brand-content.json');
const userAgent = 'BloopIQ-content-build/1.0 (quiz content provenance)';

const simple = (displayName, scope, slug, crop) => ({ displayName, scope, slug, crop });
const brands = [
  simple('Tesla', 'american-car', 'tesla'), simple('Chevrolet', 'american-car', 'chevrolet'),
  simple('Cadillac', 'american-car', 'cadillac'), simple('Ram Trucks', 'american-car', 'ram', { left: 0, top: 0, width: 512, height: 390 }),
  simple('Audi', 'european-car', 'audi'), simple('Ferrari', 'european-car', 'ferrari'),
  simple('Lamborghini', 'european-car', 'lamborghini'), simple('Renault', 'european-car', 'renault'),
  simple('Citroën', 'european-car', 'citroen'), simple('Škoda', 'european-car', 'skoda'),
  simple('Maserati', 'european-car', 'maserati'), simple('Polestar', 'european-car', 'polestar'),
  simple("McDonald's", 'food', 'mcdonalds'), simple('Starbucks', 'food', 'starbucks'),
  simple('Taco Bell', 'food', 'tacobell'), simple('Red Bull', 'food', 'redbull'),
  simple('Monster Energy', 'food', 'monster'), simple('Deliveroo', 'food', 'deliveroo'),
  { displayName: 'Breitling', scope: 'watch', file: 'Logo_Breitling_2018_1884_P.png', thumb: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Logo_Breitling_2018_1884_P.png/500px-Logo_Breitling_2018_1884_P.png', crop: { left: 185, top: 0, width: 130, height: 90 } },
  { displayName: 'Hublot', scope: 'watch', file: 'Hublot-logo.svg', thumb: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Hublot-logo.svg/500px-Hublot-logo.svg.png', crop: { left: 175, top: 0, width: 150, height: 115 } },
  { displayName: 'Swatch', scope: 'watch', file: 'Swatch_Logo_RGB.svg', thumb: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Swatch_Logo_RGB.svg/500px-Swatch_Logo_RGB.svg.png', crop: { left: 430, top: 0, width: 70, height: 83 } },
  { displayName: 'Tissot', scope: 'watch', file: 'Tissot_Logo.svg', thumb: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Tissot_Logo.svg/500px-Tissot_Logo.svg.png', crop: { left: 170, top: 0, width: 165, height: 75 } },
];

const prompts = {
  'american-car': 'Which American car brand uses this symbol?',
  'european-car': 'Which European car brand uses this symbol?',
  watch: 'Which watchmaker uses this symbol?',
  food: 'Which food or drink brand uses this symbol?',
};

const sql = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const hash = (data) => createHash('sha256').update(data).digest('hex');

async function fetchBuffer(url) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function framedPng(input, crop, normalizeSquare = false) {
  let pipeline = sharp(input, { density: 220 }).flatten({ background: '#ffffff' });
  if (normalizeSquare && crop) {
    const normalized = await pipeline.resize({ width: 512, height: 512, fit: 'contain', background: '#ffffff' }).png().toBuffer();
    pipeline = sharp(normalized);
  }
  if (crop) pipeline = pipeline.extract(crop);
  const symbol = await pipeline.resize({ width: 500, height: 350, fit: 'contain', background: '#ffffff' }).png().toBuffer();
  return sharp({ create: { width: 640, height: 480, channels: 3, background: '#ffffff' } })
    .composite([{ input: symbol, left: 70, top: 65 }]).png({ compressionLevel: 9 }).toBuffer();
}

async function writeAsset(assetPath, data) {
  for (const base of [contentRoot, stagingRoot]) {
    await mkdir(path.dirname(path.join(base, assetPath)), { recursive: true });
    await writeFile(path.join(base, assetPath), data);
  }
}

async function main() {
  const idsByScope = new Map();
  brands.forEach((brand, index) => {
    const ids = idsByScope.get(brand.scope) ?? [];
    ids.push(`brand-${String(index + 1).padStart(3, '0')}`);
    idsByScope.set(brand.scope, ids);
  });
  const items = [];
  for (const [index, brand] of brands.entries()) {
    console.log(`Preparing ${brand.displayName}`);
    const itemId = `brand-${String(index + 1).padStart(3, '0')}`;
    const assetPath = `brands-symbols-v1/q-${String(index + 1).padStart(3, '0')}.png`;
    const sourceAssetUrl = brand.slug ? `https://cdn.simpleicons.org/${brand.slug}` : brand.thumb;
    const sourcePageUrl = brand.slug ? `https://simpleicons.org/?q=${encodeURIComponent(brand.displayName)}` : `https://commons.wikimedia.org/wiki/File:${brand.file}`;
    const input = await fetchBuffer(sourceAssetUrl);
    const question = await framedPng(input, brand.crop, Boolean(brand.slug));
    await writeAsset(assetPath, question);
    let revealAssetPath = assetPath;
    let revealSha256 = hash(question);
    if (brand.file) {
      revealAssetPath = `brands-reveal-v1/r-${String(index + 1).padStart(3, '0')}.png`;
      const reveal = await framedPng(input);
      revealSha256 = hash(reveal);
      await writeAsset(revealAssetPath, reveal);
    }
    items.push({
      categoryId: 'brands', contentVersion: 'brands-symbols-v1', itemId, displayName: brand.displayName,
      assetPath, revealAssetPath, difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
      sourcePageUrl, sourceAssetUrl, rightsStatus: 'trademark_review_required',
      attribution: brand.slug ? 'Simple Icons project (CC0 icon data); underlying trademark belongs to its owner' : 'Wikimedia Commons source; underlying trademark belongs to its owner',
      metadata: {
        scope: brand.scope, competitionKey: brand.scope, selectionGroup: brand.scope,
        distractorIds: idsByScope.get(brand.scope).filter((id) => id !== itemId),
        questionPrompt: prompts[brand.scope], questionDescription: 'Recognisable brand symbol with the full name removed',
        questionAssetRole: 'symbol_only_quiz_variant', revealAssetRole: brand.file ? 'complete_original_identity' : 'official_symbol',
      },
      sha256: hash(question), revealSha256, bytes: question.length, contentType: 'image/png',
    });
  }
  const expected = new Set(items.flatMap((item) => [item.assetPath, item.revealAssetPath]));
  for (const folder of ['brands-symbols-v1', 'brands-reveal-v1']) {
    for (const base of [contentRoot, stagingRoot]) {
      const directory = path.join(base, folder);
      try {
        for (const filename of await readdir(directory)) {
          const relative = `${folder}/${filename}`;
          if (!expected.has(relative)) await unlink(path.join(directory, filename));
        }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
  await writeFile(sidecarPath, `${JSON.stringify({ schemaVersion: 1, items }, null, 2)}\n`);
  const rows = items.map((item) => `  (${[
    sql(item.categoryId), sql(item.contentVersion), sql(item.itemId), sql(item.displayName), sql(item.assetPath), sql(item.revealAssetPath),
    sql(item.sha256), sql(item.sourcePageUrl), sql(item.sourceAssetUrl), sql(item.rightsStatus), sql(item.attribution), sql(item.difficulty),
    `${sql(JSON.stringify(item.metadata))}::jsonb`,
  ].join(', ')})`).join(',\n');
  const migration = await readFile(migrationPath, 'utf8');
  const start = '-- GENERATED_BRAND_CONTENT_START';
  const end = '-- GENERATED_BRAND_CONTENT_END';
  const generated = `${start}\ninsert into private.quiz_content\n  (category_id, content_version, item_id, display_name, asset_path, reveal_asset_path, asset_sha256, source_page_url, source_asset_url, rights_status, attribution, difficulty, metadata)\nvalues\n${rows}\non conflict (content_version, item_id) do update set\n  display_name = excluded.display_name, asset_path = excluded.asset_path, reveal_asset_path = excluded.reveal_asset_path,\n  asset_sha256 = excluded.asset_sha256, source_page_url = excluded.source_page_url, source_asset_url = excluded.source_asset_url,\n  rights_status = excluded.rights_status, attribution = excluded.attribution, difficulty = excluded.difficulty, metadata = excluded.metadata;\n${end}`;
  await writeFile(migrationPath, migration.replace(new RegExp(`${start}[\\s\\S]*?${end}`), generated));
  console.log(JSON.stringify({ brands: items.length, groups: Object.fromEntries([...idsByScope].map(([key, ids]) => [key, ids.length])) }));
}

main().catch((error) => { console.error(error); process.exit(1); });
