'use client';

import { useI18n } from '../i18n/I18nProvider';
import { HOSPITAL_SEARCH_URL } from '../config';

/** Call 108, Call 112 and hospital search: always free, no login, no consent wall (spec 2.9). */
export function CallButtons({ withHospital = true }: { withHospital?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="call-buttons">
      <a className="button button-danger" href="tel:108">
        {t('result.call108')}
      </a>
      <a className="button button-danger" href="tel:112">
        {t('result.call112')}
      </a>
      {withHospital ? (
        <>
          <a
            className="button button-secondary"
            href={HOSPITAL_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('result.findHospital')}
          </a>
          <p className="meta">{t('result.findHospital.offline')}</p>
        </>
      ) : null}
    </div>
  );
}
