import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const requested = process.argv.find((argument) => /^--(patch|minor|major)$/.test(argument));
const release = requested?.slice(2) ?? 'patch';
const versionFile = new URL('VERSION', root);
const packageFile = new URL('package.json', root);
const current = (await readFile(versionFile, 'utf8')).trim();
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);

if (!match) throw new Error(`VERSION must contain semver, received "${current}".`);

const parts = match.slice(1).map(Number);
if (release === 'major') parts.splice(0, 3, parts[0] + 1, 0, 0);
if (release === 'minor') parts.splice(1, 2, parts[1] + 1, 0);
if (release === 'patch') parts[2] += 1;

const next = parts.join('.');
const packageJson = JSON.parse(await readFile(packageFile, 'utf8'));
packageJson.version = next;
await Promise.all([
  writeFile(versionFile, `${next}\n`),
  writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`),
]);
console.log(`Version ${current} → ${next}`);
