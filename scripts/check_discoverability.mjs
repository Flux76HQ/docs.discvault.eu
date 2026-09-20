import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { crawlerPolicy, renderRobotsTxt } from '../src/data/crawler-policy.mjs';

const docsRoot = path.resolve('src/content/docs');
const locales = [
  'en',
  'cs',
  'da',
  'de',
  'el',
  'es',
  'fi',
  'fr',
  'hu',
  'it',
  'ja',
  'ko',
  'nl',
  'no',
  'pl',
  'pt',
  'sv',
  'tr',
  'uk',
  'zh',
];
const translatedLocales = new Set(locales.slice(1));
const expectedAllowedAgents = new Set([
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'Googlebot',
  'bingbot',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'meta-webindexer',
  'meta-externalfetcher',
]);
const expectedDisallowedAgents = new Set([
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'CCBot',
]);
const errors = [];

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

function frontmatterValue(source, key) {
  const value = source.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!value) return undefined;
  const quote = value[0];
  return quote === value.at(-1) && (quote === "'" || quote === '"')
    ? value.slice(1, -1).replaceAll("''", "'")
    : value;
}

function localeFor(relativePath) {
  const first = relativePath.split('/')[0];
  return translatedLocales.has(first) ? first : 'en';
}

const files = (await walk(docsRoot)).filter((file) => /\.mdx?$/.test(file));
const pagesById = new Map();
for (const file of files) {
  const relative = path.relative(docsRoot, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const title = frontmatterValue(source, 'title');
  const description = frontmatterValue(source, 'description');
  const pageId = frontmatterValue(source, 'pageId');
  const locale = localeFor(relative);

  if (!title) errors.push(`${relative}: missing title.`);
  if (!description) {
    errors.push(`${relative}: missing description.`);
  } else {
    if (description.length < 30 || description.length > 180) {
      errors.push(`${relative}: description length ${description.length} is outside 30-180.`);
    }
    if (description.includes('`')) {
      errors.push(`${relative}: description contains Markdown code delimiters.`);
    }
  }
  if (!pageId) {
    errors.push(`${relative}: missing pageId.`);
    continue;
  }
  const pageLocales = pagesById.get(pageId) ?? new Set();
  pageLocales.add(locale);
  pagesById.set(pageId, pageLocales);
}

for (const [pageId, pageLocales] of pagesById) {
  if (pageLocales.size !== locales.length || locales.some((locale) => !pageLocales.has(locale))) {
    errors.push(`${pageId}: expected all ${locales.length} locales.`);
  }
}
if (files.length !== pagesById.size * locales.length) {
  errors.push(
    `Expected ${pagesById.size * locales.length} localized pages, found ${files.length}.`,
  );
}

const allowedAgents = new Set(
  crawlerPolicy.filter(({ access }) => access === 'allow').map(({ agent }) => agent),
);
const disallowedAgents = new Set(
  crawlerPolicy.filter(({ access }) => access === 'disallow').map(({ agent }) => agent),
);
const allAgents = crawlerPolicy.map(({ agent }) => agent);
if (new Set(allAgents).size !== allAgents.length)
  errors.push('Crawler policy has duplicate agents.');
for (const agent of expectedAllowedAgents) {
  if (!allowedAgents.has(agent)) errors.push(`Crawler policy must allow ${agent}.`);
}
for (const agent of expectedDisallowedAgents) {
  if (!disallowedAgents.has(agent)) errors.push(`Crawler policy must disallow ${agent}.`);
}
if (
  allowedAgents.size !== expectedAllowedAgents.size ||
  disallowedAgents.size !== expectedDisallowedAgents.size
) {
  errors.push('Crawler policy contains an unreviewed allow/deny classification.');
}
for (const { agent, source } of crawlerPolicy) {
  if (!source.startsWith('https://')) errors.push(`${agent}: missing first-party HTTPS source.`);
}
for (const unsupported of ['Bytespider', 'TikTokSpider']) {
  if (allAgents.includes(unsupported)) {
    errors.push(`${unsupported}: no verified first-party role documentation is recorded.`);
  }
}

const robots = renderRobotsTxt();
for (const { agent, access } of crawlerPolicy) {
  const block = `User-agent: ${agent}\n${access === 'allow' ? 'Allow' : 'Disallow'}: /`;
  if (!robots.includes(block)) errors.push(`robots.txt does not implement ${agent} as ${access}.`);
}
for (const required of [
  'Public documentation policy for docs.discvault.eu only.',
  'DiscVault Self-hosted keeps its separate default crawler blocking',
  'https://docs.discvault.eu/llms.txt',
  'https://docs.discvault.eu/llms-index.txt',
  'https://docs.discvault.eu/sitemap-index.xml',
]) {
  if (!robots.includes(required)) errors.push(`robots.txt is missing "${required}".`);
}

if (existsSync('public/robots.txt')) {
  errors.push('public/robots.txt would shadow the generated policy endpoint.');
}
for (const endpoint of [
  'src/pages/robots.txt.ts',
  'src/pages/llms.txt.ts',
  'src/pages/llms-index.txt.ts',
]) {
  if (!existsSync(endpoint)) errors.push(`Missing discoverability endpoint: ${endpoint}.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Discoverability source check passed for ${pagesById.size} page IDs × ${locales.length} locales, ${expectedAllowedAgents.size} citation/search agents, and ${expectedDisallowedAgents.size} training or mixed-use agents.`,
);
