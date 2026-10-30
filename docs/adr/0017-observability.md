# ADR 0017: Observability — pino, OpenTelemetry, Sentry

Status: Accepted · 2026-10-30 (spec sections 3, 16, 21)

## Context

We must spot over- and under-triage, fail-safe screens, reminder failures and auth anomalies, without ever putting personal or health data into logs, traces or analytics.

## Decision

pino structured logs that are PII-free by construction; OpenTelemetry traces that exclude request bodies; Sentry with strict `beforeSend` scrubbing; uptime checks and alerts (spike in fail-safe screens, queue backlog, reminder failures, auth anomalies). Product analytics are first-party only: a privacy-preserving event table with no device identifiers and no health values, with an opt-out in settings. No third-party analytics SDKs. The triage-level distribution is instrumented so a doctor can calibrate thresholds; rules are never relaxed automatically.

## Alternatives rejected

- **Google Analytics / Mixpanel / similar SDKs**: third-party trackers on health screens are prohibited (spec section 9).
- **Logging request/response bodies for debugging**: would capture health data.
- **Vendor APM with default capture**: risk of capturing payloads.

## Consequences

Log and event schemas are allowlists, not denylists. Dashboards in the admin console are k-anonymised (M8).
