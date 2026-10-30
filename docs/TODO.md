# TODO register

Every TODO in the repo must have an entry here (spec section 26). Safety-relevant items must also fail a build/release gate; the gate column says which. IDs are stable; do not renumber.

## Founder inputs needed

| ID    | Item                                                                                                                                                                                                                    | Needed by   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| F-001 | Brand placeholders in `packages/shared/src/brand.ts`: support email, legal entity name, domain, grievance officer                                                                                                       | Launch      |
| F-002 | ~~Source PDFs~~ received 2026-10-30 (kept local, git-ignored). Still needed: confirm the publisher of the third PDF ("Dengue Case Management" pocket guide) and whether the repo is private, so the PDFs may be tracked | M2          |
| F-003 | Name a licensed doctor (and a pharmacist) reviewer, with registration numbers, for protocol / drug-data sign-off. **The protocol stays DRAFT until then**                                                               | M1 / M6     |
| F-004 | Native-speaking doctor to review hi/mr clinical strings                                                                                                                                                                 | M2 / Launch |
| F-005 | Origin-story facts for marketing pages (use `[PLACEHOLDER]` for unknowns; never name the people who died)                                                                                                               | M2          |
| F-006 | Decide `[N]` = number of free medicines (spec section 18)                                                                                                                                                               | M11         |

## Citations

| ID    | Item                                                                                                                                                                                                 | Gate    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C-001 | [CITATION NEEDED] CDSCO 2026 guidance on medical-device software: exact title and number (cdsco.gov.in). Referenced by `docs/intended-use.md` and `docs/regulatory-notes.md`                         | Launch  |
| C-002 | NCVBDC 2023 and WHO 2009 section numbers: done in M1 (cited as printed headings). Spot-check by a second reader before sign-off                                                                      | M1 done |
| C-003 | [CITATION NEEDED] Publisher and exact title of the "Dengue Case Management" pocket guide (`CDC_POCKET` in the protocol; PubID 301358). The text credits PAHO 2022 and Paz-Bailey et al., Lancet 2024 | M2      |

## Planned documentation (spec section 24) not yet written

| ID    | Item                                                                                                    | Milestone     |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------- |
| D-001 | Architecture diagram (Mermaid)                                                                          | M3            |
| D-002 | Data map: every personal-data field, purpose, legal basis, retention, location (`docs/privacy/`)        | M3-M4         |
| D-003 | Threat model, STRIDE (`docs/threat-model.md`)                                                           | M3 (full: M9) |
| D-004 | Runbooks: incident response, protocol rollback, key rotation, DPDP breach notification, restore         | M9            |
| D-005 | Store-submission checklist, DPDP compliance checklist                                                   | M10           |
| D-006 | API docs (OpenAPI), translation guide, contributor guide                                                | M3 / M2 / M1  |
| D-007 | `docs/launch-readiness.md` (all remaining review items + legal review incl. cross-border LLM and CDSCO) | after M11     |

## CI / release gates still to wire (spec section 22)

| ID    | Gate                                                                                                                                                                                                                                                                                                            | Milestone |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| G-001 | Scenario suite fails build when level < `minimumLevel`; engine coverage must be 100%. **DONE in M1** (`pnpm test`; verified by mutating the protocol)                                                                                                                                                           | done      |
| G-002 | Banned-words check on user-facing copy (with negation allowlist). Started: `findBannedCopy` in `@bhanak/shared`, applied to protocol English strings. Still needed: UI copy, store listings, notifications, hi/mr terms                                                                                         | M2        |
| G-003 | axe-core a11y gate; Playwright e2e (incl. offline triage)                                                                                                                                                                                                                                                       | M2        |
| G-004 | Lighthouse CI budgets (JS ≤200 KB gz on triage route, LCP ≤2.5 s, CLS <0.1)                                                                                                                                                                                                                                     | M2 / M7   |
| G-005 | Scan web build for secrets                                                                                                                                                                                                                                                                                      | M2        |
| G-006 | Refuse non-`REVIEWED` protocol in prod config unless `ALLOW_DRAFT_PROTOCOL=true` (dev/staging only). Started: `assertProtocolServable` / `allowDraftFromEnv` in `@bhanak/protocols`. Still needed: call them from the web build (M2) and the API (M3), plus a CI job that fails a production build with a draft | M2-M3     |
| G-007 | `check-brand --strict` in the public-launch gate (fails while `brand.ts` has placeholders)                                                                                                                                                                                                                      | Launch    |
| G-008 | Trivy container scan, CodeQL, OWASP ZAP baseline, SBOM (CycloneDX), k6                                                                                                                                                                                                                                          | M3 / M9   |
| G-009 | Pin gitleaks container image version in CI; pin GitHub Actions by commit SHA                                                                                                                                                                                                                                    | M9        |
| G-010 | Dependabot for Terraform / Docker when `infra/` and containers exist                                                                                                                                                                                                                                            | M3        |

## Tooling notes

| ID    | Item                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-001 | TypeScript pinned to 6.0.x because typescript-eslint 8.x does not yet support TypeScript 7 (ADR 0019). Revisit when it does.                                                                            |
| T-002 | Local pre-commit secret scan needs the gitleaks binary (not installed on the dev machine); CI scans regardless.                                                                                         |
| T-004 | Scenario and protocol JSON are authored by scripts (`tests/scenarios/build-dengue-scenarios.mjs`) or by hand; there is no drift test for the scenario script. Edit the script, regenerate, commit both. |
| T-003 | `onlyBuiltDependencies` is empty in `pnpm-workspace.yaml`; add entries (e.g. Prisma engines in M3) only after review.                                                                                   |

## Clinical open items (M1)

| ID    | Item                                                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K-001 | Every item in `packages/protocols/dengue/v0.1.0.json` is `TODO_DOCTOR_REVIEW`: see the generated list and the 13 decisions at the top of `docs/clinical-review-checklist.md` |
| K-002 | `plateletRapidFallFraction` is undecided (`null`): rule `EM_PLATELET_RAPID_FALL` is inert and the protocol cannot be REVIEWED until a doctor sets it                         |
| K-003 | Hindi and Marathi strings for protocol 0.1.0 do not exist yet (English source strings only); all will be `needs_review`                                                      |
| K-004 | The UI (M2) must map "not sure" to `true` for pregnancy, blood-thinner and lives-alone answers (cautious), and must always send explicit NO answers for questions it asked   |
| K-005 | Pharmacist items: none yet (drug data starts in M6); tracked in `docs/pharmacist-review-checklist.md`                                                                        |
