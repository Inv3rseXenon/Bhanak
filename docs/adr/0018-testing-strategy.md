# ADR 0018: Testing strategy and release gates

Status: Accepted · 2026-10-30 (spec section 22)

## Context

A wrong "you are fine" can kill someone. Quality gates must make unsafe changes impossible to merge, not merely discouraged.

## Decision

- **Vitest** for unit tests; **fast-check** for property tests of the engine (adding a danger sign, an UNKNOWN answer, or a risk factor never lowers the level; same input gives the same output; no throw on any schema-valid input).
- **Scenario suite** in `tests/scenarios`: at least 150 JSON clinical scenarios; the build fails if a computed level is lower than `minimumLevel`.
- **Supertest** (API), **Playwright** (e2e including offline triage), **axe-core** (accessibility), **k6** (load), **OWASP ZAP baseline** (security).
- **CI release gates** that must fail the build: any scenario failure; engine branch coverage below 100%; unreviewed protocol in prod config; banned-claim words in UI copy; a11y violations; secrets in bundles; high/critical vulnerabilities.

## Alternatives rejected

- **Jest**: Vitest is faster and shares Vite/TypeScript config with the web app.
- **Example-based tests only for the engine**: cannot prove monotonicity properties.
- **Manual QA as the safety net**: not repeatable.

## Consequences

Rows in `docs/TODO.md` (G-001 to G-009) track which gates are live; M0 has lint, typecheck, unit, brand check, secret scan and the dependency audit.
