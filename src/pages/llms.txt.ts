import type { APIRoute } from 'astro';
import { siteLocales, siteOrigin } from '../data/site-metadata';

export const prerender = true;

const primaryRoutes = [
  ['Start and requirements', '/start/'],
  ['Install DiscVault', '/install/'],
  ['Update and migrate', '/update/'],
  ['Configure DiscVault', '/configure/'],
  ['Progressive Web App', '/pwa/'],
  ['iOS and iPadOS', '/ios/'],
  ['Android', '/android/'],
  ['Administration', '/admin/'],
  ['Integrations and API', '/integrations/'],
  ['Troubleshooting', '/troubleshooting/'],
  ['Reference', '/reference/'],
] as const;

const body = [
  '# DiscVault documentation',
  '',
  '> Official, public, static documentation for installing, using, updating, and operating DiscVault.',
  '',
  `Canonical site: ${siteOrigin}/`,
  `Sitemap: ${siteOrigin}/sitemap-index.xml`,
  `Complete multilingual page index: ${siteOrigin}/llms-index.txt`,
  '',
  '## Scope and crawl policy',
  '',
  '- This file and robots.txt apply only to the public docs.discvault.eu site.',
  '- DiscVault Self-hosted has a separate default crawler-blocking policy; this public policy does not change it.',
  '- Search, citation, and user-requested retrieval are allowed. Verified model-training agents are disallowed in robots.txt.',
  '- Page content is rendered as static HTML and does not require JavaScript to read.',
  '',
  '## Primary English routes',
  '',
  ...primaryRoutes.map(([label, route]) => `- [${label}](${siteOrigin}${route})`),
  '',
  '## Locales',
  '',
  ...siteLocales.map(
    ({ label, languageTag, path }) =>
      `- [${label} (${languageTag})](${siteOrigin}/${path ? `${path}/` : ''})`,
  ),
  '',
].join('\n');

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
