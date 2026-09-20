import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteLocales, siteOrigin } from '../data/site-metadata';

export const prerender = true;

function routeForEntryId(entryId: string) {
  const withoutExtension = entryId.replace(/\.(?:md|mdx)$/, '');
  const withoutIndex = withoutExtension.replace(/(?:^|\/)index$/, '');
  return `/${withoutIndex}${withoutIndex ? '/' : ''}`.replace('//', '/');
}

function oneLine(value: string) {
  return value.replaceAll('[', '\\[').replaceAll(']', '\\]').replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = async () => {
  const entries = (await getCollection('docs'))
    .filter(({ data }) => !data.draft)
    .map((entry) => ({ entry, route: routeForEntryId(entry.id) }))
    .sort((left, right) => left.route.localeCompare(right.route, 'en'));
  const lines = [
    '# DiscVault multilingual documentation index',
    '',
    '> Generated from the same titles and descriptions as the rendered documentation pages.',
    '',
    `Canonical site: ${siteOrigin}/`,
    `Sitemap: ${siteOrigin}/sitemap-index.xml`,
    `Compact LLM overview: ${siteOrigin}/llms.txt`,
    '',
  ];

  for (const locale of siteLocales) {
    const prefix = locale.path ? `/${locale.path}/` : '/';
    const localeEntries = entries.filter(({ route }) =>
      locale.path
        ? route.startsWith(prefix)
        : !siteLocales.some(({ path }) => path && route.startsWith(`/${path}/`)),
    );
    lines.push(`## ${locale.label} (${locale.languageTag})`, '');
    for (const { entry, route } of localeEntries) {
      const metadata = [
        `channels: ${entry.data.channels.join(', ')}`,
        `platforms: ${entry.data.platforms.join(', ')}`,
        `verified: ${entry.data.lastVerified}`,
      ].join('; ');
      lines.push(
        `- [${oneLine(entry.data.title)}](${siteOrigin}${route}): ${oneLine(entry.data.description ?? '')} (${metadata})`,
      );
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
