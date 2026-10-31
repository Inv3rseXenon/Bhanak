'use client';

import { brand } from '@bhanak/shared';
import { ENGINE_VERSION } from '@bhanak/triage-engine';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FEEDBACK_URL, TESTER_MODE } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import { LOCALES, LOCALE_NAMES } from '../i18n/locales';
import { protocol } from '../lib/protocol';

const isDraft = protocol.reviewStatus !== 'REVIEWED';

/**
 * Persistent top banner. In a tester build it carries the full notice; in any other build with an
 * unreviewed protocol it carries the draft notice (spec 5.5). It is on every screen.
 */
export function Banner() {
  const { t } = useI18n();
  if (TESTER_MODE) {
    return (
      <div className="banner banner-tester" role="note" data-testid="tester-banner">
        {t('banner.tester')}
      </div>
    );
  }
  if (isDraft) {
    return (
      <div className="banner" role="note" data-testid="draft-banner">
        {t('banner.draft')}
      </div>
    );
  }
  return null;
}

function Logo() {
  return (
    <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true" focusable="false">
      <path
        d="M1 14h6l3-7 4 14 4-9h4"
        fill="none"
        stroke="#0A6B66"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="9" r="3.2" fill="#B54708" />
    </svg>
  );
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t('lang.label')} className="lang-switch">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          onClick={() => {
            setLocale(code);
          }}
        >
          {LOCALE_NAMES[code]}
        </button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, underReview } = useI18n();
  return (
    <>
      <a className="skip-link" href="#main">
        {t('app.skip')}
      </a>
      <Banner />
      <header className="site-header">
        <Link href="/" className="logo" aria-label={`${brand.wordmark}: ${t('nav.home')}`}>
          <Logo />
          <span>{brand.wordmark}</span>
        </Link>
        <nav aria-label="Main" className="site-nav">
          <Link href="/check/" className="nav-link">
            {t('nav.check')}
          </Link>
          <Link href="/emergency/" className="nav-link nav-emergency" data-testid="emergency-link">
            {t('nav.emergency')}
          </Link>
        </nav>
        <LanguageSwitcher />
      </header>
      {underReview ? (
        <div className="review-note" role="note">
          <strong className="badge">{t('review.badge')}</strong> {t('review.note')}
        </div>
      ) : null}
      <main id="main" tabIndex={-1} className="container">
        {children}
      </main>
      <footer className="site-footer">
        <p className="disclaimer">{t('footer.disclaimer')}</p>
        {TESTER_MODE ? (
          <p>
            <a
              className="button button-secondary"
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="feedback-link"
            >
              {t('footer.feedback')}
            </a>
          </p>
        ) : null}
        <p className="meta">
          {t('footer.rules', { protocol: protocol.version, engine: ENGINE_VERSION })}
        </p>
      </footer>
    </>
  );
}
