# Contributing

1. Install dependencies and hooks with `pnpm install --frozen-lockfile && pnpm hooks:setup`.
2. Edit the canonical content data or focused components. Follow existing semantic tokens and
   accessible patterns.
3. Keep every page in all 20 locales. Translate prose and headings; do not translate commands,
   configuration keys, product names, URLs, or status values.
4. Set `products`, `platforms`, `channels`, `minVersion`, `sourceRepos`, and `lastVerified`.
   Confirm claims in working code or a release; mark incomplete work `beta`, `roadmap`, or
   `unavailable`.
5. Run `pnpm check && pnpm build && pnpm smoke`.

Protected website/build/deploy changes require `pnpm version:bump --patch`; Markdown-only
changes are exempt. Never commit `.env`, credentials, personal data, generated signed URLs, or
private screenshots. Use descriptive pull requests and do not merge your own release change.
