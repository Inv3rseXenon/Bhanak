# Progress

A fresh session can resume from this file plus [CLAUDE.md](../CLAUDE.md) and [docs/SPEC.md](SPEC.md). Update after every milestone.

## Current state

- **Last completed milestone: M1** (triage engine + protocol schema + dengue protocol v0.1.0 DRAFT + 163 scenarios + property tests + coverage gate).
- **Next: M2** (anonymous triage web app). Not started. Wait for the founder's go-ahead and answers to the open questions below.
- Working mode: stop after each milestone and wait for the founder's go-ahead.

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
