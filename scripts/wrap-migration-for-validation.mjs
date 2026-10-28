import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const migrationsDirectory = path.join(root, 'supabase', 'migrations');
const requestedSuffix = process.argv[2];
const migrationNames = (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
const migrationName = requestedSuffix
  ? migrationNames.find((name) => name.endsWith(requestedSuffix))
  : migrationNames.at(-1);
if (!migrationName) throw new Error('Requested migration is missing');

const migration = await readFile(path.join(migrationsDirectory, migrationName), 'utf8');
const outputDirectory = path.join(root, '.quiz-assets');
const outputPath = path.join(outputDirectory, 'validate-content-migration.sql');
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `begin;\n${migration}\nrollback;\n`);
console.log(outputPath);
