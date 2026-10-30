#!/usr/bin/env node
/**
 * Fails if the brand name is hard-coded anywhere in source (spec section 1:
 * "No hard-coded brand strings anywhere else" than packages/shared/src/brand.ts).
 *
 * Scans code/data files under apps/* and packages/*. Docs and READMEs are exempt.
 * Package scope imports such as "@bhanak/shared" are not brand strings and are ignored.
 * Translations must use interpolation ({{brandName}}) instead of the literal name.
 *
 * Usage: node tools/check-brand.mjs [--strict]
 *   --strict  additionally fail while brand.ts still contains [PLACEHOLDER...] values
 *             (use in the public-launch release gate, not in day-to-day CI).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_ROOTS = ['apps', 'packages'];
const EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.css',
]);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', 'out', '.turbo']);
const SKIP_BASENAMES = new Set(['package.json', 'tsconfig.json', 'tsconfig.build.json']);
/** Files that may contain the brand name (posix-style paths relative to the repo root). */
const ALLOWED_FILES = new Set([
  'packages/shared/src/brand.ts',
  'packages/shared/test/brand.test.ts',
]);

const PATTERN = /bhanak/i;
const SCOPE = /@bhanak\//gi;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // directory does not exist yet (apps/* arrive in later milestones)
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const violations = [];
for (const scanRoot of SCAN_ROOTS) {
  for (const file of walk(join(root, scanRoot))) {
    const rel = relative(root, file).split(sep).join('/');
    const base = rel.slice(rel.lastIndexOf('/') + 1);
    const ext = base.includes('.') ? base.slice(base.lastIndexOf('.')) : '';
    if (!EXTENSIONS.has(ext) || SKIP_BASENAMES.has(base) || ALLOWED_FILES.has(rel)) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (PATTERN.test(line.replace(SCOPE, ''))) violations.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
}

let failed = false;
if (violations.length > 0) {
  failed = true;
  console.error(
    'Hard-coded brand string found. Read it from packages/shared/src/brand.ts instead:',
  );
  for (const v of violations) console.error(`  ${v}`);
}

if (process.argv.includes('--strict')) {
  const brandSource = readFileSync(join(root, 'packages/shared/src/brand.ts'), 'utf8');
  const unresolved = [...brandSource.matchAll(/'(\[PLACEHOLDER:[^']*)'/g)].map((m) => m[1]);
  if (unresolved.length > 0) {
    failed = true;
    console.error('brand.ts still has unresolved placeholders (strict mode):');
    for (const u of unresolved) console.error(`  ${u}`);
  }
}

if (failed) process.exit(1);
console.log('check:brand OK');
