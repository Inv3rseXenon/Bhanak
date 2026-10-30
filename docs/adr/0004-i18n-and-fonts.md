# ADR 0004: Internationalisation and fonts

Status: Accepted · 2026-10-30 (spec sections 1, 3, 17)

## Context

Launch languages are English, Hindi and Marathi. Clinical strings in hi/mr must be flagged `needs_review` until a native-speaking doctor approves them. The app is statically exported and also bundled in Capacitor, so there is no server to negotiate locale.

## Decision

i18next with react-i18next and lazy-loaded namespaces, working fully client-side. All strings are externalised and keyed; clinical strings are versioned with the protocol and carry a `needs_review` flag that drives a visible "translation under review" badge. Fonts are self-hosted and subsetted with `font-display: swap`: Bricolage Grotesque (headlines), Inter (body), Noto Sans Devanagari (hi/mr). ICU plurals; Indian digit grouping (25,000; 1,50,000); dates `dd MMM yyyy`.

## Alternatives rejected

- **next-intl or other server-dependent i18n**: relies on server rendering/middleware that static export and Capacitor do not provide.
- **Google Fonts at runtime**: extra third-party requests (privacy, latency, offline failure).
- **Hard-coded strings in components**: makes clinical review and translation tracking impossible.

## Consequences

Brand strings are interpolated from `brand.ts`, never typed into translation files (enforced by `pnpm check:brand`). Font subsetting for Devanagari needs care (M2).
