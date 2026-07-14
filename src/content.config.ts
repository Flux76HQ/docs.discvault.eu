import { defineCollection, z } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const sourceRepository = z.enum([
  'helmerzNL/DiscVault',
  'helmerzNL/DiscVaultApp',
  'Flux76HQ/DiscVault-AndroidApp',
  'helmerzNL/DiscVault.EU',
  'Flux76HQ/App-Guidance',
]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        pageId: z.string().min(1),
        products: z.array(z.enum(['server', 'pwa', 'ios', 'android', 'docs'])),
        platforms: z.array(z.enum(['docker', 'unraid', 'web', 'ios', 'android', 'all'])),
        channels: z.array(z.enum(['stable', 'beta', 'roadmap'])),
        minVersion: z.string(),
        sourceRepos: z.array(sourceRepository).min(1),
        lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    }),
  }),
  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema(),
  }),
};
