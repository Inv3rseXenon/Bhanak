import type { Level } from '@bhanak/triage-engine';
import type { Locale } from './locales';

/**
 * Indian hospital signboards carry the same words in several languages. These few labels are kept
 * here, for all three languages at once, so the home page can show them without loading the
 * Hindi and Marathi string tables. test/signs.test.ts checks every one against the real tables,
 * so they cannot drift.
 */
export type SignKey = 'check' | Level;

export const SIGN_LABELS: Record<SignKey, Record<Locale, string>> = {
  check: { en: 'Check symptoms', hi: 'लक्षण जाँचें', mr: 'लक्षणे तपासा' },
  EMERGENCY_NOW: { en: 'Emergency', hi: 'आपातकाल', mr: 'आणीबाणी' },
  SEE_DOCTOR_TODAY: {
    en: 'See a doctor today',
    hi: 'आज ही डॉक्टर को दिखाएँ',
    mr: 'आजच डॉक्टरांना दाखवा',
  },
  TEST_AND_MONITOR: {
    en: 'Get tested and keep watching',
    hi: 'जाँच करवाएँ और नज़र रखें',
    mr: 'तपासणी करा आणि लक्ष ठेवा',
  },
  HOME_CARE_WITH_TRIGGERS: {
    en: 'Home care, with warning signs',
    hi: 'घर पर देखभाल, चेतावनी के संकेतों के साथ',
    mr: 'घरी काळजी, धोक्याच्या चिन्हांसह',
  },
};

/** The two languages other than the one on screen, in a fixed order. */
export function otherLocales(current: Locale): Locale[] {
  return (['hi', 'mr', 'en'] as const).filter((code) => code !== current);
}
