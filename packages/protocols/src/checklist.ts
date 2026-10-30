import type { Protocol } from '@bhanak/triage-engine';
import { reviewItems } from './integrity.js';

export const CHECKLIST_BEGIN =
  '<!-- BEGIN GENERATED: do not edit by hand; run `pnpm --filter @bhanak/protocols generate` -->';
export const CHECKLIST_END = '<!-- END GENERATED -->';

const cell = (text: string): string => text.replaceAll('|', '/').replaceAll('\n', ' ').trim();

/** Markdown block listing every open review item of a protocol, generated from the data. */
export function renderChecklist(protocol: Protocol): string {
  const items = reviewItems(protocol);
  const open = items.filter((item) => item.open);
  const lines = [
    CHECKLIST_BEGIN,
    '',
    `Protocol \`${protocol.id}\` v${protocol.version}: status **${protocol.reviewStatus}**. ${open.length} of ${items.length} items are open.`,
    '',
    '**Basis**: SOURCE = stated in a cited guideline (section given); SPEC_PROVISIONAL = a placeholder number or choice from the build spec that the sources do not state; SAFETY_DEFAULT = an engineering choice that errs on the side of caution.',
    '',
    '| ID | Kind | Basis | Cited sources | Reviewer note |',
    '| --- | --- | --- | --- | --- |',
    ...open.map(
      (item) =>
        `| ${item.id} | ${item.kind} | ${item.basis} | ${cell(item.sources.join('; ') || 'none')} | ${cell(item.note || '')} |`,
    ),
    '',
    CHECKLIST_END,
  ];
  return lines.join('\n');
}
