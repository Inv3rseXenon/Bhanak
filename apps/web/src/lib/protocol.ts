import type { Protocol } from '@bhanak/triage-engine';
import dengueProtocol from '@bhanak/protocols/dengue/v0.1.0.json';

/**
 * The bundled protocol. It is validated in Node at build time (scripts/verify-protocol.mjs) and in
 * test/protocol.test.ts, so the browser bundle does not need to ship the schema library.
 */
export const protocol = dengueProtocol as unknown as Protocol;
