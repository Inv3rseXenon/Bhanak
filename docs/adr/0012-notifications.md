# ADR 0012: Notifications — on-device first, server push as backup

Status: Accepted · 2026-10-30 (spec sections 3, 12)

## Context

A medicine alarm must fire even when the phone is offline. Caregiver alerts and cross-device reminders need a server path. Lock-screen text can leak health information.

## Decision

1. **On-device local notifications** (Capacitor Local Notifications) are the primary mechanism on native apps, including the Android exact-alarm permission flow, battery-optimisation guidance for aggressive OEMs, and a rolling window to respect iOS's 64 pending-notification limit.
2. **Server push** as backup: FCM (Android, and iOS via APNs) and Web Push (VAPID), scheduled by BullMQ.
3. **Optional SMS/WhatsApp fallback** (MSG91, DLT-registered templates) for medicines the user flags critical.
4. Escalation: notify at due time, repeat at +10 min, mark MISSED at +30 min and (with consent) notify the caregiver. Actions: Taken / Snooze 10 min / Skip.
5. Default lock-screen text is generic ("Time for your medicine"); medicine names only on opt-in.

## Alternatives rejected

- **Server push only**: fails offline and under OEM background restrictions.
- **Web Push only**: unreliable on iOS PWAs; the UI states this honestly rather than promising reliability.
- **A third-party notification platform**: extra data processor with access to schedules.

## Consequences

Native reliability work lands in M10; before that, the PWA shows an honest reliability banner (M6).
