import type { Protocol } from '@bhanak/triage-engine';

/** Environments in which an unreviewed protocol may be served (spec 5.5). */
const DRAFT_ALLOWED_ENVS = ['development', 'staging', 'test'] as const;

export class ProtocolGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolGateError';
  }
}

/**
 * Whether ALLOW_DRAFT_PROTOCOL is set AND permitted. Setting it in production is a
 * misconfiguration and throws, so a production deploy can never serve an unreviewed protocol
 * by accident. `APP_ENV` must name the environment explicitly.
 */
export function allowDraftFromEnv(env: Record<string, string | undefined>): boolean {
  if (env.ALLOW_DRAFT_PROTOCOL !== 'true') return false;
  const appEnv = env.APP_ENV ?? '';
  if (!(DRAFT_ALLOWED_ENVS as readonly string[]).includes(appEnv)) {
    throw new ProtocolGateError(
      `ALLOW_DRAFT_PROTOCOL=true is only allowed in ${DRAFT_ALLOWED_ENVS.join(', ')} (APP_ENV is "${appEnv}")`,
    );
  }
  return true;
}

/**
 * Release gate (spec 5.5): refuse to serve a protocol whose reviewStatus is not REVIEWED unless
 * drafts are explicitly allowed (dev/staging only).
 */
export function assertProtocolServable(protocol: Protocol, options: { allowDraft: boolean }): void {
  if (protocol.reviewStatus !== 'REVIEWED' && !options.allowDraft) {
    throw new ProtocolGateError(
      `Refusing to serve ${protocol.id} ${protocol.version}: reviewStatus is ${protocol.reviewStatus}, not REVIEWED`,
    );
  }
}

/** Results from a draft protocol must show this banner (spec 5.5). */
export const DRAFT_BANNER_TEXT = 'TEST VERSION, NOT MEDICALLY REVIEWED';
export const showsDraftBanner = (protocol: Protocol): boolean =>
  protocol.reviewStatus !== 'REVIEWED';
