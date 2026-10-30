# ADR 0003: Frontend — Next.js (App Router) static export with a React stack

Status: Accepted · 2026-10-30 (spec section 3)

## Context

We need SEO-friendly marketing and information pages (organic search such as "dengue symptoms in Marathi"), cheap CDN hosting in Mumbai, an offline-capable app, and the same build bundled inside Capacitor. Users are often on low-end Android phones and patchy networks.

## Decision

Next.js App Router with `output: 'export'` (static HTML/JS, no Node server), React, TypeScript, Tailwind CSS, Radix UI primitives in a shadcn/ui style (accessible by default), TanStack Query for server state, Zustand for client state, React Hook Form with zod for forms (zod schemas shared with the API). Charts (uPlot or Recharts) load lazily and never ship in the initial bundle.

## Alternatives rejected

- **Next.js with a Node server / SSR**: needs a server, breaks Capacitor bundling and offline use.
- **Plain SPA (Vite) only**: simpler, but weaker for statically pre-rendered, indexable content pages.
- **Astro**: good for content, but a second paradigm for the interactive app.
- **A heavier component library (MUI etc.)**: larger bundles against a 200 KB gz JS budget; harder to meet the accessibility and low-data goals.

## Consequences

No server-only Next features (API routes, middleware, per-request rendering): anything dynamic goes through the API. Bundle budgets are enforced in CI (Lighthouse CI, M2/M7).
