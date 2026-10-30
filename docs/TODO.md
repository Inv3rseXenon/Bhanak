# TODO register

Every TODO in the repo must have an entry here (spec section 26). Safety-relevant items must also fail a build/release gate; the gate column says which. IDs are stable; do not renumber.

## Founder inputs needed

| ID    | Item                                                                                                              | Needed by   |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| F-001 | Brand placeholders in `packages/shared/src/brand.ts`: support email, legal entity name, domain, grievance officer | Launch      |
| F-002 | Place source PDFs in `docs/sources/` (see `docs/sources/README.md`): NCVBDC 2023 dengue guidelines, WHO 2009, CDC | **M1**      |
| F-003 | Name a licensed doctor (and a pharmacist) reviewer, with registration numbers, for protocol / drug-data sign-off  | M1 / M6     |
| F-004 | Native-speaking doctor to review hi/mr clinical strings                                                           | M2 / Launch |
| F-005 | Origin-story facts for marketing pages (use `[PLACEHOLDER]` for unknowns; never name the people who died)         | M2          |
| F-006 | Decide `[N]` = number of free medicines (spec section 18)                                                         | M11         |

## Citations

| ID    | Item                                                                                                                                                                         | Gate   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| C-001 | [CITATION NEEDED] CDSCO 2026 guidance on medical-device software: exact title and number (cdsco.gov.in). Referenced by `docs/intended-use.md` and `docs/regulatory-notes.md` | Launch |
| C-002 | [CITATION NEEDED] NCVBDC 2023 guideline: exact section numbers for patient grouping, triage, clinical phases, testing                                                        | M1     |
| C-003 | [CITATION NEEDED] WHO 2009 and CDC sections for warning signs / admission criteria                                                                                           | M1     |

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

| ID    | Gate                                                                                                | Milestone |
| ----- | --------------------------------------------------------------------------------------------------- | --------- |
| G-001 | Scenario suite fails build when level < `minimumLevel`; engine branch coverage must be 100%         | M1        |
| G-002 | Banned-words check on user-facing copy (with negation allowlist)                                    | M2        |
| G-003 | axe-core a11y gate; Playwright e2e (incl. offline triage)                                           | M2        |
| G-004 | Lighthouse CI budgets (JS ≤200 KB gz on triage route, LCP ≤2.5 s, CLS <0.1)                         | M2 / M7   |
| G-005 | Scan web build for secrets                                                                          | M2        |
| G-006 | Refuse non-`REVIEWED` protocol in prod config unless `ALLOW_DRAFT_PROTOCOL=true` (dev/staging only) | M1-M2     |
| G-007 | `check-brand --strict` in the public-launch gate (fails while `brand.ts` has placeholders)          | Launch    |
| G-008 | Trivy container scan, CodeQL, OWASP ZAP baseline, SBOM (CycloneDX), k6                              | M3 / M9   |
| G-009 | Pin gitleaks container image version in CI; pin GitHub Actions by commit SHA                        | M9        |
| G-010 | Dependabot for Terraform / Docker when `infra/` and containers exist                                | M3        |

## Tooling notes

| ID    | Item                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| T-001 | TypeScript pinned to 6.0.x because typescript-eslint 8.x does not yet support TypeScript 7 (ADR 0019). Revisit when it does. |
| T-002 | Local pre-commit secret scan needs the gitleaks binary (not installed on the dev machine); CI scans regardless.              |
| T-003 | `onlyBuiltDependencies` is empty in `pnpm-workspace.yaml`; add entries (e.g. Prisma engines in M3) only after review.        |

## TODO_DOCTOR_REVIEW / TODO_PHARMACIST_REVIEW

None yet: clinical content starts in M1. Items are tracked in `docs/clinical-review-checklist.md` and `docs/pharmacist-review-checklist.md`.
