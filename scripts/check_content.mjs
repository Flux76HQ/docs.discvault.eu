import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  deploymentArchitecture,
  imageChannels as canonicalImageChannels,
  productVersion,
} from './content/product-model.mjs';
import { procedures } from './content/procedures.mjs';
import { procedureLocale } from './content/procedure-locales.mjs';

const root = path.resolve('src/content/docs');
const translatedLocales = [
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
const requiredFields = [
  'title',
  'description',
  'pageId',
  'products',
  'platforms',
  'channels',
  'minVersion',
  'sourceRepos',
  'lastVerified',
];
const operationalHeadings = [
  'Goal and result',
  'Applies to',
  'Prerequisites',
  'Procedure',
  'Expected result',
  'Safety and rollback',
  'Next step',
  'Source and status',
];
const requiredMarkers = {
  'start-index': ['/install/', '/pwa/', '/ios/', '/android/'],
  'start-requirements': ['Docker Engine', 'Docker Compose', 'HTTPS'],
  'install-index': [':latest', ':beta', ':legacy', 'PostgreSQL', '/data', '/update/migration/'],
  'install-docker-run': ['DATABASE_URL', 'discvault-postgres', '6080:5000', '/api/next/health'],
  'install-docker-compose': ['DISCVAULT_IMAGE', 'postgres:17-alpine', '6080:5000'],
  'install-unraid': [
    '/mnt/user/appdata/discvault/data',
    '/mnt/user/appdata/discvault/postgres',
    'DISCVAULT_IMAGE',
  ],
  'install-storage-postgresql': ['DISCVAULT_POSTGRES_DATA', 'DISCVAULT_DATA_DIR', 'next-api'],
  'install-reverse-proxy-passkeys': [
    'FQDN',
    'RP_ORIGINS',
    'RP_ID',
    '6080',
    '/api/next/health',
    'localhost',
  ],
  'install-first-start-health': ['/api/next/health', '/api/next/auth/status', '6080:5000'],
  'update-index': ['/update/backup/', '/update/update/', '/update/rollback/'],
  'update-backup': ['pg_dump -Fc', 'PREVIOUS_IMAGE', 'next-api'],
  'update-restore': ['pg_restore --exit-on-error', 'discvault.failed-', 'next-worker', 'next-api'],
  'update-update': [
    ':latest',
    ':beta',
    ':legacy',
    '--force-recreate',
    'DISCVAULT_IMAGE',
    '/update/migration/',
  ],
  'update-rollback': ['PREVIOUS_IMAGE', 'pg_restore --exit-on-error', 'discvault.failed-'],
  'update-migration': ['/migration/readiness', 'ready_for_confirmation', '/data/discvault.db'],
  'configure-index': [
    '/configure/environment/',
    '/configure/auth-rbac/',
    '/configure/plugins-metadata/',
  ],
  'configure-environment': ['/opt/discvault/.env', 'DISCVAULT_IMAGE', 'chmod 0600', 'RP_ORIGINS'],
  'configure-auth-rbac': [
    '/api/next/auth/status',
    '/api/next/auth/rbac',
    'WebAuthn',
    'Windows Hello',
    'iOS',
    'Android',
  ],
  'configure-plugins-metadata': ['/api/next/plugins/registry', '/data/plugins', 'dryRun'],
  'pwa-index': ['Service Worker', '/pwa/offline/', 'HTTPS'],
  'pwa-install': ['display-mode: standalone', 'iOS/iPadOS', 'Android'],
  'pwa-library-search': [
    'watchlist',
    'history',
    'RBAC',
    'Collectors Mode',
    'merge_editions_as_title',
    'box_set',
    'vault',
    'collection',
  ],
  'pwa-offline': ['Service Worker', 'CacheStorage', 'navigator.onLine'],
  'ios-index': ['SwiftData', 'iOS/iPadOS', 'App Lock'],
  'ios-use-sync-limits': ['SwiftData', '/api/v1', 'App Lock'],
  'android-index': ['Room', 'API 26+', 'Android'],
  'android-use-status': ['Room', 'CameraX', 'ML Kit', 'WorkManager'],
  'admin-index': ['docker compose', '/api/next/jobs', 'next-worker'],
  'integrations-index': ['MCP', 'REST', 'Plex', 'Jellyfin'],
  'integrations-mcp-api': ['streamable-http', '/mcp', 'Authorization'],
  'integrations-plex-jellyfin': ['Plex', 'Jellyfin', 'dryRun'],
  'troubleshooting-index': ['docker compose', '/api/next/health', 'postgres'],
  'reference-index': [':latest', ':beta', ':dev', '6080:5000'],
};
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

function relativePath(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function localeFor(relative) {
  const first = relative.split('/')[0];
  return translatedLocales.includes(first) ? first : 'en';
}

function pageIdFor(content) {
  return content.match(/^pageId:\s*['"]?([^'"\n]+)['"]?/m)?.[1];
}

function topLevelSections(content) {
  const matches = [...content.matchAll(/^##\s+.+$/gm)];
  return matches.map((match, index) => ({
    heading: match[0].replace(/^##\s+/, ''),
    body: content.slice(match.index + match[0].length, matches[index + 1]?.index ?? content.length),
  }));
}

function normalizedProcedure(content) {
  const procedure = topLevelSections(content)[3]?.body ?? '';
  return procedure
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, 'LINK')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function normalizedSemanticBody(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^:::[^\n]*$/gm, '')
    .replace(/[*_`#>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function firstSemanticParagraph(body) {
  return body
    .replace(/^:::[^\n]*$/gm, '')
    .split(/\n\s*\n/)
    .map((paragraph) => normalizedSemanticBody(paragraph))
    .find((paragraph) => paragraph.length >= 40);
}

function fencedBlocks(content) {
  return [...content.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].trim(),
    body: match[2].trim(),
  }));
}

function assertOrder(label, content, needles) {
  let previous = -1;
  for (const needle of needles) {
    const index = content.indexOf(needle, previous + 1);
    if (index < 0) {
      errors.push(`${label}: missing ordered operation "${needle}"`);
      return;
    }
    if (index <= previous) {
      errors.push(`${label}: unsafe operation order near "${needle}"`);
      return;
    }
    previous = index;
  }
}

const files = (await walk(root)).filter((name) => /\.mdx?$/.test(name));
const canonicalFiles = files.filter((file) => localeFor(relativePath(file)) === 'en');
const expectedPageIds = new Set(['home', ...Object.keys(requiredMarkers)]);
const duplicateBodies = new Map();
const duplicateSemanticBodies = new Map();
const duplicateSemanticParagraphs = new Map();
const seenPageIds = new Map();

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const relative = relativePath(file);
  const locale = localeFor(relative);
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!frontmatter) {
    errors.push(`${relative}: missing frontmatter`);
    continue;
  }
  for (const field of requiredFields) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) {
      errors.push(`${relative}: missing ${field}`);
    }
  }

  const pageId = pageIdFor(content);
  if (!pageId) {
    errors.push(`${relative}: missing pageId value`);
    continue;
  }
  const legacyAllowedPageIds = new Set(['install-index', 'update-update', 'update-migration']);
  const legacyDeploymentContent =
    pageId === 'install-reverse-proxy-passkeys'
      ? content.replace(/\bLegacy Authentication\b/gi, 'authentication')
      : content;
  if (
    !legacyAllowedPageIds.has(pageId) &&
    /(?:\bSQLite\b|discvault\.db|\blegacy\b)/i.test(legacyDeploymentContent)
  ) {
    errors.push(
      `${relative}: legacy deployment/SQLite claims are allowed only on install choice, container update, or existing-data migration pages; "Legacy Authentication" is the only exception on the passkey installation page`,
    );
  }
  for (const [claim, pattern] of [
    ['all-in-one runtime', /(?:current\s+)?all-in-one/i],
    ['filesystem-only runtime architecture', /single\s+`?\/data`?/i],
    ['old health endpoint', /\/api\/health\b/i],
    ['old API port', /\b6180\b/],
    ['old API port mapping', /\b6080:80\b/],
    ['singular RP_ORIGIN', /\bRP_ORIGIN\b(?!S)/],
    [
      'channel-exclusive PostgreSQL',
      /PostgreSQL[^.\n]{0,80}beta[- ]only|beta[- ]only[^.\n]{0,80}PostgreSQL/i,
    ],
  ]) {
    if (pattern.test(content)) errors.push(`${relative}: forbidden ${claim} claim`);
  }
  const products = frontmatter.match(/^products:\s*\[([^\]]+)\]/m)?.[1] ?? '';
  const channelMetadata = frontmatter.match(/^channels:\s*\[([^\]]+)\]/m)?.[1] ?? '';
  const isV26Product = /'(?:server|pwa)'/.test(products);
  if (isV26Product) {
    if (!/minVersion:\s*'DiscVault v26'/.test(frontmatter)) {
      errors.push(`${relative}: v26 server/PWA page must use unambiguous DiscVault v26 metadata`);
    }
    if (!/'stable'/.test(channelMetadata) || !/'beta'/.test(channelMetadata)) {
      errors.push(`${relative}: v26 server/PWA functionality must cover stable and beta`);
    }
  }
  if (pageId === 'home') {
    if (!/'stable'/.test(channelMetadata) || !/'beta'/.test(channelMetadata)) {
      errors.push(`${relative}: homepage metadata must expose both v26 release channels`);
    }
  }
  if (
    pageId === 'install-index' &&
    /\]\([^)]*install\/(?:docker-compose|docker-run)\/\)\s+—\s+`:(?:latest|beta)`/.test(content)
  ) {
    errors.push(`${relative}: installation route incorrectly assigns a channel to a topology`);
  }
  const localeIds = seenPageIds.get(locale) ?? new Set();
  if (localeIds.has(pageId)) errors.push(`${relative}: duplicate pageId ${pageId} in ${locale}`);
  localeIds.add(pageId);
  seenPageIds.set(locale, localeIds);

  const proseOnly = content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');
  if (/\b(?:TODO|TBD|FIXME)\b/.test(proseOnly) || /\blorem ipsum\b/i.test(proseOnly)) {
    errors.push(`${relative}: placeholder text`);
  }
  if (/Bearer\s+(?!<|\\?\$|\*{3,})[A-Za-z0-9._-]{16,}/.test(content)) {
    errors.push(`${relative}: possible credential`);
  }

  if (pageId !== 'home') {
    const sections = topLevelSections(content);
    if (sections.length !== 8) {
      errors.push(
        `${relative}: expected exactly eight operational sections, found ${sections.length}`,
      );
    }
    const procedure = sections[3]?.body ?? '';
    if ((procedure.match(/^\d+\.\s+/gm) ?? []).length < 4) {
      errors.push(`${relative}: procedure needs at least four page-specific steps`);
    }
    const channels =
      frontmatter.match(/^channels:\s*\[([^\]]+)\]/m)?.[1].match(/(?:stable|beta|roadmap)/g) ?? [];
    const scope = sections[1]?.body ?? '';
    if ((scope.match(/^###\s+/gm) ?? []).length < channels.length) {
      errors.push(`${relative}: channel guidance is not complete for ${channels.join(', ')}`);
    }

    const markers = requiredMarkers[pageId];
    if (!markers) {
      errors.push(`${relative}: no independent page-specific marker set for ${pageId}`);
    } else {
      for (const marker of markers) {
        if (!content.includes(marker)) errors.push(`${relative}: missing page marker "${marker}"`);
      }
    }

    if (pageId === 'install-index') {
      const prerequisitesBody = sections[2]?.body ?? '';
      const safetyBody = sections[5]?.body ?? '';
      const unconditionalBackupTerm = procedureLocale[locale]?.terms?.matchingBackup;
      const conditionalBackupTerm = procedureLocale[locale]?.terms?.matchingBackupIfExisting;
      if (unconditionalBackupTerm && prerequisitesBody.includes(unconditionalBackupTerm)) {
        errors.push(
          `${relative}: a fresh install must not list a matching backup as an unconditional prerequisite`,
        );
      }
      if (!conditionalBackupTerm || !safetyBody.includes(conditionalBackupTerm)) {
        errors.push(
          `${relative}: existing/legacy deployment backup guidance must remain explicitly conditional in "Safety and rollback"`,
        );
      }
    }

    if (pageId === 'pwa-library-search') {
      const collectorSettingsPath = procedureLocale[locale]?.uiPaths?.collectorSettingsPath;
      if (!collectorSettingsPath || !content.includes(collectorSettingsPath)) {
        errors.push(
          `${relative}: must include the localized Settings → Preferences → Collectors UI path`,
        );
      }
    }

    const normalized = normalizedProcedure(content);
    if (normalized.length < 80) errors.push(`${relative}: procedure body is too shallow`);
    const hash = createHash('sha256').update(normalized).digest('hex');
    const key = `${locale}:${hash}`;
    const duplicates = duplicateBodies.get(key) ?? [];
    duplicates.push(`${pageId} (${relative})`);
    duplicateBodies.set(key, duplicates);

    if (locale !== 'en') {
      const semanticSections = [
        ['applies', sections[1]?.body ?? ''],
        ['expected', sections[4]?.body ?? ''],
        ['safety', sections[5]?.body ?? ''],
      ];
      const procedurePath = pageId.replaceAll('-', '/').replace(/\/index$/, '/index');
      const spec =
        Object.entries(procedures).find(([id]) => id.replaceAll('/', '-') === pageId)?.[1] ??
        procedures[procedurePath];
      for (const [sectionName, body] of semanticSections) {
        const normalizedBody = normalizedSemanticBody(body);
        const bodyHash = createHash('sha256').update(normalizedBody).digest('hex');
        const bodyKey = `${locale}:${sectionName}:${bodyHash}`;
        const bodyPages = duplicateSemanticBodies.get(bodyKey) ?? [];
        bodyPages.push(`${pageId} (${relative})`);
        duplicateSemanticBodies.set(bodyKey, bodyPages);

        const paragraph = firstSemanticParagraph(body);
        if (!paragraph) {
          errors.push(`${relative}: ${sectionName} needs page-specific localized prose`);
        } else {
          const paragraphHash = createHash('sha256').update(paragraph).digest('hex');
          const paragraphKey = `${locale}:${sectionName}:${paragraphHash}`;
          const paragraphPages = duplicateSemanticParagraphs.get(paragraphKey) ?? [];
          paragraphPages.push(`${pageId} (${relative})`);
          duplicateSemanticParagraphs.set(paragraphKey, paragraphPages);
        }

        const markerCount =
          spec?.markers.filter((marker) => body.includes(marker)).length ??
          requiredMarkers[pageId]?.filter((marker) => body.includes(marker)).length ??
          0;
        const requiredMarkerCount = Math.min(2, spec?.markers.length ?? 2);
        if (markerCount < requiredMarkerCount) {
          errors.push(
            `${relative}: ${sectionName} prose has ${markerCount} page-specific control points; expected at least ${requiredMarkerCount}`,
          );
        }
      }
    }
  }

  if (/(?:^|\/)(?:ios|android)\//.test(relative)) {
    const nativeCrossDomain =
      /\bdocker\s+(?:compose|pull|run|logs)|\/api\/(?:next\/)?health|pg_restore|PostgreSQL|PREVIOUS_IMAGE|image rollback|service reports healthy|previous known-good image|Dienst[^.\n]{0,60}gesund|funktionierende(?:n|s)? Image|サービス[^。\n]{0,40}正常|正常なイメージ|服务[^。\n]{0,30}健康|正常镜像|service[^.\n]{0,40}gezond|werkende image|υπηρεσία[^.\n]{0,50}λειτουργία|λειτουργική εικόνα/i;
    if (nativeCrossDomain.test(content)) {
      errors.push(
        `${relative}: native-app page contains server-health or image-rollback instructions`,
      );
    }
  }
}

for (const [key, pages] of duplicateBodies) {
  if (pages.length > 1) {
    errors.push(`Duplicate generic procedure body (${key.split(':')[0]}): ${pages.join(', ')}`);
  }
  for (const [key, pages] of duplicateSemanticBodies) {
    if (pages.length > 1) {
      const [locale, section] = key.split(':');
      errors.push(`Duplicate generic ${section} section body (${locale}): ${pages.join(', ')}`);
    }
  }
  for (const [key, pages] of duplicateSemanticParagraphs) {
    if (pages.length > 1) {
      const [locale, section] = key.split(':');
      errors.push(`Repeated generic ${section} paragraph (${locale}): ${pages.join(', ')}`);
    }
  }
}

for (const locale of ['en', ...translatedLocales]) {
  const ids = seenPageIds.get(locale) ?? new Set();
  for (const pageId of expectedPageIds) {
    if (!ids.has(pageId)) errors.push(`${locale}: missing pageId ${pageId}`);
  }
}

for (const file of canonicalFiles) {
  const relative = relativePath(file);
  if (relative === 'index.mdx') continue;
  const content = await readFile(file, 'utf8');
  for (const heading of operationalHeadings) {
    if (!content.includes(`## ${heading}`)) {
      errors.push(`${relative}: missing operational section "${heading}"`);
    }
  }
}

const v26ProcedureIds = Object.keys(procedures).filter(
  (id) => !id.startsWith('ios/') && !id.startsWith('android/'),
);
for (const id of v26ProcedureIds) {
  const spec = procedures[id];
  if (!spec.channels.stable || !spec.channels.beta) {
    errors.push(`${id}: DiscVault v26 procedure must cover stable and beta`);
    continue;
  }
  const stableArchitecture = JSON.stringify(spec.channels.stable.slice(1));
  const betaArchitecture = JSON.stringify(spec.channels.beta.slice(1));
  if (stableArchitecture !== betaArchitecture) {
    errors.push(`${id}: :latest and :beta have different architecture descriptions`);
  }
}

const restore = await readFile(path.join(root, 'update/restore.mdx'), 'utf8');
assertOrder('DiscVault v26 restore', restore, [
  'export DISCVAULT_IMAGE="$PREVIOUS_IMAGE"',
  'stop next-worker next-mcp next-api',
  'discvault-data-$BACKUP_ID.tgz',
  'up -d postgres',
  'pg_restore --exit-on-error',
  '--force-recreate next-api',
  '/api/next/health',
  '--force-recreate next-worker next-mcp',
  'mv "$ENV_TMP" "$ENV_FILE"',
]);

const rollback = await readFile(path.join(root, 'update/rollback.mdx'), 'utf8');
assertOrder('DiscVault v26 rollback', rollback, [
  'stop next-worker next-mcp next-api',
  'discvault-data-$BACKUP_ID.tgz',
  'pg_restore --exit-on-error',
  '--force-recreate next-api',
  '/api/next/health',
  '--force-recreate next-worker next-mcp',
  'mv "$ENV_TMP" "$ENV_FILE"',
]);

for (const [label, content] of [
  ['restore', restore],
  ['rollback', rollback],
]) {
  const blocks = fencedBlocks(content).filter(({ language }) => language === 'bash');
  if (blocks.length !== 1) errors.push(`${label}: expected one shared v26 Bash block`);
  for (const [index, { body }] of blocks.entries()) {
    if (!body.startsWith('set -euo pipefail')) {
      errors.push(`${label} block ${index + 1}: missing leading set -euo pipefail`);
    }
    if (body.includes('pg_restore') && !body.includes('pg_restore --exit-on-error')) {
      errors.push(`${label} block ${index + 1}: pg_restore must use --exit-on-error`);
    }
    const restoreEnd = Math.max(
      body.lastIndexOf('.tgz"'),
      body.lastIndexOf('pg_restore --exit-on-error'),
    );
    const firstStartup = body.search(
      /docker (?:run|start)(?:\s|\\)|docker compose[^\n]*(?:up -d|start)[^\n]*(?:next-api|next-worker|next-mcp)/,
    );
    if (restoreEnd < 0 || firstStartup < restoreEnd) {
      errors.push(`${label} block ${index + 1}: service startup occurs before data restoration`);
    }
  }
}

const dockerRun = await readFile(path.join(root, 'install/docker-run.mdx'), 'utf8');
for (const marker of [
  'DATABASE_URL=postgresql://',
  '--name discvault-postgres',
  '--name discvault-api',
  '--name discvault-worker',
  '--name discvault-mcp',
  'postgres:17-alpine',
  '-p 6080:5000',
  '/api/next/health',
]) {
  if (!dockerRun.includes(marker)) errors.push(`install/docker-run.mdx: missing "${marker}"`);
}
assertOrder('Advanced Docker run topology', dockerRun, [
  '--name discvault-postgres',
  '.State.Health.Status',
  '--name discvault-api',
  '/api/next/health',
  '--name discvault-worker',
  '--name discvault-mcp',
]);

const composePage = await readFile(path.join(root, 'install/docker-compose.mdx'), 'utf8');
const composeBlocks = fencedBlocks(composePage).filter(({ language }) => language === 'yaml');
if (composeBlocks.length !== 1) {
  errors.push('install/docker-compose.mdx: expected one canonical Compose YAML block');
} else {
  const compose = composeBlocks[0].body;
  for (const marker of [
    'postgres:',
    'next-api:',
    'next-worker:',
    'next-mcp:',
    'image: "${DISCVAULT_IMAGE:?set DISCVAULT_IMAGE}"',
    'DATABASE_URL:',
    '${DISCVAULT_POSTGRES_DATA:',
    '${DISCVAULT_DATA_DIR:',
    '${DISCVAULT_API_PORT:-6080}:5000',
    '/api/next/health',
  ]) {
    if (!compose.includes(marker)) {
      errors.push(`install/docker-compose.mdx: canonical topology missing "${marker}"`);
    }
  }
}

const updatePage = await readFile(path.join(root, 'update/update.mdx'), 'utf8');
for (const marker of [
  'matching backup set',
  'release notes',
  'ENV_TMP=',
  'awk -v image="$DISCVAULT_IMAGE"',
  'mv "$ENV_TMP" "$ENV_FILE"',
]) {
  if (!updatePage.includes(marker)) errors.push(`update/update.mdx: missing "${marker}"`);
}
assertOrder('Channel-aware update', updatePage, [
  'config --quiet',
  'pull next-api next-worker next-mcp',
  'up -d --force-recreate',
  '/api/next/health',
  'mv "$ENV_TMP" "$ENV_FILE"',
]);

const environment = await readFile(path.join(root, 'configure/environment.mdx'), 'utf8');
for (const marker of [
  '/opt/discvault/.env',
  'DISCVAULT_IMAGE',
  '--env-file',
  'chmod 0600',
  'openssl rand -hex 32',
  'test ! -e "$ENV_FILE"',
  'mktemp "$ENV_FILE.tmp.XXXXXX"',
  'ln "$ENV_TMP" "$ENV_FILE"',
  'documentation repository environment file is never a DiscVault runtime file',
]) {
  if (!environment.includes(marker)) errors.push(`configure/environment.mdx: missing "${marker}"`);
}
if (/<(?:long|random|secret|password)[^>]*>|REPLACE_WITH|change-me/i.test(environment)) {
  errors.push('configure/environment.mdx: command-like secret placeholder is forbidden');
}

const environmentPages = [
  'install/docker-run.mdx',
  'install/docker-compose.mdx',
  'configure/environment.mdx',
];
const secretFileBlocks = [];
for (const relative of environmentPages) {
  const content = await readFile(path.join(root, relative), 'utf8');
  for (const block of fencedBlocks(content)) {
    if (/(?:JWT_SECRET|POSTGRES_PASSWORD)="\$\(openssl rand/.test(block.body)) {
      secretFileBlocks.push([relative, block.body]);
    }
  }
}
if (secretFileBlocks.length !== 3) {
  errors.push(
    `Expected three fail-fast secret environment blocks, found ${secretFileBlocks.length}`,
  );
}
for (const [relative, body] of secretFileBlocks) {
  if (!body.startsWith('set -euo pipefail')) {
    errors.push(`${relative}: secret environment block is not fail-fast`);
  }
  assertOrder(`${relative} secret file`, body, [
    'umask 077',
    'test ! -e "$ENV_FILE"',
    'mktemp "$ENV_FILE.tmp.XXXXXX"',
    'openssl rand -hex 32',
    '> "$ENV_TMP"',
    'ln "$ENV_TMP" "$ENV_FILE"',
  ]);
  if (/>\s*"?\$ENV_FILE"?/.test(body)) {
    errors.push(`${relative}: secret environment block can overwrite its destination`);
  }
}

const routeGrid = await readFile('src/components/RouteGrid.astro', 'utf8');
if (
  !routeGrid.includes('ui.v26Stable') ||
  !routeGrid.includes('ui.v26Beta') ||
  !routeGrid.includes('StatusBadge')
) {
  errors.push('Homepage route cards must expose localized DiscVault v26 stable/beta badges.');
}
const footer = await readFile('src/components/Footer.astro', 'utf8');
if (!footer.includes('PUBLIC_FEEDBACK_URL') || !footer.includes('/issues/new')) {
  errors.push('Every page footer must consume PUBLIC_FEEDBACK_URL with an Issues default.');
}

const workflowDirectory = '.github/workflows';
const workflowNames = (await readdir(workflowDirectory)).filter((name) => /\.ya?ml$/.test(name));
const workflowSources = await Promise.all(
  workflowNames.map(async (name) => [
    name,
    await readFile(path.join(workflowDirectory, name), 'utf8'),
  ]),
);
const deploymentWorkflows = workflowSources.filter(([, source]) =>
  source.includes('actions/deploy-pages@'),
);
if (deploymentWorkflows.length !== 1) {
  errors.push(
    `Expected exactly one Pages deployment workflow, found ${deploymentWorkflows.length}.`,
  );
} else {
  const [name, source] = deploymentWorkflows[0];
  for (const fragment of [
    'pull_request:',
    'branches: [main]',
    'pnpm install --frozen-lockfile',
    'pnpm format:check',
    'pnpm credentials:check',
    'pnpm check',
    'pnpm typecheck',
    'pnpm build',
    'pnpm smoke',
    'pnpm exec lhci autorun',
    'pnpm exec lhci autorun --collect.settings.preset=desktop',
    'needs: [validate, build, lighthouse]',
  ]) {
    if (!source.includes(fragment))
      errors.push(`${name}: deployment gate is missing "${fragment}"`);
  }
  const globalPermissions = source.slice(0, source.indexOf('\njobs:'));
  if (/(?:pages|id-token):\s*write/.test(globalPermissions)) {
    errors.push(`${name}: Pages permissions must be limited to the deployment job.`);
  }
}

const status = JSON.parse(await readFile('src/data/feature-status/features.json', 'utf8'));
const validStatuses = new Set(['stable', 'beta', 'limited', 'roadmap', 'unavailable']);
for (const channel of ['stable', 'beta', 'engineering']) {
  const metadata = status.imageChannels?.[channel];
  const canonical = canonicalImageChannels[channel];
  if (metadata?.image !== canonical.image) {
    errors.push(`Feature metadata has the wrong ${channel} image`);
  }
  if (metadata?.productVersion !== productVersion) {
    errors.push(
      `Feature metadata must mark ${channel} as ${productVersion}; beta cannot be the only v26 channel`,
    );
  }
  if (metadata?.architecture !== deploymentArchitecture) {
    errors.push(`Feature metadata has the wrong ${channel} deployment architecture`);
  }
}
if (status.imageChannels?.stable?.architecture !== status.imageChannels?.beta?.architecture) {
  errors.push(':latest and :beta must have identical architecture descriptions');
}
if (
  status.imageChannels?.stable?.releaseChannel !== true ||
  status.imageChannels?.beta?.releaseChannel !== true ||
  status.imageChannels?.engineering?.releaseChannel !== false
) {
  errors.push(':latest and :beta must be release channels while :dev remains engineering-only');
}

for (const feature of status.features) {
  for (const platform of ['pwa', 'ios', 'android']) {
    if (!validStatuses.has(feature[platform])) {
      errors.push(`Invalid status ${feature.id}.${platform}`);
    }
  }
}
for (const id of ['admin', 'rbac', 'plugins', 'mcp']) {
  const feature = status.features.find((candidate) => candidate.id === id);
  if (!feature || feature.pwa !== 'stable') {
    errors.push(`${id}: implemented DiscVault v26 web feature must not be beta by association`);
  }
}

for (const file of files) {
  const relative = relativePath(file);
  const content = await readFile(file, 'utf8');
  if (content.includes('ghcr.io/helmerznl/discvault:dev')) {
    errors.push(`${relative}: :dev must not be used as a deployable image`);
  }
  if (
    /(?:beta(?:\s+(?:image|channel))?\s*(?:is|uses|:|=)?\s*`:?dev`|`:?dev`[^.\n]{0,40}(?:is|as|=)\s*(?:the\s+)?beta)/i.test(
      content,
    )
  ) {
    errors.push(`${relative}: :dev is incorrectly described as beta`);
  }
  if (pageIdFor(content) === 'reference-index') {
    for (const marker of [':latest', ':beta', ':dev']) {
      if (!content.includes(marker))
        errors.push(`${relative}: channel reference is missing ${marker}`);
    }
  }
}

if (files.length !== expectedPageIds.size * 20) {
  errors.push(`Expected ${expectedPageIds.size * 20} localized pages, found ${files.length}.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Content quality valid: ${expectedPageIds.size} page IDs × 20 locales (${files.length} files); unique procedures, page markers, channel scope, native-domain boundaries, restore ordering, and feedback verified.`,
);
