# ADR 0007: Database — PostgreSQL 16 with Prisma on AWS RDS (ap-south-1)

Status: Accepted · 2026-10-30 (spec sections 3, 9, 10)

## Context

Medicines, doses, consents and audit records need relational integrity and transactions. Protocol-answer payloads are semi-structured. Health data should stay in India for a DPDP-aligned data-residency posture.

## Decision

PostgreSQL 16 on RDS in ap-south-1 (Mumbai), encrypted, with automated snapshots and point-in-time recovery. Prisma ORM with reviewable, reversible migrations. JSONB for protocol payloads. UUID v7 primary keys. Sensitive columns are field-encrypted (ADR 0010). Ownership is enforced in a repository layer plus DB constraints and indexes.

## Alternatives rejected

- **MongoDB / DynamoDB**: weaker relational integrity for schedules, dose events and consents.
- **MySQL**: workable, but JSONB and the richer constraint model favour Postgres.
- **Raw SQL or a query builder only**: more boilerplate and less type safety for a solo maintainer.
- **Hosted Postgres outside India**: weakens the residency position.

## Consequences

Prisma engine binaries require a reviewed entry in `onlyBuiltDependencies` (TODO T-003). Migration runs are a gated CI job with a rollback plan (M3).
