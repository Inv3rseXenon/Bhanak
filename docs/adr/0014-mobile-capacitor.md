# ADR 0014: Mobile — Capacitor around the web build

Status: Accepted · 2026-10-30 (spec sections 3, 15)

## Context

One founder needs web, PWA, Android and iOS from one codebase, with native code only where the web platform is unreliable: background alarms, exact alarms and secure token storage.

## Decision

Capacitor wraps the same static web build. Native plugins: local notifications, push, secure storage (Keychain/Keystore), share, deep links, status bar/splash, optional biometric app lock, haptics. Because the WebView origin is not same-site with the API, native clients receive the refresh token in the response body and store it only in secure storage (ADR 0009).

## Alternatives rejected

- **React Native / Flutter**: second UI codebase and a rewrite of the static web UI.
- **PWA only**: cannot give reliable medicine alarms on iOS or aggressive Android OEMs.
- **Two native apps**: far beyond a solo maintainer's capacity.

## Consequences

Store compliance work (Play Health apps declaration, Data safety, Apple medical-app guidance, in-app account deletion) lands in M10. No third-party social login, so Sign in with Apple is not required (documented for the store checklist).
