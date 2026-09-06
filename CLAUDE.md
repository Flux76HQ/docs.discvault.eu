# CLAUDE.md — DiscVault documentation site

Instructions for Claude Code (and any AI agent) working in this repository.

## About this repository

The static, localized product documentation for DiscVault, built with Astro, Starlight,
TypeScript and pnpm, published to <https://docs.discvault.eu> on GitHub Pages. It
documents the product for its users; it is not the place for engineering guidance or for
decisions between systems — those belong in App-Guidance (see below).

## Branches

`main` is the integration branch and there is no promotion model here. Branch feature and
fix work off `main`, open a pull request into `main`, and never commit to `main` directly.

## Versioning and localization

`VERSION` is the source of truth and the pre-commit hook in `.githooks/` checks it.
Documentation-only edits (`*.md`, `*.txt`) are exempt from the bump.

This site is localized. A page added or changed in one locale is not finished until the
other locales are accounted for — either translated, or deliberately and visibly left for
later. A locale that silently keeps the old text is worse than one that has none, because
nothing signals to the reader that what they are looking at is stale.

## The shared instructions live in App-Guidance

The engineering guidance for every Flux76 project lives in
**[`Flux76HQ/App-Guidance`](https://github.com/Flux76HQ/App-Guidance)**, not in this
repository. Read it before starting work here; this file records only what is specific
to this repo.

| What you need                                                                                  | Where it is                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| The enforceable baseline — versioning, CI guardrails, secrets, release discipline, PR workflow | [`shared/guidelines/project-baseline.md`](https://github.com/Flux76HQ/App-Guidance/blob/main/shared/guidelines/project-baseline.md) |
| Which document leads per domain, and where that document lives                                 | [`AUTHORITY.md`](https://github.com/Flux76HQ/App-Guidance/blob/main/AUTHORITY.md)                                                   |
| How to work inside App-Guidance itself (branch, PR, when the `VERSION` bump applies)           | [`CLAUDE.md`](https://github.com/Flux76HQ/App-Guidance/blob/main/CLAUDE.md)                                                         |
| DiscVault specs, the normative sync contract, and cross-repo change specs                      | [`projects/discvault/`](https://github.com/Flux76HQ/App-Guidance/tree/main/projects/discvault)                                      |

Two baseline rules apply here from the first commit, so they are worth naming rather
than leaving to be discovered:

- **A new feature gets a fresh worktree and a separate session**
  ([§16](https://github.com/Flux76HQ/App-Guidance/blob/main/shared/guidelines/project-baseline.md#16-feature-work-gets-its-own-workspace-and-its-own-session)).
  One feature, one workspace, one session. A checkout is on one branch at a time, so two
  features in one directory share a working tree and an index, and the first `git add -A`
  mixes them into a single commit that nothing can separate afterwards. Say so _before_
  the first edit, not after. It is a warning, not a veto, and it is about features — a
  fix, a refactor or a chore inherits the workspace it is given.
- **An agent carries its own PR to merge**
  ([§8](https://github.com/Flux76HQ/App-Guidance/blob/main/shared/guidelines/project-baseline.md#8-agent-pull-requests-standing-authorisation-to-merge)).
  Standing authorisation across every Flux76 repository, bounded and revocable: watch the
  PR, drive failing checks to green, merge once every check passes — without asking again
  at the green light. "All green" is the condition, not a formality.

**Precedence.** On anything shared — versioning, CI, secrets, the PR workflow, the
DiscVault contracts — App-Guidance leads and this file must not contradict it. On this
repository's own branch topology, build and release flow, this file leads. When a session
settles something that outlives its own PR — a contract between systems, an ownership or
precedence rule, a deliberate policy and why — write it up in App-Guidance in the same
change set, on a branch and through a pull request, never straight onto its `main`.
