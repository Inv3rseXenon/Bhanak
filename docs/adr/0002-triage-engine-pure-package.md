# ADR 0002: Triage engine as a pure, dependency-free package

Status: Accepted · 2026-10-30 (spec sections 2, 3, 5)

## Context

Urgency decisions are life-safety critical. They must work with no account, no network and no LLM, must be reproducible for audit, and must exist in exactly one place.

## Decision

`packages/triage-engine` is pure TypeScript with **zero runtime dependencies**: no I/O, no randomness, no `Date.now()` (time is injected as `now`). `evaluate(input, protocol, now)` returns a result containing protocol version, engine version and an input hash. The same package runs on the server and in the browser/device. Clinical thresholds are data in `packages/protocols`, never code. Level is the maximum over all fired rules; rules only raise urgency.

Enforced mechanically: ESLint restricts, inside the engine's `src`, `Date.now`, `Math.random`, zero-argument `new Date()`, I/O globals and any non-relative import.

## Alternatives rejected

- **Server-side only triage**: fails offline and makes an outage a patient-safety event.
- **Separate implementations per platform**: guaranteed drift.
- **An LLM, or an ML model, deciding urgency**: non-deterministic, unauditable, and able to be talked into softening urgency by prompt injection.
- **Using a validation library (e.g. zod) inside the engine**: breaks the zero-dependency rule; validation happens at the boundary in `shared`.

## Consequences

Easy exhaustive testing: scenarios, property tests and a 100% branch-coverage gate (M1). Any engine dependency requires a new ADR.
