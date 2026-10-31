import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LEVELS, evaluate, levelRank } from '@bhanak/triage-engine';
import type { Level, TriageInput } from '@bhanak/triage-engine';
import { TESTER_FLOOR_LEVEL, applyDisplayFloor, buildDisplayModel } from '../src/lib/display';
import { protocol } from '../src/lib/protocol';

const here = dirname(fileURLToPath(import.meta.url));
const scenarioFile = JSON.parse(
  readFileSync(join(here, '..', '..', '..', 'tests', 'scenarios', 'dengue.scenarios.json'), 'utf8'),
) as { now: string; scenarios: { id: string; input: TriageInput }[] };
const now = new Date(scenarioFile.now);

describe('TESTER_MODE display floor', () => {
  it('never lowers any level, in either mode', () => {
    for (const level of LEVELS) {
      for (const testerMode of [true, false]) {
        expect(
          levelRank(applyDisplayFloor(level, testerMode)),
          `${level} ${String(testerMode)}`,
        ).toBeGreaterThanOrEqual(levelRank(level));
      }
    }
  });

  it('changes nothing when TESTER_MODE is off', () => {
    for (const level of LEVELS) expect(applyDisplayFloor(level, false)).toBe(level);
  });

  it('never shows HOME_CARE_WITH_TRIGGERS in tester mode; TEST_AND_MONITOR is the minimum', () => {
    expect(TESTER_FLOOR_LEVEL).toBe('TEST_AND_MONITOR');
    expect(applyDisplayFloor('HOME_CARE_WITH_TRIGGERS', true)).toBe('TEST_AND_MONITOR');
    for (const level of LEVELS) {
      expect(applyDisplayFloor(level, true)).not.toBe('HOME_CARE_WITH_TRIGGERS');
    }
  });

  it('leaves the three higher levels exactly as they are', () => {
    const expected: Level[] = ['TEST_AND_MONITOR', 'SEE_DOCTOR_TODAY', 'EMERGENCY_NOW'];
    for (const level of expected) expect(applyDisplayFloor(level, true)).toBe(level);
  });

  it('is idempotent', () => {
    for (const level of LEVELS) {
      const once = applyDisplayFloor(level, true);
      expect(applyDisplayFloor(once, true)).toBe(once);
    }
  });

  it('holds for every one of the clinical scenarios, using the real engine and protocol', () => {
    expect(scenarioFile.scenarios.length).toBeGreaterThan(100);
    for (const scenario of scenarioFile.scenarios) {
      const result = evaluate(scenario.input, protocol, now);
      const tester = buildDisplayModel(result, protocol, true);
      const normal = buildDisplayModel(result, protocol, false);

      // The tester display is never below the engine's level, and never HOME_CARE.
      expect(levelRank(tester.level), scenario.id).toBeGreaterThanOrEqual(levelRank(result.level));
      expect(tester.level, scenario.id).not.toBe('HOME_CARE_WITH_TRIGGERS');
      // The normal display is exactly what the engine returned.
      expect(normal.level, scenario.id).toBe(result.level);
      expect(normal.headlineKey, scenario.id).toBe(result.headlineI18nKey);
      expect(normal.actionKeys, scenario.id).toEqual(result.actions);
      // The engine's own level is recorded unchanged.
      expect(tester.engineLevel, scenario.id).toBe(result.level);
      // Above the floor, the tester display is identical to the normal one.
      if (levelRank(result.level) >= levelRank(TESTER_FLOOR_LEVEL)) {
        expect(tester.floorApplied, scenario.id).toBe(false);
        expect(tester.headlineKey, scenario.id).toBe(result.headlineI18nKey);
        expect(tester.actionKeys, scenario.id).toEqual(result.actions);
      }
    }
  });

  it("shows the floor level's own headline and actions when it raises a result", () => {
    const homeCare = scenarioFile.scenarios
      .map((s) => evaluate(s.input, protocol, now))
      .find((r) => r.level === 'HOME_CARE_WITH_TRIGGERS');
    expect(homeCare, 'at least one scenario is HOME_CARE_WITH_TRIGGERS').toBeDefined();
    if (homeCare === undefined) return;
    const display = buildDisplayModel(homeCare, protocol, true);
    expect(display.floorApplied).toBe(true);
    expect(display.level).toBe('TEST_AND_MONITOR');
    expect(display.showUnsureNote).toBe(true);
    expect(display.headlineKey).toBe(protocol.levels.TEST_AND_MONITOR.headlineI18nKey);
    expect(display.actionKeys).toEqual(protocol.levels.TEST_AND_MONITOR.actions);
    // The stored result is not modified, and keeps its warning-sign lists.
    expect(homeCare.level).toBe('HOME_CARE_WITH_TRIGGERS');
    expect(homeCare.returnImmediatelyIf.length).toBeGreaterThan(0);
  });

  it('shows the "if you are unsure" note at the floor level only, and only in tester mode', () => {
    for (const scenario of scenarioFile.scenarios) {
      const result = evaluate(scenario.input, protocol, now);
      const tester = buildDisplayModel(result, protocol, true);
      expect(tester.showUnsureNote, scenario.id).toBe(tester.level === 'TEST_AND_MONITOR');
      expect(buildDisplayModel(result, protocol, false).showUnsureNote, scenario.id).toBe(false);
    }
  });
});
