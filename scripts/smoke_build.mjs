import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { crawlerPolicy, renderRobotsTxt } from '../src/data/crawler-policy.mjs';

const siteOrigin = 'https://docs.discvault.eu';
const docsRoot = path.resolve('src/content/docs');
const localeTags = new Map([
  ['en', 'en-US'],
  ['cs', 'cs-CZ'],
  ['da', 'da-DK'],
  ['de', 'de-DE'],
  ['el', 'el-GR'],
  ['es', 'es-ES'],
  ['fi', 'fi-FI'],
  ['fr', 'fr-FR'],
  ['hu', 'hu-HU'],
  ['it', 'it-IT'],
  ['ja', 'ja-JP'],
  ['ko', 'ko-KR'],
  ['nl', 'nl-NL'],
  ['no', 'nb-NO'],
  ['pl', 'pl-PL'],
  ['pt', 'pt-PT'],
  ['sv', 'sv-SE'],
  ['tr', 'tr-TR'],
  ['uk', 'uk-UA'],
  ['zh', 'zh-CN'],
]);
const translatedLocales = new Set([...localeTags.keys()].slice(1));

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

function routeFor(relativePath) {
  const withoutExtension = relativePath.replace(/\.(?:md|mdx)$/, '');
  const withoutIndex = withoutExtension.replace(/(?:^|\/)index$/, '');
  return `/${withoutIndex}${withoutIndex ? '/' : ''}`.replace('//', '/');
}

function builtPathFor(route) {
  return route === '/'
    ? path.resolve('dist/index.html')
    : path.resolve('dist', route.slice(1), 'index.html');
}

function expectIncludes(source, expected, context) {
  if (!source.includes(expected)) throw new Error(`${context}: missing ${expected}`);
}

const sourceFiles = (await walk(docsRoot)).filter((file) => /\.mdx?$/.test(file));
const pages = await Promise.all(
  sourceFiles.map(async (file) => {
    const relative = path.relative(docsRoot, file).replaceAll('\\', '/');
    const source = await readFile(file, 'utf8');
    return {
      route: routeFor(relative),
      locale: localeFor(relative),
      pageId: frontmatterValue(source, 'pageId'),
      title: frontmatterValue(source, 'title'),
      description: frontmatterValue(source, 'description'),
    };
  }),
);
const expectedRoutes = new Set(pages.map(({ route }) => `${siteOrigin}${route}`));
const pagesById = new Map();
for (const page of pages) {
  const localized = pagesById.get(page.pageId) ?? new Map();
  localized.set(page.locale, page);
  pagesById.set(page.pageId, localized);
}

const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
const sitemapEntries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)].map(
  (match) => ({
    url: match[1],
    alternates: new Map(
      [
        ...match[2].matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g),
      ].map((alternate) => [alternate[1], alternate[2]]),
    ),
  }),
);
const sitemapRoutes = new Set(sitemapEntries.map(({ url }) => url));
for (const route of expectedRoutes) {
  if (!sitemapRoutes.has(route)) throw new Error(`Sitemap is missing ${route}.`);
}
for (const route of sitemapRoutes) {
  if (!expectedRoutes.has(route)) throw new Error(`Sitemap contains non-document route ${route}.`);
}
if (sitemapRoutes.size !== expectedRoutes.size) {
  throw new Error(`Sitemap route count ${sitemapRoutes.size} != ${expectedRoutes.size}.`);
}
for (const { url, alternates } of sitemapEntries) {
  if (alternates.size !== localeTags.size) {
    throw new Error(`${url}: sitemap has ${alternates.size} locale alternates.`);
  }
  const page = pages.find(({ route }) => `${siteOrigin}${route}` === url);
  const localized = pagesById.get(page?.pageId);
  for (const [locale, languageTag] of localeTags) {
    const expected = localized?.get(locale);
    if (!expected || alternates.get(languageTag) !== `${siteOrigin}${expected.route}`) {
      throw new Error(`${url}: incorrect sitemap alternate for ${languageTag}.`);
    }
  }
}

for (const page of pages) {
  const html = await readFile(builtPathFor(page.route), 'utf8');
  const url = `${siteOrigin}${page.route}`;
  const languageTag = localeTags.get(page.locale);
  expectIncludes(html, `<html lang="${languageTag}"`, page.route);
  expectIncludes(html, `<link rel="canonical" href="${url}"/>`, page.route);
  expectIncludes(
    html,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
    page.route,
  );
  expectIncludes(html, `<meta property="og:url" content="${url}"/>`, page.route);
  expectIncludes(
    html,
    `<meta property="og:locale" content="${languageTag.replace('-', '_')}"/>`,
    page.route,
  );
  expectIncludes(
    html,
    '<meta property="og:image" content="https://docs.discvault.eu/brand/discvault-icon.png">',
    page.route,
  );
  expectIncludes(html, '<meta name="twitter:card" content="summary"/>', page.route);
  expectIncludes(
    html,
    '<link rel="alternate" type="text/plain" title="DiscVault Docs for language models" href="/llms.txt">',
    page.route,
  );

  const alternates = new Map(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/?>/g)].map(
      (match) => [match[1], match[2]],
    ),
  );
  if (alternates.size !== localeTags.size + 1) {
    throw new Error(`${page.route}: expected ${localeTags.size + 1} HTML alternates.`);
  }
  const localized = pagesById.get(page.pageId);
  for (const [locale, alternateLanguageTag] of localeTags) {
    const expected = localized?.get(locale);
    if (!expected || alternates.get(alternateLanguageTag) !== `${siteOrigin}${expected.route}`) {
      throw new Error(`${page.route}: incorrect HTML alternate for ${alternateLanguageTag}.`);
    }
  }
  if (alternates.get('x-default') !== `${siteOrigin}${localized?.get('en')?.route}`) {
    throw new Error(`${page.route}: incorrect x-default alternate.`);
  }

  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!jsonLd) throw new Error(`${page.route}: missing structured data.`);
  const graph = JSON.parse(jsonLd)['@graph'];
  if (!Array.isArray(graph) || !graph.some((item) => item['@type'] === 'WebSite')) {
    throw new Error(`${page.route}: missing WebSite structured data.`);
  }
  if (
    page.pageId !== 'home' &&
    !graph.some(
      (item) =>
        item['@type'] === 'TechArticle' &&
        item.url === url &&
        item.inLanguage === languageTag &&
        item.headline === page.title &&
        item.description === page.description,
    )
  ) {
    throw new Error(`${page.route}: incomplete TechArticle structured data.`);
  }
  if (!/<main\b/.test(html) || !/<a\b[^>]*href="\/[^"]*"/.test(html)) {
    throw new Error(`${page.route}: static content or internal navigation is missing.`);
  }
}

const robots = await readFile('dist/robots.txt', 'utf8');
if (robots !== renderRobotsTxt()) throw new Error('Built robots.txt differs from policy source.');
for (const { agent, access } of crawlerPolicy) {
  expectIncludes(
    robots,
    `User-agent: ${agent}\n${access === 'allow' ? 'Allow' : 'Disallow'}: /`,
    'robots.txt',
  );
}

const llms = await readFile('dist/llms.txt', 'utf8');
for (const required of [
  `${siteOrigin}/sitemap-index.xml`,
  `${siteOrigin}/llms-index.txt`,
  'DiscVault Self-hosted has a separate default crawler-blocking policy',
]) {
  expectIncludes(llms, required, 'llms.txt');
}
for (const [locale] of localeTags) {
  const localeRoot = locale === 'en' ? `${siteOrigin}/` : `${siteOrigin}/${locale}/`;
  expectIncludes(llms, localeRoot, 'llms.txt');
}

const llmsIndex = await readFile('dist/llms-index.txt', 'utf8');
const indexedPages = [
  ...llmsIndex.matchAll(/^- \[[^\]]+\]\((https:\/\/docs\.discvault\.eu\/[^)]*)\):/gm),
];
if (indexedPages.length !== pages.length) {
  throw new Error(`LLM index has ${indexedPages.length} pages; expected ${pages.length}.`);
}
for (const route of expectedRoutes) expectIncludes(llmsIndex, `](${route}):`, 'llms-index.txt');

const notFoundPaths = [
  'dist/404.html',
  ...[...localeTags.keys()]
    .filter((locale) => locale !== 'en')
    .map((locale) => `dist/${locale}/404/index.html`),
];
for (const notFoundPath of notFoundPaths) {
  const html = await readFile(notFoundPath, 'utf8');
  expectIncludes(html, '<meta name="robots" content="noindex, follow">', notFoundPath);
}

const representativePaths = [
  'dist/brand/download-on-the-app-store.svg',
  'dist/pagefind/pagefind.js',
  'dist/configure/oidc/index.html',
  'dist/el/install/reverse-proxy-passkeys/index.html',
  'dist/ja/ios/use-sync-limits/index.html',
  'dist/zh/android/use-status/index.html',
];
await Promise.all(representativePaths.map((file) => access(file)));

const homepage = await readFile('dist/index.html', 'utf8');
if (
  !homepage.includes('DiscVault') ||
  !homepage.includes('/brand/download-on-the-app-store.svg') ||
  !homepage.includes('https://apps.apple.com/app/discvault/id6788772918')
) {
  throw new Error('Homepage smoke check failed.');
}
const hasSearchInput = /<input\b(?=[^>]*\btype="search")(?=[^>]*\bid="home-search")[^>]*>/.test(
  homepage,
);
if (
  !homepage.includes('<home-search-launcher') ||
  !hasSearchInput ||
  !homepage.includes('<site-search')
) {
  throw new Error('Homepage search input or Starlight search bridge is missing.');
}
const procedure = await readFile('dist/install/docker-compose/index.html', 'utf8');
if (
  !procedure.includes('breadcrumbs') ||
  !procedure.includes('Edit page') ||
  !procedure.includes('Report a documentation issue')
) {
  throw new Error(
    'Generated procedure is missing breadcrumbs, the edit link, or the feedback link.',
  );
}
const japaneseProcedure = await readFile('dist/ja/ios/use-sync-limits/index.html', 'utf8');
if (!japaneseProcedure.includes('ドキュメントの問題を報告')) {
  throw new Error('Localized feedback link is missing from the Japanese procedure.');
}

console.log(
  `Static smoke test passed for ${pages.length} localized pages, ${sitemapRoutes.size} sitemap URLs, ${notFoundPaths.length} noindex pages, and the robots/LLM discovery endpoints.`,
);
