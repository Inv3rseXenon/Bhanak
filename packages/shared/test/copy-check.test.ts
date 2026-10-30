import { describe, expect, it } from 'vitest';
import { findBannedCopy } from '../src/copy-check.js';

describe('findBannedCopy', () => {
  it('flags each banned claim', () => {
    expect(findBannedCopy('We diagnose dengue')).toEqual(['diagnose']);
    expect(findBannedCopy('Diagnosed early')).toEqual(['diagnose']);
    expect(findBannedCopy('Detect dengue early')).toEqual(['detect']);
    expect(findBannedCopy('Early detection')).toEqual(['detect']);
    expect(findBannedCopy('A cure for fever')).toEqual(['cure']);
    expect(findBannedCopy('Your AI doctor')).toEqual(['AI doctor']);
    expect(findBannedCopy('ai-doctor in your pocket')).toEqual(['AI doctor']);
    expect(findBannedCopy('Results guaranteed')).toEqual(['guaranteed']);
    expect(findBannedCopy('You are fine')).toEqual(['you are fine']);
    expect(findBannedCopy("You're fine")).toEqual(['you are fine']);
    expect(findBannedCopy('You’re fine')).toEqual(['you are fine']);
  });

  it('allows negated disclaimers', () => {
    expect(findBannedCopy('This app does not diagnose.')).toEqual([]);
    expect(findBannedCopy('Guidance, not a diagnosis.')).toEqual([]);
    expect(findBannedCopy('This app cannot diagnose you. It is not for diagnosis.')).toEqual([]);
  });

  it('still flags a banned word next to an allowed phrase', () => {
    expect(findBannedCopy('It does not diagnose, but it will detect dengue')).toEqual(['detect']);
  });

  it('does not match inside other words', () => {
    expect(findBannedCopy('Secure your records. Accurate guidance. Directed care.')).toEqual([]);
    expect(findBannedCopy('No danger signs reported right now; this can change quickly.')).toEqual(
      [],
    );
  });
});
