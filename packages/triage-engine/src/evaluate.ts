import { evaluateCondition, signState } from './conditions.js';
import { buildContext } from './context.js';
import { flagValue, thresholdValue } from './ctx.js';
import { canonicalJson, sha256Hex } from './hash.js';
import { levelFromRank, levelRank, maxLevel } from './levels.js';
import { ENGINE_VERSION, FALLBACK_RETURN_IMMEDIATELY_I18N_KEY } from './version.js';
import type { Level, Protocol, Reason, TriageInput, TriageResult } from './types.js';

const protocolHashes = new WeakMap<Protocol, string>();

/** Fingerprint of a protocol's full content (spec 5.6). Memoised per protocol object. */
export function computeProtocolHash(protocol: Protocol): string {
  let hash = protocolHashes.get(protocol);
  if (hash === undefined) {
    hash = sha256Hex(canonicalJson(protocol));
    protocolHashes.set(protocol, hash);
  }
  return hash;
}

/**
 * Decide how urgently to seek care. Pure and deterministic: same input, protocol and `now` always
 * give the same result. Level = MAX over every fired rule; nothing here can lower a level.
 * Unknown, missing and contradictory answers raise urgency, never lower it (spec 2.3).
 */
export function evaluate(input: TriageInput, protocol: Protocol, now: Date): TriageResult {
  const ctx = buildContext(input, protocol, now);
  const reasons: Reason[] = [];
  const fire = (ruleId: string, i18nKey: string, severity: Level): void => {
    reasons.push({ ruleId, i18nKey, severity });
  };

  const states = protocol.dangerSigns.map((sign) => ({ sign, state: signState(sign, ctx) }));
  const present = states.filter((entry) => entry.state === 'PRESENT');
  const unknown = states.filter((entry) => entry.state === 'UNKNOWN');
  ctx.flags.set('anySignPresent', present.length > 0);
  const feverContext = flagValue(ctx, 'feverContext');

  if (feverContext) {
    for (const { sign } of present) fire(sign.id, sign.i18nKey, 'EMERGENCY_NOW');
    for (const { sign } of unknown) {
      const rule =
        sign.unknownPolicy === 'EMERGENCY'
          ? protocol.unknownEmergencyRule
          : protocol.uncertainDanger;
      fire(`${rule.id}:${sign.id}`, rule.i18nKey, rule.level);
    }
  } else if (present.length > 0) {
    const rule = protocol.noFeverDangerSign;
    fire(rule.id, rule.i18nKey, rule.level);
  }
  if (present.length === 0 && unknown.length === 0) {
    fire(
      protocol.noDangerSignsReason.id,
      protocol.noDangerSignsReason.i18nKey,
      'HOME_CARE_WITH_TRIGGERS',
    );
  }
  for (const rule of protocol.rules) {
    if (evaluateCondition(rule.when, ctx)) fire(rule.id, rule.i18nKey, rule.level);
  }

  let level = reasons.reduce<Level>(
    (top, reason) => maxLevel(top, reason.severity),
    'HOME_CARE_WITH_TRIGGERS',
  );

  // Risk factors raise the level one step, never lower it (spec 5.4).
  if (feverContext && ctx.riskFactorIds.length > 0) {
    const { stepUpRule, floorRule } = protocol.riskFactorPolicy;
    const stepped = levelFromRank(
      Math.min(levelRank(level) + stepUpRule.steps, levelRank(stepUpRule.maxLevel)),
    );
    if (levelRank(stepped) > levelRank(level)) {
      fire(stepUpRule.id, stepUpRule.i18nKey, stepped);
      level = stepped;
    }
    const floorDays = thresholdValue(protocol, floorRule.daysSinceOnsetThreshold);
    const daysSinceOnset = ctx.num.get('daysSinceOnset');
    if (
      floorDays !== null &&
      daysSinceOnset !== undefined &&
      daysSinceOnset >= floorDays &&
      levelRank(level) < levelRank(floorRule.level)
    ) {
      fire(floorRule.id, floorRule.i18nKey, floorRule.level);
      level = floorRule.level;
    }
  }

  const ordered = reasons
    .map((reason, index) => ({ reason, index }))
    .sort(
      (a, b) => levelRank(b.reason.severity) - levelRank(a.reason.severity) || a.index - b.index,
    )
    .map((entry) => entry.reason);

  const illnessDay = ctx.num.get('illnessDay');
  const criticalPhaseNotes = flagValue(ctx, 'criticalPhase')
    ? [
        protocol.criticalPhase.noteI18nKey,
        ...(flagValue(ctx, 'feverSettled') ? [protocol.criticalPhase.feverGoneNoteI18nKey] : []),
      ]
    : [];

  return {
    level,
    headlineI18nKey: protocol.levels[level].headlineI18nKey,
    reasons: ordered,
    actions: [...protocol.levels[level].actions],
    watchFor: [...protocol.watchFor],
    returnImmediatelyIf:
      protocol.returnImmediatelyIf.length > 0
        ? [...protocol.returnImmediatelyIf]
        : [FALLBACK_RETURN_IMMEDIATELY_I18N_KEY],
    testingAdvice: protocol.testingAdvice
      .filter((advice) => evaluateCondition(advice.when, ctx))
      .map((advice) => advice.i18nKey),
    criticalPhaseNotes,
    illnessDay: illnessDay ?? null,
    riskFactorIds: [...ctx.riskFactorIds],
    protocolId: protocol.id,
    protocolVersion: protocol.version,
    protocolHash: computeProtocolHash(protocol),
    protocolReviewStatus: protocol.reviewStatus,
    engineVersion: ENGINE_VERSION,
    inputHash: sha256Hex(canonicalJson(input)),
    evaluatedAt: Number.isFinite(now.getTime()) ? now.toISOString() : 'INVALID_TIME',
  };
}
