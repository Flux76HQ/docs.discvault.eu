/** @type {ReadonlyArray<{ agent: string; role: string; access: 'allow' | 'disallow'; source: string }>} */
export const crawlerPolicy = [
  // OpenAI documentation verified 2026-09-20: search and user-fetch are distinct from training.
  {
    agent: 'OAI-SearchBot',
    role: 'search-citation',
    access: 'allow',
    source: 'https://developers.openai.com/api/docs/bots',
  },
  {
    agent: 'ChatGPT-User',
    role: 'user-fetch',
    access: 'allow',
    source: 'https://developers.openai.com/api/docs/bots',
  },
  {
    agent: 'GPTBot',
    role: 'training',
    access: 'disallow',
    source: 'https://developers.openai.com/api/docs/bots',
  },

  // Anthropic documentation verified 2026-09-20: search, user-fetch, and training use separate agents.
  {
    agent: 'Claude-SearchBot',
    role: 'search-citation',
    access: 'allow',
    source:
      'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
  },
  {
    agent: 'Claude-User',
    role: 'user-fetch',
    access: 'allow',
    source:
      'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
  },
  {
    agent: 'ClaudeBot',
    role: 'training',
    access: 'disallow',
    source:
      'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
  },

  // Google documentation verified 2026-09-20: Google-Extended controls both Gemini training and grounding.
  {
    agent: 'Googlebot',
    role: 'search',
    access: 'allow',
    source: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers',
  },
  {
    agent: 'Google-Extended',
    role: 'training-and-grounding',
    access: 'disallow',
    source:
      'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended',
  },

  // Microsoft documentation verified 2026-09-20: Copilot web grounding uses Bing Search.
  {
    agent: 'bingbot',
    role: 'search-citation',
    access: 'allow',
    source: 'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0',
  },

  // Perplexity documentation verified 2026-09-20: PerplexityBot is citation-only, not training.
  {
    agent: 'PerplexityBot',
    role: 'search-citation',
    access: 'allow',
    source: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
  },
  {
    agent: 'Perplexity-User',
    role: 'user-fetch',
    access: 'allow',
    source: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
  },

  // Apple documentation verified 2026-09-20: Applebot-Extended is the separate training control.
  {
    agent: 'Applebot',
    role: 'search-citation',
    access: 'allow',
    source: 'https://support.apple.com/en-us/119829',
  },
  {
    agent: 'Applebot-Extended',
    role: 'training',
    access: 'disallow',
    source: 'https://support.apple.com/en-us/119829',
  },

  // Meta documentation verified 2026-09-20: webindexer is citation, externalagent includes training.
  {
    agent: 'meta-webindexer',
    role: 'search-citation',
    access: 'allow',
    source: 'https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers',
  },
  {
    agent: 'meta-externalfetcher',
    role: 'user-fetch',
    access: 'allow',
    source: 'https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers',
  },
  {
    agent: 'meta-externalagent',
    role: 'training-and-indexing',
    access: 'disallow',
    source: 'https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers',
  },

  // Common Crawl documentation verified 2026-09-20: its open corpus permits unrestricted reuse.
  {
    agent: 'CCBot',
    role: 'open-crawl-corpus',
    access: 'disallow',
    source: 'https://commoncrawl.org/ccbot',
  },
];

export function renderRobotsTxt() {
  const groups = crawlerPolicy.flatMap(({ agent, access }) => [
    `User-agent: ${agent}`,
    access === 'allow' ? 'Allow: /' : 'Disallow: /',
    '',
  ]);

  return [
    '# Public documentation policy for docs.discvault.eu only.',
    '# DiscVault Self-hosted keeps its separate default crawler blocking; this file does not change it.',
    '# Search, citation, and user-requested retrieval are allowed. Verified training agents are blocked.',
    '# AI-readable overview: https://docs.discvault.eu/llms.txt',
    '# Full multilingual index: https://docs.discvault.eu/llms-index.txt',
    '',
    ...groups,
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://docs.discvault.eu/sitemap-index.xml',
    '',
  ].join('\n');
}
