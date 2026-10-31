'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

const SIZE_KEY = 'size';

/** "Large text" switch for people who find the default size small. Remembered on this device. */
export function TextSize() {
  const { t } = useI18n();
  const [large, setLarge] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIZE_KEY) === 'large') setLarge(true);
    } catch {
      /* storage blocked: the choice is simply not remembered */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.size = large ? 'large' : 'normal';
  }, [large]);

  return (
    <button
      type="button"
      className="size-toggle"
      aria-pressed={large}
      onClick={() => {
        const next = !large;
        setLarge(next);
        try {
          window.localStorage.setItem(SIZE_KEY, next ? 'large' : 'normal');
        } catch {
          /* not remembered */
        }
      }}
    >
      <span aria-hidden="true">
        A<small>A</small>
      </span>
      <span className="size-label">{t('a11y.largeText')}</span>
    </button>
  );
}
