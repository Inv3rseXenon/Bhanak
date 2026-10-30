# Pharmacist review checklist (TODO_PHARMACIST_REVIEW)

Every drug fact marked `TODO_PHARMACIST_REVIEW` is listed here. Drug-safety warnings stay behind a feature flag until their row is signed off.

Reviewer: **[PLACEHOLDER: name, registration number]** (TODO F-003)

| ID  | Where | What needs review                                             | Status |
| --- | ----- | ------------------------------------------------------------- | ------ |
| —   | —     | No drug data exists yet (starts in M6, `packages/drug-data`). | —      |

## Standing items M6 will add rows for

- Indian brand and ingredient seed data.
- Duplicate-active-ingredient rules.
- NSAID/aspirin class membership used for the dengue prompt.
- Per-ingredient daily-limit table used by the daily-limit warning (limits come from data, never from code).
