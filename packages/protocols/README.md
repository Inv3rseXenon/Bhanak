# @bhanak/protocols

Clinical protocol files, their schema, the loader and the release gate. A protocol is **data**: adding a disease means adding a file here, not changing the engine.

```
dengue/v0.1.0.json              the protocol (DRAFT, not medically reviewed)
dengue/v0.1.0.strings.en.json   English source strings for every i18n key it uses
dengue/v0.1.0.strings.hi.json   Hindi first-pass translation (status NEEDS_REVIEW, no doctor sign-off yet)
dengue/v0.1.0.strings.mr.json   Marathi first-pass translation (status NEEDS_REVIEW, no doctor sign-off yet)
schema/protocol.schema.json     JSON Schema, generated from the zod schema
src/                            schema, loader, integrity checks, release gate, checklist renderer
```

## What is in a protocol

- `thresholds`: every clinical number, each with `basis`, `review`, `sourceRefs` (document + section) and a note. `value: null` means "undecided": rules using it stay inert and the protocol cannot be `REVIEWED`.
- `dangerSigns`: questions that mean an emergency when answered YES (with fever), each with an `unknownPolicy`.
- `rules`: conditions over a small closed language (`all`, `any`, `not`, `tri`, `num`, `flag`, `trend`) with a level. Rules can only raise urgency.
- `riskFactors`, `riskFactorPolicy`, `testingAdvice`, `levels` (headline and actions), `watchFor`, `returnImmediatelyIf`.
- `reviewStatus` (`DRAFT` | `REVIEWED`) and `review` (reviewer name, registration number, date).

Every item carries:

| Field        | Meaning                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `basis`      | `SOURCE` (stated in a cited guideline), `SPEC_PROVISIONAL` (placeholder from the build spec), `SAFETY_DEFAULT` |
| `review`     | `TODO_DOCTOR_REVIEW` until a doctor signs it off, then `REVIEWED`                                              |
| `sourceRefs` | `{ doc, section, note? }` pointing at an entry in `sources`                                                    |

Source ids: `NCVBDC2023` (National Guidelines for Clinical Management of Dengue Fever 2023), `WHO2009` (WHO dengue guidelines 2009), `CDC_POCKET` (the "Dengue Case Management" pocket guide; its publisher is still to be confirmed). Section numbers follow the printed headings; the pocket guide is cited by printed page.

## Editing a protocol

1. Edit the JSON. Never invent a clinical fact: cite a source or leave `basis` as `SPEC_PROVISIONAL` / `SAFETY_DEFAULT` with a note, and keep `review: "TODO_DOCTOR_REVIEW"`.
2. Add or update the English string for every new `i18nKey` in the strings file (the test fails on a missing or unused key), and add the Hindi and Marathi drafts: the tests require the same keys and the same numbers in all three. Copy must pass the banned-claims check.
3. Run `pnpm --filter @bhanak/protocols generate` to refresh the JSON Schema and the generated checklist in `docs/clinical-review-checklist.md`.
4. Add or update scenarios in `tests/scenarios/build-dengue-scenarios.mjs` and run it. **Write expectations from the sources, never from engine output.**
5. Run `pnpm test`. A protocol is immutable once published: change means a new version file.

## Release gate (spec 5.5)

`assertProtocolServable(protocol, { allowDraft })` refuses a protocol whose `reviewStatus` is not `REVIEWED` unless drafts are allowed. `allowDraftFromEnv(process.env)` honours `ALLOW_DRAFT_PROTOCOL=true` only when `APP_ENV` is `development`, `staging` or `test`; in any other environment it throws at startup. The web build (M2) and the API (M3) must call these. Draft results must show the `DRAFT_BANNER_TEXT` banner.

`parseProtocol` refuses `reviewStatus: "REVIEWED"` while any threshold is undecided, any item is still `TODO_DOCTOR_REVIEW`, or the reviewer fields are empty.
