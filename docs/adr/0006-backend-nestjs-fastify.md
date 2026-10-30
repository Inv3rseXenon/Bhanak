# ADR 0006: Backend — NestJS on the Fastify adapter

Status: Accepted · 2026-10-30 (spec sections 3, 11)

## Context

Authentication, authorisation, auditing and validation must be consistent cross-cutting concerns, maintained by one person, on small low-memory instances.

## Decision

NestJS (TypeScript) on a current Node LTS with the Fastify adapter. Modules, guards, interceptors and DI make auth, RBAC and audit first-class. OpenAPI is generated from zod via nestjs-zod, and a typed client is generated for the frontend. REST under `/v1`, RFC 7807 errors, `Idempotency-Key` on writes. API and BullMQ worker are separate entrypoints of the same app.

## Alternatives rejected

- **Express with hand-assembled middleware**: no enforced structure; easy to forget a guard on one route.
- **Fastify alone**: fast, but leaves architecture and DI to be invented.
- **tRPC**: excellent for TypeScript-only clients, but we want a published OpenAPI contract for a mobile shell, caregivers and future integrations.
- **A BaaS (Firebase/Supabase)**: conflicts with the custom auth and India data-residency requirements (ADR 0009, 0015).

## Consequences

Module format interop with the ESM-only workspace packages must be settled in M3 (see ADR 0019). Every route needs an owner-scoped query and an IDOR test.
