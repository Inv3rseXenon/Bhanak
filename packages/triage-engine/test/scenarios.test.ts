import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate, levelRank, type Level, type TriageInput } from '../src/index.js';
import { loadProtocol, REPO_ROOT } from './helpers.js';

interface Scenario {
  id: string;
  description: string;
  input: TriageInput;
  minimumLevel: Level;
  maximumLevel?: Level;
  expectedReasonRuleIds: string[];
  expectCriticalPhaseNote?: boolean;
}

const file = JSON.parse(
  readFileSync(join(REPO_ROOT, 'tests', 'scenarios', 'dengue.scenarios.json'), 'utf8'),
) as { protocolId: string; now: string; scenarios: Scenario[] };

const protocol = loadProtocol();
const now = new Date(file.now);

describe('clinical scenarios (release gate: a computed level below minimumLevel fails the build)', () => {
  it('has at least 150 scenarios with unique ids', () => {
    expect(file.scenarios.length).toBeGreaterThanOrEqual(150);
    expect(new Set(file.scenarios.map((s) => s.id)).size).toBe(file.scenarios.length);
    expect(file.protocolId).toBe(protocol.id);
  });

  it.each(file.scenarios.map((s) => [s.id, s] as const))('%s', (_id, scenario) => {
    const result = evaluate(scenario.input, protocol, now);
    const message = `${scenario.description} (computed ${result.level})`;

    expect(levelRank(result.level), `too LOW: ${message}`).toBeGreaterThanOrEqual(
      levelRank(scenario.minimumLevel),
    );
    if (scenario.maximumLevel !== undefined) {
      expect(levelRank(result.level), `too HIGH: ${message}`).toBeLessThanOrEqual(
        levelRank(scenario.maximumLevel),
      );
    }
    const firedIds = result.reasons.map((r) => r.ruleId);
    for (const ruleId of scenario.expectedReasonRuleIds) {
      expect(firedIds, `missing rule ${ruleId}: ${message}`).toContain(ruleId);
    }
    if (scenario.expectCriticalPhaseNote !== undefined) {
      expect(result.criticalPhaseNotes.length > 0, message).toBe(scenario.expectCriticalPhaseNote);
    }
    // Every result, even the mildest, carries triggers and warning signs (spec 2.4).
    expect(result.returnImmediatelyIf.length).toBeGreaterThan(0);
    expect(result.watchFor.length).toBeGreaterThan(0);
  });
});
