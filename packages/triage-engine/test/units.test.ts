import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localDayNumber, parseDayNumber } from '../src/dates.js';
import { levelFromRank } from '../src/levels.js';
import {
  canonicalJson,
  computeProtocolHash,
  ENGINE_VERSION,
  evaluate,
  FALLBACK_RETURN_IMMEDIATELY_I18N_KEY,
  sha256Hex,
  type Condition,
  type Rule,
  type TriageInput,
} from '../src/index.js';
import { baseInput, cloneProtocol, inputWith, loadProtocol, NOW, onsetForDay } from './helpers.js';

const protocol = loadProtocol();
const ruleIds = (input: TriageInput, p = protocol, now = NOW): string[] =>
  evaluate(input, p, now).reasons.map((r) => r.ruleId);

describe('sha256Hex', () => {
  it('matches known vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches node:crypto for ASCII, multi-byte text and block-boundary lengths', () => {
    const samples = [
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(63),
      'a'.repeat(64),
      'a'.repeat(65),
      'a'.repeat(1000),
      'é',
      'भनक पहले',
      'mix é ह 😀 end',
      '߿ࠀ￿',
    ];
    for (const sample of samples) {
      expect(sha256Hex(sample), sample.slice(0, 12)).toBe(
        createHash('sha256').update(sample, 'utf8').digest('hex'),
      );
    }
  });
});

describe('canonicalJson', () => {
  it('sorts keys, drops undefined, and nulls non-finite numbers', () => {
    expect(
      canonicalJson({ b: 1, a: [true, 'x', null, undefined, NaN, Infinity], c: undefined }),
    ).toBe('{"a":[true,"x",null,null,null,null],"b":1}');
  });

  it('is independent of key order', () => {
    expect(canonicalJson({ x: { b: 1, a: 2 }, y: 3 })).toBe(
      canonicalJson({ y: 3, x: { a: 2, b: 1 } }),
    );
  });

  it('writes values it cannot represent as null', () => {
    expect(canonicalJson(() => 1)).toBe('null');
    expect(canonicalJson(undefined)).toBe('null');
  });
});

describe('dates', () => {
  it('parses valid calendar dates', () => {
    expect(parseDayNumber('1970-01-01')).toBe(0);
    expect(parseDayNumber('1970-01-02')).toBe(1);
    expect(parseDayNumber('2024-02-29')).toBeTypeOf('number');
    expect(parseDayNumber('2000-02-29')).toBeTypeOf('number');
    expect(parseDayNumber('2026-09-16')! - parseDayNumber('2026-09-15')!).toBe(1);
  });

  it('rejects impossible dates and non-dates', () => {
    for (const bad of [
      '2023-02-29',
      '2100-02-29',
      '2026-13-01',
      '2026-00-10',
      '2026-04-31',
      '2026-01-00',
      '2026-9-1',
      'yesterday',
      '',
      20260915,
      null,
      undefined,
      {},
    ]) {
      expect(parseDayNumber(bad), typeof bad).toBeUndefined();
    }
  });

  it('computes the local day with the offset, and rejects an invalid clock', () => {
    const lateUtc = new Date('2026-09-14T20:00:00Z'); // 01:30 on 15 Sep in IST
    expect(localDayNumber(lateUtc, 330)).toBe(parseDayNumber('2026-09-15'));
    expect(localDayNumber(lateUtc, 0)).toBe(parseDayNumber('2026-09-14'));
    expect(localDayNumber(new Date(Number.NaN), 330)).toBeUndefined();
  });
});

describe('levels', () => {
  it('clamps ranks into the four levels', () => {
    expect(levelFromRank(-5)).toBe('HOME_CARE_WITH_TRIGGERS');
    expect(levelFromRank(2)).toBe('SEE_DOCTOR_TODAY');
    expect(levelFromRank(99)).toBe('EMERGENCY_NOW');
  });
});

describe('result metadata (spec 2.10)', () => {
  it('records protocol id/version/hash, engine version, input hash and time', () => {
    const input = baseInput();
    const result = evaluate(input, protocol, NOW);
    expect(result.protocolId).toBe('dengue');
    expect(result.protocolVersion).toBe(protocol.version);
    expect(result.protocolHash).toBe(computeProtocolHash(protocol));
    expect(result.protocolHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.protocolReviewStatus).toBe('DRAFT');
    expect(result.engineVersion).toBe(ENGINE_VERSION);
    expect(result.inputHash).toBe(sha256Hex(canonicalJson(input)));
    expect(result.evaluatedAt).toBe(NOW.toISOString());
  });

  it('engine version matches package.json', () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
    ) as { version: string };
    expect(ENGINE_VERSION).toBe(pkg.version);
  });

  it('changes the protocol hash when the protocol changes, and memoises per object', () => {
    const edited = cloneProtocol();
    edited.thresholds.vomitingEpisodes24h!.value = 4;
    expect(computeProtocolHash(edited)).not.toBe(computeProtocolHash(protocol));
    expect(computeProtocolHash(protocol)).toBe(computeProtocolHash(protocol));
  });

  it('input hash ignores key order and undefined members', () => {
    const a = baseInput();
    const b = JSON.parse(JSON.stringify(a)) as TriageInput;
    b.illness = { feverSettledWithin48h: 'NO', feverNow: 'YES', feverOnsetDate: onsetForDay(2) };
    expect(evaluate(a, protocol, NOW).inputHash).toBe(evaluate(b, protocol, NOW).inputHash);
  });

  it('reports an invalid clock without throwing', () => {
    const result = evaluate(baseInput(), protocol, new Date(Number.NaN));
    expect(result.evaluatedAt).toBe('INVALID_TIME');
    expect(result.illnessDay).toBeNull();
  });

  it('reports the illness day and risk factor ids', () => {
    const result = evaluate(
      inputWith((i) => {
        i.subject.conditions = ['DIABETES', 'OBESITY'];
      }),
      protocol,
      NOW,
    );
    expect(result.illnessDay).toBe(2);
    expect(result.riskFactorIds).toEqual(['DIABETES', 'OBESITY']);
  });
});

describe('output shape', () => {
  it('orders reasons most severe first and keeps ties in rule order', () => {
    const result = evaluate(
      inputWith((i) => {
        i.symptoms.bleedingGums = 'YES';
        i.labs = { plateletCount: 80000 };
      }),
      protocol,
      NOW,
    );
    const severities = result.reasons.map((r) => r.severity);
    const ranks = severities.map((s) =>
      ['HOME_CARE_WITH_TRIGGERS', 'TEST_AND_MONITOR', 'SEE_DOCTOR_TODAY', 'EMERGENCY_NOW'].indexOf(
        s,
      ),
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    expect(result.reasons[0]?.ruleId).toBe('BLEEDING_GUMS');
  });

  it('falls back to a generic trigger if a protocol ships an empty list', () => {
    const edited = cloneProtocol();
    edited.returnImmediatelyIf = [];
    expect(evaluate(baseInput(), edited, NOW).returnImmediatelyIf).toEqual([
      FALLBACK_RETURN_IMMEDIATELY_I18N_KEY,
    ]);
  });

  it('adds the "fever gone is not good news" note only when the fever has settled', () => {
    const settledInput = inputWith((i) => {
      i.illness = { feverOnsetDate: onsetForDay(4), feverNow: 'NO', feverSettledWithin48h: 'YES' };
    });
    expect(evaluate(settledInput, protocol, NOW).criticalPhaseNotes).toEqual([
      protocol.criticalPhase.noteI18nKey,
      protocol.criticalPhase.feverGoneNoteI18nKey,
    ]);
    const stillFever = inputWith((i) => {
      i.illness = { feverOnsetDate: onsetForDay(4), feverNow: 'YES', feverSettledWithin48h: 'NO' };
    });
    expect(evaluate(stillFever, protocol, NOW).criticalPhaseNotes).toEqual([
      protocol.criticalPhase.noteI18nKey,
    ]);
  });

  it('testing advice follows the illness day (NS1 early, IgM later, ask when unknown)', () => {
    const keysFor = (day: number | null): string[] =>
      evaluate(
        inputWith((i) => {
          i.illness.feverOnsetDate = day === null ? null : onsetForDay(day);
        }),
        protocol,
        NOW,
      ).testingAdvice;
    expect(keysFor(5)).toContain('dengue.test.ns1_early');
    expect(keysFor(5)).not.toContain('dengue.test.igm_later');
    expect(keysFor(6)).toContain('dengue.test.igm_later');
    expect(keysFor(null)).toContain('dengue.test.timing_unknown');
    expect(keysFor(2)).not.toContain('dengue.test.cbc');
    expect(keysFor(4)).toContain('dengue.test.cbc');
  });
});

describe('robustness: bad input never throws and is never treated as safe', () => {
  it('survives non-object input at every level', () => {
    for (const garbage of [
      null,
      undefined,
      42,
      'text',
      [],
      [1, 2],
      { subject: 7, symptoms: [1] },
    ]) {
      expect(() => evaluate(garbage as unknown as TriageInput, protocol, NOW)).not.toThrow();
    }
    const result = evaluate({} as TriageInput, protocol, NOW);
    expect(result.level).toBe('EMERGENCY_NOW');
  });

  it('ignores condition codes that are not strings, and a non-array conditions field', () => {
    const odd = inputWith((i) => {
      (i.subject as unknown as Record<string, unknown>).conditions = [1, null, 'DIABETES'];
    });
    expect(evaluate(odd, protocol, NOW).riskFactorIds).toEqual(['DIABETES']);
    const notArray = inputWith((i) => {
      (i.subject as unknown as Record<string, unknown>).conditions = 'DIABETES';
    });
    expect(evaluate(notArray, protocol, NOW).riskFactorIds).toEqual([]);
  });

  it('uses the protocol default offset when the supplied one is not a number', () => {
    const input = inputWith((i) => {
      (i.context as unknown as Record<string, unknown>).utcOffsetMinutes = 'IST';
    });
    expect(evaluate(input, protocol, NOW).illnessDay).toBe(2);
  });

  it('uses the supplied offset to decide the local date', () => {
    // 22:00 UTC on 14 Sep is already 15 Sep in IST (+330) but still 14 Sep in UTC.
    const late = new Date('2026-09-14T22:00:00Z');
    const ist = inputWith((i) => {
      i.illness.feverOnsetDate = '2026-09-15';
    });
    expect(evaluate(ist, protocol, late).illnessDay).toBe(1);
    const utc = inputWith((i) => {
      i.illness.feverOnsetDate = '2026-09-15';
      i.context.utcOffsetMinutes = 0;
    });
    expect(ruleIds(utc, protocol, late)).toContain('SD_INPUT_ISSUES'); // onset is "in the future"
  });

  it('treats an invalid previous lab reading as an input issue', () => {
    const input = inputWith((i) => {
      i.labs = { plateletCount: 150000, previous: { plateletCount: -1 } };
    });
    expect(ruleIds(input)).toContain('SD_INPUT_ISSUES');
  });

  it('assumes outbreak season when it is not a boolean', () => {
    const input = inputWith((i) => {
      i.illness.feverOnsetDate = onsetForDay(1);
      delete i.context.inOutbreakSeason;
    });
    expect(ruleIds(input)).toContain('TM_FEVER_IN_OUTBREAK_SEASON');
  });
});

describe('protocol data drives behaviour', () => {
  it('an unset threshold makes its rule inert (never fires)', () => {
    expect(protocol.thresholds.plateletRapidFallFraction?.value).toBeNull();
    const input = inputWith((i) => {
      i.labs = { plateletCount: 400000, previous: { plateletCount: 4000000 } };
    });
    expect(ruleIds(input)).not.toContain('EM_PLATELET_RAPID_FALL');
  });

  it('a decided threshold activates the rapid-fall rule', () => {
    const edited = cloneProtocol();
    edited.thresholds.plateletRapidFallFraction!.value = 0.5;
    const input = inputWith((i) => {
      i.labs = { plateletCount: 120000, previous: { plateletCount: 300000 } };
    });
    expect(ruleIds(input, edited)).toContain('EM_PLATELET_RAPID_FALL');
    expect(ruleIds(input)).not.toContain('EM_PLATELET_RAPID_FALL');
  });

  it('a lower vomiting threshold changes the sign without touching code', () => {
    const edited = cloneProtocol();
    edited.thresholds.vomitingEpisodes24h!.value = 2;
    const input = inputWith((i) => {
      i.counts.vomitingEpisodes24h = 2;
    });
    expect(evaluate(input, edited, NOW).level).toBe('EMERGENCY_NOW');
    expect(evaluate(input, protocol, NOW).level).not.toBe('EMERGENCY_NOW');
  });

  it('inert when core thresholds are undecided or missing', () => {
    const edited = cloneProtocol();
    edited.thresholds.recentFeverDays!.value = null;
    edited.thresholds.criticalPhaseStartDay!.value = null;
    const settled = inputWith((i) => {
      i.illness = { feverOnsetDate: onsetForDay(4), feverNow: 'NO', feverSettledWithin48h: 'NO' };
    });
    // No recent-onset window and no critical phase: only the "no fever" path remains.
    expect(evaluate(settled, edited, NOW).criticalPhaseNotes).toEqual([]);
    expect(evaluate(settled, edited, NOW).level).toBe('HOME_CARE_WITH_TRIGGERS');

    const missing = cloneProtocol();
    missing.core.criticalPhaseEndDayThreshold = 'doesNotExist';
    const day4 = inputWith((i) => {
      i.illness.feverOnsetDate = onsetForDay(4);
    });
    expect(evaluate(day4, missing, NOW).criticalPhaseNotes).toEqual([]);
  });

  it('risk step-up and floor are separate, data-driven policies', () => {
    const day3Diabetic = inputWith((i) => {
      i.illness.feverOnsetDate = onsetForDay(3);
      i.subject.conditions = ['DIABETES'];
      i.context.inOutbreakSeason = false;
    });
    const noStep = cloneProtocol();
    noStep.riskFactorPolicy.stepUpRule.steps = 0;
    noStep.rules = noStep.rules.filter((rule) => rule.id !== 'SD_FEVER_3D_WITH_RISK');
    const floored = evaluate(day3Diabetic, noStep, NOW);
    expect(floored.level).toBe('SEE_DOCTOR_TODAY');
    expect(floored.reasons.map((r) => r.ruleId)).toContain('RISK_FACTOR_FEVER_FLOOR');

    const noFloor = cloneProtocol();
    noFloor.riskFactorPolicy.stepUpRule.steps = 0;
    noFloor.rules = noFloor.rules.filter((rule) => rule.id !== 'SD_FEVER_3D_WITH_RISK');
    noFloor.thresholds.riskFloorFeverDays!.value = null;
    expect(evaluate(day3Diabetic, noFloor, NOW).level).toBe('TEST_AND_MONITOR');

    const unknownOnset = inputWith((i) => {
      i.illness.feverOnsetDate = null;
      i.subject.conditions = ['DIABETES'];
      i.context.inOutbreakSeason = false;
    });
    expect(ruleIds(unknownOnset, noStep)).not.toContain('RISK_FACTOR_FEVER_FLOOR');
  });

  it('risk step-up respects its cap', () => {
    const capped = cloneProtocol();
    capped.riskFactorPolicy.stepUpRule.maxLevel = 'TEST_AND_MONITOR';
    const input = inputWith((i) => {
      i.illness.feverOnsetDate = onsetForDay(1);
      i.subject.conditions = ['DIABETES'];
      i.context.inOutbreakSeason = false;
    });
    expect(evaluate(input, capped, NOW).level).toBe('TEST_AND_MONITOR');
    const lower = cloneProtocol();
    lower.riskFactorPolicy.stepUpRule.maxLevel = 'HOME_CARE_WITH_TRIGGERS';
    lower.riskFactorPolicy.floorRule.level = 'HOME_CARE_WITH_TRIGGERS';
    expect(evaluate(input, lower, NOW).level).toBe('HOME_CARE_WITH_TRIGGERS');
  });
});

describe('condition language', () => {
  const withRule = (when: Condition): string[] => {
    const edited = cloneProtocol();
    const rule: Rule = {
      id: 'TEST_RULE',
      i18nKey: 'x',
      basis: 'SAFETY_DEFAULT',
      review: 'TODO_DOCTOR_REVIEW',
      sourceRefs: [],
      level: 'SEE_DOCTOR_TODAY',
      when,
    };
    edited.rules.push(rule);
    return ruleIds(baseInput(), edited);
  };

  it('evaluates all / any / not', () => {
    expect(withRule({ op: 'all', of: [] })).toContain('TEST_RULE');
    expect(withRule({ op: 'any', of: [] })).not.toContain('TEST_RULE');
    expect(withRule({ op: 'not', of: { op: 'any', of: [] } })).toContain('TEST_RULE');
  });

  it('a comparison with no threshold or literal never fires', () => {
    expect(withRule({ op: 'num', field: 'ageMonths', cmp: 'lt' })).not.toContain('TEST_RULE');
    expect(withRule({ op: 'num', field: 'ageMonths', cmp: 'lt', threshold: 'nope' })).not.toContain(
      'TEST_RULE',
    );
    expect(withRule({ op: 'num', field: 'noSuchField', cmp: 'gte', value: 0 })).not.toContain(
      'TEST_RULE',
    );
    expect(withRule({ op: 'num', field: 'ageMonths', cmp: 'eq', value: 360 })).toContain(
      'TEST_RULE',
    );
  });

  it('an unknown flag name is false, and a missing answer is UNKNOWN', () => {
    expect(withRule({ op: 'flag', name: 'noSuchFlag' })).not.toContain('TEST_RULE');
    expect(withRule({ op: 'tri', ref: 'symptoms.neverAsked', is: 'UNKNOWN' })).toContain(
      'TEST_RULE',
    );
  });

  it('trends need both readings', () => {
    expect(withRule({ op: 'trend', field: 'hematocrit', dir: 'rising' })).not.toContain(
      'TEST_RULE',
    );
  });
});

describe('danger sign semantics', () => {
  it('a danger sign without fever context is SEE_DOCTOR_TODAY, never home care', () => {
    const input = inputWith((i) => {
      i.illness = { feverOnsetDate: null, feverNow: 'NO', feverSettledWithin48h: 'NO' };
      i.symptoms.chestPain = 'YES';
    });
    const result = evaluate(input, protocol, NOW);
    expect(result.level).toBe('SEE_DOCTOR_TODAY');
    expect(result.reasons.map((r) => r.ruleId)).toContain('SD_DANGER_SIGN_WITHOUT_FEVER');
  });

  it('only claims "no danger signs reported" when nothing is present or unanswered', () => {
    expect(ruleIds(baseInput())).toContain('NO_DANGER_SIGNS_REPORTED');
    const unsure = inputWith((i) => {
      i.symptoms.chestPain = 'UNKNOWN';
    });
    expect(ruleIds(unsure)).not.toContain('NO_DANGER_SIGNS_REPORTED');
  });
});
