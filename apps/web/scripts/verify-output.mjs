#!/usr/bin/env node
/**
 * Post-build checks on the exported site in out/ (private tester release).
 *
 *  - Every HTML page carries the persistent banner when TESTER_MODE=true, and a noindex tag
 *    whenever the build is a tester build or the protocol is not reviewed.
 *  - robots.txt disallows everything in those cases.
 *  - _headers (noindex header, CSP) is present.
 *  - No analytics, tracking or cookie code is in the shipped files.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const tester = process.env.TESTER_MODE === 'true';
const BANNER = 'TEST VERSION, NOT MEDICALLY REVIEWED. Not for real medical decisions.';

const problems = [];
const fail = (message) => problems.push(message);

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else yield full;
  }
}

if (!existsSync(out)) {
  console.error('verify-output: out/ does not exist (did `next build` run?)');
  process.exit(1);
}

const all = [...files(out)];
const html = all.filter((file) => file.endsWith('.html'));
if (html.length < 3) fail(`expected at least 3 HTML pages, found ${String(html.length)}`);

for (const file of html) {
  const name = relative(out, file);
  const text = readFileSync(file, 'utf8');
  if (!/<meta name="robots" content="noindex/.test(text)) fail(`${name}: no noindex meta tag`);
  if (tester && !text.includes(BANNER)) fail(`${name}: tester banner missing`);
}

const robots = existsSync(join(out, 'robots.txt'))
  ? readFileSync(join(out, 'robots.txt'), 'utf8')
  : '';
if (!/^Disallow: \/\s*$/m.test(robots)) fail('robots.txt must contain "Disallow: /"');
if (/^Allow:/m.test(robots)) fail('robots.txt must not allow anything');

const headers = existsSync(join(out, '_headers'))
  ? readFileSync(join(out, '_headers'), 'utf8')
  : '';
if (!/X-Robots-Tag: noindex/.test(headers)) fail('_headers: X-Robots-Tag noindex missing');
if (!/connect-src 'self'/.test(headers)) fail("_headers: CSP connect-src 'self' missing");

const forbidden =
  /googletagmanager|google-analytics|gtag\(|plausible\.io|mixpanel|hotjar|posthog|sentry\.io|fbevents|navigator\.sendBeacon|document\.cookie/;
for (const file of all.filter((f) => /\.(js|html|css|txt)$/.test(f))) {
  const match = forbidden.exec(readFileSync(file, 'utf8'));
  if (match !== null) fail(`${relative(out, file)}: contains "${match[0]}"`);
}

if (problems.length > 0) {
  console.error('verify-output: FAILED');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(
  `verify-output OK: ${String(html.length)} pages, ${String(all.length)} files, noindex everywhere` +
    (tester ? ', tester banner on every page' : ''),
);
if ((process.env.FEEDBACK_URL ?? '') === '') {
  console.warn(
    'verify-output: WARNING: FEEDBACK_URL is not set, so "Send feedback" points at a placeholder form.',
  );
}
