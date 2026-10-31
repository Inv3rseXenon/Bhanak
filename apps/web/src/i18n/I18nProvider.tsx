'use client';

import { brand } from '@bhanak/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { format } from '../lib/format';
import type { Params } from '../lib/format';
import { isLocale, needsReview, pickLocale } from './locales';
import type { Locale } from './locales';
import { englishMessages, loadMessages } from './messages';
import type { Messages } from './messages';

const STORAGE_KEY = 'lang';

export interface I18n {
  locale: Locale;
  /** Look up a string. A key missing from this language falls back to English, then to the key. */
  t: (key: string, params?: Params) => string;
  /** True when the key exists in the English source (used for optional help text). */
  has: (key: string) => boolean;
  setLocale: (locale: Locale) => void;
  /** Hindi and Marathi carry the "translation under review" badge (docs/TODO.md L-001). */
  underReview: boolean;
}

const I18nContext = createContext<I18n | null>(null);

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null; // storage can be blocked; the language simply is not remembered
  }
}

function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* not remembered; nothing else depends on it */
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Messages>(englishMessages);

  const setLocale = useCallback((next: Locale) => {
    loadMessages(next).then(
      (loaded) => {
        setMessages(loaded);
        setLocaleState(next);
        document.documentElement.lang = next;
        storeLocale(next);
      },
      () => {
        // Offline and the language chunk is not cached yet: stay in the current language.
      },
    );
  }, []);

  // Choose the language after mount, so the server HTML (English) and the first client render match.
  useEffect(() => {
    const initial = readStoredLocale() ?? pickLocale(navigator.languages);
    if (initial !== 'en') setLocale(initial);
  }, [setLocale]);

  // The browser tab title follows the language too.
  useEffect(() => {
    document.title = format(messages['meta.title'] ?? englishMessages['meta.title'] ?? '', {
      brandName: brand.name,
    });
  }, [messages]);

  const value = useMemo<I18n>(
    () => ({
      locale,
      t: (key, params) =>
        format(messages[key] ?? englishMessages[key] ?? key, { brandName: brand.name, ...params }),
      has: (key) => key in englishMessages,
      setLocale,
      underReview: needsReview(locale),
    }),
    [locale, messages, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (value === null) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
