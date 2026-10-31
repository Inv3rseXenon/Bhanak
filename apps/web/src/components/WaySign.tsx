'use client';

import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { SIGN_LABELS, otherLocales } from '../i18n/signs';
import type { SignKey } from '../i18n/signs';

/**
 * A hospital-style signboard: a coloured pictogram block and a bold label in the language on
 * screen, with the same words in the other two languages beneath, as on real hospital signs.
 */
export function SignLanguages({ sign }: { sign: SignKey }) {
  const { locale } = useI18n();
  return (
    <span className="sign-others">
      {otherLocales(locale).map((code) => (
        <span key={code} lang={code}>
          {SIGN_LABELS[sign][code]}
        </span>
      ))}
    </span>
  );
}

export function WaySign({
  sign,
  tone,
  icon,
  label,
  note,
}: {
  sign: SignKey;
  tone: string;
  icon: ReactNode;
  /** The label in the language on screen. */
  label: string;
  note?: string;
}) {
  return (
    <div className={`sign sign-${tone}`}>
      <span className="sign-icon">{icon}</span>
      <span className="sign-text">
        <span className="sign-primary">{label}</span>
        <SignLanguages sign={sign} />
        {note !== undefined ? <span className="sign-note">{note}</span> : null}
      </span>
    </div>
  );
}
