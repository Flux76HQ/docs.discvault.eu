import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const remediation =
  'Protected website/build/deploy files changed without a VERSION bump. Run "pnpm version:bump --patch", commit VERSION, and push again.';
const protectedPath =
  /^(?:src\/components\/|src\/styles\/|scripts\/|\.github\/workflows\/|astro\.config\.mjs$|package\.json$|pnpm-lock\.yaml$|tsconfig\.json$|src\/content\.config\.ts$|\.githooks\/)/;
const runGit = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function refExists(ref) {
  try {
    runGit('rev-parse', '--verify', ref);
    return true;
  } catch {
    return false;
  }
}

let base;
let files;
if (process.argv.includes('--staged')) {
  files = runGit('diff', '--cached', '--name-only').split(/\r?\n/).filter(Boolean);
  base = refExists('HEAD') ? 'HEAD' : undefined;
} else {
  const explicit = process.env.VERSION_GUARD_BASE;
  if (explicit && refExists(explicit)) base = explicit;
  else if (process.env.GITHUB_BASE_REF && refExists(`origin/${process.env.GITHUB_BASE_REF}`))
    base = runGit('merge-base', 'HEAD', `origin/${process.env.GITHUB_BASE_REF}`);
  else if (refExists('HEAD^')) base = 'HEAD^';
  files = base
    ? runGit('diff', '--name-only', `${base}...HEAD`).split(/\r?\n/).filter(Boolean)
    : runGit('status', '--porcelain')
        .split(/\r?\n/)
        .map((line) => line.slice(3))
        .filter(Boolean);
}

if (!files.some((file) => protectedPath.test(file.replaceAll('\\', '/')))) {
  console.log('Version guard: no protected changes.');
  process.exit(0);
}

const current = readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(current))
  throw new Error('VERSION must contain semantic version X.Y.Z.');

let previous;
if (base) {
  try {
    previous = runGit('show', `${base}:VERSION`);
  } catch {
    previous = undefined;
  }
}

if (previous === current) {
  console.error(remediation);
  process.exit(1);
}
console.log(`Version guard: ${previous ?? '(new project)'} → ${current}`);
