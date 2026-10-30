import {
  CONDITION_FLAG_PREFIX,
  FIXED_TRI_REFS,
  KNOWN_FLAGS,
  KNOWN_NUM_FIELDS,
  SYMPTOM_REF_PREFIX,
  type Condition,
  type Level,
  type Protocol,
} from '@bhanak/triage-engine';

const KNOWN_FLAG_SET = new Set<string>(KNOWN_FLAGS);
const KNOWN_NUM_SET = new Set<string>(KNOWN_NUM_FIELDS);
const FIXED_TRI_SET = new Set<string>(FIXED_TRI_REFS);
const SEMVER = /^\d+\.\d+\.\d+$/;

export interface ReviewItem {
  id: string;
  kind: string;
  basis: string;
  review: string;
  sources: string[];
  note: string;
  open: boolean;
}

function sourceLabels(refs: { doc: string; section: string }[]): string[] {
  return refs.map((ref) => `${ref.doc} ${ref.section}`);
}

/** Every reviewable item in the protocol, for the clinical review checklist. */
export function reviewItems(protocol: Protocol): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const [name, threshold] of Object.entries(protocol.thresholds)) {
    items.push({
      id: name,
      kind: 'threshold',
      basis: threshold.basis,
      review: threshold.review,
      sources: sourceLabels(threshold.sourceRefs),
      note: [
        threshold.value === null
          ? 'UNSET: a doctor must decide a value.'
          : `Value ${threshold.value}${threshold.unit === undefined ? '' : ` ${threshold.unit}`}.`,
        threshold.note ?? '',
      ]
        .join(' ')
        .trim(),
      open: threshold.review !== 'REVIEWED' || threshold.value === null,
    });
  }
  const meta = (
    kind: string,
    list: {
      id: string;
      basis: string;
      review: string;
      sourceRefs: { doc: string; section: string }[];
      note?: string | undefined;
    }[],
  ): void => {
    for (const item of list) {
      items.push({
        id: item.id,
        kind,
        basis: item.basis,
        review: item.review,
        sources: sourceLabels(item.sourceRefs),
        note: item.note ?? '',
        open: item.review !== 'REVIEWED',
      });
    }
  };
  meta('danger sign', protocol.dangerSigns);
  meta('rule', [
    ...protocol.rules,
    protocol.noFeverDangerSign,
    protocol.unknownEmergencyRule,
    protocol.uncertainDanger,
  ]);
  meta('risk factor', protocol.riskFactors);
  meta('testing advice', protocol.testingAdvice);
  return items;
}

function walk(condition: Condition, visit: (c: Condition) => void): void {
  visit(condition);
  if (condition.op === 'all' || condition.op === 'any') {
    for (const child of condition.of) walk(child, visit);
  } else if (condition.op === 'not') {
    walk(condition.of, visit);
  }
}

function allConditions(protocol: Protocol): Condition[] {
  const list: Condition[] = [];
  for (const rule of [
    ...protocol.rules,
    protocol.noFeverDangerSign,
    protocol.unknownEmergencyRule,
    protocol.uncertainDanger,
  ]) {
    list.push(rule.when);
  }
  for (const sign of protocol.dangerSigns) {
    if (sign.applicableWhen !== undefined) list.push(sign.applicableWhen);
  }
  for (const item of [...protocol.riskFactors, ...protocol.testingAdvice]) list.push(item.when);
  return list;
}

/**
 * Cross-checks a schema-valid protocol: everything it references must exist, and the safety
 * invariants the engine relies on must hold. Returns human-readable problems (empty = ok).
 */
export function checkProtocolIntegrity(protocol: Protocol): string[] {
  const issues: string[] = [];

  // --- ids ---------------------------------------------------------------------------------
  const ids = [
    ...protocol.dangerSigns.map((s) => s.id),
    ...protocol.rules.map((r) => r.id),
    ...protocol.riskFactors.map((r) => r.id),
    ...protocol.testingAdvice.map((t) => t.id),
    protocol.noFeverDangerSign.id,
    protocol.unknownEmergencyRule.id,
    protocol.uncertainDanger.id,
    protocol.noDangerSignsReason.id,
    protocol.riskFactorPolicy.stepUpRule.id,
    protocol.riskFactorPolicy.floorRule.id,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) issues.push(`duplicate id ${id}`);
    seen.add(id);
  }

  // --- version ---------------------------------------------------------------------------------
  if (!SEMVER.test(protocol.version)) issues.push(`version ${protocol.version} is not semver`);

  // --- references --------------------------------------------------------------------------------
  const thresholdNames = new Set(Object.keys(protocol.thresholds));
  const needThreshold = (name: string | undefined, where: string): void => {
    if (name !== undefined && !thresholdNames.has(name)) {
      issues.push(`${where} references unknown threshold ${name}`);
    }
  };
  needThreshold(protocol.core.recentFeverDaysThreshold, 'core');
  needThreshold(protocol.core.criticalPhaseStartDayThreshold, 'core');
  needThreshold(protocol.core.criticalPhaseEndDayThreshold, 'core');
  needThreshold(protocol.riskFactorPolicy.floorRule.daysSinceOnsetThreshold, 'riskFactorPolicy');

  const checkNum = (
    field: string,
    threshold: string | undefined,
    value: number | undefined,
    where: string,
  ): void => {
    if (!KNOWN_NUM_SET.has(field)) issues.push(`${where} uses unknown numeric field ${field}`);
    needThreshold(threshold, where);
    if ((threshold === undefined) === (value === undefined)) {
      issues.push(`${where} must give exactly one of threshold or value`);
    }
  };
  const checkTri = (ref: string, where: string): void => {
    const isSymptom = ref.startsWith(SYMPTOM_REF_PREFIX) && ref.length > SYMPTOM_REF_PREFIX.length;
    if (!isSymptom && !FIXED_TRI_SET.has(ref)) issues.push(`${where} uses unknown answer ${ref}`);
  };

  for (const sign of protocol.dangerSigns) {
    const where = `danger sign ${sign.id}`;
    if (sign.test.kind === 'tri') checkTri(sign.test.ref, where);
    else checkNum(sign.test.field, sign.test.threshold, sign.test.value, where);
  }
  for (const condition of allConditions(protocol)) {
    walk(condition, (c) => {
      if (c.op === 'flag') {
        if (!KNOWN_FLAG_SET.has(c.name) && !c.name.startsWith(CONDITION_FLAG_PREFIX)) {
          issues.push(`unknown flag ${c.name}`);
        }
      } else if (c.op === 'num') {
        checkNum(c.field, c.threshold, c.value, `condition on ${c.field}`);
      } else if (c.op === 'tri') {
        checkTri(c.ref, 'condition');
      } else if (c.op === 'trend') {
        needThreshold(c.minRelativeChange, `trend on ${c.field}`);
      }
    });
  }

  // --- provenance ----------------------------------------------------------------------------------
  const provenance = [
    ...reviewItems(protocol).map((item) => ({
      id: item.id,
      basis: item.basis,
      sources: item.sources,
    })),
  ];
  const sourceIds = new Set(Object.keys(protocol.sources));
  const referencedDocs = [
    ...Object.values(protocol.thresholds).flatMap((t) => t.sourceRefs),
    ...protocol.dangerSigns.flatMap((s) => s.sourceRefs),
    ...protocol.rules.flatMap((r) => r.sourceRefs),
    ...protocol.riskFactors.flatMap((r) => r.sourceRefs),
    ...protocol.testingAdvice.flatMap((t) => t.sourceRefs),
  ];
  for (const ref of referencedDocs) {
    if (!sourceIds.has(ref.doc)) issues.push(`source document ${ref.doc} is not listed in sources`);
  }
  for (const item of provenance) {
    if (item.basis === 'SOURCE' && item.sources.length === 0) {
      issues.push(`${item.id} is marked SOURCE but cites nothing`);
    }
  }

  // --- structure the engine and the spec rely on ----------------------------------------------------------
  const levelRank: Record<Level, number> = {
    HOME_CARE_WITH_TRIGGERS: 0,
    TEST_AND_MONITOR: 1,
    SEE_DOCTOR_TODAY: 2,
    EMERGENCY_NOW: 3,
  };
  for (const rule of protocol.rules) {
    if (rule.level === 'HOME_CARE_WITH_TRIGGERS') {
      issues.push(`rule ${rule.id} is at HOME_CARE_WITH_TRIGGERS: rules can only raise urgency`);
    }
  }
  if (levelRank[protocol.uncertainDanger.level] > levelRank.SEE_DOCTOR_TODAY) {
    issues.push('uncertainDanger must not exceed SEE_DOCTOR_TODAY (spec 5.1: capped)');
  }
  if (protocol.unknownEmergencyRule.level !== 'EMERGENCY_NOW') {
    issues.push('unknownEmergencyRule must be EMERGENCY_NOW');
  }
  for (const [level, content] of Object.entries(protocol.levels)) {
    if (content.actions.length === 0) issues.push(`level ${level} has no actions`);
  }
  if (protocol.watchFor.length === 0) issues.push('watchFor must not be empty (spec 2.4)');
  if (protocol.returnImmediatelyIf.length === 0) {
    issues.push('returnImmediatelyIf must not be empty (spec 2.4)');
  }

  // --- sign-off ------------------------------------------------------------------------------------------------
  if (protocol.reviewStatus === 'REVIEWED') {
    const { reviewerName, registrationNumber, reviewedOn } = protocol.review;
    if (!reviewerName || !registrationNumber || !reviewedOn) {
      issues.push('REVIEWED needs reviewer name, registration number and date');
    }
    for (const item of reviewItems(protocol)) {
      if (item.open) issues.push(`REVIEWED but ${item.kind} ${item.id} is still open`);
    }
  }
  return issues;
}

/** All i18n keys the protocol refers to. */
export function collectI18nKeys(protocol: Protocol): string[] {
  const keys = new Set<string>();
  const add = (key: string): void => {
    keys.add(key);
  };
  for (const item of [
    ...protocol.dangerSigns,
    ...protocol.rules,
    ...protocol.riskFactors,
    ...protocol.testingAdvice,
    protocol.noFeverDangerSign,
    protocol.unknownEmergencyRule,
    protocol.uncertainDanger,
  ]) {
    add(item.i18nKey);
  }
  add(protocol.noDangerSignsReason.i18nKey);
  add(protocol.riskFactorPolicy.stepUpRule.i18nKey);
  add(protocol.riskFactorPolicy.floorRule.i18nKey);
  add(protocol.criticalPhase.noteI18nKey);
  add(protocol.criticalPhase.feverGoneNoteI18nKey);
  for (const content of Object.values(protocol.levels)) {
    add(content.headlineI18nKey);
    content.actions.forEach(add);
  }
  protocol.watchFor.forEach(add);
  protocol.returnImmediatelyIf.forEach(add);
  return [...keys].sort();
}

/** Missing or unused strings for one locale. */
export function checkStrings(
  protocol: Protocol,
  strings: Record<string, string>,
  extraKnownKeys: readonly string[] = [],
): string[] {
  const issues: string[] = [];
  const needed = new Set([...collectI18nKeys(protocol), ...extraKnownKeys]);
  for (const key of needed) {
    if (!(key in strings)) issues.push(`missing string ${key}`);
  }
  for (const key of Object.keys(strings)) {
    if (!needed.has(key)) issues.push(`unused string ${key}`);
  }
  return issues;
}
