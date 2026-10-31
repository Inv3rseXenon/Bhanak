/**
 * Build-time configuration. Every value is inlined by Next at build time (see next.config.mjs);
 * nothing here is read from a server, a cookie or the network.
 */

/** Private tester build: banner on every screen, display floor, noindex. */
export const TESTER_MODE: boolean = process.env.NEXT_PUBLIC_TESTER_MODE === 'true';

/** Placeholder until the founder creates the Google Form (docs/TODO.md W-001). */
export const FEEDBACK_URL_PLACEHOLDER =
  'https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/viewform';

/** "Send feedback" target. */
export const FEEDBACK_URL: string =
  process.env.NEXT_PUBLIC_FEEDBACK_URL !== undefined && process.env.NEXT_PUBLIC_FEEDBACK_URL !== ''
    ? process.env.NEXT_PUBLIC_FEEDBACK_URL
    : FEEDBACK_URL_PLACEHOLDER;

/** External early-access form (spec 19: placeholder until the API exists). Empty = not set. */
export const WAITLIST_URL: string = process.env.NEXT_PUBLIC_WAITLIST_URL ?? '';

/** Emergency numbers (spec 2.3). */
export const EMERGENCY_NUMBERS = ['108', '112'] as const;

/** Opens the device maps app; no API key, no cost (spec 7). */
export const HOSPITAL_SEARCH_URL = 'https://www.google.com/maps/search/hospital+near+me';
