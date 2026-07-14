import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const excludedDirectories = new Set(['.astro', '.git', '.lighthouseci', 'dist', 'node_modules']);
const patterns = [
  {
    name: 'GitHub token',
    expression: new RegExp(`gh${'[pousr]'}_[A-Za-z0-9]{30,}`, 'g'),
  },
  {
    name: 'AWS access key',
    expression: new RegExp(`AK${'IA'}[0-9A-Z]{16}`, 'g'),
  },
  {
    name: 'private key',
    expression: new RegExp(`${'-----BEGIN '}(?:RSA |EC |OPENSSH )?${'PRIVATE KEY-----'}`, 'g'),
  },
];
const findings = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    const metadata = await stat(absolute);
    if (metadata.size > 2_000_000) continue;
    let content;
    try {
      content = await readFile(absolute, 'utf8');
    } catch {
      continue;
    }
    if (content.includes('\0')) continue;
    for (const { name, expression } of patterns) {
      expression.lastIndex = 0;
      if (expression.test(content)) {
        findings.push(`${path.relative(root, absolute).replaceAll('\\', '/')}: ${name}`);
      }
    }
  }
}

await walk(root);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exit(1);
}
console.log('Credential scan passed.');
