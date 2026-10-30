import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  evaluate,
  levelRank,
  type LabStatus,
  type Sex,
  type Tri,
  type TriageInput,
} from '../src/index.js';
import { loadProtocol, NOW, onsetForDay, SYMPTOM_KEYS } from './helpers.js';

const protocol = loadProtocol();
const level = (input: TriageInput): number => levelRank(evaluate(input, protocol, NOW).level);

const triArb: fc.Arbitrary<Tri> = fc.constantFrom('YES', 'NO', 'UNKNOWN');
const optional = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T | undefined> =>
  fc.option(arb, { nil: undefined });
const optionalCount = (max: number): fc.Arbitrary<number | null | undefined> =>
  fc.option(fc.integer({ min: 0, max }), { nil: undefined });
const labStatus: fc.Arbitrary<LabStatus | undefined> = optional(
  fc.constantFrom<LabStatus>('POSITIVE', 'NEGATIVE', 'NOT_DONE'),
);

const CONDITION_CODES = [
  'DIABETES',
  'HYPERTENSION',
  'HEART_DISEASE',
  'KIDNEY_DISEASE',
  'LIVER_DISEASE',
  'BLOOD_DISORDER',
  'OBESITY',
  'PEPTIC_ULCER',
] as const;

/** Any schema-valid input. */
const inputArb: fc.Arbitrary<TriageInput> = fc
  .record({
    subject: fc.record({
      ageMonths: fc.integer({ min: 0, max: 1200 }),
      sex: fc.constantFrom<Sex>('MALE', 'FEMALE', 'OTHER', 'UNKNOWN'),
      pregnant: optional(fc.boolean()),
      conditions: fc.subarray([...CONDITION_CODES]),
      onAnticoagulant: optional(fc.boolean()),
      livesAloneOrFarFromHospital: optional(fc.boolean()),
    }),
    illness: fc.record({
      feverOnsetDate: fc.option(
        fc.integer({ min: 1, max: 15 }).map((day) => onsetForDay(day)),
        { nil: null },
      ),
      feverNow: optional(triArb),
      feverSettledWithin48h: optional(triArb),
    }),
    symptoms: fc.record(Object.fromEntries(SYMPTOM_KEYS.map((key) => [key, triArb]))),
    counts: fc.record({
      vomitingEpisodes24h: optionalCount(10),
      urineLast6hOrDiaperCount: optionalCount(6),
    }),
    fluids: fc.record({ canKeepFluidsDown: optional(triArb) }),
    labs: fc.record({
      plateletCount: fc.option(fc.integer({ min: 1000, max: 450000 }), { nil: undefined }),
      hematocrit: fc.option(fc.integer({ min: 20, max: 60 }), { nil: undefined }),
      ast: fc.option(fc.integer({ min: 5, max: 3000 }), { nil: undefined }),
      alt: fc.option(fc.integer({ min: 5, max: 3000 }), { nil: undefined }),
      ns1: labStatus,
      igm: labStatus,
      igg: labStatus,
      previous: fc.option(
        fc.record({
          plateletCount: fc.option(fc.integer({ min: 1000, max: 450000 }), { nil: undefined }),
          hematocrit: fc.option(fc.integer({ min: 20, max: 60 }), { nil: undefined }),
        }),
        { nil: undefined },
      ),
    }),
    meds: fc.record({ tookNsaidOrAspirin: optional(triArb) }),
    context: fc.record({
      inOutbreakSeason: optional(fc.boolean()),
      utcOffsetMinutes: optional(fc.constantFrom(0, 330, -300)),
    }),
  })
  .map((raw) => JSON.parse(JSON.stringify(raw)) as TriageInput); // drops undefined like real JSON

const withFever: fc.Arbitrary<TriageInput> = inputArb.map((input) => ({
  ...input,
  illness: { ...input.illness, feverNow: 'YES' as const },
}));

const copy = (input: TriageInput): TriageInput => JSON.parse(JSON.stringify(input)) as TriageInput;
const RUNS = { numRuns: 400 };

describe('engine properties (spec 22)', () => {
  it('same input gives the same output', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        expect(evaluate(copy(input), protocol, NOW)).toEqual(evaluate(input, protocol, NOW));
      }),
      RUNS,
    );
  });

  it('never throws on any schema-valid input, and always returns triggers and a level', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const result = evaluate(input, protocol, NOW);
        expect(result.returnImmediatelyIf.length).toBeGreaterThan(0);
        expect(result.actions.length).toBeGreaterThan(0);
        expect(result.reasons.length).toBeGreaterThan(0);
      }),
      RUNS,
    );
  });

  it('never throws on arbitrary garbage input or an arbitrary clock', () => {
    fc.assert(
      fc.property(fc.anything(), fc.date({ noInvalidDate: false }), (garbage, now) => {
        expect(() => evaluate(garbage as TriageInput, protocol, now)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it('level is exactly the highest severity among the reasons (rules only raise)', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const result = evaluate(input, protocol, NOW);
        const top = Math.max(...result.reasons.map((r) => levelRank(r.severity)));
        expect(levelRank(result.level)).toBe(top);
      }),
      RUNS,
    );
  });

  describe('adding a danger sign never lowers the level', () => {
    const addSign: fc.Arbitrary<(input: TriageInput) => void> = fc.oneof(
      fc.constantFrom(...SYMPTOM_KEYS).map((key) => (input: TriageInput) => {
        input.symptoms[key] = 'YES';
      }),
      fc.constant((input: TriageInput) => {
        input.fluids.canKeepFluidsDown = 'NO';
      }),
      fc.constant((input: TriageInput) => {
        input.counts.vomitingEpisodes24h = 9;
      }),
      fc.constant((input: TriageInput) => {
        input.counts.urineLast6hOrDiaperCount = 0;
      }),
    );
    it('holds', () => {
      fc.assert(
        fc.property(inputArb, addSign, (input, add) => {
          const before = level(input);
          const changed = copy(input);
          add(changed);
          expect(level(changed)).toBeGreaterThanOrEqual(before);
        }),
        RUNS,
      );
    });
  });

  describe('changing a safe answer to UNKNOWN never lowers the level', () => {
    const makeUnknown: fc.Arbitrary<(input: TriageInput) => void> = fc.oneof(
      fc.constantFrom(...SYMPTOM_KEYS).map((key) => (input: TriageInput) => {
        if (input.symptoms[key] === 'NO') input.symptoms[key] = 'UNKNOWN';
      }),
      fc.constant((input: TriageInput) => {
        if (input.fluids.canKeepFluidsDown === 'YES') input.fluids.canKeepFluidsDown = 'UNKNOWN';
      }),
      fc.constant((input: TriageInput) => {
        if (input.illness.feverNow === 'NO') input.illness.feverNow = 'UNKNOWN';
      }),
      fc.constant((input: TriageInput) => {
        if (input.illness.feverSettledWithin48h === 'NO') {
          input.illness.feverSettledWithin48h = 'UNKNOWN';
        }
      }),
    );
    it('holds', () => {
      fc.assert(
        fc.property(inputArb, makeUnknown, (input, change) => {
          const changed = copy(input);
          change(changed);
          expect(level(changed)).toBeGreaterThanOrEqual(level(input));
        }),
        RUNS,
      );
    });

    it('an unknown count is never lower than a known harmless count', () => {
      fc.assert(
        fc.property(inputArb, (input) => {
          const harmless = copy(input);
          harmless.counts = { vomitingEpisodes24h: 0, urineLast6hOrDiaperCount: 3 };
          const unknown = copy(input);
          unknown.counts = { vomitingEpisodes24h: null, urineLast6hOrDiaperCount: null };
          expect(level(unknown)).toBeGreaterThanOrEqual(level(harmless));
        }),
        RUNS,
      );
    });
  });

  it('turning a stated danger sign into "not sure" never drops below see-a-doctor-today (with fever)', () => {
    fc.assert(
      fc.property(withFever, fc.constantFrom(...SYMPTOM_KEYS), (input, key) => {
        // Only the danger-sign questions: the other keys are not danger signs.
        const dangerKeys = new Set<string>(
          protocol.dangerSigns.flatMap((s) => (s.test.kind === 'tri' ? [s.test.ref.slice(9)] : [])),
        );
        fc.pre(dangerKeys.has(key));
        const changed = copy(input);
        changed.symptoms[key] = 'UNKNOWN';
        const applicable =
          !(key === 'heavyMenstrualBleeding' && changed.subject.sex === 'MALE') &&
          !(key === 'reducedFetalMovement' && changed.subject.pregnant !== true);
        fc.pre(applicable);
        expect(level(changed)).toBeGreaterThanOrEqual(levelRank('SEE_DOCTOR_TODAY'));
      }),
      RUNS,
    );
  });

  describe('adding a risk factor never lowers the level', () => {
    const addRisk: fc.Arbitrary<(input: TriageInput) => void> = fc.oneof(
      fc.constantFrom(...CONDITION_CODES).map((code) => (input: TriageInput) => {
        if (!input.subject.conditions.includes(code)) input.subject.conditions.push(code);
      }),
      fc.constant((input: TriageInput) => {
        input.subject.pregnant = true;
      }),
      fc.constant((input: TriageInput) => {
        input.subject.onAnticoagulant = true;
      }),
      fc.constant((input: TriageInput) => {
        input.subject.livesAloneOrFarFromHospital = true;
      }),
      fc.constant((input: TriageInput) => {
        input.subject.ageMonths = 24;
      }),
    );
    it('holds', () => {
      fc.assert(
        fc.property(inputArb, addRisk, (input, add) => {
          const before = level(input);
          const changed = copy(input);
          add(changed);
          // Lowering the age to 24 months could remove an "elderly" risk factor but adds the
          // "under 5" one: both are risk factors, so the level must not drop.
          expect(level(changed)).toBeGreaterThanOrEqual(before);
        }),
        RUNS,
      );
    });
  });

  it('a lower platelet count never lowers the level', () => {
    fc.assert(
      fc.property(inputArb, fc.integer({ min: 1, max: 99 }), (input, percent) => {
        fc.pre(input.labs.plateletCount !== undefined && input.labs.plateletCount !== null);
        const changed = copy(input);
        changed.labs.plateletCount = Math.floor(((input.labs.plateletCount ?? 0) * percent) / 100);
        expect(level(changed)).toBeGreaterThanOrEqual(level(input));
      }),
      RUNS,
    );
  });

  it('a danger sign anywhere means the result is never "home care"', () => {
    fc.assert(
      fc.property(inputArb, fc.constantFrom(...SYMPTOM_KEYS), (input, key) => {
        const dangerKeys = new Set<string>(
          protocol.dangerSigns.flatMap((s) => (s.test.kind === 'tri' ? [s.test.ref.slice(9)] : [])),
        );
        fc.pre(dangerKeys.has(key));
        const changed = copy(input);
        changed.symptoms[key] = 'YES';
        expect(level(changed)).toBeGreaterThanOrEqual(levelRank('SEE_DOCTOR_TODAY'));
      }),
      RUNS,
    );
  });
});
