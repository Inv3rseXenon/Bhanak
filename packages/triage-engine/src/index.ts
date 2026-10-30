export { evaluate, computeProtocolHash } from './evaluate.js';
export { ENGINE_VERSION, FALLBACK_RETURN_IMMEDIATELY_I18N_KEY } from './version.js';
export { canonicalJson, sha256Hex } from './hash.js';
export { levelRank, maxLevel } from './levels.js';
export {
  CONDITION_FLAG_PREFIX,
  FIXED_TRI_REFS,
  KNOWN_FLAGS,
  KNOWN_NUM_FIELDS,
  SYMPTOM_REF_PREFIX,
} from './ctx.js';
export { LEVELS } from './types.js';
export type {
  Basis,
  Cmp,
  Condition,
  DangerSign,
  ItemMeta,
  ItemReview,
  LabStatus,
  Level,
  LevelContent,
  Protocol,
  Reason,
  ReviewStatus,
  RiskFactor,
  Rule,
  Sex,
  SignTest,
  SourceRef,
  TestingAdvice,
  Threshold,
  Tri,
  TrendField,
  TriageInput,
  TriageResult,
} from './types.js';
