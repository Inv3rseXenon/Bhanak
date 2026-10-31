import type { MetadataRoute } from 'next';
import { TESTER_MODE } from '../config';
import { isIndexable, reviewStatus } from '../lib/seo';

export const dynamic = 'force-static';

/** Tester builds and unreviewed protocols: Disallow everything. */
export default function robots(): MetadataRoute.Robots {
  return isIndexable(TESTER_MODE, reviewStatus)
    ? { rules: { userAgent: '*', allow: '/' } }
    : { rules: { userAgent: '*', disallow: '/' } };
}
