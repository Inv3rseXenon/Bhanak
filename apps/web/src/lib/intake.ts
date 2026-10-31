import type { LabStatus, Sex, Tri, TriageInput } from '@bhanak/triage-engine';

/**
 * Guided intake (spec 6): one question per screen, and the mapping from answers to the engine's
 * TriageInput. Pure functions only, so it can be unit-tested without a browser.
 *
 * Mapping rules (docs/TODO.md K-004):
 *  - A question that was shown always sends an explicit answer; one that was never shown sends
 *    nothing, and the engine reads "nothing" as UNKNOWN, never as NO.
 *  - "Not sure" on pregnancy, blood-thinner and lives-alone answers is mapped to YES (cautious).
 *  - "Not sure" on a danger question stays UNKNOWN: the protocol decides what that means.
 */

/** Single answers are strings; multi-select answers are string arrays. */
export type Answers = Record<string, string | string[]>;

export type StepKind = 'choice' | 'tri' | 'multi' | 'age' | 'count' | 'temp' | 'labs';

export interface StepOption {
  value: string;
  labelKey: string;
}

export interface Step {
  id: string;
  kind: StepKind;
  titleKey: string;
  helpKey?: string;
  options?: readonly StepOption[];
}

const WHO: readonly StepOption[] = [
  { value: 'SELF', labelKey: 'intake.who.self' },
  { value: 'CHILD', labelKey: 'intake.who.child' },
  { value: 'FAMILY', labelKey: 'intake.who.family' },
];

const SEX: readonly StepOption[] = [
  { value: 'FEMALE', labelKey: 'intake.sex.female' },
  { value: 'MALE', labelKey: 'intake.sex.male' },
  { value: 'OTHER', labelKey: 'intake.sex.other' },
  { value: 'UNKNOWN', labelKey: 'intake.sex.unknown' },
];

/** Codes are the protocol's condition vocabulary (dengue/v0.1.0.json riskFactors). */
export const CONDITION_CODES = [
  'DIABETES',
  'HYPERTENSION',
  'HEART_DISEASE',
  'KIDNEY_DISEASE',
  'LIVER_DISEASE',
  'BLOOD_DISORDER',
  'OBESITY',
  'PEPTIC_ULCER',
] as const;

const CONDITIONS: readonly StepOption[] = CONDITION_CODES.map((code) => ({
  value: code,
  labelKey: `dengue.risk.${code.toLowerCase()}`,
}));

/** Symptoms asked as a group; each is sent as an explicit YES (ticked) or NO (not ticked). */
export const OTHER_SYMPTOMS = [
  'headache',
  'severeHeadache',
  'eyePain',
  'bodyPain',
  'rash',
  'nausea',
] as const;

const OTHER_SYMPTOM_OPTIONS: readonly StepOption[] = OTHER_SYMPTOMS.map((key) => ({
  value: key,
  labelKey: `intake.other.${key}`,
}));

/** Symptom keys for the danger-sign questions, in the order they are asked. */
export const DANGER_SYMPTOM_KEYS = [
  'severeAbdominalPain',
  'bleedingGums',
  'bleedingNose',
  'bloodInVomit',
  'bloodOrBlackStool',
  'bloodInUrine',
  'heavyMenstrualBleeding',
  'drowsyOrLethargic',
  'confusion',
  'restlessOrIrritable',
  'fits',
  'coldClammyHandsFeet',
  'fainting',
  'veryWeakPulse',
  'paleOrMottledSkin',
  'breathingDifficulty',
  'chestPain',
  'jaundice',
  'reducedFetalMovement',
] as const;

/** "N days ago" choices; 8 means "8 or more". UNKNOWN = not sure. */
const ONSET_OPTIONS: readonly StepOption[] = [
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((days) => ({
    value: String(days),
    labelKey: `intake.onset.d${days}`,
  })),
  { value: 'UNKNOWN', labelKey: 'intake.notSure' },
];

const tri = (id: string, titleKey: string, helpKey?: string): Step => ({
  id,
  kind: 'tri',
  titleKey,
  ...(helpKey === undefined ? {} : { helpKey }),
});

export function parseNumber(text: string | undefined): number {
  if (text === undefined) return Number.NaN;
  const cleaned = text.replace(/[\s,]/g, '');
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

const str = (value: string | string[] | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;
const list = (value: string | string[] | undefined): string[] =>
  Array.isArray(value) ? value : [];

/** Age in whole months, or NaN while the age question has not been answered validly. */
export function ageInMonths(answers: Answers): number {
  const value = parseNumber(str(answers.age));
  if (Number.isNaN(value)) return Number.NaN;
  return str(answers.ageUnit) === 'MONTHS' ? Math.round(value) : Math.round(value * 12);
}

const triOf = (value: string | string[] | undefined): Tri => {
  const text = str(value);
  return text === 'YES' || text === 'NO' ? text : 'UNKNOWN';
};

/** YES and "not sure" are both treated as true: the cautious reading (K-004). */
const cautiousBool = (value: string | string[] | undefined): boolean => triOf(value) !== 'NO';

/** The steps to show for these answers, in order. Re-evaluated after every answer. */
export function visibleSteps(answers: Answers): Step[] {
  const months = ageInMonths(answers);
  const ageKnown = !Number.isNaN(months);
  const sex = str(answers.sex);
  const feverNow = str(answers.feverNow);
  const feverSettled = str(answers.feverSettled);
  const pregnancyAsked =
    sex !== 'MALE' && sex !== undefined && (!ageKnown || (months >= 120 && months <= 660));
  const pregnant = pregnancyAsked && cautiousBool(answers.pregnant);
  const noFeverAtAll = feverNow === 'NO' && feverSettled === 'NO';
  const child = ageKnown && months < 60;

  const steps: Step[] = [
    { id: 'who', kind: 'choice', titleKey: 'intake.who.title', options: WHO },
    { id: 'age', kind: 'age', titleKey: 'intake.age.title', helpKey: 'intake.age.help' },
    { id: 'sex', kind: 'choice', titleKey: 'intake.sex.title', options: SEX },
  ];
  if (pregnancyAsked) steps.push(tri('pregnant', 'intake.pregnant.title'));
  steps.push(
    {
      id: 'conditions',
      kind: 'multi',
      titleKey: 'intake.conditions.title',
      helpKey: 'intake.conditions.help',
      options: CONDITIONS,
    },
    tri('anticoagulant', 'intake.anticoagulant.title'),
    tri('livesAlone', 'intake.livesAlone.title'),
    tri('feverNow', 'intake.feverNow.title'),
  );
  if (feverNow !== 'YES') steps.push(tri('feverSettled', 'intake.feverSettled.title'));
  if (!noFeverAtAll) {
    steps.push(
      {
        id: 'onset',
        kind: 'choice',
        titleKey: 'intake.onset.title',
        helpKey: 'intake.onset.help',
        options: ONSET_OPTIONS,
      },
      {
        id: 'maxTemp',
        kind: 'temp',
        titleKey: 'intake.maxTemp.title',
        helpKey: 'intake.maxTemp.help',
      },
    );
  }
  steps.push(
    tri('fluids', 'intake.fluids.title', 'intake.fluids.help'),
    { id: 'vomiting', kind: 'count', titleKey: 'intake.vomiting.title' },
    {
      id: 'urine',
      kind: 'count',
      titleKey: ageKnown && months < 12 ? 'intake.urineBaby.title' : 'intake.urine.title',
      helpKey: 'intake.urine.help',
    },
  );
  for (const key of DANGER_SYMPTOM_KEYS) {
    if (key === 'heavyMenstrualBleeding' && sex === 'MALE') continue;
    if (key === 'reducedFetalMovement' && !pregnant) continue;
    steps.push(tri(`sym.${key}`, `q.${key}.title`, `q.${key}.help`));
  }
  steps.push(tri('sym.stomachPain', 'q.stomachPain.title'));
  steps.push(tri('sym.poorOralIntake', 'q.poorOralIntake.title'));
  if (child) {
    steps.push(tri('sym.poorFeeding', 'q.poorFeeding.title'));
    steps.push(tri('sym.fewerWetDiapers', 'q.fewerWetDiapers.title'));
  }
  steps.push(
    {
      id: 'otherSymptoms',
      kind: 'multi',
      titleKey: 'intake.other.title',
      helpKey: 'intake.other.help',
      options: OTHER_SYMPTOM_OPTIONS,
    },
    tri('nsaid', 'intake.nsaid.title', 'intake.nsaid.help'),
    tri('hasLabs', 'intake.hasLabs.title'),
  );
  if (str(answers.hasLabs) === 'YES') {
    steps.push({
      id: 'labs',
      kind: 'labs',
      titleKey: 'intake.labs.title',
      helpKey: 'intake.labs.help',
    });
  }
  return steps;
}

export const LAB_FIELDS = ['platelet', 'hematocrit', 'ast', 'alt'] as const;
export const LAB_TESTS = ['ns1', 'igm', 'igg'] as const;

/** An error key for the current step's answer, or null when it can proceed. */
export function validateStep(step: Step, answers: Answers): string | null {
  switch (step.kind) {
    case 'choice':
    case 'tri':
      return str(answers[step.id]) === undefined ? 'error.choose' : null;
    case 'multi':
      return null;
    case 'age': {
      const value = parseNumber(str(answers.age));
      if (Number.isNaN(value)) return 'error.age';
      const unit = str(answers.ageUnit);
      return value <= (unit === 'MONTHS' ? 119 : 120) ? null : 'error.age';
    }
    case 'count': {
      const text = str(answers[step.id]);
      if (text === 'UNKNOWN') return null;
      const value = parseNumber(text);
      return Number.isInteger(value) && value <= 99 ? null : 'error.count';
    }
    case 'temp': {
      const text = str(answers.maxTemp);
      if (text === undefined || text === '' || text === 'UNKNOWN') return null;
      const value = parseNumber(text);
      return value >= 34 && value <= 43 ? null : 'error.temp';
    }
    case 'labs': {
      for (const field of LAB_FIELDS) {
        const text = str(answers[`lab.${field}`]);
        if (text !== undefined && text !== '' && Number.isNaN(parseNumber(text))) {
          return 'error.number';
        }
      }
      return null;
    }
  }
}

/** Local calendar date (YYYY-MM-DD) `daysAgo` days before `now`, at the given UTC offset. */
export function localDateDaysAgo(now: Date, utcOffsetMinutes: number, daysAgo: number): string {
  const shifted = new Date(now.getTime() + utcOffsetMinutes * 60_000 - daysAgo * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

const optionalNumber = (value: string | string[] | undefined): number | undefined => {
  const parsed = parseNumber(str(value));
  return Number.isNaN(parsed) ? undefined : parsed;
};

const labStatus = (value: string | string[] | undefined): LabStatus | undefined => {
  const text = str(value);
  return text === 'POSITIVE' || text === 'NEGATIVE' || text === 'NOT_DONE' ? text : undefined;
};

export function toTriageInput(answers: Answers, now: Date, utcOffsetMinutes: number): TriageInput {
  const steps = visibleSteps(answers);
  const asked = new Set(steps.map((step) => step.id));
  const months = ageInMonths(answers);
  const sex = (str(answers.sex) ?? 'UNKNOWN') as Sex;

  const symptoms: Record<string, Tri> = {};
  for (const step of steps) {
    if (step.id.startsWith('sym.')) symptoms[step.id.slice(4)] = triOf(answers[step.id]);
  }
  if (asked.has('otherSymptoms')) {
    const chosen = new Set(list(answers.otherSymptoms));
    for (const key of OTHER_SYMPTOMS) symptoms[key] = chosen.has(key) ? 'YES' : 'NO';
  }

  const onsetAnswer = str(answers.onset);
  const onsetDays = onsetAnswer === undefined ? Number.NaN : Number(onsetAnswer);
  const labs: TriageInput['labs'] = {};
  if (asked.has('labs')) {
    const platelet = optionalNumber(answers['lab.platelet']);
    const hematocrit = optionalNumber(answers['lab.hematocrit']);
    const ast = optionalNumber(answers['lab.ast']);
    const alt = optionalNumber(answers['lab.alt']);
    if (platelet !== undefined) labs.plateletCount = platelet;
    if (hematocrit !== undefined) labs.hematocrit = hematocrit;
    if (ast !== undefined) labs.ast = ast;
    if (alt !== undefined) labs.alt = alt;
    for (const test of LAB_TESTS) {
      const status = labStatus(answers[`lab.${test}`]);
      if (status !== undefined) labs[test] = status;
    }
  }

  const maxTemp = optionalNumber(answers.maxTemp);
  const vomiting = optionalNumber(answers.vomiting);
  const urine = optionalNumber(answers.urine);

  return {
    subject: {
      ageMonths: months,
      sex,
      pregnant: asked.has('pregnant') ? cautiousBool(answers.pregnant) : false,
      conditions: list(answers.conditions),
      onAnticoagulant: cautiousBool(answers.anticoagulant),
      livesAloneOrFarFromHospital: cautiousBool(answers.livesAlone),
    },
    illness: {
      feverOnsetDate:
        asked.has('onset') && Number.isInteger(onsetDays)
          ? localDateDaysAgo(now, utcOffsetMinutes, onsetDays)
          : null,
      maxTempC: maxTemp ?? null,
      feverNow: triOf(answers.feverNow),
      ...(asked.has('feverSettled') ? { feverSettledWithin48h: triOf(answers.feverSettled) } : {}),
    },
    symptoms,
    counts: {
      vomitingEpisodes24h: vomiting ?? null,
      urineLast6hOrDiaperCount: urine ?? null,
    },
    fluids: { canKeepFluidsDown: triOf(answers.fluids) },
    labs,
    meds: { tookNsaidOrAspirin: triOf(answers.nsaid) },
    context: { utcOffsetMinutes },
  };
}
