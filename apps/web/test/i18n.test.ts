import { describe, expect, it } from 'vitest';
import { brand, findBannedCopy } from '@bhanak/shared';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { mr } from '../src/i18n/mr';
import { isLocale, needsReview, pickLocale } from '../src/i18n/locales';
import { englishMessages, loadMessages } from '../src/i18n/messages';
import { format, formatIndianNumber } from '../src/lib/format';

const digits = (text: string): string[] => text.match(/\d+/g)?.sort() ?? [];
const placeholders = (text: string): string[] => text.match(/\{\w+\}/g)?.sort() ?? [];

describe('UI strings', () => {
  it('hi and mr define exactly the keys of en', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(mr).sort()).toEqual(Object.keys(en).sort());
  });

  it('keep the numbers (108, 112, 6, 24 ...) and {placeholders} of the English text', () => {
    for (const [key, english] of Object.entries(en)) {
      for (const [name, table] of [
        ['hi', hi],
        ['mr', mr],
      ] as const) {
        const text: string = table[key as keyof typeof en];
        expect(digits(text), `${name} ${key}`).toEqual(digits(english));
        expect(placeholders(text), `${name} ${key}`).toEqual(placeholders(english));
      }
    }
  });

  it('contain no banned claims in English (diagnose, detect, cure, AI doctor, guaranteed)', () => {
    for (const [key, text] of Object.entries(englishMessages)) {
      expect(findBannedCopy(text), key).toEqual([]);
    }
  });

  it('never state that the person is fine or does not have a disease', () => {
    for (const [key, text] of Object.entries(englishMessages)) {
      expect(text, key).not.toMatch(/\byou (do not|don't) have (dengue|a disease|an infection)/i);
      expect(text, key).not.toMatch(/\bnot (a )?dengue\b/i);
    }
  });

  it('do not hard-code the brand name (it comes from brand.ts)', () => {
    for (const table of [en, hi, mr]) {
      for (const [key, text] of Object.entries(table)) {
        expect(text.toLowerCase(), key).not.toContain(brand.name.toLowerCase());
      }
    }
  });

  it('carry the exact banner, disclaimer and fail-safe text of the spec', () => {
    expect(en['banner.tester']).toBe(
      'TEST VERSION, NOT MEDICALLY REVIEWED. Not for real medical decisions. In an emergency call 108 or 112.',
    );
    expect(en['banner.draft']).toBe('TEST VERSION, NOT MEDICALLY REVIEWED');
    expect(en['footer.disclaimer']).toBe(
      'Guidance, not a diagnosis. In an emergency call 108 or 112.',
    );
    expect(en['failsafe.body']).toBe(
      'We could not assess this. If you have a fever and any of: vomiting repeatedly, unable to drink, severe stomach pain, bleeding, unusual sleepiness, cold skin, very little urine, breathlessness: go to a hospital now. Call 108 or 112.',
    );
  });

  it('give the emergency numbers in every language on the banner, footer and fail-safe', () => {
    for (const table of [en, hi, mr]) {
      for (const key of ['banner.tester', 'footer.disclaimer', 'failsafe.body'] as const) {
        expect(table[key]).toContain('108');
        expect(table[key]).toContain('112');
      }
    }
  });
});

describe('loading languages', () => {
  it('Hindi and Marathi provide every key that English has, protocol strings included', async () => {
    const keys = Object.keys(englishMessages).sort();
    expect(keys.length).toBeGreaterThan(250);
    for (const locale of ['hi', 'mr'] as const) {
      const loaded = await loadMessages(locale);
      expect(Object.keys(loaded).sort(), locale).toEqual(keys);
      // A translation is never the English text copied across.
      expect(loaded['dengue.headline.emergency'], locale).not.toBe(
        englishMessages['dengue.headline.emergency'],
      );
    }
    expect(await loadMessages('en')).toBe(englishMessages);
  });

  it('flags hi and mr as translations under review, but not English', () => {
    expect(needsReview('en')).toBe(false);
    expect(needsReview('hi')).toBe(true);
    expect(needsReview('mr')).toBe(true);
  });

  it('picks the first supported browser language', () => {
    expect(pickLocale(['fr-FR', 'hi-IN', 'en'])).toBe('hi');
    expect(pickLocale(['mr'])).toBe('mr');
    expect(pickLocale(['de'])).toBe('en');
    expect(pickLocale([])).toBe('en');
    expect(isLocale('hi')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });
});

describe('formatting', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('Question {current} of {total}', { current: 3, total: 40 })).toBe(
      'Question 3 of 40',
    );
    expect(format('Hello {missing}')).toBe('Hello {missing}');
  });
  it('groups numbers the Indian way', () => {
    expect(formatIndianNumber(25000)).toBe('25,000');
    expect(formatIndianNumber(150000)).toBe('1,50,000');
    expect(formatIndianNumber(12345678)).toBe('1,23,45,678');
    expect(formatIndianNumber(999)).toBe('999');
    expect(formatIndianNumber(1234.5)).toBe('1,234.5');
  });
});
