import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { procedureLocale } from './content/procedure-locales.mjs';

const root = path.resolve('src/content/docs');
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
const translatedLocales = locales.filter((locale) => locale !== 'en');
const errors = [];

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(directory, entry.name), relative)));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
}

const all = await walk(root);
const canonical = all.filter(
  (file) => !translatedLocales.some((locale) => file.startsWith(`${locale}/`)),
);
const getHeadings = (text) =>
  [...text.matchAll(/^(#{2,6})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
  }));
const getId = (text) => text.match(/^pageId:\s*['"]?([^'"\n]+)['"]?/m)?.[1];
const withoutFrontmatter = (text) => text.replace(/^---[\s\S]*?---/m, '');
const withoutCode = (text) =>
  withoutFrontmatter(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');
const fenced = (text) =>
  [...text.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].trim(),
    body: match[2].trim(),
  }));
const forbiddenEnglishProse = [
  'Goal and result',
  'Before you begin',
  'Expected result',
  'Safety and rollback',
  'Safe rollback',
  'Source and verification',
  'The native source contains placeholder',
  'Android is a working foundation',
  'The task is complete when',
  'Do not continue after a failed check',
  'Page status',
  'Stable channel',
  'Beta channel',
  'Both channels',
  'The procedure is complete when',
  'Complete the prerequisites',
  'Replace example paths',
  'Run every check',
  'service reports healthy',
  'previous known-good image',
  'airplane mode',
  'server connection',
  'stopped writers',
  'immutable digest',
  'matching data',
  'restore before start',
];
const forbiddenFenceStatus =
  /^\s*#\s*(?:Stable(?: channel)?|Beta(?: channel)?|Both channels|DiscVault v?26 (?:stable|beta))\s*$/im;

for (const file of canonical) {
  const source = await readFile(path.join(root, file), 'utf8');
  const sourceHeadings = getHeadings(source);
  const sourceFences = fenced(source);
  for (const locale of translatedLocales) {
    const localizedFile = `${locale}/${file}`;
    const translatedPath = path.join(root, localizedFile);
    let translated;
    try {
      translated = await readFile(translatedPath, 'utf8');
    } catch {
      errors.push(`Missing ${localizedFile}`);
      continue;
    }

    if (getId(source) !== getId(translated)) {
      errors.push(`pageId mismatch: ${localizedFile}`);
    }
    const translatedHeadings = getHeadings(translated);
    if (
      sourceHeadings.map(({ level }) => level).join(',') !==
      translatedHeadings.map(({ level }) => level).join(',')
    ) {
      errors.push(`Heading structure mismatch: ${localizedFile}`);
    }

    const translatedFences = fenced(translated);
    if (sourceFences.length !== translatedFences.length) {
      errors.push(`Code/config block count mismatch: ${localizedFile}`);
    } else {
      sourceFences.forEach((sourceFence, index) => {
        const translatedFence = translatedFences[index];
        if (
          sourceFence.language !== translatedFence.language ||
          sourceFence.body !== translatedFence.body
        ) {
          errors.push(`Command/config block mismatch: ${localizedFile} block ${index + 1}`);
        }
        if (forbiddenFenceStatus.test(translatedFence.body)) {
          errors.push(`English human status label inside fenced block: ${localizedFile}`);
        }
      });
    }

    const prose = withoutCode(translated);
    const visible = withoutFrontmatter(translated);
    for (const phrase of forbiddenEnglishProse) {
      if (prose.includes(phrase)) {
        errors.push(`English fallback "${phrase}": ${localizedFile}`);
      }
    }
    if (/(?:^|\n)#{2,6}\s+(?:Stable channel|Beta channel|Both channels)\s*$/m.test(visible)) {
      errors.push(`English status heading: ${localizedFile}`);
    }
    if (file !== 'index.mdx' && prose.replace(/\s+/g, ' ').length < 500) {
      errors.push(`Insufficient localized procedure prose: ${localizedFile}`);
    }

    const sourceDescription = source.match(/^description:\s*(.+)$/m)?.[1];
    const translatedDescription = translated.match(/^description:\s*(.+)$/m)?.[1];
    if (!translatedDescription || sourceDescription === translatedDescription) {
      errors.push(`Untranslated description: ${localizedFile}`);
    }
    if (!visible.includes('<PageMeta ') && file !== 'index.mdx') {
      errors.push(`Missing visible channel metadata: ${localizedFile}`);
    }
    if (source.includes("minVersion: 'DiscVault v26'") && file !== 'index.mdx') {
      const sourceChannels = source.match(/^channels:\s*\[([^\]]+)\]/m)?.[1] ?? '';
      const expectedChannels = [
        ...(sourceChannels.includes("'stable'") ? ['v26Stable'] : []),
        ...(sourceChannels.includes("'beta'") ? ['v26Beta'] : []),
      ];
      for (const channel of expectedChannels) {
        if (!visible.includes(`### ${procedureLocale[locale][channel]}`)) {
          errors.push(`Missing localized ${channel} heading: ${localizedFile}`);
        }
      }
    }
  }
}

if (all.length !== canonical.length * locales.length) {
  errors.push(`Expected ${canonical.length * locales.length} pages, found ${all.length}.`);
}

const localizedUi = await readFile('src/data/localized-ui.ts', 'utf8');
for (const locale of translatedLocales) {
  const localeBlock = localizedUi.match(
    new RegExp(`\\n\\s*${locale}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`),
  )?.[1];
  if (!localeBlock?.includes('pageStatus:')) {
    errors.push(`Missing locale-specific status labels for ${locale}.`);
  }
  if (!localeBlock?.includes('feedback:')) {
    errors.push(`Missing locale-specific feedback label for ${locale}.`);
  }
  if (!localeBlock?.includes('v26Stable:') || !localeBlock?.includes('v26Beta:')) {
    errors.push(`Missing locale-specific DiscVault v26 channel labels for ${locale}.`);
  }
  if (
    localeBlock &&
    /feedback:\s*['"](?:Report a documentation issue|Feedback|Report issue)['"]/.test(localeBlock)
  ) {
    errors.push(`English feedback fallback for ${locale}.`);
  }
}

const greekUi = JSON.parse(await readFile('src/content/i18n/el.json', 'utf8'));
for (const key of [
  'search.label',
  'themeSelect.accessibleLabel',
  'sidebarNav.accessibleLabel',
  'tableOfContents.onThisPage',
  'page.editLink',
  'pagefind.search_label',
]) {
  if (
    !greekUi[key] ||
    /^(?:Search|Select theme|Main|On this page|Edit page)$/i.test(greekUi[key])
  ) {
    errors.push(`Greek UI key is missing or English: ${key}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Translation quality: ${canonical.length} page IDs × ${locales.length} locales (${all.length} files); heading parity, exact executable samples, localized status/feedback text, and fenced English-status checks passed.`,
);
