'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { TESTER_MODE, WAITLIST_URL } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import { protocol } from '../lib/protocol';
import { Carousel } from './Carousel';
import { CheckIcon, FamilyIcon, LockIcon, PhoneIcon, ShieldIcon, WordsIcon } from './Icons';
import { PulseHero } from './Pulse';

const FEATURES: readonly { n: 1 | 2 | 3 | 4 | 5; icon: ReactNode }[] = [
  { n: 1, icon: <FamilyIcon /> },
  { n: 2, icon: <ShieldIcon /> },
  { n: 3, icon: <PhoneIcon /> },
  { n: 4, icon: <WordsIcon /> },
  { n: 5, icon: <LockIcon /> },
];

/** Only sources whose publisher is confirmed are shown; a "[CITATION NEEDED...]" one is not. */
const confirmedSources = Object.entries(protocol.sources).filter(
  ([, source]) => !source.publisher.startsWith('['),
);

export function Landing() {
  const { t } = useI18n();
  const review = protocol.review;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">
          {t('landing.headline')}
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
        <ul className="chips">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <CheckIcon />
              {t(`home.trust.${n}`)}
            </li>
          ))}
        </ul>
        {TESTER_MODE ? <p className="tester-note">{t('landing.tester')}</p> : null}
        <PulseHero />
        <p className="tagline">
          {t('landing.tagline')} <span>{t('landing.taglineCompanion')}</span>
        </p>
      </section>

      <Carousel />

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

      <section className="features" aria-labelledby="features-title">
        <h2 id="features-title">{t('home.features.title')}</h2>
        <ul className="feature-list">
          {FEATURES.map(({ n, icon }) => (
            <li key={n}>
              <span className="feature-icon">{icon}</span>
              <div>
                <h3>{t(`home.features.${n}.title`)}</h3>
                <p>{t(`home.features.${n}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">{t('home.sources.title')}</h2>
        <p>{t('home.sources.body')}</p>
        <ul>
          {confirmedSources.map(([id, source]) => (
            <li key={id} lang="en">
              <strong>{source.title}</strong>
              <br />
              {source.publisher}
            </li>
          ))}
        </ul>
        <p className="source-status">
          {protocol.reviewStatus === 'REVIEWED' && review.reviewerName !== null
            ? t('home.sources.reviewed', {
                name: review.reviewerName,
                date: review.reviewedOn ?? '',
              })
            : t('home.sources.draft')}
        </p>
      </section>

      <section className="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">{t('faq.title')}</h2>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <details key={n}>
            <summary>{t(`faq.${n}.q`)}</summary>
            <p>{t(`faq.${n}.a`)}</p>
          </details>
        ))}
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <h2 id="cta-title">{t('home.cta.title')}</h2>
        <p>{t('home.cta.body')}</p>
        <div className="hero-actions">
          <Link className="button button-light button-large" href="/check/">
            {t('landing.cta')}
          </Link>
          <Link className="button button-danger button-large" href="/emergency/">
            <PhoneIcon />
            {t('landing.emergency')}
          </Link>
        </div>
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
