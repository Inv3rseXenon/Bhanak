import type { Protocol, Tri } from './types.js';

/** Everything rules can look at, derived once from the raw input. */
export interface Ctx {
  protocol: Protocol;
  tri: Map<string, Tri>;
  /** Only finite, non-negative numbers are stored; absent = unknown. */
  num: Map<string, number>;
  flags: Map<string, boolean>;
  trends: Map<string, { previous: number; current: number }>;
  riskFactorIds: string[];
  /** Human-readable codes for malformed or contradictory input (never contains values). */
  issues: string[];
}

export const CONDITION_FLAG_PREFIX = 'condition:';

/** Boolean flags the engine derives. Protocol conditions may only reference these. */
export const KNOWN_FLAGS = [
  'feverContext',
  'feverCurrent',
  'feverSettled',
  'feverUnder24h',
  'criticalPhase',
  'inOutbreakSeason',
  'pregnant',
  'onAnticoagulant',
  'livesAloneOrFarFromHospital',
  'sexMale',
  'anyRiskFactor',
  'anySignPresent',
  'anyLabPositive',
  'inputInconsistent',
] as const;

/** Numeric fields the engine derives. */
export const KNOWN_NUM_FIELDS = [
  'ageMonths',
  'illnessDay',
  'daysSinceOnset',
  'maxTempC',
  'vomitingEpisodes24h',
  'urineLast6hOrDiaperCount',
  'plateletCount',
  'hematocrit',
  'ast',
  'alt',
  'riskFactorCount',
] as const;

/** Answer references that are not free-form symptom keys. */
export const FIXED_TRI_REFS = [
  'fluids.canKeepFluidsDown',
  'meds.tookNsaidOrAspirin',
  'illness.feverNow',
  'illness.feverSettledWithin48h',
] as const;

export const SYMPTOM_REF_PREFIX = 'symptoms.';

/** An unset or missing threshold is null: rules that use it are inert. */
export function thresholdValue(protocol: Protocol, name: string): number | null {
  return protocol.thresholds[name]?.value ?? null;
}

/** An answer that was never given is UNKNOWN, never "no". */
export function triRef(ctx: Ctx, ref: string): Tri {
  return ctx.tri.get(ref) ?? 'UNKNOWN';
}

export function flagValue(ctx: Ctx, name: string): boolean {
  return ctx.flags.get(name) === true;
}
