# ADR 0010: Encryption — KMS envelope with field-level AES-256-GCM

Status: Accepted · 2026-10-30 (spec sections 3, 9, 16)

## Context

A database leak alone must not expose health data, and deleting an account must make its data unrecoverable even while backups age out.

## Decision

Per-user data keys (DEK) generated per user and wrapped by an AWS KMS customer-managed key (CMK) in ap-south-1. Sensitive columns (marked `[ENC]` in the data model) are encrypted in the application with AES-256-GCM using the user's DEK. TLS 1.2+ everywhere; RDS, S3 and backups encrypted at rest. Account deletion hard-deletes rows and **crypto-shreds** by destroying the user's wrapped DEK. A key-rotation runbook is required (M9).

## Alternatives rejected

- **Disk/RDS encryption only**: protects stolen disks, not a leaked database dump or a compromised application credential.
- **A single global data key**: no per-user crypto-shredding; larger blast radius.
- **Database-side pgcrypto**: keys would transit or live near the data.
- **Client-side end-to-end encryption**: would block server-side reminders, caregiver features and the audit copy of triage.

## Consequences

Encrypted columns cannot be queried by value; design lookups on non-sensitive columns. Key-management failures become availability incidents and need alerts.
