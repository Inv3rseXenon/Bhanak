import { describe, expect, it } from 'vitest';
import { evaluate } from '@bhanak/triage-engine';
import type { Condition } from '@bhanak/triage-engine';
import { assess } from '../src/lib/assess';
import {
  DANGER_SYMPTOM_KEYS,
  OTHER_SYMPTOMS,
  ageInMonths,
  localDateDaysAgo,
  parseNumber,
  toTriageInput,
  validateStep,
  visibleSteps,
} from '../src/lib/intake';
import type { Answers } from '../src/lib/intake';
import { protocol } from '../src/lib/protocol';
import { en } from '../src/i18n/en';

const now = new Date('2026-09-15T10:00:00+05:30');
const IST = 330;

/** An adult man with fever for 2 days and every question answered "No" (fluids: yes). */
const baseAnswers = (): Answers => {
  const answers: Answers = {
    who: 'SELF',
    age: '30',
    ageUnit: 'YEARS',
    sex: 'MALE',
    conditions: [],
    anticoagulant: 'NO',
    livesAlone: 'NO',
    feverNow: 'YES',
    onset: '2',
    maxTemp: '39',
    fluids: 'YES',
    vomiting: '0',
    urine: '4',
    otherSymptoms: [],
    nsaid: 'NO',
    hasLabs: 'NO',
  };
  for (const step of visibleSteps(answers)) {
    if (step.id.startsWith('sym.')) answers[step.id] = 'NO';
  }
  return answers;
};

describe('parseNumber', () => {
  it('reads plain and Indian-formatted numbers', () => {
    expect(parseNumber('25000')).toBe(25000);
    expect(parseNumber('1,50,000')).toBe(150000);
    expect(parseNumber(' 38.5 ')).toBe(38.5);
  });
  it('rejects anything else', () => {
    for (const bad of ['', 'abc', '-3', '1e3', '3.', undefined]) {
      expect(parseNumber(bad)).toBeNaN();
    }
  });
});

describe('age and dates', () => {
  it('converts years and months to months', () => {
    expect(ageInMonths({ age: '30' })).toBe(360);
    expect(ageInMonths({ age: '8', ageUnit: 'MONTHS' })).toBe(8);
    expect(ageInMonths({})).toBeNaN();
  });
  it('computes the local calendar date of fever onset', () => {
    expect(localDateDaysAgo(now, IST, 0)).toBe('2026-09-15');
    expect(localDateDaysAgo(now, IST, 2)).toBe('2026-09-13');
    // 23:30 UTC on 14 Sep is already 15 Sep in India.
    expect(localDateDaysAgo(new Date('2026-09-14T23:30:00Z'), IST, 0)).toBe('2026-09-15');
  });
});

describe('visible steps (one question per screen, with branching)', () => {
  it('starts with who, age, sex', () => {
    expect(
      visibleSteps({})
        .map((s) => s.id)
        .slice(0, 3),
    ).toEqual(['who', 'age', 'sex']);
  });
  it('asks about pregnancy only for people who could be pregnant', () => {
    const ids = (answers: Answers) => visibleSteps(answers).map((s) => s.id);
    expect(ids({ age: '30', sex: 'FEMALE' })).toContain('pregnant');
    expect(ids({ age: '30', sex: 'MALE' })).not.toContain('pregnant');
    expect(ids({ age: '6', sex: 'FEMALE' })).not.toContain('pregnant');
    expect(ids({ age: '60', sex: 'FEMALE' })).not.toContain('pregnant');
  });
  it('asks about heavy menstrual bleeding unless male, and fetal movement only if pregnant', () => {
    const ids = (answers: Answers) => visibleSteps(answers).map((s) => s.id);
    expect(ids({ age: '30', sex: 'MALE' })).not.toContain('sym.heavyMenstrualBleeding');
    expect(ids({ age: '30', sex: 'FEMALE', pregnant: 'NO' })).toContain(
      'sym.heavyMenstrualBleeding',
    );
    expect(ids({ age: '30', sex: 'FEMALE', pregnant: 'NO' })).not.toContain(
      'sym.reducedFetalMovement',
    );
    for (const answer of ['YES', 'UNKNOWN']) {
      expect(ids({ age: '30', sex: 'FEMALE', pregnant: answer })).toContain(
        'sym.reducedFetalMovement',
      );
    }
  });
  it('asks the fever-settled question unless there is fever now, and skips onset with no fever at all', () => {
    const ids = (answers: Answers) => visibleSteps(answers).map((s) => s.id);
    expect(ids({ feverNow: 'YES' })).not.toContain('feverSettled');
    expect(ids({ feverNow: 'NO' })).toContain('feverSettled');
    expect(ids({ feverNow: 'NO', feverSettled: 'YES' })).toContain('onset');
    expect(ids({ feverNow: 'NO', feverSettled: 'NO' })).not.toContain('onset');
  });
  it('asks child-only questions for children under 5, and wet diapers for babies', () => {
    const ids = (answers: Answers) => visibleSteps(answers).map((s) => s.id);
    expect(ids({ age: '3' })).toContain('sym.poorFeeding');
    expect(ids({ age: '30' })).not.toContain('sym.poorFeeding');
    expect(
      visibleSteps({ age: '6', ageUnit: 'MONTHS' }).find((s) => s.id === 'urine')?.titleKey,
    ).toBe('intake.urineBaby.title');
  });
  it('shows the labs screen only when the person has a report', () => {
    expect(visibleSteps({ hasLabs: 'YES' }).map((s) => s.id)).toContain('labs');
    expect(visibleSteps({ hasLabs: 'NO' }).map((s) => s.id)).not.toContain('labs');
  });
});

describe('every protocol question is asked', () => {
  const symptomRefs = new Set<string>();
  const walk = (condition: Condition): void => {
    if (condition.op === 'tri' && condition.ref.startsWith('symptoms.')) {
      symptomRefs.add(condition.ref.slice('symptoms.'.length));
    }
    if (condition.op === 'all' || condition.op === 'any') condition.of.forEach(walk);
    if (condition.op === 'not') walk(condition.of);
  };
  for (const item of [
    ...protocol.rules,
    ...protocol.riskFactors,
    ...protocol.testingAdvice,
    protocol.noFeverDangerSign,
    protocol.unknownEmergencyRule,
    protocol.uncertainDanger,
  ]) {
    walk(item.when);
  }
  for (const sign of protocol.dangerSigns) {
    if (sign.test.kind === 'tri' && sign.test.ref.startsWith('symptoms.')) {
      symptomRefs.add(sign.test.ref.slice('symptoms.'.length));
    }
  }

  it('has a question for every symptom the protocol looks at', () => {
    const asked = new Set<string>([
      ...DANGER_SYMPTOM_KEYS,
      ...OTHER_SYMPTOMS,
      'stomachPain',
      'poorOralIntake',
      'poorFeeding',
      'fewerWetDiapers',
    ]);
    expect(symptomRefs.size).toBeGreaterThan(10);
    for (const key of symptomRefs)
      expect(asked.has(key), `no question for symptom ${key}`).toBe(true);
  });

  it('asks every danger sign question "Yes / No / not sure"', () => {
    const answers = { ...baseAnswers(), sex: 'FEMALE', pregnant: 'YES' };
    const ids = visibleSteps(answers).map((s) => s.id);
    for (const sign of protocol.dangerSigns) {
      if (sign.test.kind === 'tri' && sign.test.ref.startsWith('symptoms.')) {
        const key = sign.test.ref.slice('symptoms.'.length);
        expect(ids, key).toContain(`sym.${key}`);
        const step = visibleSteps(answers).find((s) => s.id === `sym.${key}`);
        expect(step?.kind).toBe('tri');
      }
    }
  });

  it('has English text for every question and option', () => {
    const answers = { ...baseAnswers(), sex: 'FEMALE', pregnant: 'YES', age: '3', hasLabs: 'YES' };
    for (const step of visibleSteps(answers)) {
      expect(en, step.titleKey).toHaveProperty([step.titleKey]);
      for (const option of step.options ?? []) {
        const known = option.labelKey in en || option.labelKey.startsWith('dengue.risk.');
        expect(known, option.labelKey).toBe(true);
      }
    }
  });
});

describe('answers to engine input (K-004)', () => {
  it('maps a complete, ordinary set of answers', () => {
    const input = toTriageInput(baseAnswers(), now, IST);
    expect(input.subject).toMatchObject({
      ageMonths: 360,
      sex: 'MALE',
      pregnant: false,
      onAnticoagulant: false,
      livesAloneOrFarFromHospital: false,
    });
    expect(input.illness).toMatchObject({
      feverNow: 'YES',
      feverOnsetDate: '2026-09-13',
      maxTempC: 39,
    });
    expect(input.counts).toEqual({ vomitingEpisodes24h: 0, urineLast6hOrDiaperCount: 4 });
    expect(input.fluids.canKeepFluidsDown).toBe('YES');
    expect(input.context.utcOffsetMinutes).toBe(IST);
  });

  it('sends an explicit NO for every symptom question that was shown', () => {
    const input = toTriageInput(baseAnswers(), now, IST);
    for (const key of DANGER_SYMPTOM_KEYS) {
      if (key === 'heavyMenstrualBleeding' || key === 'reducedFetalMovement') continue; // not shown
      expect(input.symptoms[key], key).toBe('NO');
    }
    for (const key of OTHER_SYMPTOMS) expect(input.symptoms[key]).toBe('NO');
  });

  it('sends nothing for a question that was never shown (the engine reads that as UNKNOWN)', () => {
    const input = toTriageInput(baseAnswers(), now, IST);
    expect(input.symptoms).not.toHaveProperty('heavyMenstrualBleeding');
    expect(input.symptoms).not.toHaveProperty('reducedFetalMovement');
    expect(input.symptoms).not.toHaveProperty('poorFeeding');
  });

  it('keeps "not sure" as UNKNOWN on danger questions', () => {
    const input = toTriageInput({ ...baseAnswers(), 'sym.bleedingGums': 'UNKNOWN' }, now, IST);
    expect(input.symptoms.bleedingGums).toBe('UNKNOWN');
  });

  it('maps "not sure" to YES for pregnancy, blood thinner and lives-alone (cautious)', () => {
    const input = toTriageInput(
      {
        ...baseAnswers(),
        sex: 'FEMALE',
        pregnant: 'UNKNOWN',
        anticoagulant: 'UNKNOWN',
        livesAlone: 'UNKNOWN',
      },
      now,
      IST,
    );
    expect(input.subject.pregnant).toBe(true);
    expect(input.subject.onAnticoagulant).toBe(true);
    expect(input.subject.livesAloneOrFarFromHospital).toBe(true);
  });

  it('turns ticked symptoms into YES and unticked ones into NO', () => {
    const input = toTriageInput({ ...baseAnswers(), otherSymptoms: ['rash', 'eyePain'] }, now, IST);
    expect(input.symptoms).toMatchObject({ rash: 'YES', eyePain: 'YES', headache: 'NO' });
  });

  it('treats "not sure" counts and an unknown onset as missing, never as zero or as a date', () => {
    const input = toTriageInput(
      {
        ...baseAnswers(),
        vomiting: 'UNKNOWN',
        urine: 'UNKNOWN',
        onset: 'UNKNOWN',
        maxTemp: 'UNKNOWN',
      },
      now,
      IST,
    );
    expect(input.counts).toEqual({ vomitingEpisodes24h: null, urineLast6hOrDiaperCount: null });
    expect(input.illness.feverOnsetDate).toBeNull();
    expect(input.illness.maxTempC).toBeNull();
  });

  it('maps lab values, including Indian number formatting', () => {
    const input = toTriageInput(
      {
        ...baseAnswers(),
        hasLabs: 'YES',
        'lab.platelet': '45,000',
        'lab.hematocrit': '41',
        'lab.ns1': 'POSITIVE',
      },
      now,
      IST,
    );
    expect(input.labs).toEqual({ plateletCount: 45000, hematocrit: 41, ns1: 'POSITIVE' });
  });

  it('ignores stale answers to questions that are no longer shown', () => {
    const input = toTriageInput(
      { ...baseAnswers(), sex: 'MALE', 'sym.heavyMenstrualBleeding': 'YES', pregnant: 'YES' },
      now,
      IST,
    );
    expect(input.symptoms).not.toHaveProperty('heavyMenstrualBleeding');
    expect(input.subject.pregnant).toBe(false);
  });

  it('does not send a settled-fever answer when there is fever now', () => {
    const input = toTriageInput({ ...baseAnswers(), feverSettled: 'YES' }, now, IST);
    expect(input.illness).not.toHaveProperty('feverSettledWithin48h');
  });
});

describe('step validation', () => {
  const step = (id: string) => {
    const found = visibleSteps({ hasLabs: 'YES' }).find((s) => s.id === id);
    if (found === undefined) throw new Error(`no step ${id}`);
    return found;
  };
  it('requires an answer to a choice or yes/no question', () => {
    expect(validateStep(step('who'), {})).toBe('error.choose');
    expect(validateStep(step('who'), { who: 'SELF' })).toBeNull();
    expect(validateStep(step('feverNow'), {})).toBe('error.choose');
  });
  it('validates age', () => {
    for (const age of ['', 'abc', '121', '-1']) {
      expect(validateStep(step('age'), { age }), age).toBe('error.age');
    }
    expect(validateStep(step('age'), { age: '0' })).toBeNull();
    expect(validateStep(step('age'), { age: '120' })).toBeNull();
    expect(validateStep(step('age'), { age: '120', ageUnit: 'MONTHS' })).toBe('error.age');
    expect(validateStep(step('age'), { age: '18', ageUnit: 'MONTHS' })).toBeNull();
  });
  it('accepts a whole number or "not sure" for counts', () => {
    expect(validateStep(step('vomiting'), {})).toBe('error.count');
    expect(validateStep(step('vomiting'), { vomiting: '2.5' })).toBe('error.count');
    expect(validateStep(step('vomiting'), { vomiting: '100' })).toBe('error.count');
    expect(validateStep(step('vomiting'), { vomiting: '3' })).toBeNull();
    expect(validateStep(step('vomiting'), { vomiting: 'UNKNOWN' })).toBeNull();
  });
  it('accepts an empty or plausible temperature', () => {
    expect(validateStep(step('maxTemp'), {})).toBeNull();
    expect(validateStep(step('maxTemp'), { maxTemp: '38.5' })).toBeNull();
    expect(validateStep(step('maxTemp'), { maxTemp: '12' })).toBe('error.temp');
    expect(validateStep(step('maxTemp'), { maxTemp: 'hot' })).toBe('error.temp');
  });
  it('rejects non-numeric lab values', () => {
    expect(validateStep(step('labs'), { 'lab.platelet': 'low' })).toBe('error.number');
    expect(validateStep(step('labs'), { 'lab.platelet': '1,50,000' })).toBeNull();
    expect(validateStep(step('labs'), {})).toBeNull();
  });
  it('lets a multi-select continue with nothing ticked', () => {
    expect(validateStep(step('conditions'), {})).toBeNull();
  });
});

describe('end to end: answers -> engine -> result', () => {
  const level = (answers: Answers): string => {
    const assessment = assess(toTriageInput(answers, now, IST), protocol, now, false);
    if (assessment.kind !== 'ok') throw new Error('unexpected fail-safe');
    return assessment.result.level;
  };

  it('is an emergency when a person with fever cannot keep fluids down', () => {
    expect(level({ ...baseAnswers(), fluids: 'NO' })).toBe('EMERGENCY_NOW');
  });
  it('is an emergency for each emergency-type danger sign answered Yes', () => {
    for (const key of ['bleedingGums', 'drowsyOrLethargic', 'confusion', 'bloodInVomit']) {
      expect(level({ ...baseAnswers(), [`sym.${key}`]: 'YES' }), key).toBe('EMERGENCY_NOW');
    }
  });
  it('never drops a "not sure" danger answer below see-a-doctor-today when there is fever', () => {
    for (const key of DANGER_SYMPTOM_KEYS) {
      if (key === 'heavyMenstrualBleeding' || key === 'reducedFetalMovement') continue;
      const result = level({ ...baseAnswers(), [`sym.${key}`]: 'UNKNOWN' });
      expect(['SEE_DOCTOR_TODAY', 'EMERGENCY_NOW'], key).toContain(result);
    }
  });
  it('does not call a person with fever and no danger sign "home care" on day 3 or later', () => {
    expect(level({ ...baseAnswers(), onset: '3' })).not.toBe('HOME_CARE_WITH_TRIGGERS');
  });
  it('treats a platelet count below the provisional emergency cut-off as an emergency', () => {
    expect(level({ ...baseAnswers(), hasLabs: 'YES', 'lab.platelet': '30,000' })).toBe(
      'EMERGENCY_NOW',
    );
  });
  it('matches the engine called directly with the same input', () => {
    const answers = { ...baseAnswers(), 'sym.severeAbdominalPain': 'YES' };
    const input = toTriageInput(answers, now, IST);
    expect(evaluate(input, protocol, now).level).toBe(level(answers));
  });
});
