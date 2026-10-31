import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertProtocolServable, parseProtocol } from '@bhanak/protocols';
import { protocol } from '../src/lib/protocol';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(webRoot, 'scripts', 'verify-protocol.mjs');

/** Run the build-time gate with a clean environment containing only what the test sets. */
function gate(env: Record<string, string>): { status: number | null; output: string } {
  const run = spawnSync(process.execPath, [script], {
    cwd: webRoot,
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

describe('bundled protocol', () => {
  it('is the validated dengue protocol, and is still a DRAFT', () => {
    const raw = JSON.parse(
      readFileSync(
        join(webRoot, '..', '..', 'packages', 'protocols', 'dengue', 'v0.1.0.json'),
        'utf8',
      ),
    ) as unknown;
    expect(() => parseProtocol(raw)).not.toThrow();
    expect(protocol.reviewStatus).toBe('DRAFT');
    expect(protocol.version).toBe('0.1.0');
  });

  it('is refused by the release gate unless drafts are allowed', () => {
    expect(() => {
      assertProtocolServable(protocol, { allowDraft: false });
    }).toThrow(/not REVIEWED/);
    expect(() => {
      assertProtocolServable(protocol, { allowDraft: true });
    }).not.toThrow();
  });
});

describe('web build release gate (scripts/verify-protocol.mjs)', () => {
  it('refuses to build with an unreviewed protocol when nothing allows drafts', () => {
    const result = gate({});
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/not REVIEWED/);
  });

  it('refuses a production build even when drafts are requested', () => {
    const result = gate({ APP_ENV: 'production', ALLOW_DRAFT_PROTOCOL: 'true' });
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/only allowed in/);
  });

  it('refuses a build with no APP_ENV even when drafts are requested', () => {
    expect(gate({ ALLOW_DRAFT_PROTOCOL: 'true' }).status).toBe(1);
  });

  it('allows a staging or test build with drafts allowed', () => {
    for (const appEnv of ['staging', 'test', 'development']) {
      const result = gate({ APP_ENV: appEnv, ALLOW_DRAFT_PROTOCOL: 'true' });
      expect(result.status, `${appEnv}: ${result.output}`).toBe(0);
      expect(result.output).toContain('verify-protocol OK');
    }
  });

  it('reports whether TESTER_MODE is on', () => {
    const on = gate({ APP_ENV: 'staging', ALLOW_DRAFT_PROTOCOL: 'true', TESTER_MODE: 'true' });
    expect(on.status).toBe(0);
    expect(on.output).toContain('TESTER_MODE=on');
  });

  it('rejects a mistyped TESTER_MODE instead of silently building without the banner', () => {
    for (const bad of ['TRUE', '1', 'yes', 'on']) {
      const result = gate({ APP_ENV: 'staging', ALLOW_DRAFT_PROTOCOL: 'true', TESTER_MODE: bad });
      expect(result.status, bad).toBe(1);
      expect(result.output).toMatch(/TESTER_MODE must be/);
    }
  });

  it('never lets a tester build be a production build', () => {
    const result = gate({ APP_ENV: 'production', TESTER_MODE: 'true' });
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/cannot be combined with APP_ENV=production/);
  });
});
