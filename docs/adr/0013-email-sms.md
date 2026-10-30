# ADR 0013: Email and SMS — AWS SES (Mumbai) and MSG91

Status: Accepted · 2026-10-30 (spec sections 3, 8.1)

## Context

OTP and password-reset delivery need to be reliable in India. SMS in India requires DLT (Distributed Ledger Technology) registration of senders and templates.

## Decision

AWS SES in ap-south-1 for email. MSG91 for OTP and fallback SMS with DLT-registered templates. Message bodies carry no health data; OTP messages contain only the code and purpose.

## Alternatives rejected

- **Twilio or other international SMS gateways**: DLT compliance and deliverability to Indian numbers are harder.
- **SendGrid/Mailgun for email**: additional vendor and data location when SES already sits in the same account and region.
- **OTP via WhatsApp only**: not universal; template approval adds delay.

## Consequences

DLT sender and template registration has real lead time and must be started well before the first SMS is needed (M3); founder action needed with the legal entity details (F-001).
