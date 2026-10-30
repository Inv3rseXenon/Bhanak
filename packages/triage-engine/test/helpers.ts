import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Protocol, TriageInput } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(here, '..', '..', '..');

/** 2026-09-15 10:00 IST: the user's local date is 2026-09-15. */
export const NOW = new Date('2026-09-15T10:00:00+05:30');

export function loadProtocol(): Protocol {
  const path = join(REPO_ROOT, 'packages', 'protocols', 'dengue', 'v0.1.0.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Protocol;
}

/** A fresh deep copy, so tests can edit protocol data without affecting each other. */
export function cloneProtocol(): Protocol {
  return structuredClone(loadProtocol());
}

export const SYMPTOM_KEYS = [
  'severeAbdominalPain',
  'bleedingGums',
  'bleedingNose',
  'bloodInVomit',
  'bloodOrBlackStool',
  'bloodInUrine',
  'heavyMenstrualBleeding',
  'drowsyOrLethargic',
  'confusion',
  'restlessOrIrritable',
  'fits',
  'coldClammyHandsFeet',
  'fainting',
  'veryWeakPulse',
  'paleOrMottledSkin',
  'breathingDifficulty',
  'chestPain',
  'jaundice',
  'reducedFetalMovement',
  'stomachPain',
  'rash',
  'severeHeadache',
  'eyePain',
  'bodyPain',
  'headache',
  'nausea',
  'poorOralIntake',
  'poorFeeding',
  'fewerWetDiapers',
] as const;

/** Onset date for "day n of illness" relative to NOW (day 1 = today). Valid for n up to 15. */
export function onsetForDay(day: number): string {
  return `2026-09-${String(15 - (day - 1)).padStart(2, '0')}`;
}

/** Adult with fever since yesterday, every answer given as "no". */
export function baseInput(): TriageInput {
  return {
    subject: { ageMonths: 360, sex: 'MALE', conditions: [] },
    illness: { feverOnsetDate: onsetForDay(2), feverNow: 'YES', feverSettledWithin48h: 'NO' },
    symptoms: Object.fromEntries(SYMPTOM_KEYS.map((key) => [key, 'NO' as const])),
    counts: { vomitingEpisodes24h: 0, urineLast6hOrDiaperCount: 3 },
    fluids: { canKeepFluidsDown: 'YES' },
    labs: {},
    meds: { tookNsaidOrAspirin: 'NO' },
    context: { inOutbreakSeason: true, region: 'Mumbai', utcOffsetMinutes: 330 },
  };
}

export function inputWith(patch: (input: TriageInput) => void): TriageInput {
  const input = baseInput();
  patch(input);
  return input;
}
