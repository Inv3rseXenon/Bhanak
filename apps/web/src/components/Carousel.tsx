'use client';

import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { protocol } from '../lib/protocol';
import { BackIcon, ForwardIcon } from './Icons';

/**
 * What to watch for: the protocol's own watch-for guidance, one idea per slide.
 * Built for older users: big Previous and Next buttons, swipe, no automatic movement
 * (nothing moves unless the person moves it), and the text is the same as in the result screen.
 */
const SLIDES = [
  { titleKey: 'home.watch.1.title', bodyKey: 'dengue.watch.fever_falls', tone: 'deep', days: true },
  { titleKey: 'home.watch.2.title', bodyKey: 'dengue.watch.drinks_and_urine', tone: 'mist' },
  { titleKey: 'home.watch.3.title', bodyKey: 'dengue.watch.new_symptoms', tone: 'wash' },
  { titleKey: 'home.watch.4.title', bodyKey: 'dengue.watch.daily_notes', tone: 'mist' },
  { titleKey: 'home.watch.5.title', bodyKey: 'dengue.action.check_painkillers', tone: 'warm' },
] as const;

function DayStrip() {
  const { t } = useI18n();
  const from = protocol.thresholds.criticalPhaseStartDay?.value ?? 3;
  const to = protocol.thresholds.criticalPhaseEndDay?.value ?? 7;
  const days = Array.from({ length: to + 1 }, (_, i) => i + 1);
  return (
    <div>
      <ol className="day-strip">
        {days.map((day) => {
          const critical = day >= from && day <= to;
          return (
            <li
              key={day}
              className={critical ? 'day day-critical' : 'day'}
              aria-label={t('home.day', { n: day })}
            >
              {day}
            </li>
          );
        })}
      </ol>
      <p className="day-legend">{t('home.day.legend', { from, to })}</p>
    </div>
  );
}

export function Carousel() {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;

  const go = (target: number) => {
    const next = Math.min(total - 1, Math.max(0, target));
    setIndex(next);
    const element = track.current;
    if (element !== null) element.scrollLeft = next * element.clientWidth;
  };

  const onScroll = () => {
    const element = track.current;
    if (element === null || element.clientWidth === 0) return;
    setIndex(Math.round(element.scrollLeft / element.clientWidth));
  };

  return (
    <section
      className="carousel"
      aria-roledescription={t('carousel.roleCarousel')}
      aria-labelledby="watch-title"
    >
      <h2 id="watch-title">{t('home.watch.title')}</h2>
      <p className="carousel-lead">{t('home.watch.lead')}</p>

      <div
        className="carousel-track"
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        role="group"
        aria-label={t('home.watch.title')}
        data-testid="carousel-track"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.titleKey}
            className={`slide slide-${slide.tone}`}
            role="group"
            aria-roledescription={t('carousel.roleSlide')}
            aria-label={t('carousel.slide', { n: i + 1, total })}
          >
            <h3>{t(slide.titleKey)}</h3>
            <p>{t(slide.bodyKey)}</p>
            {'days' in slide ? <DayStrip /> : null}
          </div>
        ))}
      </div>

      <div className="carousel-controls">
        <button
          type="button"
          className="carousel-button"
          onClick={() => {
            go(index - 1);
          }}
          disabled={index === 0}
        >
          <BackIcon />
          <span className="btn-label">{t('carousel.prev')}</span>
        </button>
        <div className="dots">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.titleKey}
              type="button"
              className="dot"
              aria-label={t('carousel.goto', { n: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => {
                go(i);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="carousel-button"
          onClick={() => {
            go(index + 1);
          }}
          disabled={index === total - 1}
        >
          <span className="btn-label">{t('carousel.next')}</span>
          <ForwardIcon />
        </button>
      </div>
      <p className="meta carousel-count" aria-live="polite">
        {t('carousel.slide', { n: index + 1, total })}
      </p>
    </section>
  );
}
