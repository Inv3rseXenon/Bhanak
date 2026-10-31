import type { TriageResult } from '@bhanak/triage-engine';
import type { DisplayModel } from './display';

/**
 * Plain-text summary a person can paste into a message to their doctor. Built only from the
 * result (no answers are included), and only ever sent where the person chooses to send it.
 */
export function buildSummaryText(
  t: (key: string) => string,
  result: TriageResult,
  display: DisplayModel,
  date: string,
): string {
  const lines = [
    t('summary.heading'),
    `${t('summary.date')}: ${date}`,
    `${t('summary.result')}: ${t(`level.${display.level}`)}`,
    t(display.headlineKey),
  ];
  if (result.reasons.length > 0) {
    lines.push('', `${t('summary.reasons')}:`);
    for (const reason of result.reasons) lines.push(`- ${t(reason.i18nKey)}`);
  }
  lines.push('', t('summary.footer'));
  return lines.join('\n');
}
