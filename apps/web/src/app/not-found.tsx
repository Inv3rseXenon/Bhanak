'use client';

import Link from 'next/link';
import { CallButtons } from '../components/CallButtons';
import { useI18n } from '../i18n/I18nProvider';

/** Even a wrong address leads to the emergency numbers, in the person's language. */
export default function NotFound() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t('notfound.title')}</h1>
      <p>{t('notfound.body')}</p>
      <p>
        <Link className="button button-secondary" href="/">
          {t('nav.home')}
        </Link>
      </p>
      <CallButtons withHospital={false} />
    </>
  );
}
