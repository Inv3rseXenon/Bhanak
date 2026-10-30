import { evaluateCondition } from './conditions.js';
import { CONDITION_FLAG_PREFIX, SYMPTOM_REF_PREFIX, thresholdValue, type Ctx } from './ctx.js';
import { localDayNumber, parseDayNumber } from './dates.js';
import type { Protocol, Tri } from './types.js';

type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const asRecord = (value: unknown): Rec => (isRecord(value) ? value : {});

/** Anything other than an explicit YES or NO is UNKNOWN. */
export const triOf = (value: unknown): Tri =>
  value === 'YES' || value === 'NO' ? value : 'UNKNOWN';

interface NumRead {
  value: number | undefined;
  invalid: boolean;
}

/** null/undefined = not given; a negative, non-finite or non-numeric value = invalid. */
export function readNum(value: unknown): NumRead {
  if (value === undefined || value === null) return { value: undefined, invalid: false };
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return { value, invalid: false };
  }
  return { value: undefined, invalid: true };
}

const LAB_FIELDS = ['plateletCount', 'hematocrit', 'ast', 'alt'] as const;
const TREND_FIELDS = ['plateletCount', 'hematocrit'] as const;

export function buildContext(input: unknown, protocol: Protocol, now: Date): Ctx {
  const root = asRecord(input);
  const subject = asRecord(root.subject);
  const illness = asRecord(root.illness);
  const symptoms = asRecord(root.symptoms);
  const counts = asRecord(root.counts);
  const fluids = asRecord(root.fluids);
  const labs = asRecord(root.labs);
  const previousLabs = asRecord(labs.previous);
  const meds = asRecord(root.meds);
  const context = asRecord(root.context);

  const ctx: Ctx = {
    protocol,
    tri: new Map(),
    num: new Map(),
    flags: new Map(),
    trends: new Map(),
    riskFactorIds: [],
    issues: [],
  };

  // --- plain answers -------------------------------------------------------------------
  for (const key of Object.keys(symptoms)) {
    ctx.tri.set(`${SYMPTOM_REF_PREFIX}${key}`, triOf(symptoms[key]));
  }
  ctx.tri.set('fluids.canKeepFluidsDown', triOf(fluids.canKeepFluidsDown));
  ctx.tri.set('meds.tookNsaidOrAspirin', triOf(meds.tookNsaidOrAspirin));
  const feverNow = triOf(illness.feverNow);
  const settledAnswer = triOf(illness.feverSettledWithin48h);
  ctx.tri.set('illness.feverNow', feverNow);
  ctx.tri.set('illness.feverSettledWithin48h', settledAnswer);

  // --- numbers: invalid ones become "unknown" and are flagged as an input issue ---------------
  const numbers: [string, unknown][] = [
    ['ageMonths', subject.ageMonths],
    ['maxTempC', illness.maxTempC],
    ['vomitingEpisodes24h', counts.vomitingEpisodes24h],
    ['urineLast6hOrDiaperCount', counts.urineLast6hOrDiaperCount],
    ...LAB_FIELDS.map((field): [string, unknown] => [field, labs[field]]),
  ];
  for (const [field, raw] of numbers) {
    const read = readNum(raw);
    if (read.value !== undefined) ctx.num.set(field, read.value);
    if (read.invalid) ctx.issues.push(`invalid:${field}`);
  }
  if (!ctx.num.has('ageMonths')) ctx.issues.push('missing:ageMonths');

  // --- dates ----------------------------------------------------------------------------
  const offsetRaw = context.utcOffsetMinutes;
  const offset =
    typeof offsetRaw === 'number' && Number.isFinite(offsetRaw)
      ? offsetRaw
      : protocol.defaults.utcOffsetMinutes;
  const today = localDayNumber(now, offset);
  const onsetRaw = illness.feverOnsetDate;
  const onsetDay = parseDayNumber(onsetRaw);
  let daysSinceOnset: number | undefined;
  if (today !== undefined && onsetDay !== undefined) daysSinceOnset = today - onsetDay;
  if (daysSinceOnset !== undefined && daysSinceOnset < 0) {
    ctx.issues.push('onsetInFuture');
    daysSinceOnset = undefined;
  }
  if (onsetRaw !== undefined && onsetRaw !== null && onsetDay === undefined) {
    ctx.issues.push('invalid:feverOnsetDate');
  }
  if (daysSinceOnset !== undefined) {
    ctx.num.set('daysSinceOnset', daysSinceOnset);
    ctx.num.set('illnessDay', daysSinceOnset + 1);
  }

  // --- fever context: unknown fever is treated as possible fever ----------------------------
  const recentDays = thresholdValue(protocol, protocol.core.recentFeverDaysThreshold);
  const recentOnset =
    daysSinceOnset !== undefined && recentDays !== null && daysSinceOnset <= recentDays;
  const feverCurrent = feverNow === 'YES';
  const feverContext = feverNow !== 'NO' || settledAnswer !== 'NO' || recentOnset;
  const illnessDay = ctx.num.get('illnessDay');
  const startDay = thresholdValue(protocol, protocol.core.criticalPhaseStartDayThreshold);
  const endDay = thresholdValue(protocol, protocol.core.criticalPhaseEndDayThreshold);
  const criticalPhase =
    feverContext &&
    illnessDay !== undefined &&
    startDay !== null &&
    endDay !== null &&
    illnessDay >= startDay &&
    illnessDay <= endDay;

  // --- subject flags -----------------------------------------------------------------------
  const pregnant = subject.pregnant === true;
  const male = subject.sex === 'MALE';
  if (pregnant && male) ctx.issues.push('contradiction:pregnantMale');
  const conditions = Array.isArray(subject.conditions) ? subject.conditions : [];
  for (const code of conditions) {
    if (typeof code === 'string') ctx.flags.set(`${CONDITION_FLAG_PREFIX}${code}`, true);
  }

  // --- labs ------------------------------------------------------------------------------------
  for (const field of TREND_FIELDS) {
    const current = ctx.num.get(field);
    const previous = readNum(previousLabs[field]);
    if (previous.invalid) ctx.issues.push(`invalid:previous.${field}`);
    if (current !== undefined && previous.value !== undefined) {
      ctx.trends.set(field, { previous: previous.value, current });
    }
  }
  const anyLabPositive = ['ns1', 'igm', 'igg'].some((test) => labs[test] === 'POSITIVE');

  const flags: [string, boolean][] = [
    ['feverContext', feverContext],
    ['feverCurrent', feverCurrent],
    ['feverSettled', settledAnswer === 'YES' && !feverCurrent],
    ['feverUnder24h', feverCurrent && daysSinceOnset === 0],
    ['criticalPhase', criticalPhase],
    ['inOutbreakSeason', Boolean(context.inOutbreakSeason ?? protocol.defaults.inOutbreakSeason)],
    ['pregnant', pregnant],
    ['onAnticoagulant', subject.onAnticoagulant === true],
    ['livesAloneOrFarFromHospital', subject.livesAloneOrFarFromHospital === true],
    ['sexMale', male],
    ['anyLabPositive', anyLabPositive],
    ['inputInconsistent', ctx.issues.length > 0],
    ['anySignPresent', false],
    ['anyRiskFactor', false],
  ];
  for (const [name, value] of flags) ctx.flags.set(name, value);

  // --- risk factors (need the flags above) ---------------------------------------------------------
  ctx.riskFactorIds = protocol.riskFactors
    .filter((factor) => evaluateCondition(factor.when, ctx))
    .map((factor) => factor.id);
  ctx.num.set('riskFactorCount', ctx.riskFactorIds.length);
  ctx.flags.set('anyRiskFactor', ctx.riskFactorIds.length > 0);
  return ctx;
}
