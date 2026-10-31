'use client';

import { brand } from '@bhanak/shared';
import Link from 'next/link';
import { TESTER_MODE, WAITLIST_URL } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import { PhoneIcon } from './Icons';
import { PulseHero } from './Pulse';

export function Landing() {
  const { t } = useI18n();
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">
          {brand.homeHeadline}
        </h1>
        <p className="hero-lead">{t('landing.lead')}</p>
        <div className="hero-actions">
          <Link className="button button-primary button-large" href="/check/">
            {t('landing.cta')}
          </Link>
          <Link className="button button-danger button-large" href="/emergency/">
            <PhoneIcon />
            {t('landing.emergency')}
          </Link>
        </div>
        {TESTER_MODE ? <p className="tester-note">{t('landing.tester')}</p> : null}
        <PulseHero />
        <p className="tagline">
          {brand.tagline} <span>{brand.taglineEn}</span>
        </p>
      </section>

      <section className="rows" aria-labelledby="how-title">
        <h2 id="how-title">{t('landing.how.title')}</h2>
        <ul className="row-list">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <h3>{t(`landing.how.${n}.title`)}</h3>
              <p>{t(`landing.how.${n}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="plain-note" aria-labelledby="not-title">
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
