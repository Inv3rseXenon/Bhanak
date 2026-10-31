import englishProtocolStrings from '@bhanak/protocols/dengue/v0.1.0.strings.en.json';
import { en } from './en';
import type { Locale } from './locales';

/** Key -> text for one language: UI strings plus the protocol's clinical strings. */
export type Messages = Record<string, string>;

/** English is bundled; it is also the fallback for any key a translation lacks. */
export const englishMessages: Messages = { ...englishProtocolStrings.strings, ...en };

/** Hindi and Marathi load on demand, so the first screen ships only English. */
export async function loadMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'hi': {
      const [ui, clinical] = await Promise.all([
        import('./hi'),
        import('@bhanak/protocols/dengue/v0.1.0.strings.hi.json'),
      ]);
      return { ...clinical.default.strings, ...ui.hi };
    }
    case 'mr': {
      const [ui, clinical] = await Promise.all([
        import('./mr'),
        import('@bhanak/protocols/dengue/v0.1.0.strings.mr.json'),
      ]);
      return { ...clinical.default.strings, ...ui.mr };
    }
    case 'en':
      return englishMessages;
  }
}
