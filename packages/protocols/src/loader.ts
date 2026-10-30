import {
  computeProtocolHash,
  FALLBACK_RETURN_IMMEDIATELY_I18N_KEY,
  type Protocol,
} from '@bhanak/triage-engine';
import { checkProtocolIntegrity } from './integrity.js';
import { protocolSchema, stringsFileSchema } from './schema.js';

export class ProtocolError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(`${message}\n- ${issues.join('\n- ')}`);
    this.name = 'ProtocolError';
    this.issues = issues;
  }
}

/** Validate raw JSON and cross-check it. Throws ProtocolError listing every problem. */
export function parseProtocol(raw: unknown): Protocol {
  const parsed = protocolSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ProtocolError(
      'Protocol does not match the schema',
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  const issues = checkProtocolIntegrity(parsed.data);
  if (issues.length > 0) throw new ProtocolError('Protocol failed integrity checks', issues);
  return parsed.data;
}

/** Validate a strings file; returns the key -> text map. */
export function parseStrings(raw: unknown): Record<string, string> {
  const parsed = stringsFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ProtocolError(
      'Strings file does not match the schema',
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data.strings;
}

/** i18n keys the engine itself can emit, besides the protocol's own. */
export const ENGINE_I18N_KEYS = [FALLBACK_RETURN_IMMEDIATELY_I18N_KEY] as const;

/** Content hash recorded with every result (spec 5.6). */
export const protocolContentHash = (protocol: Protocol): string => computeProtocolHash(protocol);
