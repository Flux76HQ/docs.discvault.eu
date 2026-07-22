import { access, readFile } from 'node:fs/promises';

const paths = [
  'dist/index.html',
  'dist/brand/download-on-the-app-store.svg',
  'dist/ios/index.html',
  'dist/install/docker-compose/index.html',
  'dist/update/restore/index.html',
  'dist/pwa/offline/index.html',
  'dist/el/install/reverse-proxy-passkeys/index.html',
  'dist/ja/ios/use-sync-limits/index.html',
  'dist/zh/android/use-status/index.html',
  'dist/404.html',
  'dist/pagefind/pagefind.js',
  ...[
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
  ].map((locale) => `dist/${locale}/404/index.html`),
];
await Promise.all(paths.map((path) => access(path)));
const homepage = await readFile('dist/index.html', 'utf8');
if (
  !homepage.includes('DiscVault') ||
  !homepage.includes('hreflang="nl"') ||
  !homepage.includes('/brand/download-on-the-app-store.svg') ||
  !homepage.includes('https://apps.apple.com/app/discvault/id6788772918')
)
  throw new Error('Homepage smoke check failed.');
const hasSearchInput = /<input\b(?=[^>]*\btype="search")(?=[^>]*\bid="home-search")[^>]*>/.test(
  homepage,
);
const hasSearchBridge = /customElements\.whenDefined\(["']site-search["']\)/.test(homepage);
if (!homepage.includes('<home-search-launcher') || !hasSearchInput || !hasSearchBridge)
  throw new Error('Homepage search input or Starlight search bridge is missing.');
const procedure = await readFile('dist/install/docker-compose/index.html', 'utf8');
if (
  !procedure.includes('breadcrumbs') ||
  !procedure.includes('Edit page') ||
  !procedure.includes('Report a documentation issue')
)
  throw new Error(
    'Generated procedure is missing breadcrumbs, the edit link, or the feedback link.',
  );
const japaneseProcedure = await readFile('dist/ja/ios/use-sync-limits/index.html', 'utf8');
if (!japaneseProcedure.includes('ドキュメントの問題を報告'))
  throw new Error('Localized feedback link is missing from the Japanese procedure.');
const iosSetup = await readFile('dist/ios/index.html', 'utf8');
if (
  !iosSetup.includes('/brand/download-on-the-app-store.svg') ||
  !iosSetup.includes('https://apps.apple.com/app/discvault/id6788772918')
)
  throw new Error('App Store badge or listing link is missing from the iOS setup page.');
const localizedNotFound = await readFile('dist/nl/404/index.html', 'utf8');
if (!localizedNotFound.includes('Pagina niet gevonden'))
  throw new Error('Localized 404 route is missing.');
console.log(`Static smoke test passed for ${paths.length} representative artifacts.`);
