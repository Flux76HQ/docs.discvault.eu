module.exports = {
  ci: {
    collect: {
      startServerCommand: 'corepack pnpm preview --host 127.0.0.1',
      startServerReadyPattern: 'Local',
      url: [
        'http://127.0.0.1:4321/',
        'http://127.0.0.1:4321/install/docker-compose/',
        'http://127.0.0.1:4321/el/install/reverse-proxy-passkeys/',
      ],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
