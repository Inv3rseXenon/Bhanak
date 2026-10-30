# ADR 0008: Cache and queue — Redis (ElastiCache) with BullMQ

Status: Accepted · 2026-10-30 (spec sections 3, 8.5, 12)

## Context

We need sliding-window rate limits, OTP throttling, a revoked-session set for JWT checks, and a reliable delayed-job queue for reminders, escalations and notifications with retries and dead-lettering.

## Decision

Redis on ElastiCache (ap-south-1). BullMQ for queues: delayed jobs for reminders (due, +10 min repeat, +30 min MISSED and caregiver notification), retries with backoff, and a dead-letter path. Workers shut down gracefully, finishing in-flight reminder jobs.

## Alternatives rejected

- **Postgres-only job queue**: possible, but adds load to the primary datastore and rate limiting is awkward.
- **AWS SQS + EventBridge Scheduler**: robust, but delay granularity and per-job retry semantics need more glue, and rate limiting still needs Redis.
- **In-memory limits**: not shared across instances; lost on restart.

## Consequences

Redis is a hard dependency for auth (revocation list, rate limits): failure behaviour must be specified in M3. The offline emergency path must never depend on it.
