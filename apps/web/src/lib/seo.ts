import { protocol } from './protocol';

/**
 * Search engines may index the site only when it is a real release: not a tester build, and the
 * protocol has been reviewed by a named doctor. Everything else is noindex and Disallow: /.
 */
export function isIndexable(testerMode: boolean, reviewStatus: string): boolean {
  return !testerMode && reviewStatus === 'REVIEWED';
}

export const reviewStatus = protocol.reviewStatus;
