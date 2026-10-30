# Regulatory notes

**This position must be confirmed by a healthcare regulatory lawyer before any public launch.** Nothing in this repository is legal advice, and no regulatory conclusion has been reached.

## Working position

Bhanak is positioned as triage guidance and health information, not as a medical device that diagnoses or treats (see [intended-use.md](intended-use.md)). Whether that position holds under India's CDSCO guidance on medical-device software (2026) is **unverified**: the document's title and number have not yet been located ([CITATION NEEDED], TODO C-001).

## Features that could change the classification

If any of these are added or worded differently, re-run the regulatory review before shipping:

1. Any diagnostic claim or disease-naming output ("you have dengue", "likely dengue", "no dengue").
2. Lab interpretation that states a disease, rather than comparing a value with a reviewed urgency threshold.
3. Any dose, drug choice, or "take / stop taking" recommendation, including missed-dose catch-up advice.
4. Letting an LLM influence urgency, explanations of conditions, or medicine advice.
5. Automated alerts that act on a clinical result without the user (for example, notifying a caregiver that a patient "has" a condition rather than that urgency changed).
6. Monitoring that supplies clinical decision support to clinicians, or integration with hospital records, wearables or devices.
7. Marketing claims about accuracy, sensitivity, outcomes or lives saved without substantiation.
8. Paid or partner placement of any kind that can influence urgency (spec section 18 forbids it).

## Other legal reviews required before launch

Tracked in `docs/launch-readiness.md` (written after M11):

- DPDP Act 2023 compliance, including parental consent for dependents and breach-notification process.
- Cross-border processing for the optional LLM free-text feature (symptom text leaves India; separate explicit consent; privacy-lawyer sign-off).
- Terms, privacy policy and medical disclaimer (drafts in en/hi/mr for lawyer review).
- Google Play "Health apps" declaration and Apple medical-app guidance.
