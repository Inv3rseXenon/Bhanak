'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEVELS } from '@bhanak/triage-engine';
import type { Level } from '@bhanak/triage-engine';
import { TESTER_MODE, WAITLIST_URL } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import { applyDisplayFloor } from '../lib/display';
import { protocol } from '../lib/protocol';
import { CallButtons } from './CallButtons';
import { Carousel } from './Carousel';
import {
  CheckIcon,
  ChildIcon,
  FamilyIcon,
  ForwardIcon,
  PersonIcon,
  PhoneIcon,
  PulseGlyph,
} from './Icons';
import { LevelIcon } from './LevelIcon';
import { PulseHero } from './Pulse';
import { EntranceScene, HospitalScene } from './Scenes';
import { SignLanguages, WaySign } from './WaySign';

const WHO: readonly { id: 'SELF' | 'CHILD' | 'FAMILY'; key: string; icon: ReactNode }[] = [
  { id: 'SELF', key: 'intake.who.self', icon: <PersonIcon /> },
  { id: 'CHILD', key: 'intake.who.child', icon: <ChildIcon /> },
  { id: 'FAMILY', key: 'intake.who.family', icon: <FamilyIcon /> },
];

const TONE: Record<Level, string> = {
  EMERGENCY_NOW: 'red',
  SEE_DOCTOR_TODAY: 'orange',
  TEST_AND_MONITOR: 'teal',
  HOME_CARE_WITH_TRIGGERS: 'slate',
};

/** Outcomes a person can actually be shown (a tester build never shows home care). */
const SHOWN_LEVELS = [...LEVELS]
  .reverse()
  .filter((level) => applyDisplayFloor(level, TESTER_MODE) === level);

/** Only sources whose publisher is confirmed are shown; a "[CITATION NEEDED...]" one is not. */
const confirmedSources = Object.entries(protocol.sources).filter(
  ([, source]) => !source.publisher.startsWith('['),
);

export function Landing() {
  const { t } = useI18n();
  const review = protocol.review;
  return (
    <>
      <section className="hero-full" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-copy-inner">
            <h1 id="hero-title" className="hero-title">
              <span className="hero-title-icon">
                <PulseGlyph />
              </span>
              {t('nav.check')}
            </h1>
            <p className="hero-langs">
              <SignLanguages sign="check" />
            </p>
            <p className="hero-quote">{t('landing.headline')}</p>

            <div className="start-panel" role="group" aria-labelledby="start-title">
              <p id="start-title" className="start-title">
                {t('intake.who.title')}
              </p>
              <div className="start-doors">
                {WHO.map(({ id, key, icon }) => (
                  <Link key={id} className="door" href={`/check/#who=${id}`}>
                    <span className="door-icon">{icon}</span>
                    <span className="door-label">{t(key)}</span>
                    <ForwardIcon />
                  </Link>
                ))}
              </div>
              <p className="start-note">{t('home.start.note')}</p>
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
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HospitalScene />
        </div>
      </section>

      <section className="pulse-band" aria-label={t('landing.tagline')}>
        <div className="wrap">
          <PulseHero />
          <p className="tagline">
            {t('landing.tagline')} <span>{t('landing.taglineCompanion')}</span>
          </p>
        </div>
      </section>

      <section className="band band-deep" aria-labelledby="outcomes-title">
        <div className="wrap">
          <h2 id="outcomes-title">{t('home.outcomes.title')}</h2>
          <ul className="signs">
            {SHOWN_LEVELS.map((level) => (
              <li key={level}>
                <WaySign
                  sign={level}
                  tone={TONE[level]}
                  icon={<LevelIcon level={level} />}
                  label={t(`level.${level}`)}
                  note={t(protocol.levels[level].headlineI18nKey)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="band">
        <div className="wrap">
          <Carousel />
        </div>
      </div>

      <section className="band band-mist" aria-labelledby="where-title">
        <div className="wrap split">
          <div>
            <h2 id="where-title">{t('emergency.title')}</h2>
            <p className="lead">{t('emergency.lead')}</p>
            <CallButtons />
          </div>
          <div className="picture">
            <EntranceScene />
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="faq-title">
        <div className="wrap split split-faq">
          <div className="faq">
            <h2 id="faq-title">{t('faq.title')}</h2>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <details key={n}>
                <summary>{t(`faq.${n}.q`)}</summary>
                <p>{t(`faq.${n}.a`)}</p>
              </details>
            ))}
          </div>
          <div>
            <div className="sources" aria-labelledby="sources-title" role="group">
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
            </div>
            <div className="plain-note" role="group" aria-labelledby="not-title">
              <h2 id="not-title">{t('landing.not.title')}</h2>
              <p>{t('landing.not.body')}</p>
              <p>{t('landing.privacy')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band band-deep cta-final" aria-labelledby="cta-title">
        <div className="wrap">
          <h2 id="cta-title">{t('home.cta.title')}</h2>
          <p>{t('home.cta.body')}</p>
          <div className="hero-actions">
            <Link className="button button-light button-large" href="/check/">
              <PulseGlyph />
              {t('landing.cta')}
            </Link>
            <Link className="button button-danger button-large" href="/emergency/">
              <PhoneIcon />
              {t('landing.emergency')}
            </Link>
          </div>
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
        </div>
      </section>
    </>
  );
}
