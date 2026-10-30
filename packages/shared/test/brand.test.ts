import { describe, expect, it } from 'vitest';
import { brand, PLACEHOLDER_PREFIX, unresolvedBrandPlaceholders } from '../src/brand.js';
import { DEFAULT_LOCALE, EMERGENCY_NUMBERS, SUPPORTED_LOCALES } from '../src/constants.js';

describe('brand', () => {
  it('has the fixed identity strings from the spec', () => {
    expect(brand.name).toBe('Bhanak');
    expect(brand.wordmark).toBe('bhanak');
    expect(brand.tagline).toBe('Bhanak pehle, khatra baad mein.');
    expect(brand.taglineEn).toBe('Catch the first hint.');
  });

  it('never leaves a field empty: unknown values must be explicit placeholders', () => {
    const walk = (value: unknown): void => {
      if (typeof value === 'string') {
        expect(value.trim()).not.toBe('');
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(walk);
      }
    };
    walk(brand);
  });

  it('reports every unresolved placeholder by dotted path', () => {
    expect(unresolvedBrandPlaceholders()).toEqual([
      'supportEmail',
      'legalEntityName',
      'domain',
      'grievanceOfficer.name',
      'grievanceOfficer.email',
      'grievanceOfficer.phone',
      'grievanceOfficer.address',
    ]);
  });

  it('reports nothing once all placeholders are filled in', () => {
    const filled = {
      ...brand,
      supportEmail: 'help@example.test',
      grievanceOfficer: { ...brand.grievanceOfficer, name: 'A. Person' },
    };
    expect(unresolvedBrandPlaceholders(filled)).not.toContain('supportEmail');
    expect(unresolvedBrandPlaceholders(filled)).not.toContain('grievanceOfficer.name');
    expect(unresolvedBrandPlaceholders({ a: 'x', b: { c: 'y' } })).toEqual([]);
    expect(unresolvedBrandPlaceholders({ a: `${PLACEHOLDER_PREFIX}: x]`, b: 1, c: null })).toEqual([
      'a',
    ]);
  });
});

describe('constants', () => {
  it('lists the emergency numbers and launch locales from the spec', () => {
    expect(EMERGENCY_NUMBERS).toEqual(['108', '112']);
    expect(SUPPORTED_LOCALES).toEqual(['en', 'hi', 'mr']);
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
