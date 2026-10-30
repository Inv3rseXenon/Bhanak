# ADR 0016: Payments — Razorpay and RevenueCat scaffolds, off by default

Status: Accepted · 2026-10-30 (spec sections 3, 18)

## Context

V1 does not charge. We still want plumbing in place so a family plan can be added later without touching clinical code. App stores require their own billing for in-app digital subscriptions, and UPI is how India pays on the web.

## Decision

Entitlements table, plan definitions, feature flags and paywall components behind a flag. Razorpay (web, UPI AutoPay) and RevenueCat (Play Billing/StoreKit) sit behind one `BillingProvider` interface. Nothing is charged in V1. A unit test asserts that **no entitlement or flag can alter triage output**. Free forever: triage, emergency screen, warning signs, one diary, a limited number of medicines (`[N]` to be decided, F-006).

## Alternatives rejected

- **Stripe**: weaker UPI AutoPay support for Indian consumers.
- **Own store-billing integration**: RevenueCat removes receipt-validation and entitlement-sync work.
- **Ads or data monetisation**: forbidden by the privacy principles.

## Consequences

Built in M11. Emergency guidance is never behind a paywall (spec 2.9).
