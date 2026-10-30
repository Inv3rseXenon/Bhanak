/**
 * Single source of truth for brand identity (spec section 1).
 * No brand string may be hard-coded anywhere else: read it from here.
 * `pnpm check:brand` enforces this.
 *
 * Values still unknown are explicit placeholders, never guesses. A placeholder is
 * any string starting with PLACEHOLDER_PREFIX. Use `unresolvedBrandPlaceholders()`
 * in release gates so a public launch cannot ship with one (see docs/TODO.md).
 */

export const PLACEHOLDER_PREFIX = '[PLACEHOLDER';

export const brand = {
  /** Display name. */
  name: 'Bhanak',
  /** Lowercase wordmark used in the logo. */
  wordmark: 'bhanak',
  /** Hindi/Marathi-flavoured tagline (romanised). */
  tagline: 'Bhanak pehle, khatra baad mein.',
  /** English companion tagline. */
  taglineEn: 'Catch the first hint.',
  /** Story-led home page headline (spec section 19). */
  homeHeadline: 'Everyone deserves a brother who knows when to say: go to the hospital, now.',
  supportEmail: '[PLACEHOLDER: support email]',
  legalEntityName: '[PLACEHOLDER: legal entity name]',
  /** Registrable domain; web and API share it (app.<domain>, api.<domain>). */
  domain: '[PLACEHOLDER: domain]',
  /** Grievance officer (DPDP Act); legal review required before launch. */
  grievanceOfficer: {
    name: '[PLACEHOLDER: grievance officer name]',
    email: '[PLACEHOLDER: grievance officer email]',
    phone: '[PLACEHOLDER: grievance officer phone]',
    address: '[PLACEHOLDER: grievance officer postal address]',
  },
} as const;

export type Brand = typeof brand;

function collectPlaceholders(value: unknown, path: string, out: string[]): void {
  if (typeof value === 'string') {
    if (value.startsWith(PLACEHOLDER_PREFIX)) out.push(path);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectPlaceholders(child, path === '' ? key : `${path}.${key}`, out);
    }
  }
}

/** Dotted paths of brand fields that are still placeholders (empty = ready to launch). */
export function unresolvedBrandPlaceholders(source: unknown = brand): string[] {
  const out: string[] = [];
  collectPlaceholders(source, '', out);
  return out;
}
