# Bhanak

A health-triage and medicine-management product for dengue and common monsoon fevers in India. It helps a person or family decide **how urgently to seek care**, what to watch for, and how to stay on track with medicines. It triages and informs; it does not diagnose, prescribe or recommend doses.

> **Status: milestone M0 (monorepo + tooling).** There is no app yet and nothing here is medically reviewed. See [docs/PROGRESS.md](docs/PROGRESS.md).

- Build specification (source of truth): [docs/SPEC.md](docs/SPEC.md)
- Working rules and commands: [CLAUDE.md](CLAUDE.md)
- Architecture decisions: [docs/adr/](docs/adr/README.md)
- Open work and review items: [docs/TODO.md](docs/TODO.md)

## Set up (about 5 minutes)

Requirements: Node.js 24 LTS (see `.nvmrc`), pnpm 10 (the exact version is pinned in `package.json` → `packageManager`), Git.

```bash
corepack enable          # or: npm install -g pnpm@10.34.9
pnpm install
pnpm check               # format, brand check, lint, typecheck, test, build
```

If you cannot install software system-wide (locked-down Windows laptop), use a portable Node.js zip from nodejs.org, put its folder first on `PATH`, then `npm install -g pnpm@10.34.9`.

Optional but recommended: install [gitleaks](https://github.com/gitleaks/gitleaks) so the pre-commit hook can scan staged changes for secrets (CI always scans).

## Layout

```
apps/            web, api, mobile, admin      (added in later milestones)
packages/        shared, triage-engine, protocols, ui, drug-data
infra/terraform  AWS (ap-south-1) infrastructure
docs/            spec, ADRs, regulatory + clinical review checklists
tests/scenarios  clinical scenarios (M1)
tools/           repo scripts (brand-string check)
```

## Everyday commands

| Command            | What it does                                         |
| ------------------ | ---------------------------------------------------- |
| `pnpm build`       | Build all packages (Turborepo, cached)               |
| `pnpm lint`        | ESLint (type-aware, strict)                          |
| `pnpm typecheck`   | `tsc --noEmit` in every package                      |
| `pnpm test`        | Vitest in every package                              |
| `pnpm format`      | Prettier write (`format:check` to verify)            |
| `pnpm check:brand` | Fails on hard-coded brand strings outside `brand.ts` |
| `pnpm check`       | Everything above, as CI runs it                      |

## Conventions

- TypeScript strict everywhere; Conventional Commits; small commits.
- Brand strings come only from `packages/shared/src/brand.ts`.
- Clinical content is never invented: cite a source or mark `TODO_DOCTOR_REVIEW` (and `TODO_PHARMACIST_REVIEW` for drug facts). Unverifiable citations are `[CITATION NEEDED]`.
- The triage engine (`packages/triage-engine`) is pure and dependency-free; ESLint enforces no `Date.now()`, no randomness, no I/O and only relative imports there.
