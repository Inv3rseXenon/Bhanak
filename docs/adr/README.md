# Architecture decision records

Short ADRs for every technology in spec section 3: why chosen, alternatives rejected. Status values: **Accepted** (decided by the spec or by the founder), **Proposed** (needs a check before it is binding). New decisions get the next number; do not rewrite history, supersede instead.

| #    | Decision                                                                               | Status                                  |
| ---- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| 0001 | [Monorepo: pnpm + Turborepo](0001-monorepo-pnpm-turborepo.md)                          | Accepted                                |
| 0002 | [Triage engine as a pure, dependency-free package](0002-triage-engine-pure-package.md) | Accepted                                |
| 0003 | [Frontend: Next.js static export + React stack](0003-frontend-nextjs-static-export.md) | Accepted                                |
| 0004 | [i18n and fonts](0004-i18n-and-fonts.md)                                               | Accepted                                |
| 0005 | [PWA and offline data: Serwist + Dexie outbox](0005-pwa-offline-serwist-dexie.md)      | Accepted                                |
| 0006 | [Backend: NestJS on Fastify](0006-backend-nestjs-fastify.md)                           | Accepted                                |
| 0007 | [Database: PostgreSQL 16 + Prisma, ap-south-1](0007-database-postgres-prisma.md)       | Accepted                                |
| 0008 | [Cache and queue: Redis + BullMQ](0008-cache-queue-redis-bullmq.md)                    | Accepted                                |
| 0009 | [Authentication: custom, standards-based](0009-auth-custom.md)                         | Accepted                                |
| 0010 | [Encryption: KMS envelope + field-level AES-256-GCM](0010-encryption-kms-envelope.md)  | Accepted                                |
| 0011 | [Optional LLM free-text extraction](0011-llm-optional-extraction.md)                   | Proposed (India-region check due in M7) |
| 0012 | [Notifications: on-device first, push as backup](0012-notifications.md)                | Accepted                                |
| 0013 | [Email and SMS: SES + MSG91](0013-email-sms.md)                                        | Accepted                                |
| 0014 | [Mobile: Capacitor around the web build](0014-mobile-capacitor.md)                     | Accepted                                |
| 0015 | [Infrastructure: AWS ap-south-1 + Terraform](0015-infra-aws-terraform.md)              | Accepted                                |
| 0016 | [Payments: Razorpay + RevenueCat scaffolds, off by default](0016-payments-scaffold.md) | Accepted                                |
| 0017 | [Observability: pino, OpenTelemetry, Sentry](0017-observability.md)                    | Accepted                                |
| 0018 | [Testing strategy and release gates](0018-testing-strategy.md)                         | Accepted                                |
| 0019 | [Toolchain versions and package module format](0019-toolchain-and-module-format.md)    | Accepted                                |

Template:

```
# ADR NNNN: Title
Status · Date
## Context   ## Decision   ## Alternatives rejected   ## Consequences
```
