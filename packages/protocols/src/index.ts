import { z } from 'zod';
import { protocolSchema } from './schema.js';

export { protocolSchema, stringsFileSchema, conditionSchema } from './schema.js';
export {
  parseProtocol,
  parseStrings,
  ProtocolError,
  ENGINE_I18N_KEYS,
  protocolContentHash,
} from './loader.js';
export { checkProtocolIntegrity, checkStrings, collectI18nKeys, reviewItems } from './integrity.js';
export type { ReviewItem } from './integrity.js';
export {
  allowDraftFromEnv,
  assertProtocolServable,
  DRAFT_BANNER_TEXT,
  ProtocolGateError,
  showsDraftBanner,
} from './gate.js';
export { renderChecklist, CHECKLIST_BEGIN, CHECKLIST_END } from './checklist.js';

/** JSON Schema (draft 2020-12) for protocol files, generated from the zod schema. */
export function protocolJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(protocolSchema, { target: 'draft-2020-12' });
}
