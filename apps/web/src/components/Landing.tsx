'use client';

import { brand } from '@bhanak/shared';
import Link from 'next/link';
import { TESTER_MODE, WAITLIST_URL } from '../config';
import { useI18n } from '../i18n/I18nProvider';

export function Landing() {
  const { t } = useI18n();
  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('landing.eyebrow')}</p>
        <h1>{brand.homeHeadline}</h1>
        <p className="lead">{t('landing.lead')}</p>
        <p className="tagline">
          {brand.tagline} <span>{brand.taglineEn}</span>
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/check/">
            {t('landing.cta')}
          </Link>
          <Link className="button button-danger" href="/emergency/">
            {t('landing.emergency')}
          </Link>
        </div>
        {TESTER_MODE ? <p className="note-box">{t('landing.tester')}</p> : null}
      </section>

      <section aria-labelledby="how-title">
        <h2 id="how-title">{t('landing.how.title')}</h2>
        <ol className="steps">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <h3>{t(`landing.how.${n}.title`)}</h3>
              <p>{t(`landing.how.${n}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="not-title" className="note-box">
        <h2 id="not-title">{t('landing.not.title')}</h2>
        <p>{t('landing.not.body')}</p>
        <p>{t('landing.privacy')}</p>
      </section>

      {!TESTER_MODE && WAITLIST_URL !== '' ? (
        <p>
          <a
            className="button button-secondary"
            href={WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('landing.waitlist')}
          </a>
        </p>
      ) : null}
    </>
  );
}
