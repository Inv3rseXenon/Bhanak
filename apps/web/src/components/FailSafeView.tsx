'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { CallButtons } from './CallButtons';

/** Shown when the engine throws or returns something unusable (spec 2.3). Exact text, keyed. */
export function FailSafeView({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <article data-testid="failsafe" aria-labelledby="failsafe-title">
      <div className="level-card level-EMERGENCY_NOW" role="alert">
        <div>
          <h1 id="failsafe-title" ref={heading} tabIndex={-1} className="level-label">
            {t('failsafe.title')}
          </h1>
          <p className="level-headline">{t('failsafe.body')}</p>
        </div>
      </div>
      <CallButtons />
      <button type="button" className="button button-secondary" onClick={onRetry}>
        {t('failsafe.retry')}
      </button>
    </article>
  );
}
