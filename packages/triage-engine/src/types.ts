/**
 * Public types of the triage engine (spec section 5.1).
 *
 * Optional fields are written `?: T | undefined` so that values parsed by zod
 * (which yields `T | undefined`) are assignable under `exactOptionalPropertyTypes`.
 * Missing, null or malformed answers are never "safe": see evaluate.ts.
 */

/** Exactly four output levels, ordered from least to most urgent. */
export const LEVELS = [
  'HOME_CARE_WITH_TRIGGERS',
  'TEST_AND_MONITOR',
  'SEE_DOCTOR_TODAY',
  'EMERGENCY_NOW',
] as const;
export type Level = (typeof LEVELS)[number];

export type Tri = 'YES' | 'NO' | 'UNKNOWN';
export type Sex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type LabStatus = 'POSITIVE' | 'NEGATIVE' | 'NOT_DONE';

export interface TriageInput {
  subject: {
    ageMonths: number;
    sex: Sex;
    /** Treat "not sure" as true when mapping from the UI (cautious). */
    pregnant?: boolean | undefined;
    /** Condition codes from the protocol's vocabulary, e.g. DIABETES. */
    conditions: string[];
    onAnticoagulant?: boolean | undefined;
    livesAloneOrFarFromHospital?: boolean | undefined;
  };
  illness: {
    /** Calendar date (YYYY-MM-DD, user's local date) the fever started. */
    feverOnsetDate?: string | null | undefined;
    maxTempC?: number | null | undefined;
    feverNow?: Tri | undefined;
    feverSettledWithin48h?: Tri | undefined;
  };
  /** Keys are protocol-defined (e.g. severeAbdominalPain). A missing key means UNKNOWN. */
  symptoms: Record<string, Tri>;
  counts: {
    vomitingEpisodes24h?: number | null | undefined;
    /** Times urine passed (or wet diapers) in the last 6 hours. */
    urineLast6hOrDiaperCount?: number | null | undefined;
  };
  fluids: { canKeepFluidsDown?: Tri | undefined };
  labs: {
    plateletCount?: number | null | undefined;
    hematocrit?: number | null | undefined;
    ast?: number | null | undefined;
    alt?: number | null | undefined;
    ns1?: LabStatus | undefined;
    igm?: LabStatus | undefined;
    igg?: LabStatus | undefined;
    collectedOn?: string | null | undefined;
    /** Previous reading, used for trends. */
    previous?:
      | {
          plateletCount?: number | null | undefined;
          hematocrit?: number | null | undefined;
          collectedOn?: string | null | undefined;
        }
      | null
      | undefined;
  };
  meds: { tookNsaidOrAspirin?: Tri | undefined };
  context: {
    /** Missing means "assume yes" (protocol default): cautious. */
    inOutbreakSeason?: boolean | undefined;
    region?: string | undefined;
    /** Minutes east of UTC for the user's local date. Defaults to the protocol default. */
    utcOffsetMinutes?: number | undefined;
  };
}

export type ReviewStatus = 'DRAFT' | 'REVIEWED';
export type ItemReview = 'TODO_DOCTOR_REVIEW' | 'REVIEWED';
/**
 * Where a rule or number comes from:
 * SOURCE = stated in a cited guideline; SPEC_PROVISIONAL = a placeholder value given in the
 * build spec (not found in the sources); SAFETY_DEFAULT = engineering choice that errs on caution.
 */
export type Basis = 'SOURCE' | 'SPEC_PROVISIONAL' | 'SAFETY_DEFAULT';

export interface SourceRef {
  doc: string;
  section: string;
  note?: string | undefined;
}

export interface ItemMeta {
  id: string;
  i18nKey: string;
  basis: Basis;
  review: ItemReview;
  sourceRefs: SourceRef[];
  note?: string | undefined;
}

export type Cmp = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
export type TrendField = 'plateletCount' | 'hematocrit';

export type Condition =
  | { op: 'all'; of: Condition[] }
  | { op: 'any'; of: Condition[] }
  | { op: 'not'; of: Condition }
  | { op: 'tri'; ref: string; is: Tri }
  | {
      op: 'num';
      field: string;
      cmp: Cmp;
      /** Name of an entry in protocol.thresholds, or... */
      threshold?: string | undefined;
      /** ...a literal (used for structural zeroes only, never clinical cut-offs). */
      value?: number | undefined;
    }
  | { op: 'flag'; name: string }
  | {
      op: 'trend';
      field: TrendField;
      dir: 'rising' | 'falling';
      /** Threshold name: minimum relative change versus the previous reading. */
      minRelativeChange?: string | undefined;
    };

export interface Threshold {
  /** null = not yet decided; rules using it are inert and the protocol cannot be REVIEWED. */
  value: number | null;
  unit?: string | undefined;
  review: ItemReview;
  basis: Basis;
  sourceRefs: SourceRef[];
  note?: string | undefined;
}

export type SignTest =
  | { kind: 'tri'; ref: string; is: 'YES' | 'NO' }
  | {
      kind: 'num';
      field: string;
      cmp: Cmp;
      threshold?: string | undefined;
      value?: number | undefined;
    };

/** A danger sign: emergency with fever, and subject to the UNKNOWN policy. */
export interface DangerSign extends ItemMeta {
  test: SignTest;
  /**
   * What an UNKNOWN answer does (fever context only): EMERGENCY = treat as emergency
   * (spec 5.1 unknown_is_emergency list); UNCERTAIN = raise to uncertainDanger.level.
   */
  unknownPolicy: 'EMERGENCY' | 'UNCERTAIN';
  applicableWhen?: Condition | undefined;
}

export interface Rule extends ItemMeta {
  level: Level;
  when: Condition;
}

export interface RiskFactor extends ItemMeta {
  when: Condition;
}

export interface TestingAdvice extends ItemMeta {
  when: Condition;
}

export interface LevelContent {
  headlineI18nKey: string;
  actions: string[];
}

export interface Protocol {
  schemaVersion: 1;
  id: string;
  disease: string;
  /** Semver. Immutable once published. */
  version: string;
  reviewStatus: ReviewStatus;
  review: {
    reviewerName: string | null;
    registrationNumber: string | null;
    reviewedOn: string | null;
  };
  sources: Record<string, { title: string; publisher: string; note?: string | undefined }>;
  defaults: { utcOffsetMinutes: number; inOutbreakSeason: boolean };
  thresholds: Record<string, Threshold>;
  core: {
    recentFeverDaysThreshold: string;
    criticalPhaseStartDayThreshold: string;
    criticalPhaseEndDayThreshold: string;
  };
  dangerSigns: DangerSign[];
  /** Fired once (without fever context) when any danger sign is present. */
  noFeverDangerSign: Rule;
  /** Fired per sign (as `<id>:<signId>`) when an EMERGENCY-policy sign is UNKNOWN. */
  unknownEmergencyRule: Rule;
  /** Fired per sign (as `<id>:<signId>`) when an UNCERTAIN-policy sign is UNKNOWN. */
  uncertainDanger: Rule;
  /** Reported when no danger sign is present or unknown. */
  noDangerSignsReason: { id: string; i18nKey: string };
  riskFactors: RiskFactor[];
  riskFactorPolicy: {
    stepUpRule: {
      id: string;
      i18nKey: string;
      steps: number;
      maxLevel: Level;
      note?: string | undefined;
    };
    floorRule: {
      id: string;
      i18nKey: string;
      daysSinceOnsetThreshold: string;
      level: Level;
    };
  };
  rules: Rule[];
  testingAdvice: TestingAdvice[];
  criticalPhase: { noteI18nKey: string; feverGoneNoteI18nKey: string };
  levels: Record<Level, LevelContent>;
  watchFor: string[];
  returnImmediatelyIf: string[];
}

export interface Reason {
  ruleId: string;
  i18nKey: string;
  severity: Level;
}

export interface TriageResult {
  level: Level;
  headlineI18nKey: string;
  reasons: Reason[];
  actions: string[];
  watchFor: string[];
  /** Never empty. */
  returnImmediatelyIf: string[];
  testingAdvice: string[];
  /** Empty unless the person is in the critical-phase window (days 3-7). */
  criticalPhaseNotes: string[];
  /** Day 1 = day fever started; null if the onset date is missing or invalid. */
  illnessDay: number | null;
  riskFactorIds: string[];
  protocolId: string;
  protocolVersion: string;
  protocolHash: string;
  protocolReviewStatus: ReviewStatus;
  engineVersion: string;
  inputHash: string;
  evaluatedAt: string;
}
