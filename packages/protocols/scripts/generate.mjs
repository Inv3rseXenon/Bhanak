#!/usr/bin/env node
/**
 * Regenerates files derived from the protocol data. Run after editing a protocol or the schema:
 *
 *   pnpm --filter @bhanak/protocols generate
 *
 * - schema/protocol.schema.json            JSON Schema for protocol files (from the zod schema)
 * - docs/clinical-review-checklist.md      the generated block listing every open review item
 *
 * Tests fail if either file is out of date.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  CHECKLIST_BEGIN,
  CHECKLIST_END,
  parseProtocol,
  protocolJsonSchema,
  renderChecklist,
} from '../dist/index.js';

const here = (path) => new URL(path, import.meta.url);

const protocol = parseProtocol(JSON.parse(readFileSync(here('../dengue/v0.1.0.json'), 'utf8')));

writeFileSync(
  here('../schema/protocol.schema.json'),
  `${JSON.stringify(protocolJsonSchema(), null, 2)}\n`,
);

const docPath = here('../../../docs/clinical-review-checklist.md');
const doc = readFileSync(docPath, 'utf8');
const start = doc.indexOf(CHECKLIST_BEGIN);
const end = doc.indexOf(CHECKLIST_END);
if (start === -1 || end === -1 || end < start) {
  throw new Error('docs/clinical-review-checklist.md is missing the generated-block markers');
}
const updated =
  doc.slice(0, start) + renderChecklist(protocol) + doc.slice(end + CHECKLIST_END.length);
writeFileSync(docPath, updated);
console.log('regenerated schema/protocol.schema.json and docs/clinical-review-checklist.md');
