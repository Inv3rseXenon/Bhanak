#!/usr/bin/env node
/**
 * Authoring script for tests/scenarios/dengue.scenarios.json (spec section 22).
 *
 * Expectations (minimumLevel, expectedReasonRuleIds) are written by hand from the spec and the
 * cited guidelines. They must NEVER be copied from engine output: a scenario that merely echoes
 * the engine can never catch a regression. Edit this file, then run:
 *
 *   node tests/scenarios/build-dengue-scenarios.mjs
 *
 * Fixed clock: 2026-09-15 10:00 IST, so the user's local date is 2026-09-15 and "day N of illness"
 * means the fever started on 2026-09-15 minus (N - 1) days.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOW = '2026-09-15T10:00:00+05:30';
const HOME = 'HOME_CARE_WITH_TRIGGERS';
const TEST = 'TEST_AND_MONITOR';
const DOCTOR = 'SEE_DOCTOR_TODAY';
const EMERGENCY = 'EMERGENCY_NOW';

const SYMPTOM_KEYS = [
  'severeAbdominalPain',
  'bleedingGums',
  'bleedingNose',
  'bloodInVomit',
  'bloodOrBlackStool',
  'bloodInUrine',
  'heavyMenstrualBleeding',
  'drowsyOrLethargic',
  'confusion',
  'restlessOrIrritable',
  'fits',
  'coldClammyHandsFeet',
  'fainting',
  'veryWeakPulse',
  'paleOrMottledSkin',
  'breathingDifficulty',
  'chestPain',
  'jaundice',
  'reducedFetalMovement',
  'stomachPain',
  'rash',
  'severeHeadache',
  'eyePain',
  'bodyPain',
  'headache',
  'nausea',
  'poorOralIntake',
  'poorFeeding',
  'fewerWetDiapers',
];

/** Healthy-looking adult, fever since yesterday (day 2), every answer given, outbreak season. */
function base() {
  return {
    subject: { ageMonths: 360, sex: 'MALE', conditions: [] },
    illness: { feverOnsetDate: onset(2), feverNow: 'YES', feverSettledWithin48h: 'NO' },
    symptoms: Object.fromEntries(SYMPTOM_KEYS.map((key) => [key, 'NO'])),
    counts: { vomitingEpisodes24h: 0, urineLast6hOrDiaperCount: 3 },
    fluids: { canKeepFluidsDown: 'YES' },
    labs: {},
    meds: { tookNsaidOrAspirin: 'NO' },
    context: { inOutbreakSeason: true, region: 'Mumbai', utcOffsetMinutes: 330 },
  };
}

/** Onset date for "day n of illness" (day 1 = today). Valid for n up to 15. */
function onset(day) {
  return `2026-09-${String(15 - (day - 1)).padStart(2, '0')}`;
}

// ---- mutators ------------------------------------------------------------------------------
const day = (n) => (i) => {
  i.illness.feverOnsetDate = onset(n);
};
const sym =
  (key, value = 'YES') =>
  (i) => {
    i.symptoms[key] = value;
  };
const fluids = (value) => (i) => {
  i.fluids.canKeepFluidsDown = value;
};
const vomit = (n) => (i) => {
  i.counts.vomitingEpisodes24h = n;
};
const urine = (n) => (i) => {
  i.counts.urineLast6hOrDiaperCount = n;
};
const age = (months) => (i) => {
  i.subject.ageMonths = months;
};
const sex = (value) => (i) => {
  i.subject.sex = value;
};
const pregnant = () => (i) => {
  i.subject.sex = 'FEMALE';
  i.subject.pregnant = true;
};
const conditions =
  (...codes) =>
  (i) => {
    i.subject.conditions = codes;
  };
const settled = () => (i) => {
  i.illness.feverNow = 'NO';
  i.illness.feverSettledWithin48h = 'YES';
};
const noFever = () => (i) => {
  i.illness.feverNow = 'NO';
  i.illness.feverSettledWithin48h = 'NO';
  i.illness.feverOnsetDate = null;
};
const labs = (values) => (i) => {
  Object.assign(i.labs, values);
};
const outbreak = (value) => (i) => {
  i.context.inOutbreakSeason = value;
};
const nsaid = (value) => (i) => {
  i.meds.tookNsaidOrAspirin = value;
};
const subject = (patch) => (i) => {
  Object.assign(i.subject, patch);
};

const scenarios = [];
const ids = new Set();
/** sc(id, description, mutators, minimumLevel, expectedReasonRuleIds, extras) */
function sc(id, description, mutators, minimumLevel, expectedReasonRuleIds = [], extras = {}) {
  if (ids.has(id)) throw new Error(`duplicate scenario id ${id}`);
  ids.add(id);
  const input = base();
  for (const mutate of mutators) mutate(input);
  scenarios.push({ id, description, input, minimumLevel, expectedReasonRuleIds, ...extras });
}
const max = (level) => ({ maximumLevel: level });

// ---- 1. The four spec scenarios, the founder's story, and two common cases -----------------
sc(
  'S001-fever-day3-vomiting-cannot-drink',
  'Spec case 1: fever day 3, vomiting repeatedly, cannot keep fluids down.',
  [day(3), vomit(5), fluids('NO')],
  EMERGENCY,
  ['CANNOT_KEEP_FLUIDS', 'PERSISTENT_VOMITING'],
);
sc(
  'S002-fever-day2-drinking-well-outbreak',
  'Spec case 2: fever day 2, drinking well, no danger signs, outbreak season.',
  [day(2)],
  TEST,
  ['TM_FEVER_IN_OUTBREAK_SEASON'],
  max(TEST),
);
sc(
  'S003-fever-settled-new-belly-pain-drowsy',
  'Spec case 3: fever settled yesterday, new belly pain and drowsiness.',
  [day(4), settled(), sym('severeAbdominalPain'), sym('drowsyOrLethargic')],
  EMERGENCY,
  ['SEVERE_ABDOMINAL_PAIN', 'DROWSY_OR_LETHARGIC', 'EM_WARNING_AS_FEVER_FALLS'],
);
sc(
  'S004-child-under-5-fever-poor-feeding',
  'Spec case 4: child under 5 with fever and poor feeding.',
  [age(36), sym('poorFeeding')],
  DOCTOR,
  ['SD_CHILD_POOR_FEEDING'],
);
sc(
  'S005-founder-story',
  'Founder story: fever day 4, only fever medicine from a clinic, cannot keep water down, platelets 25,000, raised ALT/AST.',
  [day(4), fluids('NO'), labs({ plateletCount: 25000, ast: 180, alt: 210 })],
  EMERGENCY,
  ['CANNOT_KEEP_FLUIDS', 'EM_PLATELETS_BELOW_HOSPITAL'],
);
sc(
  'S006-elderly-diabetic-day3',
  'Elderly diabetic, fever day 3, no danger signs: needs a doctor today.',
  [age(840), conditions('DIABETES'), day(3)],
  DOCTOR,
  ['SD_FEVER_3D_WITH_RISK'],
  max(DOCTOR),
);

// ---- 2. Every danger sign on its own (with fever) -> emergency ---------------------------------
// [id, mutators, extra description]
const SIGNS = [
  ['CANNOT_KEEP_FLUIDS', [fluids('NO')]],
  ['PERSISTENT_VOMITING', [vomit(3)]],
  ['SEVERE_ABDOMINAL_PAIN', [sym('severeAbdominalPain')]],
  ['BLEEDING_GUMS', [sym('bleedingGums')]],
  ['BLEEDING_NOSE', [sym('bleedingNose')]],
  ['BLOOD_IN_VOMIT', [sym('bloodInVomit')]],
  ['BLOOD_OR_BLACK_STOOL', [sym('bloodOrBlackStool')]],
  ['BLOOD_IN_URINE', [sym('bloodInUrine')]],
  ['HEAVY_MENSTRUAL_BLEEDING', [sex('FEMALE'), sym('heavyMenstrualBleeding')]],
  ['DROWSY_OR_LETHARGIC', [sym('drowsyOrLethargic')]],
  ['CONFUSION', [sym('confusion')]],
  ['RESTLESS_OR_IRRITABLE', [sym('restlessOrIrritable')]],
  ['FITS', [sym('fits')]],
  ['COLD_CLAMMY_EXTREMITIES', [sym('coldClammyHandsFeet')]],
  ['FAINTING', [sym('fainting')]],
  ['VERY_WEAK_PULSE', [sym('veryWeakPulse')]],
  ['PALE_OR_MOTTLED_SKIN', [sym('paleOrMottledSkin')]],
  ['NO_URINE_6H', [urine(0)]],
  ['BREATHING_DIFFICULTY', [sym('breathingDifficulty')]],
  ['CHEST_PAIN', [sym('chestPain')]],
  ['JAUNDICE', [sym('jaundice')]],
  ['REDUCED_FETAL_MOVEMENT', [pregnant(), sym('reducedFetalMovement')]],
];
for (const [signId, mutators] of SIGNS) {
  sc(
    `S1-${signId}`,
    `${signId} alone, with fever, is an emergency.`,
    [day(2), ...mutators],
    EMERGENCY,
    [signId],
  );
}
sc(
  'S1-vomiting-below-threshold',
  'Two vomiting episodes is below the provisional threshold: not an emergency by itself.',
  [vomit(2)],
  TEST,
  [],
  max(TEST),
);
sc('S1-urine-once', 'One urination in 6 hours is not "no urine".', [urine(1)], TEST, [], max(TEST));

// ---- 3. UNKNOWN ("not sure") on danger questions never lowers urgency -----------------------------
// [id, mutators, policy] policy: 'E' (unknown_is_emergency list) or 'U' (uncertain, at least see doctor)
const UNKNOWNS = [
  ['CANNOT_KEEP_FLUIDS', [fluids('UNKNOWN')], 'E'],
  ['BLEEDING_GUMS', [sym('bleedingGums', 'UNKNOWN')], 'E'],
  ['BLEEDING_NOSE', [sym('bleedingNose', 'UNKNOWN')], 'E'],
  ['BLOOD_IN_VOMIT', [sym('bloodInVomit', 'UNKNOWN')], 'E'],
  ['BLOOD_OR_BLACK_STOOL', [sym('bloodOrBlackStool', 'UNKNOWN')], 'E'],
  ['BLOOD_IN_URINE', [sym('bloodInUrine', 'UNKNOWN')], 'E'],
  ['HEAVY_MENSTRUAL_BLEEDING', [sex('FEMALE'), sym('heavyMenstrualBleeding', 'UNKNOWN')], 'E'],
  ['DROWSY_OR_LETHARGIC', [sym('drowsyOrLethargic', 'UNKNOWN')], 'E'],
  ['CONFUSION', [sym('confusion', 'UNKNOWN')], 'E'],
  [
    'PERSISTENT_VOMITING',
    [
      (i) => {
        i.counts.vomitingEpisodes24h = null;
      },
    ],
    'U',
  ],
  ['SEVERE_ABDOMINAL_PAIN', [sym('severeAbdominalPain', 'UNKNOWN')], 'U'],
  ['RESTLESS_OR_IRRITABLE', [sym('restlessOrIrritable', 'UNKNOWN')], 'U'],
  ['FITS', [sym('fits', 'UNKNOWN')], 'U'],
  ['COLD_CLAMMY_EXTREMITIES', [sym('coldClammyHandsFeet', 'UNKNOWN')], 'U'],
  ['FAINTING', [sym('fainting', 'UNKNOWN')], 'U'],
  ['VERY_WEAK_PULSE', [sym('veryWeakPulse', 'UNKNOWN')], 'U'],
  ['PALE_OR_MOTTLED_SKIN', [sym('paleOrMottledSkin', 'UNKNOWN')], 'U'],
  [
    'NO_URINE_6H',
    [
      (i) => {
        i.counts.urineLast6hOrDiaperCount = null;
      },
    ],
    'U',
  ],
  ['BREATHING_DIFFICULTY', [sym('breathingDifficulty', 'UNKNOWN')], 'U'],
  ['CHEST_PAIN', [sym('chestPain', 'UNKNOWN')], 'U'],
  ['JAUNDICE', [sym('jaundice', 'UNKNOWN')], 'U'],
  ['REDUCED_FETAL_MOVEMENT', [pregnant(), sym('reducedFetalMovement', 'UNKNOWN')], 'U'],
];
for (const [signId, mutators, policy] of UNKNOWNS) {
  const emergency = policy === 'E';
  sc(
    `S2-unknown-${signId}`,
    `"Not sure" about ${signId} with fever: ${emergency ? 'treated as an emergency (spec 5.1 list)' : 'at least see a doctor today'}.`,
    [day(2), ...mutators],
    emergency ? EMERGENCY : DOCTOR,
    [`${emergency ? 'UNKNOWN_EMERGENCY' : 'UNCERTAIN_DANGER'}:${signId}`],
  );
}
sc(
  'S2-missing-answers-same-as-unknown',
  'Symptom answers left out entirely are treated like "not sure".',
  [
    (i) => {
      i.symptoms = {};
    },
  ],
  EMERGENCY,
  ['UNKNOWN_EMERGENCY:BLEEDING_GUMS'],
);

// ---- 4. Lab values ---------------------------------------------------------------------------------
sc(
  'S3-platelets-49999',
  'Platelets 49,999 (just under the provisional hospital cut-off).',
  [labs({ plateletCount: 49999 })],
  EMERGENCY,
  ['EM_PLATELETS_BELOW_HOSPITAL'],
);
sc(
  'S3-platelets-50000',
  'Platelets exactly 50,000: not the hospital rule, but still low.',
  [labs({ plateletCount: 50000 })],
  DOCTOR,
  ['SD_PLATELETS_LOW'],
  max(DOCTOR),
);
sc(
  'S3-platelets-99999',
  'Platelets 99,999: see a doctor today.',
  [labs({ plateletCount: 99999 })],
  DOCTOR,
  ['SD_PLATELETS_LOW'],
  max(DOCTOR),
);
sc(
  'S3-platelets-100000',
  'Platelets exactly 100,000: no platelet rule fires.',
  [labs({ plateletCount: 100000 })],
  TEST,
  [],
  max(TEST),
);
sc(
  'S3-platelets-25000-with-fluids-ok',
  'Platelets 25,000 even if drinking well.',
  [labs({ plateletCount: 25000 })],
  EMERGENCY,
  ['EM_PLATELETS_BELOW_HOSPITAL'],
);
sc(
  'S3-hct-rising-platelets-falling',
  'Haematocrit up 13% and platelets down since the previous test.',
  [
    labs({
      plateletCount: 120000,
      hematocrit: 43,
      previous: { plateletCount: 150000, hematocrit: 38 },
    }),
  ],
  EMERGENCY,
  ['EM_HCT_RISING_PLATELETS_FALLING'],
);
sc(
  'S3-hct-small-rise-platelets-falling',
  'Haematocrit up only about 5% with platelets falling: the combined rule does not fire.',
  [
    labs({
      plateletCount: 120000,
      hematocrit: 40,
      previous: { plateletCount: 150000, hematocrit: 38 },
    }),
  ],
  TEST,
  [],
  max(TEST),
);
sc(
  'S3-hct-rising-platelets-rising',
  'Haematocrit up 13% but platelets also up: no combined rule.',
  [
    labs({
      plateletCount: 160000,
      hematocrit: 43,
      previous: { plateletCount: 150000, hematocrit: 38 },
    }),
  ],
  TEST,
  [],
  max(TEST),
);
sc(
  'S3-platelets-fast-fall-rule-inert',
  'Platelets 60,000 down from 200,000. The "rapid fall" rule is inert until a doctor sets its threshold; the level comes from the low count. UPDATE when the threshold is set.',
  [labs({ plateletCount: 60000, previous: { plateletCount: 200000 } })],
  DOCTOR,
  ['SD_PLATELETS_LOW'],
  max(DOCTOR),
);
sc('S3-alt-1000', 'ALT 1000 U/L.', [labs({ alt: 1000 })], EMERGENCY, [
  'EM_TRANSAMINASES_VERY_HIGH',
]);
sc('S3-ast-1000', 'AST 1000 U/L.', [labs({ ast: 1000 })], EMERGENCY, [
  'EM_TRANSAMINASES_VERY_HIGH',
]);
sc(
  'S3-ast-alt-999',
  'AST and ALT both 999: below the severe cut-off.',
  [labs({ ast: 999, alt: 999 })],
  TEST,
  [],
  max(TEST),
);
sc(
  'S3-ns1-positive-no-fever',
  'NS1 positive in a person with no recent fever: never "home care".',
  [noFever(), labs({ ns1: 'POSITIVE' })],
  TEST,
  ['TM_LAB_MARKER_POSITIVE'],
  max(TEST),
);
sc(
  'S3-igm-positive-no-fever',
  'IgM positive in a person with no recent fever.',
  [noFever(), labs({ igm: 'POSITIVE' })],
  TEST,
  ['TM_LAB_MARKER_POSITIVE'],
  max(TEST),
);
sc(
  'S3-labs-only',
  'Only a platelet report entered; nothing else answered: unknown fluids are treated as an emergency.',
  [
    (i) => {
      i.illness = {};
      i.symptoms = {};
      i.counts = {};
      i.fluids = {};
      i.meds = {};
      i.labs = { plateletCount: 80000 };
    },
  ],
  EMERGENCY,
  ['UNKNOWN_EMERGENCY:CANNOT_KEEP_FLUIDS', 'SD_PLATELETS_LOW'],
);

// ---- 5. Risk factors ------------------------------------------------------------------------------
const RISKS = [
  ['PREGNANCY', [pregnant()]],
  ['AGE_UNDER_5', [age(48)]],
  ['AGE_65_PLUS', [age(780)]],
  ['DIABETES', [conditions('DIABETES')]],
  ['HYPERTENSION', [conditions('HYPERTENSION')]],
  ['HEART_DISEASE', [conditions('HEART_DISEASE')]],
  ['KIDNEY_DISEASE', [conditions('KIDNEY_DISEASE')]],
  ['LIVER_DISEASE', [conditions('LIVER_DISEASE')]],
  ['BLOOD_DISORDER', [conditions('BLOOD_DISORDER')]],
  ['OBESITY', [conditions('OBESITY')]],
  ['PEPTIC_ULCER', [conditions('PEPTIC_ULCER')]],
  ['ANTICOAGULANT', [subject({ onAnticoagulant: true })]],
  ['LIVES_ALONE_OR_FAR', [subject({ livesAloneOrFarFromHospital: true })]],
];
for (const [riskId, mutators] of RISKS) {
  sc(
    `S4-risk-${riskId}-day3`,
    `${riskId}: fever 3 days with no danger signs needs a doctor today (and never an emergency by itself).`,
    [day(3), ...mutators],
    DOCTOR,
    ['SD_FEVER_3D_WITH_RISK'],
    max(DOCTOR),
  );
}
for (const [label, mutators] of [
  ['diabetes', [conditions('DIABETES')]],
  ['age 70', [age(840)]],
  ['pregnancy', [pregnant()]],
]) {
  sc(
    `S4-risk-step-up-${label.replace(' ', '')}`,
    `Fever under 24 hours outside outbreak season is normally home care; with ${label} it is raised one step.`,
    [day(1), outbreak(false), ...mutators],
    TEST,
    ['RISK_FACTOR_STEP_UP'],
    max(TEST),
  );
}
sc(
  'S4-risk-no-fever',
  'Diabetic with no fever at all stays at home care.',
  [noFever(), conditions('DIABETES')],
  HOME,
  ['NO_DANGER_SIGNS_REPORTED'],
  max(HOME),
);
sc(
  'S4-unrecognised-condition-ignored',
  'An unknown condition code is not treated as a risk factor.',
  [conditions('SOMETHING_ELSE'), day(1), outbreak(false)],
  HOME,
  [],
  max(HOME),
);

// ---- 6. Age and pregnancy --------------------------------------------------------------------------
sc(
  'S5-infant-fever',
  'Baby of 6 months with a fever that started today.',
  [age(6), day(1), outbreak(false)],
  DOCTOR,
  ['SD_INFANT_FEVER'],
);
sc(
  'S5-infant-no-wet-diaper',
  'Baby with no wet diaper in 6 hours.',
  [age(8), urine(0)],
  EMERGENCY,
  ['NO_URINE_6H'],
);
sc(
  'S5-infant-poor-feeding',
  'Baby with fever who is not feeding well.',
  [age(7), sym('poorFeeding')],
  DOCTOR,
  ['SD_INFANT_FEVER', 'SD_CHILD_POOR_FEEDING'],
);
sc(
  'S5-child-fewer-wet-diapers',
  'Child of 3 with fever passing less urine than usual.',
  [age(36), sym('fewerWetDiapers')],
  DOCTOR,
  ['SD_CHILD_FEWER_WET_DIAPERS'],
);
sc(
  'S5-child-irritable',
  'Child of 4 who is very irritable with fever.',
  [age(48), sym('restlessOrIrritable')],
  EMERGENCY,
  ['RESTLESS_OR_IRRITABLE'],
);
sc('S5-child-fit', 'Child of 2 who had a fit.', [age(24), sym('fits')], EMERGENCY, ['FITS']);
sc(
  'S5-child-8-years-no-signs',
  'Child of 8 with fever day 2 and no signs: not in a risk group by the spec age cut-off.',
  [age(96)],
  TEST,
  ['TM_FEVER_IN_OUTBREAK_SEASON'],
  max(TEST),
);
sc(
  'S5-pregnant-fever-day2',
  'Pregnant woman, fever day 2, no danger signs.',
  [pregnant()],
  DOCTOR,
  ['RISK_FACTOR_STEP_UP'],
  max(DOCTOR),
);
sc(
  'S5-pregnant-belly-pain',
  'Pregnant woman with strong belly pain.',
  [pregnant(), sym('severeAbdominalPain')],
  EMERGENCY,
  ['SEVERE_ABDOMINAL_PAIN'],
);
sc(
  'S5-elderly-settled-day5',
  'Woman of 80, fever settled, day 5, no danger signs: critical phase plus age.',
  [age(960), sex('FEMALE'), day(5), settled()],
  DOCTOR,
  ['TM_CRITICAL_PHASE', 'SD_FEVER_3D_WITH_RISK'],
  { maximumLevel: DOCTOR, expectCriticalPhaseNote: true },
);

// ---- 7. Critical phase: a falling fever is never presented as good news --------------------------------
for (const n of [3, 4, 5, 6, 7]) {
  sc(
    `S6-critical-phase-settled-day${n}`,
    `Fever settled, day ${n}, no danger signs: still monitor (critical phase).`,
    [day(n), settled()],
    TEST,
    ['TM_CRITICAL_PHASE'],
    { maximumLevel: TEST, expectCriticalPhaseNote: true },
  );
}
sc(
  'S6-critical-phase-settled-day3-no-outbreak',
  'Critical phase applies even outside outbreak season.',
  [day(3), settled(), outbreak(false)],
  TEST,
  ['TM_CRITICAL_PHASE'],
  { maximumLevel: TEST, expectCriticalPhaseNote: true },
);
sc(
  'S6-critical-phase-fever-still-present-day5',
  'Fever still present on day 5: critical-phase guidance is shown.',
  [day(5)],
  TEST,
  ['TM_CRITICAL_PHASE'],
  { maximumLevel: TEST, expectCriticalPhaseNote: true },
);
sc('S6-day2-no-critical-note', 'Day 2 is before the critical phase.', [day(2)], TEST, [], {
  maximumLevel: TEST,
  expectCriticalPhaseNote: false,
});
sc(
  'S6-day8-settled-after-window',
  'Day 8 with fever settled: after the usual window but still within 7 days of onset, so still monitored.',
  [day(8), settled()],
  TEST,
  [],
  { maximumLevel: TEST, expectCriticalPhaseNote: false },
);
for (const [key, label] of [
  ['bleedingGums', 'bleeding gums'],
  ['severeAbdominalPain', 'severe belly pain'],
  ['drowsyOrLethargic', 'drowsiness'],
]) {
  sc(
    `S6-warning-as-fever-falls-${key}`,
    `Fever settled, day 4, and now ${label}.`,
    [day(4), settled(), sym(key)],
    EMERGENCY,
    ['EM_WARNING_AS_FEVER_FALLS'],
  );
}
sc(
  'S6-settled-vomiting',
  'Fever settled, day 5, vomiting 4 times.',
  [day(5), settled(), vomit(4)],
  EMERGENCY,
  ['PERSISTENT_VOMITING', 'EM_WARNING_AS_FEVER_FALLS'],
);

// ---- 8. Season, duration and "is there a fever?" ----------------------------------------------------------
sc(
  'S7-fever-under-24h-no-outbreak',
  'Fever since today, outside outbreak season, no symptoms: lowest level.',
  [day(1), outbreak(false)],
  HOME,
  ['NO_DANGER_SIGNS_REPORTED'],
  max(HOME),
);
sc('S7-fever-under-24h-outbreak', 'Fever since today during outbreak season.', [day(1)], TEST, [
  'TM_FEVER_IN_OUTBREAK_SEASON',
]);
sc(
  'S7-fever-under-24h-headache',
  'Fever since today with headache, outside outbreak season.',
  [day(1), outbreak(false), sym('headache')],
  TEST,
  ['TM_DENGUE_LIKE_SYMPTOMS'],
);
sc(
  'S7-fever-day2-no-outbreak',
  'Fever day 2 outside outbreak season.',
  [day(2), outbreak(false)],
  TEST,
  ['TM_FEVER_OVER_24H'],
  max(TEST),
);
sc(
  'S7-outbreak-season-missing',
  'Outbreak season not given: assumed yes (cautious).',
  [
    day(1),
    (i) => {
      delete i.context.inOutbreakSeason;
    },
  ],
  TEST,
  ['TM_FEVER_IN_OUTBREAK_SEASON'],
);
sc(
  'S7-no-fever-healthy',
  'No fever, nothing wrong.',
  [noFever()],
  HOME,
  ['NO_DANGER_SIGNS_REPORTED'],
  max(HOME),
);
sc(
  'S7-fever-8-days-ago-over',
  'Fever ended long ago (started 8 days ago, none in the last 48 hours).',
  [
    (i) => {
      i.illness.feverOnsetDate = '2026-09-07';
      i.illness.feverNow = 'NO';
    },
  ],
  HOME,
  [],
  max(HOME),
);
sc(
  'S7-fever-7-days-ago-still-counts',
  'Fever started 7 days ago and has gone: still within the 7-day window.',
  [
    (i) => {
      i.illness.feverOnsetDate = '2026-09-08';
      i.illness.feverNow = 'NO';
    },
  ],
  TEST,
  ['TM_FEVER_OVER_24H'],
);
sc(
  'S7-fever-unsure',
  'Not sure whether there is a fever now.',
  [
    (i) => {
      i.illness.feverNow = 'UNKNOWN';
      i.illness.feverOnsetDate = null;
    },
  ],
  TEST,
  [],
  max(DOCTOR),
);
sc(
  'S7-no-fever-but-bleeding',
  'No fever but bleeding gums: never home care.',
  [noFever(), sym('bleedingGums')],
  DOCTOR,
  ['SD_DANGER_SIGN_WITHOUT_FEVER'],
  max(DOCTOR),
);
sc(
  'S7-no-fever-unsure-answers-ignored',
  'No fever: "not sure" about danger signs is not escalated.',
  [noFever(), sym('severeAbdominalPain', 'UNKNOWN'), fluids('UNKNOWN')],
  HOME,
  [],
  max(HOME),
);

// ---- 9. See-a-doctor triggers -----------------------------------------------------------------------------
sc(
  'S8-rash-and-headache-outbreak',
  'Rash plus severe headache in outbreak season.',
  [sym('rash'), sym('severeHeadache')],
  DOCTOR,
  ['SD_RASH_PAIN_OUTBREAK'],
  max(DOCTOR),
);
sc(
  'S8-rash-and-eye-pain-outbreak',
  'Rash plus eye pain in outbreak season.',
  [sym('rash'), sym('eyePain')],
  DOCTOR,
  ['SD_RASH_PAIN_OUTBREAK'],
  max(DOCTOR),
);
sc(
  'S8-rash-and-body-pain-outbreak',
  'Rash plus body pain in outbreak season.',
  [sym('rash'), sym('bodyPain')],
  DOCTOR,
  ['SD_RASH_PAIN_OUTBREAK'],
  max(DOCTOR),
);
sc(
  'S8-rash-alone',
  'Rash alone does not reach see-a-doctor.',
  [sym('rash')],
  TEST,
  ['TM_DENGUE_LIKE_SYMPTOMS'],
  max(TEST),
);
sc(
  'S8-rash-headache-no-outbreak',
  'Rash plus severe headache outside outbreak season.',
  [outbreak(false), sym('rash'), sym('severeHeadache')],
  TEST,
  ['TM_DENGUE_LIKE_SYMPTOMS'],
  max(TEST),
);
sc(
  'S8-poor-oral-intake',
  'Eating and drinking very little but not vomiting.',
  [sym('poorOralIntake')],
  DOCTOR,
  ['SD_POOR_ORAL_INTAKE'],
  max(DOCTOR),
);
sc(
  'S8-nsaid-and-stomach-pain',
  'Took a painkiller like aspirin and has stomach pain.',
  [nsaid('YES'), sym('stomachPain')],
  DOCTOR,
  ['SD_NSAID_WITH_STOMACH_PAIN'],
  max(DOCTOR),
);
sc(
  'S8-stomach-pain-no-nsaid',
  'Stomach pain but no painkiller taken.',
  [sym('stomachPain')],
  TEST,
  [],
  max(TEST),
);
sc(
  'S8-nsaid-unsure-stomach-pain',
  'Not sure about painkillers, with stomach pain: treated as taken.',
  [nsaid('UNKNOWN'), sym('stomachPain')],
  DOCTOR,
  ['SD_NSAID_WITH_STOMACH_PAIN'],
);
sc(
  'S8-nsaid-no-stomach-pain',
  'Took a painkiller but no stomach pain.',
  [nsaid('YES')],
  TEST,
  [],
  max(TEST),
);

// ---- 10. Contradictory, malformed and fully unknown input ----------------------------------------------------
sc(
  'S9-fluids-ok-but-vomiting-6',
  'Says fluids stay down but also 6 vomiting episodes: the worse answer wins.',
  [fluids('YES'), vomit(6)],
  EMERGENCY,
  ['PERSISTENT_VOMITING'],
);
sc(
  'S9-onset-in-future',
  'Fever start date is in the future.',
  [
    (i) => {
      i.illness.feverOnsetDate = '2026-09-20';
    },
  ],
  DOCTOR,
  ['SD_INPUT_ISSUES'],
);
sc(
  'S9-onset-impossible-date',
  'Fever start date 2026-02-30 does not exist.',
  [
    (i) => {
      i.illness.feverOnsetDate = '2026-02-30';
    },
  ],
  DOCTOR,
  ['SD_INPUT_ISSUES'],
);
sc(
  'S9-onset-not-a-date',
  'Fever start date is text.',
  [
    (i) => {
      i.illness.feverOnsetDate = 'yesterday';
    },
  ],
  DOCTOR,
  ['SD_INPUT_ISSUES'],
);
sc(
  'S9-pregnant-male',
  'Male patient marked pregnant.',
  [sex('MALE'), subject({ pregnant: true })],
  DOCTOR,
  ['SD_INPUT_ISSUES'],
);
sc('S9-negative-vomit-count', 'Vomiting count of -1.', [vomit(-1)], DOCTOR, [
  'SD_INPUT_ISSUES',
  'UNCERTAIN_DANGER:PERSISTENT_VOMITING',
]);
sc(
  'S9-missing-age',
  'Age missing.',
  [
    (i) => {
      delete i.subject.ageMonths;
    },
  ],
  DOCTOR,
  ['SD_INPUT_ISSUES'],
);
sc('S9-negative-platelets', 'Platelet value of -5.', [labs({ plateletCount: -5 })], DOCTOR, [
  'SD_INPUT_ISSUES',
]);
for (const [label, patch] of [
  ['adult', []],
  ['child', [age(36)]],
  ['elderly', [age(840)]],
]) {
  sc(
    `S9-not-sure-about-everything-${label}`,
    `${label}: "not sure" to every question.`,
    [
      ...patch,
      (i) => {
        for (const key of Object.keys(i.symptoms)) i.symptoms[key] = 'UNKNOWN';
        i.fluids.canKeepFluidsDown = 'UNKNOWN';
        i.counts = { vomitingEpisodes24h: null, urineLast6hOrDiaperCount: null };
        i.illness.feverNow = 'UNKNOWN';
        i.illness.feverSettledWithin48h = 'UNKNOWN';
        i.meds.tookNsaidOrAspirin = 'UNKNOWN';
      },
    ],
    EMERGENCY,
    [
      'UNKNOWN_EMERGENCY:CANNOT_KEEP_FLUIDS',
      'UNKNOWN_EMERGENCY:BLEEDING_GUMS',
      'UNKNOWN_EMERGENCY:DROWSY_OR_LETHARGIC',
    ],
  );
}
sc(
  'S9-empty-answers',
  'Only age and sex known; everything else missing.',
  [
    (i) => {
      i.illness = {};
      i.symptoms = {};
      i.counts = {};
      i.fluids = {};
      i.labs = {};
      i.meds = {};
      i.context = {};
    },
  ],
  EMERGENCY,
  ['UNKNOWN_EMERGENCY:CANNOT_KEEP_FLUIDS'],
);
sc(
  'S9-fever-now-and-settled-both-yes',
  'Says fever is present and also settled; with a max temperature of 40.',
  [
    day(4),
    (i) => {
      i.illness.feverSettledWithin48h = 'YES';
      i.illness.maxTempC = 40;
    },
  ],
  TEST,
  ['TM_CRITICAL_PHASE'],
  { expectCriticalPhaseNote: true },
);
sc(
  'S9-other-sex-heavy-bleeding',
  'Sex recorded as other: heavy bleeding question applies.',
  [sex('OTHER'), sym('heavyMenstrualBleeding')],
  EMERGENCY,
  ['HEAVY_MENSTRUAL_BLEEDING'],
);
sc(
  'S9-male-heavy-bleeding-yes',
  'Male patient answers YES to heavy menstrual bleeding: a stated danger sign is never ignored.',
  [sex('MALE'), sym('heavyMenstrualBleeding')],
  EMERGENCY,
  ['HEAVY_MENSTRUAL_BLEEDING'],
);
sc(
  'S9-male-heavy-bleeding-unsure',
  'Male patient unsure about a question that does not apply: not escalated.',
  [sex('MALE'), sym('heavyMenstrualBleeding', 'UNKNOWN')],
  TEST,
  [],
  max(TEST),
);
sc(
  'S9-not-pregnant-fetal-movement-yes',
  'Not pregnant but answers YES to reduced fetal movement: not ignored.',
  [sex('FEMALE'), sym('reducedFetalMovement')],
  EMERGENCY,
  ['REDUCED_FETAL_MOVEMENT'],
);
sc(
  'S9-not-pregnant-fetal-movement-unsure',
  'Not pregnant, unsure about fetal movement: not escalated.',
  [sex('FEMALE'), sym('reducedFetalMovement', 'UNKNOWN')],
  TEST,
  [],
  max(TEST),
);
sc(
  'S9-utc-offset-missing',
  'No timezone offset given: protocol default (IST) is used.',
  [
    (i) => {
      delete i.context.utcOffsetMinutes;
    },
  ],
  TEST,
  ['TM_FEVER_IN_OUTBREAK_SEASON'],
  max(TEST),
);

// ---- 11. Combinations ------------------------------------------------------------------------------------------
sc('S10-elderly-vomiting', 'Man of 70 vomiting 4 times.', [age(840), vomit(4)], EMERGENCY, [
  'PERSISTENT_VOMITING',
]);
sc(
  'S10-diabetic-nosebleed',
  'Diabetic with nose bleeding.',
  [conditions('DIABETES'), sym('bleedingNose')],
  EMERGENCY,
  ['BLEEDING_NOSE'],
);
sc(
  'S10-child-drowsy',
  'Child of 3 who is very sleepy.',
  [age(36), sym('drowsyOrLethargic')],
  EMERGENCY,
  ['DROWSY_OR_LETHARGIC'],
);
sc('S10-infant-no-urine', 'Baby of 8 months, no wet diaper.', [age(8), urine(0)], EMERGENCY, [
  'NO_URINE_6H',
]);
sc(
  'S10-poor-intake-rash-headache',
  'Poor intake plus rash and headache, otherwise well.',
  [sym('poorOralIntake'), sym('rash'), sym('severeHeadache')],
  DOCTOR,
  ['SD_POOR_ORAL_INTAKE', 'SD_RASH_PAIN_OUTBREAK'],
  max(DOCTOR),
);
sc(
  'S10-low-platelets-diabetic',
  'Diabetic with platelets 80,000.',
  [conditions('DIABETES'), labs({ plateletCount: 80000 })],
  DOCTOR,
  ['SD_PLATELETS_LOW'],
  max(DOCTOR),
);
sc(
  'S10-elderly-very-low-platelets',
  'Man of 70 with platelets 30,000.',
  [age(840), labs({ plateletCount: 30000 })],
  EMERGENCY,
  ['EM_PLATELETS_BELOW_HOSPITAL'],
);
sc(
  'S10-breathing-and-chest-pain',
  'Trouble breathing and chest pain.',
  [sym('breathingDifficulty'), sym('chestPain')],
  EMERGENCY,
  ['BREATHING_DIFFICULTY', 'CHEST_PAIN'],
);
sc(
  'S10-lives-alone-day3',
  'Lives alone far from a hospital, fever day 3.',
  [subject({ livesAloneOrFarFromHospital: true }), day(3)],
  DOCTOR,
  ['SD_FEVER_3D_WITH_RISK'],
  max(DOCTOR),
);
sc(
  'S10-obese-settled-day5',
  'Obese, fever settled on day 5, no danger signs.',
  [conditions('OBESITY'), day(5), settled()],
  DOCTOR,
  ['TM_CRITICAL_PHASE', 'SD_FEVER_3D_WITH_RISK'],
  { maximumLevel: DOCTOR, expectCriticalPhaseNote: true },
);
sc(
  'S10-anticoagulant-and-bleeding',
  'On a blood thinner with gum bleeding.',
  [subject({ onAnticoagulant: true }), sym('bleedingGums')],
  EMERGENCY,
  ['BLEEDING_GUMS'],
);
sc(
  'S10-unsure-and-risk',
  'Diabetic who is unsure about belly pain: no longer just monitor.',
  [conditions('DIABETES'), sym('severeAbdominalPain', 'UNKNOWN')],
  DOCTOR,
  ['UNCERTAIN_DANGER:SEVERE_ABDOMINAL_PAIN'],
);
sc(
  'S10-pregnant-poor-intake',
  'Pregnant woman who is barely drinking, not vomiting.',
  [pregnant(), sym('poorOralIntake')],
  DOCTOR,
  ['SD_POOR_ORAL_INTAKE'],
  max(DOCTOR),
);
sc(
  'S10-kidney-disease-settled-vomiting',
  'Kidney disease, fever settled day 4, vomiting 3 times.',
  [conditions('KIDNEY_DISEASE'), day(4), settled(), vomit(3)],
  EMERGENCY,
  ['PERSISTENT_VOMITING', 'EM_WARNING_AS_FEVER_FALLS'],
);

if (scenarios.length < 150)
  throw new Error(`need at least 150 scenarios, have ${scenarios.length}`);

const out = join(dirname(fileURLToPath(import.meta.url)), 'dengue.scenarios.json');
writeFileSync(out, `${JSON.stringify({ protocolId: 'dengue', now: NOW, scenarios }, null, 2)}\n`);
console.log(`wrote ${scenarios.length} scenarios to ${out}`);
