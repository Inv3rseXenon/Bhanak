# tests/scenarios

Clinical scenarios for the triage engine (spec section 22): `dengue.scenarios.json` holds 163 of them.

```jsonc
{
  "protocolId": "dengue",
  "now": "2026-09-15T10:00:00+05:30", // fixed clock; the engine never reads real time
  "scenarios": [
    {
      "id": "S1-BLEEDING_GUMS",
      "description": "...",
      "input": {}, // a full TriageInput
      "minimumLevel": "EMERGENCY_NOW", // build FAILS if the computed level is lower
      "maximumLevel": "TEST_AND_MONITOR", // optional: catches over-triage
      "expectedReasonRuleIds": ["BLEEDING_GUMS"], // each must appear among the reasons
      "expectCriticalPhaseNote": true, // optional
    },
  ],
}
```

## Rules for authors

- Expectations are written from the spec and the cited guidelines **by hand**. Never paste the engine's output into a scenario: a scenario that echoes the engine can never catch a regression.
- A scenario fails the build only when the level is _lower_ than `minimumLevel` (or higher than `maximumLevel`). Safety scenarios should set `minimumLevel`; use `maximumLevel` sparingly, where over-triage matters.
- Some scenarios document a provisional behaviour (for example the inert "rapid platelet fall" rule). Their description says "UPDATE when ..." and they must be revisited when a doctor changes a number.

## Editing

`build-dengue-scenarios.mjs` is the authoring source. After editing it:

```bash
node tests/scenarios/build-dengue-scenarios.mjs
```

Commit both files. The test `packages/triage-engine/test/scenarios.test.ts` runs every scenario in CI (`pnpm test`).
