import { describe, expect, it } from 'vitest';
import { LEVELS } from '@bhanak/triage-engine';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { mr } from '../src/i18n/mr';
import { SIGN_LABELS, otherLocales } from '../src/i18n/signs';

describe('signboard labels (all three languages at once)', () => {
  it('match the real translation tables, so they cannot drift', () => {
    expect(SIGN_LABELS.check).toEqual({
      en: en['nav.check'],
      hi: hi['nav.check'],
      mr: mr['nav.check'],
    });
    for (const level of LEVELS) {
      expect(SIGN_LABELS[level], level).toEqual({
        en: en[`level.${level}`],
        hi: hi[`level.${level}`],
        mr: mr[`level.${level}`],
      });
    }
  });

  it('shows the two languages that are not on screen', () => {
    expect(otherLocales('en')).toEqual(['hi', 'mr']);
    expect(otherLocales('hi')).toEqual(['mr', 'en']);
    expect(otherLocales('mr')).toEqual(['hi', 'en']);
  });
});
