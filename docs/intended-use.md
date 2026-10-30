# Intended-use statement

> Draft for review by a healthcare regulatory lawyer. Not legal advice. See [regulatory-notes.md](regulatory-notes.md).

## Statement

Bhanak provides **triage guidance and health information**. It helps a person, or someone caring for them, decide how urgently to seek medical care when they have fever and related symptoms, what warning signs to watch for, and how to keep track of symptoms, test results and medicines prescribed by their own doctor.

Bhanak is **not for diagnosis or treatment**. It does not diagnose any disease, does not prescribe, and does not recommend medicines or doses. It does not replace a doctor. In an emergency the user is told to call 108 or 112.

## Who it is for

Adults managing their own health, parents and guardians acting for children, caregivers of older adults. Accounts are for adults (18+); minors and elders are dependent profiles managed by a guardian.

## What it does

- Asks structured questions and returns one of four urgency levels (`EMERGENCY_NOW`, `SEE_DOCTOR_TODAY`, `TEST_AND_MONITOR`, `HOME_CARE_WITH_TRIGGERS`) using a deterministic rules engine whose thresholds come from cited public clinical guidance and are signed off by a licensed doctor.
- Always shows warning signs and "go immediately if" triggers.
- Stores a diary, user-entered lab values and a user-entered medicine schedule; sends reminders for medicines the user's doctor prescribed.

## What it does not do

- Does not tell a user which disease they have, or that they do not have one.
- Does not interpret a lab value as a disease. It compares user-entered values with reviewed thresholds to decide urgency of seeking care.
- Does not recommend, start, stop or change any medicine or dose. Missed-dose guidance is "ask your doctor or pharmacist".
- An AI language model is never used to decide urgency. If used at all (optional, consent-gated, off by default), it only helps turn free text into answers the user then confirms.

## Regulatory reference

India's CDSCO guidance on medical device software, issued in 2026: **[CITATION NEEDED]**. The exact title, number and date must be verified on cdsco.gov.in before this statement cites it (tracked as C-001 in [TODO.md](TODO.md)). This document must not name the document until verified.

## Wording constraints that keep this statement true

User-facing copy, store listings and notifications must not claim to diagnose, detect, or cure, must not say "AI doctor" or "guaranteed", and must not tell a user "you are fine". A CI check enforces this (G-002).
