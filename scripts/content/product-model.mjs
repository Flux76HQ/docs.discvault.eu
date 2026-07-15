export const productVersion = 'DiscVault 26';

export const deploymentArchitecture =
  'PostgreSQL 17 + persistent /data; postgres, API, worker, and MCP services';

export const imageChannels = Object.freeze({
  stable: Object.freeze({
    image: 'ghcr.io/helmerznl/discvault:latest',
    label: 'DiscVault v26 stable',
    productVersion,
    architecture: deploymentArchitecture,
  }),
  beta: Object.freeze({
    image: 'ghcr.io/helmerznl/discvault:beta',
    label: 'DiscVault v26 beta',
    productVersion,
    architecture: deploymentArchitecture,
  }),
  engineering: Object.freeze({
    image: 'ghcr.io/helmerznl/discvault:dev',
    label: 'DiscVault v26 engineering',
    productVersion,
    architecture: deploymentArchitecture,
  }),
  legacy: Object.freeze({
    image: 'ghcr.io/helmerznl/discvault:legacy',
    label: 'Previous-generation DiscVault (frozen)',
    productVersion: 'Previous DiscVault generation',
    architecture: 'Existing legacy deployment topology; not the DiscVault v26 Compose topology',
  }),
});

export const deployment = Object.freeze({
  composeProject: 'discvault',
  services: Object.freeze(['postgres', 'next-api', 'next-worker', 'next-mcp']),
  database: 'PostgreSQL 17',
  filesystem: '/data',
  apiHostPort: 6080,
  apiContainerPort: 5000,
  mcpHostPort: 6090,
  healthEndpoint: '/api/next/health',
  sourceCompose: 'app/deploy/next/docker-compose.yml@6d27c689ac2166651d2c7c74833c1ee225b37ec3',
});
