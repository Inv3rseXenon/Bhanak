/** Constants stated by the spec. Nothing clinical lives here (clinical values belong in protocols). */

/** Indian emergency numbers shown on the emergency screen (spec sections 2 and 7). */
export const EMERGENCY_NUMBERS = ['108', '112'] as const;
export type EmergencyNumber = (typeof EMERGENCY_NUMBERS)[number];

/** Launch languages (spec section 1). */
export const SUPPORTED_LOCALES = ['en', 'hi', 'mr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Default IANA timezone; each user stores their own (spec section 1). */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
