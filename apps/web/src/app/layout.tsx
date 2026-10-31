import { brand } from '@bhanak/shared';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Shell } from '../components/Shell';
import { TESTER_MODE } from '../config';
import { I18nProvider } from '../i18n/I18nProvider';
import { isIndexable, reviewStatus } from '../lib/seo';
import './globals.css';

export const metadata: Metadata = {
  title: `${brand.name}: ${brand.taglineEn}`,
  description:
    'Guidance on how urgently to seek care for dengue and monsoon fevers. Not a diagnosis. In an emergency call 108 or 112.',
  // Tester builds and unreviewed protocols are never indexed (private tester release).
  robots: isIndexable(TESTER_MODE, reviewStatus)
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A6B66',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
