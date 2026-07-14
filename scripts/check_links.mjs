import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/content/docs');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const files = (await walk(root)).filter((file) => /\.mdx?$/.test(file));
const routes = new Set(
  files.map((file) => {
    let route = path
      .relative(root, file)
      .replaceAll('\\', '/')
      .replace(/(?:\/index)?\.mdx?$/, '');
    return `/${route}${route ? '/' : ''}`.replace('/index/', '/');
  }),
);
const errors = [];

for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\((\/[^)#?]*)(?:[?#][^)]*)?\)/g)) {
    const normalized = `${match[1].replace(/\/?$/, '/')}`.replace('//', '/');
    if (!routes.has(normalized) && !normalized.startsWith('/brand/'))
      errors.push(`${path.relative(root, file)}: broken link ${match[1]}`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Internal documentation links are valid.');
