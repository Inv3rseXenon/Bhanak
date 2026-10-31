import { brand } from '@bhanak/shared';

/**
 * Words that are the same in every language: medical abbreviations and units, the "AA" glyph of
 * the large-text switch, and the brand name (a name, not a word to translate).
 */
const SHARED_TERMS = new RegExp(`\\b(ORS|CBC|AST|ALT|NS1|IgM|IgG|U/L|AA|${brand.name})\\b`, 'g');

/** Latin-script words left in `text` once placeholders and shared terms are removed. */
export const strayEnglish = (text: string): string[] =>
  text
    .replace(/\{\w+\}/g, ' ')
    .replace(SHARED_TERMS, ' ')
    .match(/[A-Za-z]{2,}/g) ?? [];
