# ADR 0001: Monorepo with pnpm workspaces and Turborepo

Status: Accepted · 2026-10-30 (spec section 3)

## Context

One founder maintains a web app, an API, a mobile shell, an admin console and shared packages. The triage engine and the zod schemas must be identical on the server (audit) and on the device (offline emergency path); drift between copies is a patient-safety risk.

## Decision

A single repository using pnpm workspaces for dependency management and Turborepo for cached, dependency-ordered task running (`build`, `lint`, `typecheck`, `test`). Workspace layout: `apps/*` and `packages/*`.

## Alternatives rejected

- **Separate repositories per app/package**: shared code would be published and versioned, so the engine on the server and on the device could silently diverge.
- **npm or yarn workspaces**: workable, but pnpm's strict, non-flat `node_modules` catches undeclared dependencies, which matters for a package that must have zero runtime dependencies.
- **Nx**: more capable, but heavier to learn and operate; Turborepo's small surface suits a solo maintainer.

## Consequences

Atomic cross-package changes and one CI pipeline. Tasks that depend on built packages declare `dependsOn: ["^build"]` in `turbo.json`.
