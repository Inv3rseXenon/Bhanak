# ADR 0020: Protocols are data, with a small closed condition language

Status: Accepted · 2026-10-30 (M1 implementation decision within spec sections 3 and 5)

## Context

Spec 5.3 says every clinical value lives in the protocol file, "never in code", and that other diseases are added "by adding protocol files, not code". Rules must be reviewable by a doctor who does not read TypeScript, and the engine must stay pure, total and 100% covered.

## Decision

A protocol file contains thresholds, danger signs, rules, risk factors, testing advice and per-level content. Rule conditions use a closed language of seven operators: `all`, `any`, `not`, `tri` (a YES/NO/UNKNOWN answer), `num` (a number compared with a named threshold or a structural literal), `flag` (a boolean the engine derives, such as `feverContext`) and `trend` (change versus the previous lab reading). The engine interprets it with a table of handlers; there is no expression parsing and no code in data.

- A missing answer is UNKNOWN. A missing or undecided (`null`) threshold makes a comparison false, so a rule with an undecided number is inert rather than guessing. The protocol cannot be `REVIEWED` while any threshold is undecided.
- Danger signs are a separate structure from rules because they carry the UNKNOWN policy (spec 5.1): `EMERGENCY` for the unknown-is-emergency list, otherwise capped at SEE_DOCTOR_TODAY.
- Each item records `basis` (SOURCE, SPEC_PROVISIONAL or SAFETY_DEFAULT), `review` status and cited `sourceRefs`, so a reviewer sees which numbers the guidelines state and which are placeholders. The review checklist is generated from this data.
- The engine owns the `Protocol` type (it has no dependencies); `@bhanak/protocols` validates files with a strict zod schema, cross-checks references, and exports a JSON Schema.

## Alternatives rejected

- **Rules written as TypeScript functions**: reviewers cannot read them, and thresholds would sit in code, against the spec.
- **A general expression language or embedded scripting (JSONLogic, CEL, JS eval)**: more power than needed, harder to prove total and deterministic, and a larger attack surface for protocol files that an admin console will edit (M8).
- **Decision tables or a flowchart format**: readable, but the "maximum over all fired rules" semantics and the UNKNOWN policy fit a rule list better.
- **Validating protocols inside the engine with zod**: breaks the zero-runtime-dependency rule (ADR 0002).

## Consequences

Adding a disease means a new protocol file plus scenarios. A new kind of check (for example a lab ratio) needs a new derived field or operator in the engine, which needs a new test and an engine version bump. The set of derived flags and numeric fields is exported (`KNOWN_FLAGS`, `KNOWN_NUM_FIELDS`) so protocol loading rejects references to anything the engine does not provide.
