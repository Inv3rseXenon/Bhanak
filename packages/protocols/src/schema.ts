import { z } from 'zod';
import type { Condition, Protocol } from '@bhanak/triage-engine';

/** Zod schema for a protocol file (spec 5.6). Strict: unknown keys are errors, so typos fail. */

const levelSchema = z.enum([
  'HOME_CARE_WITH_TRIGGERS',
  'TEST_AND_MONITOR',
  'SEE_DOCTOR_TODAY',
  'EMERGENCY_NOW',
]);
const triSchema = z.enum(['YES', 'NO', 'UNKNOWN']);
const cmpSchema = z.enum(['lt', 'lte', 'gt', 'gte', 'eq']);
const idSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'ids are UPPER_SNAKE_CASE');
const nonEmpty = z.string().min(1);

const sourceRefSchema = z.strictObject({
  doc: nonEmpty,
  section: nonEmpty,
  note: z.string().optional(),
});

const itemMetaShape = {
  id: idSchema,
  i18nKey: nonEmpty,
  basis: z.enum(['SOURCE', 'SPEC_PROVISIONAL', 'SAFETY_DEFAULT']),
  review: z.enum(['TODO_DOCTOR_REVIEW', 'REVIEWED']),
  sourceRefs: z.array(sourceRefSchema),
  note: z.string().optional(),
};

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ op: z.literal('all'), of: z.array(conditionSchema) }),
    z.strictObject({ op: z.literal('any'), of: z.array(conditionSchema) }),
    z.strictObject({ op: z.literal('not'), of: conditionSchema }),
    z.strictObject({ op: z.literal('tri'), ref: nonEmpty, is: triSchema }),
    z.strictObject({
      op: z.literal('num'),
      field: nonEmpty,
      cmp: cmpSchema,
      threshold: z.string().optional(),
      value: z.number().optional(),
    }),
    z.strictObject({ op: z.literal('flag'), name: nonEmpty }),
    z.strictObject({
      op: z.literal('trend'),
      field: z.enum(['plateletCount', 'hematocrit']),
      dir: z.enum(['rising', 'falling']),
      minRelativeChange: z.string().optional(),
    }),
  ]),
);

const thresholdSchema = z.strictObject({
  value: z.number().nullable(),
  unit: z.string().optional(),
  review: itemMetaShape.review,
  basis: itemMetaShape.basis,
  sourceRefs: z.array(sourceRefSchema),
  note: z.string().optional(),
});

const ruleSchema = z.strictObject({ ...itemMetaShape, level: levelSchema, when: conditionSchema });

const signTestSchema = z.union([
  z.strictObject({ kind: z.literal('tri'), ref: nonEmpty, is: z.enum(['YES', 'NO']) }),
  z.strictObject({
    kind: z.literal('num'),
    field: nonEmpty,
    cmp: cmpSchema,
    threshold: z.string().optional(),
    value: z.number().optional(),
  }),
]);

const dangerSignSchema = z.strictObject({
  ...itemMetaShape,
  test: signTestSchema,
  unknownPolicy: z.enum(['EMERGENCY', 'UNCERTAIN']),
  applicableWhen: conditionSchema.optional(),
});

const conditionItemSchema = z.strictObject({ ...itemMetaShape, when: conditionSchema });

const levelContentSchema = z.strictObject({
  headlineI18nKey: nonEmpty,
  actions: z.array(nonEmpty),
});

export const protocolSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: nonEmpty,
  disease: nonEmpty,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'semver MAJOR.MINOR.PATCH'),
  reviewStatus: z.enum(['DRAFT', 'REVIEWED']),
  review: z.strictObject({
    reviewerName: z.string().nullable(),
    registrationNumber: z.string().nullable(),
    reviewedOn: z.string().nullable(),
  }),
  sources: z.record(
    z.string(),
    z.strictObject({ title: nonEmpty, publisher: nonEmpty, note: z.string().optional() }),
  ),
  defaults: z.strictObject({ utcOffsetMinutes: z.number(), inOutbreakSeason: z.boolean() }),
  thresholds: z.record(z.string(), thresholdSchema),
  core: z.strictObject({
    recentFeverDaysThreshold: nonEmpty,
    criticalPhaseStartDayThreshold: nonEmpty,
    criticalPhaseEndDayThreshold: nonEmpty,
  }),
  dangerSigns: z.array(dangerSignSchema),
  noFeverDangerSign: ruleSchema,
  unknownEmergencyRule: ruleSchema,
  uncertainDanger: ruleSchema,
  noDangerSignsReason: z.strictObject({ id: idSchema, i18nKey: nonEmpty }),
  riskFactors: z.array(conditionItemSchema),
  riskFactorPolicy: z.strictObject({
    stepUpRule: z.strictObject({
      id: idSchema,
      i18nKey: nonEmpty,
      steps: z.number().int().min(0),
      maxLevel: levelSchema,
      note: z.string().optional(),
    }),
    floorRule: z.strictObject({
      id: idSchema,
      i18nKey: nonEmpty,
      daysSinceOnsetThreshold: nonEmpty,
      level: levelSchema,
    }),
  }),
  rules: z.array(ruleSchema),
  testingAdvice: z.array(conditionItemSchema),
  criticalPhase: z.strictObject({ noteI18nKey: nonEmpty, feverGoneNoteI18nKey: nonEmpty }),
  levels: z.strictObject({
    HOME_CARE_WITH_TRIGGERS: levelContentSchema,
    TEST_AND_MONITOR: levelContentSchema,
    SEE_DOCTOR_TODAY: levelContentSchema,
    EMERGENCY_NOW: levelContentSchema,
  }),
  watchFor: z.array(nonEmpty),
  returnImmediatelyIf: z.array(nonEmpty),
});

export const stringsFileSchema = z.strictObject({
  locale: nonEmpty,
  status: nonEmpty,
  note: z.string().optional(),
  strings: z.record(z.string(), nonEmpty),
});

// Compile-time check: whatever the schema accepts is a valid engine Protocol.
export const assertSchemaMatchesEngineType = (parsed: z.output<typeof protocolSchema>): Protocol =>
  parsed;
