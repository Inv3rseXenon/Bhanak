# Clinical review checklist (TODO_DOCTOR_REVIEW)

Every clinical threshold, question, warning sign, message and translation marked `TODO_DOCTOR_REVIEW` anywhere in the repo is listed here, with the source it traces to. A protocol cannot become `REVIEWED` while any row is open.

Reviewer: **[PLACEHOLDER: name, registration number]** (TODO F-003)

| ID  | Where | What needs review                              | Source cited | Status |
| --- | ----- | ---------------------------------------------- | ------------ | ------ |
| —   | —     | No clinical content exists yet (starts in M1). | —            | —      |

## Standing items that M1/M2 will add rows for

- Every rule and threshold in `packages/protocols/dengue/v0.1.0.json` (spec 5.3), including the provisional vomiting count (3 in 24 h) and platelet cut-offs (<50,000 and <100,000).
- Risk-factor policy and child/pregnancy sub-rules (spec 5.4).
- The NSAID/aspirin "check with your doctor or pharmacist" prompt wording (spec 2.8).
- The missed-dose wording (spec 12).
- The fail-safe screen text (spec 2.3).
- All hi/mr clinical strings (`needs_review` until a native-speaking doctor approves).
- Calibration against the level distribution: over-triage teaches people to ignore the app; the doctor calibrates, the code never relaxes a rule automatically.
