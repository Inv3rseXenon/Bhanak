import { LEVELS, levelRank } from '@bhanak/triage-engine';
import type { Level, Protocol, TriageResult } from '@bhanak/triage-engine';

/**
 * TESTER_MODE display floor.
 *
 * In a private tester build, a result is never shown as HOME_CARE_WITH_TRIGGERS: the lowest level
 * shown is TEST_AND_MONITOR. This is a pure, one-way raise: the output is never below the input.
 * It changes only what is displayed. The engine, the protocol and the stored engine level are
 * untouched, so the scenario suite still tests the unmodified clinical rules.
 */
export const TESTER_FLOOR_LEVEL: Level = 'TEST_AND_MONITOR';

export function applyDisplayFloor(level: Level, testerMode: boolean): Level {
  if (!testerMode) return level;
  return levelRank(level) < levelRank(TESTER_FLOOR_LEVEL) ? TESTER_FLOOR_LEVEL : level;
}

/** What the result screen shows. Built from the engine result, never from user input. */
export interface DisplayModel {
  /** Level shown to the person. */
  level: Level;
  /** Level the engine computed (kept for the audit record; not shown to the person). */
  engineLevel: Level;
  /** True when the tester floor raised the displayed level. */
  floorApplied: boolean;
  /** Show "If you are unsure, see a doctor." (tester builds, at the floor level). */
  showUnsureNote: boolean;
  headlineKey: string;
  actionKeys: string[];
}

export function buildDisplayModel(
  result: TriageResult,
  protocol: Protocol,
  testerMode: boolean,
): DisplayModel {
  const level = applyDisplayFloor(result.level, testerMode);
  const floorApplied = level !== result.level;
  const content = protocol.levels[level];
  return {
    level,
    engineLevel: result.level,
    floorApplied,
    showUnsureNote: testerMode && level === TESTER_FLOOR_LEVEL,
    // When the floor raised the level, show that level's own headline and actions; otherwise
    // show exactly what the engine returned.
    headlineKey: floorApplied ? content.headlineI18nKey : result.headlineI18nKey,
    actionKeys: floorApplied ? [...content.actions] : [...result.actions],
  };
}

export const isLevel = (value: unknown): value is Level =>
  typeof value === 'string' && (LEVELS as readonly string[]).includes(value);
