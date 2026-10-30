# Clinical review checklist (TODO_DOCTOR_REVIEW)

Every clinical threshold, question, warning sign, message and translation marked `TODO_DOCTOR_REVIEW` anywhere in the repo is listed here, with the source it traces to. **A protocol cannot become `REVIEWED` while any row is open** (enforced by `checkProtocolIntegrity`).

Reviewer: **[PLACEHOLDER: name, registration number]** (TODO F-003)

The table below is **generated** from `packages/protocols/dengue/v0.1.0.json`. Do not edit it by hand: change the protocol (or have the doctor change it), then run `pnpm --filter @bhanak/protocols generate`. A test fails if this file is out of date.

## Decisions the reviewing doctor must make first

These are the places where the sources do not give the number or the rule, or where the spec and the sources differ. Details are in the generated table's notes.

1. **Platelet cut-offs (50,000 and 100,000).** The three source documents do not give a "go to hospital now" or "see a doctor today" platelet number. They are the build spec's placeholders. WHO 2009 section 4.3.5 only says counts below 100,000 may be seen in dengue; NCVBDC 2023 chapter 13 uses 50,000 as a discharge criterion; NCVBDC section 7.3 Box 8 uses under 10,000 for prophylactic transfusion.
2. **"Rapid fall" of platelets has no number anywhere.** The rule `EM_PLATELET_RAPID_FALL` is inert (never fires) until a value is set for `plateletRapidFallFraction`. The protocol cannot be REVIEWED while that value is empty.
3. **Persistent vomiting.** The spec's provisional "3 episodes in 24 hours" is more sensitive than the CDC pocket guide (3 episodes in 1 hour, or 4 in 6 hours). NCVBDC 2023 gives no number.
4. **Hours without urine.** The spec and WHO 2009 section 2.3.2.1 support 6 hours ("not passing urine for more than 4-6 hours"). NCVBDC 2023 section 10.2 says 12 hours. The question is fixed at 6 hours.
5. **Risk-factor step-up.** Spec 5.4 says "raise by one step". Taken literally with 5.3 it would make a person with a risk factor and no danger sign an emergency by day 3. The protocol caps the step-up at SEE_DOCTOR_TODAY so that only danger signs reach EMERGENCY_NOW. Confirm.
6. **Reduced fetal movement with fever** is set to EMERGENCY_NOW (the spec names the sign but gives no level).
7. **Danger sign without any fever** is set to SEE_DOCTOR_TODAY (the spec is silent; home care requires no matching symptoms).
8. **UNKNOWN answers.** An unsure answer about drinking, bleeding, drowsiness or confusion is treated as an emergency (spec 5.1 list); an unsure answer about other danger signs raises the result to SEE_DOCTOR_TODAY. A stated YES is not the same as UNKNOWN: spec section 22 says "changing any answer to UNKNOWN never lowers the level", which cannot hold for a YES on a danger sign under the spec 5.1 cap. The tests check the safe-answer-to-UNKNOWN direction and that an UNKNOWN never drops below SEE_DOCTOR_TODAY. Confirm this reading.
9. **Hematocrit rise.** NCVBDC 2023 section 7.3: a rise of 10% above baseline is an early indicator of plasma leakage. Implemented as a 10% rise relative to the previous reading. Confirm relative vs absolute and what counts as the baseline.
10. **ALT/AST of 1000.** NCVBDC section 4.4 prints a comparison symbol that did not extract; implemented as "1000 or more".
11. **Age cut-offs.** Spec: under 5 and 65 or over. NCVBDC Box 5: under 10 with malnutrition, and over 65.
12. **Extra risk factor.** Peptic ulcer disease is added because all three sources name it (not in the spec's list).
13. **CDC pocket guide publisher.** The text does not name its publisher; confirm it before citing it as a CDC document.

## Other standing items

- The NSAID/aspirin "check with your doctor or pharmacist" prompt wording (spec 2.8): `dengue.action.check_painkillers`.
- Missed-dose wording (spec 12): not yet written (M6).
- The fail-safe screen text (spec 2.3): not yet written (M2).
- All Hindi and Marathi clinical strings: `needs_review` until a native-speaking doctor approves them (M2).
- Calibration: over-triage teaches people to ignore the app. The doctor calibrates thresholds using the level distribution (M9); the code never relaxes a rule automatically.

## Generated list of open items

<!-- BEGIN GENERATED: do not edit by hand; run `pnpm --filter @bhanak/protocols generate` -->

Protocol `dengue` v0.1.0: status **DRAFT**. 79 of 79 items are open.

**Basis**: SOURCE = stated in a cited guideline (section given); SPEC_PROVISIONAL = a placeholder number or choice from the build spec that the sources do not state; SAFETY_DEFAULT = an engineering choice that errs on the side of caution.

| ID | Kind | Basis | Cited sources | Reviewer note |
| --- | --- | --- | --- | --- |
| recentFeverDays | threshold | SPEC_PROVISIONAL | WHO2009 2.1.1 | Value 7 days. Spec 5.3 says "fever (current or within 7 days)". Compared with whole days since the onset date. |
| criticalPhaseStartDay | threshold | SOURCE | WHO2009 2.1.2; NCVBDC2023 5.1; NCVBDC2023 4.1 | Value 3 illness day. |
| criticalPhaseEndDay | threshold | SOURCE | WHO2009 2.1.2; NCVBDC2023 5.1 | Value 7 illness day. |
| vomitingEpisodes24h | threshold | SPEC_PROVISIONAL | CDC_POCKET p.1 Warning signs; NCVBDC2023 4.1 Box 2 | Value 3 episodes in 24 h. Spec 5.3 gives N=3 per 24 h as a placeholder. The pocket guide defines it differently (3 in 1 hour or 4 in 6 hours). Doctor must choose; the spec value is the more sensitive one. |
| plateletEmergency | threshold | SPEC_PROVISIONAL | NCVBDC2023 13; WHO2009 4.3.5 | Value 50000 per cubic mm. NOT found in the sources as a "go to hospital now" cut-off. Doctor to confirm or replace. |
| plateletSeeDoctor | threshold | SPEC_PROVISIONAL | WHO2009 4.3.5; NCVBDC2023 8.1.3 (b) | Value 100000 per cubic mm. NOT found in the sources as a "see a doctor today" cut-off. Doctor to confirm or replace. |
| plateletRapidFallFraction | threshold | SPEC_PROVISIONAL | NCVBDC2023 4.1 Box 2; WHO2009 Textbox C | UNSET: a doctor must decide a value. UNSET ON PURPOSE: the sources say "rapid" without a number and the spec gives none. The rule that uses it is inert until a doctor supplies a value, and the protocol cannot be REVIEWED while it is null. |
| hematocritRiseFraction | threshold | SOURCE | NCVBDC2023 7.3; WHO2009 4.3.5 | Value 0.1 fraction of previous reading. Treated as a relative rise versus the previous reading. Doctor to confirm relative vs absolute and the baseline definition. |
| transaminaseSevere | threshold | SOURCE | NCVBDC2023 4.4; CDC_POCKET p.1 Group C | Value 1000 units per litre. Doctor to confirm greater-than vs greater-or-equal. |
| infantAgeMonths | threshold | SPEC_PROVISIONAL | NCVBDC2023 8.1.2; WHO2009 Textbox E | Value 12 months. Spec 5.3: infant under 12 months with any fever. |
| childAgeMonths | threshold | SPEC_PROVISIONAL | NCVBDC2023 Box 5; WHO2009 Textbox E | Value 60 months. Spec 5.3 uses age under 5 years. The NCVBDC high-risk list says under 10 years with malnutrition. Doctor to decide. |
| elderAgeMonths | threshold | SOURCE | NCVBDC2023 Box 5; WHO2009 Textbox E; CDC_POCKET p.6 | Value 780 months (65 years). Spec says age 65 or older; sources say over 65. Doctor to confirm. |
| riskFeverDays | threshold | SPEC_PROVISIONAL | NCVBDC2023 7.1 | Value 3 illness day. Spec 5.3: fever 3 days or more with any risk factor. |
| riskFloorFeverDays | threshold | SPEC_PROVISIONAL | none | Value 2 days since onset. Spec 5.4: floor at SEE_DOCTOR_TODAY when fever persists 2 days or more with a risk factor. |
| ns1MaxDay | threshold | SOURCE | NCVBDC2023 6.2; NCVBDC2023 6.1.2 | Value 5 illness day. |
| cbcFeverDays | threshold | SOURCE | NCVBDC2023 7.1 | Value 3 illness day. |
| CANNOT_KEEP_FLUIDS | danger sign | SOURCE | NCVBDC2023 12 item 3; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| PERSISTENT_VOMITING | danger sign | SPEC_PROVISIONAL | NCVBDC2023 4.1 Box 2; NCVBDC2023 12 item 1; WHO2009 Textbox C; CDC_POCKET p.1 | Sign is sourced; the count that defines "persistent" is a spec placeholder (see threshold). |
| SEVERE_ABDOMINAL_PAIN | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; WHO2009 Textbox C; CDC_POCKET p.1 |  |
| BLEEDING_GUMS | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; WHO2009 Textbox G |  |
| BLEEDING_NOSE | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; WHO2009 Textbox G |  |
| BLOOD_IN_VOMIT | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; WHO2009 Textbox G |  |
| BLOOD_OR_BLACK_STOOL | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; WHO2009 Textbox G |  |
| BLOOD_IN_URINE | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 10.2 |  |
| HEAVY_MENSTRUAL_BLEEDING | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; WHO2009 Textbox G | Not asked when sex is male (applicableWhen). |
| DROWSY_OR_LETHARGIC | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; WHO2009 Textbox G; CDC_POCKET p.3 |  |
| CONFUSION | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 10.2; WHO2009 Textbox G |  |
| RESTLESS_OR_IRRITABLE | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.2; CDC_POCKET p.1 |  |
| FITS | danger sign | SOURCE | NCVBDC2023 10.2; WHO2009 Textbox G |  |
| COLD_CLAMMY_EXTREMITIES | danger sign | SOURCE | NCVBDC2023 7.2; NCVBDC2023 Table 2; WHO2009 Textbox G |  |
| FAINTING | danger sign | SOURCE | NCVBDC2023 4.1 Box 2; WHO2009 Textbox E |  |
| VERY_WEAK_PULSE | danger sign | SOURCE | NCVBDC2023 Table 2; WHO2009 Textbox D |  |
| PALE_OR_MOTTLED_SKIN | danger sign | SOURCE | NCVBDC2023 7.2; NCVBDC2023 Table 2 |  |
| NO_URINE_6H | danger sign | SOURCE | WHO2009 2.3.2.1; NCVBDC2023 10.2 | WHO supports the 6 hour window used by the spec; NCVBDC PHC advice says 12 hours. The 6 hour window is fixed by the question wording. |
| BREATHING_DIFFICULTY | danger sign | SOURCE | NCVBDC2023 12 item 4; WHO2009 Textbox G; CDC_POCKET p.6 |  |
| CHEST_PAIN | danger sign | SOURCE | WHO2009 Textbox E |  |
| JAUNDICE | danger sign | SPEC_PROVISIONAL | NCVBDC2023 4.4 / Table 5; WHO2009 Textbox E | Jaundice itself is listed in the spec; the sources describe liver involvement rather than jaundice. |
| REDUCED_FETAL_MOVEMENT | danger sign | SPEC_PROVISIONAL | NCVBDC2023 8.1.1 | Spec 5.4 names this sign but gives no level. Treated as EMERGENCY_NOW (cautious). Doctor to decide. |
| EM_WARNING_AS_FEVER_FALLS | rule | SOURCE | NCVBDC2023 4.3; WHO2009 2.1.2; CDC_POCKET p.2 | Redundant with the individual sign rules by design: it adds the explanation. |
| EM_PLATELETS_BELOW_HOSPITAL | rule | SPEC_PROVISIONAL | WHO2009 4.3.5; NCVBDC2023 13 | Cut-off is a spec placeholder (see threshold). |
| EM_PLATELET_RAPID_FALL | rule | SPEC_PROVISIONAL | NCVBDC2023 4.1 Box 2; NCVBDC2023 7.3 | INERT until plateletRapidFallFraction is set by a doctor. |
| EM_HCT_RISING_PLATELETS_FALLING | rule | SOURCE | NCVBDC2023 4.1 Box 2; WHO2009 Textbox C; CDC_POCKET p.1 | "Falling" here means any decrease; "rapid" is not quantified in the sources. |
| EM_TRANSAMINASES_VERY_HIGH | rule | SOURCE | NCVBDC2023 4.4; CDC_POCKET p.1 Group C |  |
| SD_PLATELETS_LOW | rule | SPEC_PROVISIONAL | WHO2009 4.3.5 | Cut-off is a spec placeholder (see threshold). |
| SD_FEVER_3D_WITH_RISK | rule | SPEC_PROVISIONAL | NCVBDC2023 7.1; NCVBDC2023 12; WHO2009 2.3.2.2 |  |
| SD_INFANT_FEVER | rule | SPEC_PROVISIONAL | NCVBDC2023 8.1.2; WHO2009 Textbox E |  |
| SD_RASH_PAIN_OUTBREAK | rule | SPEC_PROVISIONAL | NCVBDC2023 4.1 |  |
| SD_POOR_ORAL_INTAKE | rule | SPEC_PROVISIONAL | NCVBDC2023 7.3; NCVBDC2023 10.2 |  |
| SD_NSAID_WITH_STOMACH_PAIN | rule | SPEC_PROVISIONAL | NCVBDC2023 7.2; WHO2009 2.3.2.1 | An unsure answer about painkillers counts as "took one" (cautious). |
| SD_CHILD_POOR_FEEDING | rule | SPEC_PROVISIONAL | NCVBDC2023 8.1.2; NCVBDC2023 10.2 |  |
| SD_CHILD_FEWER_WET_DIAPERS | rule | SPEC_PROVISIONAL | NCVBDC2023 10.2; CDC_POCKET p.3 |  |
| SD_INPUT_ISSUES | rule | SAFETY_DEFAULT | none | Contradictory or malformed input never lowers urgency (spec 2.3). |
| TM_FEVER_IN_OUTBREAK_SEASON | rule | SPEC_PROVISIONAL | NCVBDC2023 4.1 Box 1 |  |
| TM_CRITICAL_PHASE | rule | SOURCE | WHO2009 2.1.2; NCVBDC2023 4.1; NCVBDC2023 5.1; CDC_POCKET p.2 |  |
| TM_FEVER_OVER_24H | rule | SPEC_PROVISIONAL | NCVBDC2023 7.1 |  |
| TM_DENGUE_LIKE_SYMPTOMS | rule | SOURCE | NCVBDC2023 4.1; NCVBDC2023 4.2; CDC_POCKET p.1 Presumptive diagnosis |  |
| TM_LAB_MARKER_POSITIVE | rule | SAFETY_DEFAULT | NCVBDC2023 4.1 Box 1 | Spec is silent. A positive test never leaves the result at HOME_CARE_WITH_TRIGGERS. |
| SD_DANGER_SIGN_WITHOUT_FEVER | rule | SAFETY_DEFAULT | none | Spec is silent on danger signs without fever. HOME_CARE requires no matching symptoms, so this never stays at HOME_CARE. |
| UNKNOWN_EMERGENCY | rule | SPEC_PROVISIONAL | none | Spec 5.1 unknown_is_emergency list: can keep fluids down; drowsy/confused; bleeding. Reason ids are UNKNOWN_EMERGENCY:<signId>. The "when" field is unused for this rule. |
| UNCERTAIN_DANGER | rule | SPEC_PROVISIONAL | none | Spec 5.1: UNKNOWN raises urgency, capped at SEE_DOCTOR_TODAY. Reason ids are UNCERTAIN_DANGER:<signId>. The "when" field is unused for this rule. |
| PREGNANCY | risk factor | SOURCE | NCVBDC2023 Box 5; NCVBDC2023 8.1.1; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| AGE_UNDER_5 | risk factor | SPEC_PROVISIONAL | NCVBDC2023 Box 5; WHO2009 Textbox E | See childAgeMonths threshold. |
| AGE_65_PLUS | risk factor | SOURCE | NCVBDC2023 Box 5; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| DIABETES | risk factor | SOURCE | NCVBDC2023 Box 5; NCVBDC2023 8.1.3 (c); WHO2009 Textbox E; CDC_POCKET p.6 |  |
| HYPERTENSION | risk factor | SOURCE | NCVBDC2023 Box 5; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| HEART_DISEASE | risk factor | SOURCE | NCVBDC2023 Box 5; NCVBDC2023 8.1.3 (b) |  |
| KIDNEY_DISEASE | risk factor | SOURCE | NCVBDC2023 Box 5; WHO2009 2.3.2.2; CDC_POCKET p.6 |  |
| LIVER_DISEASE | risk factor | SOURCE | NCVBDC2023 Box 5; NCVBDC2023 8.1.3 (a); CDC_POCKET p.6 |  |
| BLOOD_DISORDER | risk factor | SOURCE | NCVBDC2023 Box 5; WHO2009 2.3.2.2 |  |
| OBESITY | risk factor | SOURCE | NCVBDC2023 Box 5; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| PEPTIC_ULCER | risk factor | SOURCE | NCVBDC2023 Box 5; NCVBDC2023 4.1; WHO2009 Textbox E; CDC_POCKET p.6 | Added beyond the spec list because all three sources name it. Doctor to confirm. |
| ANTICOAGULANT | risk factor | SOURCE | NCVBDC2023 8.1.3 (b); CDC_POCKET p.6 |  |
| LIVES_ALONE_OR_FAR | risk factor | SOURCE | NCVBDC2023 12 item 8; WHO2009 2.3.2.2; WHO2009 Textbox E; CDC_POCKET p.6 |  |
| T_NS1_EARLY | testing advice | SOURCE | NCVBDC2023 6.2 |  |
| T_IGM_LATER | testing advice | SOURCE | NCVBDC2023 6.2; NCVBDC2023 6.1.2 |  |
| T_TIMING_UNKNOWN | testing advice | SOURCE | NCVBDC2023 6.2 |  |
| T_CBC | testing advice | SOURCE | NCVBDC2023 7.1 |  |
| T_TELL_LAB | testing advice | SOURCE | NCVBDC2023 6.2 |  |
| T_NO_RAPID_KITS | testing advice | SOURCE | NCVBDC2023 6.1.7 |  |

<!-- END GENERATED -->
