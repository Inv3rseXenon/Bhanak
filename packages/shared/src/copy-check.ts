/**
 * Banned-claims check for user-facing copy (spec section 1): UI strings, store listings and
 * notifications must not diagnose, detect, cure, promise, or call themselves an AI doctor, and
 * must never say "you are fine". Negated disclaimers such as "does not diagnose" are allowed.
 *
 * This checks English copy. Hindi and Marathi equivalents are added with the translations (M2);
 * see docs/TODO.md G-002.
 */

export const BANNED_COPY_PATTERNS: readonly { term: string; pattern: RegExp }[] = [
  { term: 'diagnose', pattern: /\bdiagnos(?:e|es|ed|ing|is)\b/i },
  { term: 'detect', pattern: /\bdetect(?:s|ed|ing|ion|or)?\b/i },
  { term: 'cure', pattern: /\bcur(?:e|es|ed|ing)\b/i },
  { term: 'AI doctor', pattern: /\bai[\s-]+doctor\b/i },
  { term: 'guaranteed', pattern: /\bguarantee(?:s|d)?\b/i },
  { term: 'you are fine', pattern: /\byou(?:\s+are|['’]re)\s+fine\b/i },
];

/** Phrases that mention a banned word only to disclaim it. */
export const ALLOWED_NEGATED_PHRASES: readonly string[] = [
  'does not diagnose',
  'do not diagnose',
  'cannot diagnose',
  'not a diagnosis',
  'not for diagnosis',
];

/** The banned terms found in `text` (after removing allowed negated disclaimers). */
export function findBannedCopy(text: string): string[] {
  let cleaned = text;
  for (const phrase of ALLOWED_NEGATED_PHRASES) {
    cleaned = cleaned.replace(new RegExp(phrase, 'gi'), ' ');
  }
  return BANNED_COPY_PATTERNS.filter(({ pattern }) => pattern.test(cleaned)).map(
    ({ term }) => term,
  );
}
