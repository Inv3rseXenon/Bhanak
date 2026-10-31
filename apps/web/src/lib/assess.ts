import { evaluate } from '@bhanak/triage-engine';
import type { Protocol, TriageInput, TriageResult } from '@bhanak/triage-engine';
import { buildDisplayModel, isLevel } from './display';
import type { DisplayModel } from './display';

export type Assessment =
  | { kind: 'ok'; result: TriageResult; display: DisplayModel }
  /** The engine threw or returned something unusable: show the fail-safe screen (spec 2.3). */
  | { kind: 'failsafe' };

/**
 * Run the engine and prepare what the screen shows. Any exception, or a result that does not
 * look like a TriageResult, becomes the fail-safe screen: a person is never left without guidance.
 */
export function assess(
  input: TriageInput,
  protocol: Protocol,
  now: Date,
  testerMode: boolean,
): Assessment {
  try {
    const result = evaluate(input, protocol, now);
    if (!isLevel(result.level) || result.returnImmediatelyIf.length === 0) {
      return { kind: 'failsafe' };
    }
    return { kind: 'ok', result, display: buildDisplayModel(result, protocol, testerMode) };
  } catch {
    return { kind: 'failsafe' };
  }
}
