'use client';

import { useI18n } from '../i18n/I18nProvider';
import { HOSPITAL_SEARCH_URL } from '../config';
import { PhoneIcon, PinIcon } from './Icons';

/** Call 108, Call 112 and hospital search: always free, no login, no consent wall (spec 2.9). */
export function CallButtons({ withHospital = true }: { withHospital?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="call-buttons">
      <a className="button button-danger button-large" href="tel:108">
        <PhoneIcon />
        {t('result.call108')}
      </a>
      <a className="button button-danger button-large" href="tel:112">
        <PhoneIcon />
        {t('result.call112')}
      </a>
      {withHospital ? (
        <>
          <a
            className="button button-secondary button-large"
            href={HOSPITAL_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PinIcon />
            {t('result.findHospital')}
          </a>
          <p className="meta">{t('result.findHospital.offline')}</p>
        </>
      ) : null}
    </div>
  );
}
