/** Bumped whenever evaluation behaviour changes. Recorded in every result (spec 2.10). */
export const ENGINE_VERSION = '0.1.0';

/**
 * i18n key used if a protocol ever ships an empty "return immediately if" list: that list must
 * never be empty (spec 2.4), so the engine falls back to this generic key.
 */
export const FALLBACK_RETURN_IMMEDIATELY_I18N_KEY = 'common.return_immediately_fallback';
