# @bhanak/triage-engine

The deterministic triage rules engine (spec section 5). It decides **how urgently** to seek care. It does not diagnose and never recommends medicines or doses.

```ts
import { evaluate } from '@bhanak/triage-engine';
const result = evaluate(input, protocol, new Date()); // time is injected, never read inside
```

## Guarantees (and how they are enforced)

| Guarantee                                                                      | Enforced by                                                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Pure: no I/O, no randomness, no `Date.now()`, no environment access            | ESLint `no-restricted-*` rules on `src/` (see `eslint.config.mjs`)                            |
| Zero runtime dependencies                                                      | ESLint: only relative imports in `src/`; `package.json` has no `dependencies`                 |
| Level = highest severity of every fired rule; rules only raise urgency         | Property test; protocol integrity check rejects a rule at HOME_CARE                           |
| Unknown, missing or contradictory answers never lower urgency                  | Property tests; scenarios; `UNKNOWN_EMERGENCY` / `UNCERTAIN_DANGER` / `SD_INPUT_ISSUES` rules |
| Never throws on schema-valid input (or on arbitrary garbage)                   | Property tests with `fc.anything()`                                                           |
| Same input, protocol and time give the same result                             | Property test                                                                                 |
| Every result has non-empty "return immediately if" triggers and warning signs  | Property test; protocol integrity check; engine fallback key                                  |
| Every result records protocol id, version and hash, engine version, input hash | Unit tests                                                                                    |
| 100% statement, branch, function and line coverage                             | `vitest --coverage` thresholds: the package's `test` script fails below 100%                  |
| No scenario computes a level lower than its `minimumLevel`                     | `test/scenarios.test.ts` over `tests/scenarios/dengue.scenarios.json`                         |

## How a result is computed

1. Build a context from the raw input: answers, numbers (invalid ones become "unknown" and are flagged), the illness day (from the onset date and the injected `now`), and derived flags such as `feverContext` ("fever now, settled in the last 48 hours, or started within the recent window"; an unknown fever counts as possible fever).
2. Danger signs: with fever context a present sign is an emergency; an unanswered sign applies its `unknownPolicy` (`EMERGENCY` for drinking, bleeding, drowsiness and confusion; otherwise `SEE_DOCTOR_TODAY`). Without fever context, a present sign is `SEE_DOCTOR_TODAY`.
3. Rules from the protocol fire by their condition. All clinical numbers come from `protocol.thresholds`; an undecided (`null`) threshold makes its rule inert.
4. Risk factors raise the level by the protocol's step-up (capped) and apply a floor when fever has lasted long enough.
5. The level is the maximum severity of all reasons. Reasons are ordered most severe first.

The protocol format, the condition language and the review workflow are described in [packages/protocols](../protocols/README.md). `ENGINE_VERSION` (in `src/version.ts`) must equal this package's `version`; a test checks it. Bump both when behaviour changes.
