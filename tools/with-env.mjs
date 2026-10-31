#!/usr/bin/env node
/**
 * Run a command with extra environment variables, on any OS (no cross-env dependency).
 *
 *   node tools/with-env.mjs APP_ENV=test ALLOW_DRAFT_PROTOCOL=true -- turbo run build
 *
 * Used by the root `build` (drafts allowed, APP_ENV=test) and `build:tester` scripts, so the
 * release gate in apps/web/scripts/verify-protocol.mjs sees explicit, reviewable settings.
 * `pnpm build:release` sets nothing, and therefore fails while the protocol is a DRAFT.
 */
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const split = args.indexOf('--');
if (split < 1 || split === args.length - 1) {
  console.error('usage: node tools/with-env.mjs KEY=value [KEY=value ...] -- command [args]');
  process.exit(2);
}

const env = { ...process.env };
for (const pair of args.slice(0, split)) {
  const equals = pair.indexOf('=');
  if (equals < 1) {
    console.error(`not a KEY=value pair: ${pair}`);
    process.exit(2);
  }
  env[pair.slice(0, equals)] = pair.slice(equals + 1);
}

const [command, ...rest] = args.slice(split + 1);
const result = spawnSync(command, rest, { stdio: 'inherit', env, shell: true });
process.exit(result.status ?? 1);
