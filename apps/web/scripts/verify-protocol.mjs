#!/usr/bin/env node
/**
 * Build-time release gate for the web app (spec 5.5, CLAUDE.md "Release gates").
 *
 *  1. TESTER_MODE must be exactly "true" or "false" when set (a typo must not silently ship
 *     a build without the test banner).
 *  2. The bundled protocol and its strings (en, hi, mr) must pass full validation.
 *  3. A protocol that is not REVIEWED is refused unless ALLOW_DRAFT_PROTOCOL=true AND APP_ENV is
 *     development, staging or test (allowDraftFromEnv throws otherwise).
 *  4. A production build (APP_ENV=production) can never be a tester build.
 *
 * This runs in Node, so the web bundle does not need to ship zod.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  allowDraftFromEnv,
  assertProtocolServable,
  checkStrings,
  ENGINE_I18N_KEYS,
  parseProtocol,
  parseStrings,
} from '@bhanak/protocols';

const require = createRequire(import.meta.url);
const dengueDir = dirname(require.resolve('@bhanak/protocols/dengue/v0.1.0.json'));
const read = (name) => JSON.parse(readFileSync(join(dengueDir, name), 'utf8'));

function fail(message) {
  console.error(`verify-protocol: ${message}`);
  process.exit(1);
}

const { TESTER_MODE, APP_ENV } = process.env;
if (TESTER_MODE !== undefined && TESTER_MODE !== '' && !['true', 'false'].includes(TESTER_MODE)) {
  fail(`TESTER_MODE must be "true" or "false", got "${TESTER_MODE}"`);
}
if (TESTER_MODE === 'true' && APP_ENV === 'production') {
  fail('TESTER_MODE=true cannot be combined with APP_ENV=production');
}

try {
  const protocol = parseProtocol(read('v0.1.0.json'));
  for (const locale of ['en', 'hi', 'mr']) {
    const strings = parseStrings(read(`v0.1.0.strings.${locale}.json`));
    const issues = checkStrings(protocol, strings, ENGINE_I18N_KEYS);
    if (issues.length > 0) fail(`strings (${locale}): ${issues.join('; ')}`);
  }
  assertProtocolServable(protocol, { allowDraft: allowDraftFromEnv(process.env) });
  console.log(
    `verify-protocol OK: ${protocol.id} ${protocol.version} (${protocol.reviewStatus}), ` +
      `TESTER_MODE=${TESTER_MODE === 'true' ? 'on' : 'off'}`,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
