# CLAUDE.md — Bhanak

Condensed from [docs/SPEC.md](docs/SPEC.md) (the source of truth). If this file and the spec disagree, the spec wins, and **spec section 2 (safety principles) beats everything**. Keep both updated; log progress in [docs/PROGRESS.md](docs/PROGRESS.md).

## What this is

Bhanak ("a faint first hint that something is coming"; tagline "Bhanak pehle, khatra baad mein." / "Catch the first hint.") is a **life-safety** health-triage and medicine-management product. V1 scope: dengue and common monsoon fevers in India. It **triages and informs**. It does **not** diagnose, prescribe, or recommend doses. A wrong "you are fine" can kill someone: when in doubt, be more cautious and **ask the founder before making any clinical assumption**.

## How to work

- Work **milestone by milestone** (list below). After each: run all checks, fix failures, write a short summary (built, assumptions, open TODOs, "what I need from the founder", manual smoke script), update `docs/PROGRESS.md`, commit, then **STOP and wait for the go-ahead**.
- Batches: A = M0,M1,M2 · B = M3,M4 · C = M5,M6 · D = M7–M11. First session: **M0 only**, then stop. (Spec section 26 batch rule vs. section 0 first-session rule: the explicit first-session instruction wins.)
- **Never invent** clinical facts, drug facts, document titles, section numbers, regulation numbers or URLs.
  - Clinical thresholds/questions/messages must trace to a cited source (below) or be marked `TODO_DOCTOR_REVIEW` and listed in `docs/clinical-review-checklist.md`.
  - Drug facts: `TODO_PHARMACIST_REVIEW` (listed in `docs/pharmacist-review-checklist.md`).
  - Unverifiable citation: write `[CITATION NEEDED]` and list it in `docs/TODO.md`.
  - If the source PDFs are not in `docs/sources/`, STOP and ask the founder. Never use memory or blogs for thresholds.
  - Don't paste long passages from copyrighted guidelines: summarise, cite document + section.
- **No silent stubs.** Unfinished work = visible entry in `docs/TODO.md`; if safety-relevant it must make the build fail (release gates).
- Git remote: `origin` = https://github.com/Inv3rseXenon/Bhanak.git (branch `main`). The founder wants work committed and pushed there. Never run `husky` by hand with arguments (it treats them as the hooks directory); hooks path must stay `.husky/_`. When running pnpm/turbo from a piped shell, redirect output to a file: a lingering child process can hold the pipe open.
- Boring technology; simple, typed, tested, documented; solo-maintainable.
- Commits: Conventional Commits, small. Pre-commit (Husky): lint-staged, typecheck + unit tests on changed packages, gitleaks if installed.

## Safety rules (spec section 2 — summary; read the original)

1. Triage works with **no account, no internet (after first load), no LLM**.
2. Urgency comes **only** from the deterministic, pure, dependency-free rules engine. The LLM can never set, change, lower or soften urgency.
3. **Fail toward caution**: unknown / missing / contradictory / "not sure" on danger questions raises urgency, never lowers it. Engine throws or times out → fail-safe screen (exact text in spec 2.3).
4. Exactly four levels: `EMERGENCY_NOW`, `SEE_DOCTOR_TODAY`, `TEST_AND_MONITOR`, `HOME_CARE_WITH_TRIGGERS`. Every result shows warning signs + "return/go immediately if" triggers.
5. Never say "you do not have dengue" / "you are fine". Allowed: "no danger signs reported right now; this can change quickly".
6. Special-caution groups raise urgency (infants, children, pregnancy, ≥65, diabetes, hypertension, heart/kidney/liver/blood disorders, anticoagulants, obesity, alone/far from hospital).
7. Never present "fever has gone" as good news on illness days 3–7 (critical phase).
8. Never recommend doses or new medicines; only schedule what a doctor prescribed. NSAID/aspirin "check with your doctor or pharmacist" prompt (wording `TODO_DOCTOR_REVIEW`).
9. Emergency guidance is always free: never behind login, paywall, consent wall, ad or A/B test.
10. Every triage result records protocol version + engine version + input hash.
11. Permanent disclaimer: "Guidance, not a diagnosis. In an emergency call 108 or 112."
12. Regulatory: `docs/intended-use.md` (triage guidance, not diagnosis/treatment; cite the CDSCO 2026 medical-device-software guidance — exact title/number to be verified on cdsco.gov.in) and `docs/regulatory-notes.md` (lawyer must confirm before launch).

## Triage engine rules (spec 5)

- `packages/triage-engine`: pure TS, **zero runtime deps**, no I/O, no randomness, no `Date.now()` (time injected). `evaluate(input, protocol, now) → TriageResult`.
- Level = **MAX** over fired rules; rules only raise. UNKNOWN on a danger question fires an "uncertain danger" rule (≥ +1 level, capped at SEE_DOCTOR_TODAY unless question is in `unknown_is_emergency`: can-keep-fluids-down, drowsy/confused, bleeding).
- All thresholds live in `packages/protocols/dengue/v0.1.0.json`, never in code; each `TODO_DOCTOR_REVIEW` until signed off. Protocol has `reviewStatus: DRAFT | REVIEWED` + reviewer name/date/registration no.
- Release gate: prod build + API refuse a non-`REVIEWED` protocol unless `ALLOW_DRAFT_PROTOCOL=true` (dev/staging only). Drafts show "TEST VERSION, NOT MEDICALLY REVIEWED" on every result.
- Sources (only permitted basis): (a) National Guidelines for Clinical Management of Dengue Fever 2023, NCVBDC/MoHFW; (b) WHO Dengue guidelines 2009 + updates; (c) CDC Clinical Care of Dengue. Cite doc + section in each rule's `source`.
- 100% branch coverage on this package; ≥150 scenarios in `tests/scenarios` (build fails if computed level < `minimumLevel`); fast-check property tests (adding danger sign / UNKNOWN / risk factor never lowers level; deterministic; never throws).
- No entitlement or feature flag may alter triage output (unit-tested).

## Stack (decisions + reasoning in `docs/adr/`)

pnpm workspaces + Turborepo · TypeScript strict · Next.js App Router static export + React + Tailwind + Radix + TanStack Query + Zustand + RHF + zod · i18next (en/hi/mr, lazy namespaces) · Serwist PWA + Dexie outbox · NestJS + Fastify · PostgreSQL 16 + Prisma (ap-south-1) · Redis + BullMQ · custom auth (Argon2id + pepper, jose EdDSA JWT 10 min, opaque rotating refresh tokens with reuse detection, otplib TOTP) · AWS KMS envelope + AES-256-GCM field encryption · Anthropic Claude (optional, consent-gated, extraction only) · FCM/Web Push/Capacitor local notifications/MSG91 · Capacitor mobile · AWS + Terraform · Razorpay/RevenueCat scaffolds (off) · pino/OTel/Sentry · Vitest, fast-check, Supertest, Playwright, axe-core, k6, ZAP.

## Repo layout

```
apps/web  apps/api  apps/mobile  apps/admin          (added by their milestones)
packages/{triage-engine,protocols,shared,ui,drug-data}
infra/terraform   docs/   tests/scenarios   tools/
```

**Brand strings live only in `packages/shared/src/brand.ts`** (name, tagline, support email, legal entity, grievance officer, domain). `pnpm check:brand` fails on hard-coded brand strings elsewhere in source.

## Copy rules

Brand voice: warm, plain, calm; never scary or jokey about illness. Languages en/hi/mr, all strings externalised; hi/mr clinical strings carry `needs_review` until a native-speaking doctor approves (visible "translation under review" badge). **Banned in UI copy / store listings / notifications** (CI check, user-facing copy only, allowlist for negations like "does not diagnose", "not a diagnosis"): diagnose, detect, cure, AI doctor, guaranteed, "you are fine". Notifications never show medicine names unless the user opts in. Unknown facts → `[PLACEHOLDER]`. Never name the people who died in the origin story.

## Commands

```bash
pnpm install            # install (Node >=24, pnpm 10 — see packageManager)
pnpm build              # turbo run build
pnpm lint               # turbo run lint
pnpm typecheck          # turbo run typecheck (builds deps first)
pnpm test               # turbo run test
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .
pnpm check:brand        # no hard-coded brand strings outside brand.ts
pnpm check              # format:check + check:brand + lint + typecheck + test + build
```

**This machine (Windows, no admin, winget blocked by Group Policy):** Node/pnpm are portable installs under `%USERPROFILE%\tools\node`. In a new shell run, PowerShell: `$env:Path = "$env:USERPROFILE\tools\node;" + $env:Path` · Git Bash: `export PATH="$USERPROFILE/tools/node:$PATH"`.

## Release gates (CI must fail on)

Any scenario failure · engine branch coverage <100% · unreviewed protocol in prod config · banned-claim words in UI copy · a11y violations (axe) · secrets in bundles · high/critical vulnerabilities. Budgets: initial JS ≤200 KB gz on triage route, LCP ≤2.5 s on throttled 3G, CLS <0.1.

## Milestones (STOP after each)

| #   | Scope                                                                                                                                    | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| M0  | Monorepo, tooling, CI skeleton, CLAUDE.md, brand.ts, ADRs for the stack                                                                  | done   |
| M1  | triage-engine + protocol schema + dengue protocol v0.1.0 (DRAFT, cited) + 150 scenarios + property tests + coverage gate                 | done   |
| M2  | Anonymous triage web app (no backend): guided intake, result, emergency screen, i18n en/hi/mr, a11y baseline, DRAFT banner, landing page | next   |
| M3  | API foundation: Prisma, auth (signup/OTP/login/refresh/sessions/reset/TOTP), RBAC, audit, rate limits, encryption — all tested           |        |
| M4  | Accounts UX: profile, dependents, emergency contacts, consents, claim anonymous results, export/delete                                   |        |
| M5  | Diary, labs, episode view, doctor-summary PDF                                                                                            |        |
| M6  | Medicine manager, schedules, dose events, flagged warnings, web-push reminders, caregiver alerts                                         |        |
| M7  | PWA offline hardening + outbox sync + install flow + perf budgets; optional consent-gated LLM free-text extraction                       |        |
| M8  | Admin/review console + protocol workflow + release gates                                                                                 |        |
| M9  | Hardening: threat-model fixes, scans, load tests, observability, backup/restore drill, privacy docs                                      |        |
| M10 | Capacitor apps: native reminders, secure storage, store assets + compliance docs                                                         |        |
| M11 | Monetisation scaffolding, B2B hooks, marketing-site polish → then `docs/launch-readiness.md`                                             |        |

## Definition of done (every milestone)

Typecheck, lint, all tests green · every TODO has an entry in `docs/TODO.md` · no secrets · docs updated · manual smoke script in the summary · list of assumptions and questions for the founder.

## Triage engine and protocol: working notes (M1)

- Engine API: `evaluate(input, protocol, now)` in `@bhanak/triage-engine`. Protocol data: `packages/protocols/dengue/v0.1.0.json` (DRAFT), loaded with `parseProtocol` from `@bhanak/protocols`. Strings: `v0.1.0.strings.en.json`.
- Every protocol item has `basis` (SOURCE / SPEC_PROVISIONAL / SAFETY_DEFAULT), `review` and cited `sourceRefs`. Edit flow and rules: `packages/protocols/README.md`. After editing run `pnpm --filter @bhanak/protocols generate` (refreshes the JSON Schema and the generated list in `docs/clinical-review-checklist.md`).
- Scenarios: edit `tests/scenarios/build-dengue-scenarios.mjs`, run `node tests/scenarios/build-dengue-scenarios.mjs`, commit both files. Expectations come from the sources and spec, never from engine output.
- The engine's `test` script runs coverage and fails below 100%. Do not add `/* v8 ignore */`; restructure the code or add a test.
- Never silently approve clinical content: nothing is marked `REVIEWED` until a named doctor signs off.
- The source PDFs live in `docs/sources/` locally but are git-ignored (copyright) until the founder confirms the repo is private.
- On this machine run pnpm from PowerShell; the pnpm shim misbehaves under Git Bash.
