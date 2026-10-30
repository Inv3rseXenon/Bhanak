# ADR 0015: Infrastructure — AWS ap-south-1 with Terraform

Status: Accepted · 2026-10-30 (spec sections 3, 16, 23)

## Context

In-region hosting for a data-residency posture, auditable security controls, and a setup that scales from tiny to large and is reproducible by one person.

## Decision

AWS in ap-south-1 (Mumbai), defined in Terraform with dev, staging and prod environments: CloudFront + S3 (web), ECS Fargate (api, worker), RDS Postgres, ElastiCache Redis, KMS, Secrets Manager, SES, WAF, CloudWatch, GuardDuty. Web and API share a registrable domain (`app.<domain>`, `api.<domain>`) so SameSite cookies work. Terraform plan on pull requests; apply on merge with approval; prod needs manual approval and blocks draft protocols.

## Alternatives rejected

- **Vercel/Netlify + a managed BaaS**: fast start, but data location, WAF and key-management control are weaker.
- **A single VM with Docker Compose**: cheap, but no managed backups/PITR or failover, and manual hardening.
- **Kubernetes (EKS)**: operational overhead not justified for a solo maintainer.
- **Pulumi/CDK**: reasonable; Terraform chosen for ubiquity and plan-review workflow.

## Consequences

Infrastructure starts in M3 and is hardened in M9 (backups and restore drill, WAF rules, alerts). Until then there is no deployed environment.
