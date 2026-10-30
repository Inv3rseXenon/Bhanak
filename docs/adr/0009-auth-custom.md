# ADR 0009: Authentication — custom, standards-based

Status: Accepted · 2026-10-30 (spec section 8)

## Context

Requirements: anonymous-first triage (no account ever blocks an emergency instruction), device sessions, refresh-token rotation with reuse detection, role-based 2FA, enumeration resistance, no foreign processing of credentials, and no vendor lock-in.

## Decision

Custom implementation on vetted libraries:

- **Passwords**: Argon2id (node-argon2; 64 MiB, 3 iterations, parallelism 1, tuned to ~250-500 ms), per-password random salt inside the PHC string, plus a server-side HMAC-SHA256 pepper from Secrets Manager with a stored `pepper_version`. Transparent rehash on login. Policy: 10-128 chars, zxcvbn ≥ 3, HIBP k-anonymity (fail open), NFKC normalisation.
- **Access tokens**: JWT signed EdDSA (Ed25519) with `jose`, 10-minute lifetime, algorithm allowlist, `kid` rotation, `sid` revocation list in Redis. No PII or health data in tokens. Held in memory on web.
- **Refresh tokens**: opaque 256-bit, only the SHA-256 stored, rotated on every use, family revoked on reuse. Web: httpOnly `__Host-` cookie with SameSite=Strict, custom header and Origin check. Native: body delivery, stored only in Keychain/Keystore.
- **OTP**: 6-digit CSPRNG, HMAC-stored, 10-minute expiry, attempt and send limits. **TOTP** (otplib) mandatory for REVIEWER and ADMIN.

## Alternatives rejected

- **Auth0 / Cognito / Firebase Auth**: faster to start, but credential processing and session semantics are outside our control and may sit outside India; reuse-detecting rotation and anonymous-first flows are awkward to fit.
- **bcrypt**: not memory-hard; 72-byte truncation.
- **Session cookies only**: do not suit the Capacitor WebView (not same-site with the API).
- **JWT refresh tokens**: cannot be individually revoked or reuse-detected without state anyway.

## Consequences

Highest-risk code in the project: delivered in M3 with the test matrix from spec section 22 (alg confusion, expiry, audience, revoked sid, rotation/reuse, OTP limits, enumeration timing, IDOR). Consider an external review before launch.
