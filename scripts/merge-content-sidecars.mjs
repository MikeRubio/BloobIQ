import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(root, 'supabase', 'content', 'quiz-content.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const versions = new Set(['brands-symbols-v1', 'people-history-v1', 'people-celebrities-v1']);
manifest.items = manifest.items.filter((item) => !versions.has(item.contentVersion));
for (const sidecar of ['brand-content.json', 'people-content.json']) {
  try {
    const content = JSON.parse(await readFile(path.join(root, 'supabase', 'content', sidecar), 'utf8'));
    manifest.items.push(...content.items);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ total: manifest.items.length, added: manifest.items.filter((item) => versions.has(item.contentVersion)).length }));
