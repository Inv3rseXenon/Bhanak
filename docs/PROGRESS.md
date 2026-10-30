# Progress

A fresh session can resume from this file plus [CLAUDE.md](../CLAUDE.md) and [docs/SPEC.md](SPEC.md). Update after every milestone.

## Current state

- **Last completed milestone: M0** (monorepo, tooling, CI skeleton, CLAUDE.md, brand.ts, ADRs).
- **Next: M1** (triage engine + protocol schema + dengue protocol v0.1.0 + 150 scenarios + property tests + coverage gate). **Blocked on founder input F-002**: the source PDFs must be placed in `docs/sources/` first (spec 5.2: never rely on memory for thresholds).
- Working mode: stop after each milestone and wait for the founder's go-ahead.

## M0 — done

Built:

- pnpm 10 + Turborepo workspace; TypeScript 6.0 strict (+ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); ESLint 10 type-aware strict config; Prettier; Husky + lint-staged pre-commit.
- Packages (skeletons except `shared`): `shared` (brand.ts, constants), `triage-engine`, `protocols`, `ui`, `drug-data`. Apps, infra and scenarios directories hold only READMEs.
- ESLint rules that enforce engine purity in `packages/triage-engine/src` (no `Date.now`, no randomness, no I/O globals, relative imports only). Verified by planting violations.
- `pnpm check:brand`: fails on hard-coded brand strings outside `brand.ts`; `--strict` also fails on unresolved placeholders. Verified by planting a violation.
- GitHub Actions CI: format, brand, lint, typecheck, test, build, gitleaks, `pnpm audit --audit-level=high`. Dependabot for npm + Actions.
- ADRs 0001-0019 for the stack (`docs/adr/`), intended-use + regulatory notes (with `[CITATION NEEDED]`), review checklists, TODO register.

Decisions / deviations (all recorded in ADR 0019):

- Node 24 LTS rather than 26 (26 only just entered LTS; ecosystem maturity).
- TypeScript 6.0.x, not 7 (typescript-eslint does not support 7 yet).
- Internal packages are built with `tsc` to ESM `dist/` (NodeNext, `.js` import suffixes) and consumed via `exports`.
- Spec section 26 says "complete every milestone in a batch"; section 0 says first session = M0 only. Followed the explicit first-session instruction.

Environment notes (founder's machine): winget is blocked by Group Policy, so Node 24.22.2 (checksum-verified, from nodejs.org) and pnpm 10.34.9 were installed portably under `%USERPROFILE%\tools\node` with no PATH/system changes. See CLAUDE.md for the PATH snippet.

## Open questions for the founder

1. F-002: can you provide the three source PDFs (NCVBDC 2023, WHO 2009, CDC Clinical Care of Dengue) for `docs/sources/`? M1 cannot start clinical content without them.
2. F-003: who is the reviewing doctor (name, registration number)? Until then every protocol stays `DRAFT`.
3. Is the GitHub repository created yet (for CI)? Nothing has been pushed anywhere.
4. Do you want me to try to locate the CDSCO 2026 document title/number now (C-001), or leave it for the regulatory-lawyer step?
