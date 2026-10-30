# ADR 0005: PWA and offline data — Serwist + Dexie outbox

Status: Accepted · 2026-10-30 (spec sections 3, 14)

## Context

Triage and the emergency screen must work offline after first load. Diary, labs and dose logs must be writable offline and sync later without duplicates or lost entries.

## Decision

Serwist (Workbox-based service-worker tooling for Next.js) precaches the shell, the active protocol, the engine, translations and the emergency page, with stale-while-revalidate for read APIs. Offline data lives in IndexedDB through Dexie. Writes go to an outbox with idempotency keys and retry/backoff. Conflict policy: dose logs are append-only; diary entries are last-write-wins by server time with client timestamps preserved. An update prompt never interrupts an in-progress triage.

## Alternatives rejected

- **Hand-written service worker**: error-prone caching logic in a safety-critical path.
- **`next-pwa`**: no longer the maintained route for the App Router.
- **localStorage for offline data**: size-limited, synchronous, no transactions or indexes.
- **Last-write-wins for everything**: could silently drop a dose log.

## Consequences

PWA reminders are unreliable on some platforms (notably iOS PWAs); the UI must say so honestly and recommend the native app (M6, M10).
