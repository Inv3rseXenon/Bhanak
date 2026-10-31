'use client';

import { useI18n } from '../i18n/I18nProvider';
import { protocol } from '../lib/protocol';
import { CallButtons } from './CallButtons';

/** Emergency screen (spec 7): no login, no consent wall, nothing to load. */
export function EmergencyView() {
  const { t } = useI18n();
  return (
    <div className="wrap-narrow">
      <article data-testid="emergency-page">
        <h1>{t('emergency.title')}</h1>
        <p className="lead">{t('emergency.lead')}</p>
        <CallButtons />
        <section className="return-box">
          <h2>{t('emergency.signs')}</h2>
          <ul>
            {protocol.returnImmediatelyIf.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{t('emergency.tell')}</h2>
          <ul>
            {[1, 2, 3, 4].map((n) => (
              <li key={n}>{t(`emergency.tell.${n}`)}</li>
            ))}
          </ul>
        </section>
        <p className="meta">{t('emergency.offline')}</p>
      </article>
    </div>
  );
}
