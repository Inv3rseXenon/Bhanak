# ADR 0019: Toolchain versions and package module format

Status: Accepted · 2026-10-30 (M0 implementation decisions within spec sections 0 and 3)

## Context

The spec asks for Node LTS, TypeScript strict, pnpm + Turborepo, ESLint, Prettier and Husky. Versions and module format were left open.

## Decision

- **Node 24 (Active LTS "Krypton")**, pinned via `.nvmrc` and `engines`. Node 26 reached LTS only days before M0; 24 has the more mature ecosystem support (NestJS, Prisma, Capacitor tooling). Revisit when 26 has matured.
- **pnpm 10.34.9**, pinned in `packageManager`. Dependency build scripts are blocked unless listed in `onlyBuiltDependencies` (empty for now).
- **TypeScript 6.0.x**, not 7. typescript-eslint 8.x declares a peer range below 6.1, so TypeScript 7 is unsupported by our linter (TODO T-001).
- **ESLint 10** flat config with type-aware `strictTypeChecked` + `stylisticTypeChecked`; Prettier; Husky + lint-staged. Strict compiler flags: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **Vitest 5** for tests.
- **Internal packages are ESM, compiled with `tsc` to `dist/`**, resolved with `module: NodeNext` (relative imports carry `.js` suffixes) and exposed through `exports`. Turborepo builds dependencies first (`dependsOn: ["^build"]`).

## Alternatives rejected

- **Node 26 now**: too new for the dependency set we rely on.
- **TypeScript 7 now**: unsupported by typescript-eslint; we would lose type-aware lint rules that guard the engine's purity.
- **Packages exporting raw `.ts` (just-in-time)**: simpler locally, but NestJS and Node consumers would need a transpile step for workspace code; built ESM works everywhere, and Node 24 can `require()` ESM.
- **Dual CJS/ESM builds**: unnecessary complexity given Node 24's `require(esm)`.

## Consequences

Every package must be built before dependants typecheck or test; Turborepo handles this and caches it. If NestJS (M3) hits CommonJS/ESM friction, revisit here with a new ADR.
