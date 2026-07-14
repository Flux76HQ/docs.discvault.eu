# DiscVault documentation

Static, localized product documentation for [DiscVault](https://discvault.eu), built with
Astro, Starlight, TypeScript, and pnpm. Production targets
<https://docs.discvault.eu> on GitHub Pages.

## Requirements

- Node.js 22 LTS or 24
- Corepack with pnpm 10.13.1

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm hooks:setup
```

If Corepack cannot install a global shim, prefix local commands with `corepack`, for example
`corepack pnpm dev`.

## Run, verify, and stop

```bash
pnpm dev
```

Open <http://localhost:4321>. Stop the foreground server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.
A production-equivalent local demo is:

```bash
pnpm check
pnpm build
pnpm smoke
pnpm preview
```

Health-check the built site with `curl --fail --head http://localhost:4321/` or verify
`dist/index.html` exists. The site has no runtime backend or database.

## Content and architecture

- `src/content/docs/`: 34 pages in each of 20 locales; English lives at `/`, translations at
  `/<locale>/`.
- `src/components/`: status, route, feature-matrix, and SEO components.
- `src/data/feature-status/features.json`: machine-readable PWA/iOS/Android status.
- `src/styles/`: Chrome & Blue v3.1 semantic tokens and responsive styling.
- `public/brand/`: permitted assets imported from `Flux76HQ/App-Guidance`.
- `scripts/`: generation, parity, content, link, smoke, hook, and semver checks.

Page metadata lives in `scripts/generate_content.mjs`. Page-specific prerequisites, ordered
steps, channel facts, checks, recovery notes, and executable blocks live in
`scripts/content/procedures.mjs`; shared translated action/UI phrases live in
`scripts/content/procedure-locales.mjs`. The canonical DiscVault v26 image channels and shared
PostgreSQL deployment architecture live in `scripts/content/product-model.mjs`. Run
`pnpm content:generate` after changing those sources; it deterministically replaces all generated
MDX.

`PUBLIC_FEEDBACK_URL` optionally changes the public feedback link. It must be an HTTPS URL and
falls back to this repository’s GitHub Issues form. The docs `.env.example` is build configuration
only and must never be copied to a DiscVault deployment.

## Version and updates

`VERSION` and `package.json` start at `0.1.0`. Markdown-only changes need no bump. Changes to
runtime, components, styles, scripts, CI, build, or deployment require:

```bash
pnpm version:bump --patch
```

Use `--minor` or `--major` when appropriate. The guard prints the exact remediation when a
protected change has no bump. Never add secrets to `.env.example` or any `PUBLIC_*` variable.

## Deployment and rollback

Pull requests run all validation and a production build. Successful pushes to `main`, version
tags, and manual dispatches deploy through the protected `github-pages` environment. A
`vX.Y.Z` tag must match `VERSION`; the release workflow stores the static build artifact.

To roll back, open **Actions → Deploy GitHub Pages → Run workflow**, choose the desired tag,
and deploy it. Alternatively rerun that tag’s successful deployment job. Do not rewrite a
release tag. DNS must keep `docs.discvault.eu` pointed at GitHub Pages; `public/CNAME` is the
repository source of truth.

## Factual sources

Documentation is verified against the read-only source repositories listed in page metadata.
Implemented behavior, beta behavior, and roadmap items must stay distinct. Never publish API
tokens, passwords, personal data, or signed download URLs.
