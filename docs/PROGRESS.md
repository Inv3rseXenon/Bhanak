# Progress

A fresh session can resume from this file plus [CLAUDE.md](../CLAUDE.md) and [docs/SPEC.md](SPEC.md). Update after every milestone.

## Current state

- **Last completed milestone: M2** (anonymous triage web app) **plus the private tester release** (`TESTER_MODE` build and Cloudflare Pages / Netlify runbook). Built on M1 (triage engine, protocol schema, dengue protocol v0.1.0 DRAFT, 163 scenarios).
- **Next: M3** (API foundation). Not started. Wait for the founder's go-ahead and answers to the open questions below.
- The protocol is still a **DRAFT**: no doctor has reviewed it. Nothing public can be built (`pnpm build:release` refuses). Hindi and Marathi are first drafts behind a "translation under review" badge.
- Working mode: stop after each milestone and wait for the founder's go-ahead.

## M2 and tester release — done

Built:

- `apps/web` (Next.js 16 static export, React 19, plain CSS; no Tailwind, Radix or i18next yet, see ADR 0021): landing page; guided intake (one question per screen, up to 40 screens with branching, Back keeps answers, "I'm not sure" on every danger question, emergency numbers on every screen); result screen (level with icon, colour and text, what to do, why, risk factors, critical-phase note, testing, watch-for, go-immediately list, Call 108 / 112 / find hospital, copy-or-share summary, start again); emergency screen; the spec 2.3 fail-safe screen; English, Hindi and Marathi with a "translation under review" badge.
- Hindi and Marathi first-pass translations of all 100 protocol strings (`packages/protocols/dengue/v0.1.0.strings.hi.json`, `.mr.json`) and of the web UI strings. Tests require the same keys, numbers and placeholders as English.
- **Tester release (all six requested items):**
  1. `TESTER_MODE` build flag. Banner on every screen in en/hi/mr with the exact text requested, sticky at the top. `pnpm build:tester` sets it.
  2. Display floor (`apps/web/src/lib/display.ts`): HOME_CARE_WITH_TRIGGERS is never shown, TEST_AND_MONITOR is the minimum, with "If you are unsure, see a doctor." Unit tests prove it never lowers any level, for all four levels and for all 163 scenarios using the real engine and protocol. The engine, protocol, thresholds and scenarios are untouched.
  3. noindex meta tag and `robots.txt` `Disallow: /` (and an `X-Robots-Tag` header); no analytics, no cookies; nothing sent to any server (tests scan the source; a Content-Security-Policy with `connect-src 'self'` enforces it in the browser; `verify-output.mjs` scans the built files). The only things remembered are the chosen language and the "Large text" setting (`localStorage`).
  4. "Send feedback" link (placeholder Google Form URL until `FEEDBACK_URL` is set; TODO W-001).
  5. `docs/runbooks/tester-deploy.md`: build command `pnpm build:tester`, output directory `apps/web/out`, direct-upload and Git-connected steps for Cloudflare Pages and Netlify, access control, form notice, post-deploy checks, smoke checks.
  6. This file, committed.
- **Release gate for the web build**: `apps/web/scripts/verify-protocol.mjs` refuses a DRAFT protocol unless drafts are explicitly allowed in development, staging or test. `pnpm build:release` fails now, as it should; `APP_ENV=production` with drafts allowed is refused; `TESTER_MODE=true` cannot be combined with production; a mistyped `TESTER_MODE` fails the build. CI runs the production build and expects it to fail (G-006).
- Verified in a real browser against the built tester site (mobile viewport): banner, a no-fever case shown as "Get tested and keep watching" with the unsure note, no cookies, nothing in storage, every request same-origin.

Tests: web 105 (display floor, intake mapping, i18n parity and banned claims, release gate, privacy, screens with axe), protocols 34 (28 + hi/mr string checks), engine 212 (100% coverage), shared 9. `pnpm check` passes.

Assumptions and deviations (all in ADR 0021):

- Plain CSS and a small typed i18n instead of the full ADR 0003/0004 stack for now; system fonts (no font download).
- Intake wording, answer mapping ("not sure" means yes for pregnancy, blood thinner, lives alone), the "8 or more days" onset option and the lab entry screen are my choices and need the doctor (TODO Q-001 to Q-003, checklist section "Intake questions and screens").
- Anonymous results are not stored in M2 (W-005); there is no service worker, so no offline use yet (W-010, M7).
- Initial JavaScript on `/check/` is about 204 KB gz, slightly over the 200 KB budget (P-001).

Not done and not verified: the first GitHub Actions run (T-006); real-device screen-reader testing; colour contrast was checked by design (all pairs at least 4.5:1) but not with a tool; LCP and CLS.

### Home page and complete translation (2026-10-31)

- Hindi and Marathi now translate everything: headline, tagline, browser tab title, navigation label, the 404 page and the result record line (my drafts, still behind the "translation under review" badge). A test fails on any stray English word in those languages.
- Home page: hero with trust facts, a "what to watch for" carousel (no autoplay, big buttons, swipe, keyboard), how it works, features, sources, questions people ask, closing call to action. Web tests: 127.
- Needs the founder: approve the Hindi and Marathi headline wording (W-006); the pocket guide is not cited on the page until its publisher is confirmed (W-013).

### Signboard redesign, check-first home page (2026-10-31)

- Home page rebuilt around starting the check: hero with the first question as three large doors, trilingual signboard title, original illustrations of an Indian hospital, outcome signs, the watch-for carousel, where to go in an emergency, questions and sources, closing call to action. Full-width layout; two columns with an illustration in the check flow on wide screens.
- Pictures are my SVG drawings, not photographs (W-015, W-016). Web tests: 137.

## M1 — done

Built:

- `packages/triage-engine`: pure, zero-dependency engine (`evaluate(input, protocol, now)`), SHA-256 and canonical JSON implemented in pure TS for the input and protocol hashes, calendar-date arithmetic without `Date`. **212 tests, 100% statement/branch/function/line coverage**, enforced by the package's `test` script.
- `packages/protocols`: zod schema (strict), JSON Schema (generated), loader with integrity checks (unknown thresholds/flags/fields, missing sources, duplicate ids, safety invariants), the release gate (`assertProtocolServable`, `allowDraftFromEnv`), draft banner text, and a generated review checklist. 28 tests.
- `packages/protocols/dengue/v0.1.0.json`: DRAFT protocol: 22 danger signs, 19 rules, 13 risk factors, 6 testing-advice items, 17 thresholds; every item carries `basis`, `review: TODO_DOCTOR_REVIEW` and cited sources. Plus 100 English strings.
- `tests/scenarios/dengue.scenarios.json`: 163 scenarios (spec cases 1 to 4, the founder's case, every danger sign alone and as UNKNOWN, labs and boundaries, 13 risk factors, ages, pregnancy, critical phase, contradictions). Expectations are hand-derived, never copied from engine output.
- Property tests (fast-check): determinism; never throws on valid input or on arbitrary garbage; level equals the highest reason severity; adding a danger sign, a risk factor, or lowering platelets never lowers the level; safe answer to UNKNOWN never lowers the level.
- `findBannedCopy` in `@bhanak/shared` (banned-claims check with the negation allowlist), applied to protocol strings.
- Verified the gates work: weakening the protocol (platelet cut-off, unknown policy, an inverted sign) made 80 scenarios fail.

Sources read (extracted to the scratchpad, not committed): NCVBDC 2023 (chapters 4 to 8, 10, 12, 13), WHO 2009 (sections 2.1, 2.3, 4.3.5, Textboxes C to G), the "Dengue Case Management" pocket guide.

What the sources did **not** give (so these stay `SPEC_PROVISIONAL`): the platelet cut-offs of 50,000 and 100,000, the "3 vomiting episodes in 24 hours" count, any number for a "rapid" platelet fall (left undecided, rule inert). See the 13 decisions at the top of `docs/clinical-review-checklist.md`.

Deviations from the spec text, all flagged for the doctor:

- Risk-factor step-up is capped at SEE_DOCTOR_TODAY (the literal spec 5.4 would make a risk-factor person with no danger sign an emergency by day 3, contradicting spec 5.3).
- Spec section 22 says "changing any answer to UNKNOWN never lowers the level". With the spec 5.1 cap this cannot hold for a stated YES on a danger sign, so the tests check safe-answer-to-UNKNOWN and "unknown never below see-a-doctor-today".
- `feverNow` and `feverSettledWithin48h` are YES/NO/UNKNOWN (spec says optional booleans), so "not sure" is representable.
- Result has `criticalPhaseNotes` (list) and a few extra fields (`headlineI18nKey`, `illnessDay`, `riskFactorIds`, protocol id/hash/review status); `maxTempC` is accepted but no rule uses it.
- Scenario files have a top-level `now` and optional `maximumLevel` / `expectCriticalPhaseNote` fields, to test against over-triage and the critical-phase note.
- Source PDFs are git-ignored (`docs/sources/*.pdf`) until the founder confirms the repo is private.

## M0 — done

Built:

- pnpm 10 + Turborepo workspace; TypeScript 6.0 strict (+ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); ESLint 10 type-aware strict config; Prettier; Husky + lint-staged pre-commit.
- Packages (skeletons except `shared`): `shared` (brand.ts, constants), `triage-engine`, `protocols`, `ui`, `drug-data`. Apps, infra and scenarios directories hold only READMEs.
- ESLint rules that enforce engine purity in `packages/triage-engine/src` (no `Date.now`, no randomness, no I/O globals, relative imports only). Verified by planting violations.
- `pnpm check:brand`: fails on hard-coded brand strings outside `brand.ts`; `--strict` also fails on unresolved placeholders. Verified by planting a violation.
- GitHub Actions CI: format, brand, lint, typecheck, test, build, gitleaks, `pnpm audit --audit-level=high`. Dependabot for npm + Actions.
- ADRs 0001-0019 for the stack (`docs/adr/`), intended-use + regulatory notes (with `[CITATION NEEDED]`), review checklists, TODO register.

Decisions / deviations (all recorded in ADR 0019):

- Node 24 LTS rather than 26 (26 only just entered LTS; ecosystem maturity).
- TypeScript 6.0.x, not 7 (typescript-eslint does not support 7 yet).
- Internal packages are built with `tsc` to ESM `dist/` (NodeNext, `.js` import suffixes) and consumed via `exports`.
- Spec section 26 says "complete every milestone in a batch"; section 0 says first session = M0 only. Followed the explicit first-session instruction.

Environment notes (founder's machine): winget is blocked by Group Policy, so Node 24.22.2 (checksum-verified, from nodejs.org) and pnpm 10.34.9 were installed portably under `%USERPROFILE%\tools\node` with no PATH/system changes. See CLAUDE.md for the PATH snippet.

## Open questions for the founder

1. **Reviewer (F-003)**: who is the reviewing doctor (name, registration number)? Until then the protocol stays `DRAFT` and every result shows the "TEST VERSION, NOT MEDICALLY REVIEWED" banner. The 13 decisions at the top of `docs/clinical-review-checklist.md` are the doctor's agenda.
2. **Third PDF**: its text does not name a publisher (it credits the 2022 PAHO guidelines). Is it a CDC document, and what is its exact title? (C-003)
3. **Repository**: is `https://github.com/Inv3rseXenon/Bhanak.git` public or private? If private and you want the guideline PDFs tracked, remove `docs/sources/*.pdf` from `.gitignore`. The first CI run on GitHub has not been observed yet (check the Actions tab: `secrets` and `audit` jobs especially). Commits are authored as `Inv3rseXenon <piyush.company.mail@gmail.com>`.
4. **CDSCO 2026 document (C-001)**: shall I try to locate its exact title/number, or leave it for the regulatory-lawyer step?
5. **Clinical readings in section "Deviations"** above: please confirm the step-up cap and the UNKNOWN reading, or tell me to change them.
6. **Feedback form (W-001)**: create the Google Form and give me the link (or set `FEEDBACK_URL` when you build). Until then "Send feedback" opens a placeholder address.
7. **Who may see the tester site?** An unguessable link plus noindex is not access control. If testers must be limited to named people, use Cloudflare Access (see the runbook), or tell me and I will add a simple passcode screen.
8. **Hindi and Marathi** (L-001, F-004): my drafts need a native-speaking doctor. Also, do you want the home headline and tagline in Hindi and Marathi (W-006)?
9. **Hosting choice**: Cloudflare Pages or Netlify? The runbook covers both; the direct-upload route needs no build setup on the host.
