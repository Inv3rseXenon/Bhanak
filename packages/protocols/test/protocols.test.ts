import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { findBannedCopy } from '@bhanak/shared';
import { evaluate, type Protocol, type TriageInput } from '@bhanak/triage-engine';
import {
  allowDraftFromEnv,
  assertProtocolServable,
  checkProtocolIntegrity,
  checkStrings,
  CHECKLIST_BEGIN,
  CHECKLIST_END,
  DRAFT_BANNER_TEXT,
  ENGINE_I18N_KEYS,
  parseProtocol,
  parseStrings,
  protocolContentHash,
  protocolJsonSchema,
  ProtocolError,
  ProtocolGateError,
  renderChecklist,
  reviewItems,
  showsDraftBanner,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const repoRoot = join(packageRoot, '..', '..');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

const rawProtocol = readJson(join(packageRoot, 'dengue', 'v0.1.0.json'));
const rawStrings = readJson(join(packageRoot, 'dengue', 'v0.1.0.strings.en.json'));
const protocol = parseProtocol(rawProtocol);
const strings = parseStrings(rawStrings);
const edited = (change: (p: Protocol) => void): Protocol => {
  const copy = structuredClone(protocol);
  change(copy);
  return copy;
};

describe('dengue protocol v0.1.0', () => {
  it('passes the schema and integrity checks', () => {
    expect(checkProtocolIntegrity(protocol)).toEqual([]);
  });

  it('is a DRAFT with no reviewer: the release gate must keep it out of production', () => {
    expect(protocol.reviewStatus).toBe('DRAFT');
    expect(protocol.review).toEqual({
      reviewerName: null,
      registrationNumber: null,
      reviewedOn: null,
    });
    expect(showsDraftBanner(protocol)).toBe(true);
    expect(DRAFT_BANNER_TEXT).toBe('TEST VERSION, NOT MEDICALLY REVIEWED');
  });

  it('every clinical item is awaiting doctor review (none is silently approved)', () => {
    const items = reviewItems(protocol);
    expect(items.length).toBeGreaterThan(70);
    expect(items.every((item) => item.review === 'TODO_DOCTOR_REVIEW')).toBe(true);
  });

  it('lists the thresholds that are still undecided', () => {
    const unset = Object.entries(protocol.thresholds)
      .filter(([, t]) => t.value === null)
      .map(([name]) => name);
    expect(unset).toEqual(['plateletRapidFallFraction']);
  });

  it('keeps spec placeholders flagged as such, not as sourced facts', () => {
    for (const name of ['plateletEmergency', 'plateletSeeDoctor', 'vomitingEpisodes24h']) {
      expect(protocol.thresholds[name]?.basis, name).toBe('SPEC_PROVISIONAL');
    }
  });

  it('cites a known source document for every reference, and every SOURCE item cites something', () => {
    const docs = new Set(Object.keys(protocol.sources));
    expect([...docs].sort()).toEqual(['CDC_POCKET', 'NCVBDC2023', 'WHO2009']);
    for (const item of reviewItems(protocol)) {
      if (item.basis === 'SOURCE') expect(item.sources.length, item.id).toBeGreaterThan(0);
    }
  });

  it('has a stable content hash', () => {
    expect(protocolContentHash(protocol)).toMatch(/^[0-9a-f]{64}$/);
    expect(protocolContentHash(parseProtocol(rawProtocol))).toBe(protocolContentHash(protocol));
  });

  it('can be used by the engine', () => {
    const input = {
      subject: { ageMonths: 360, sex: 'MALE', conditions: [] },
      illness: { feverOnsetDate: '2026-09-14', feverNow: 'YES', feverSettledWithin48h: 'NO' },
      symptoms: {},
      counts: {},
      fluids: { canKeepFluidsDown: 'NO' },
      labs: {},
      meds: {},
      context: { inOutbreakSeason: true },
    } satisfies TriageInput;
    expect(evaluate(input, protocol, new Date('2026-09-15T10:00:00+05:30')).level).toBe(
      'EMERGENCY_NOW',
    );
  });
});

describe('strings (en)', () => {
  it('has a string for every key the protocol uses, and none unused', () => {
    expect(checkStrings(protocol, strings, ENGINE_I18N_KEYS)).toEqual([]);
  });

  it('contains no banned claims (diagnose, detect, cure, AI doctor, guaranteed, "you are fine")', () => {
    for (const [key, text] of Object.entries(strings)) {
      expect(findBannedCopy(text), key).toEqual([]);
    }
  });

  it('never states that the person has, or does not have, a disease', () => {
    for (const [key, text] of Object.entries(strings)) {
      expect(text, key).not.toMatch(/\byou (do not|don't) have\b/i);
      expect(text, key).not.toMatch(/\byou have dengue\b/i);
    }
  });

  it('reports missing and unused strings', () => {
    const missing = { ...strings };
    delete missing['dengue.headline.emergency'];
    expect(checkStrings(protocol, missing, ENGINE_I18N_KEYS)).toContain(
      'missing string dengue.headline.emergency',
    );
    expect(checkStrings(protocol, { ...strings, 'dengue.extra': 'x' }, ENGINE_I18N_KEYS)).toContain(
      'unused string dengue.extra',
    );
  });

  it('rejects a malformed strings file', () => {
    expect(() => parseStrings({ locale: 'en' })).toThrow(ProtocolError);
  });
});

describe('generated files are up to date', () => {
  it('schema/protocol.schema.json matches the zod schema', () => {
    const onDisk = readJson(join(packageRoot, 'schema', 'protocol.schema.json'));
    expect(onDisk).toEqual(JSON.parse(JSON.stringify(protocolJsonSchema())));
  });

  it('docs/clinical-review-checklist.md lists exactly the open review items', () => {
    const doc = readFileSync(join(repoRoot, 'docs', 'clinical-review-checklist.md'), 'utf8');
    const block = doc.slice(
      doc.indexOf(CHECKLIST_BEGIN),
      doc.indexOf(CHECKLIST_END) + CHECKLIST_END.length,
    );
    expect(block).toBe(renderChecklist(protocol));
  });

  it('the scenario file names this protocol', () => {
    const file = readJson(join(repoRoot, 'tests', 'scenarios', 'dengue.scenarios.json')) as {
      protocolId: string;
    };
    expect(file.protocolId).toBe(protocol.id);
  });
});

describe('schema and integrity checks reject bad protocols', () => {
  const bad = (change: (p: Protocol) => void): string[] => checkProtocolIntegrity(edited(change));

  it('rejects unknown keys and wrong types', () => {
    expect(() => parseProtocol({ ...(rawProtocol as object), surprise: 1 })).toThrow(ProtocolError);
    expect(() => parseProtocol(null)).toThrow(ProtocolError);
    expect(() => parseProtocol({ ...(rawProtocol as object), version: 'v1' })).toThrow(/semver/);
  });

  it('rejects a protocol that fails integrity checks', () => {
    const broken = structuredClone(rawProtocol) as { returnImmediatelyIf: string[] };
    broken.returnImmediatelyIf = [];
    expect(() => parseProtocol(broken)).toThrow(/returnImmediatelyIf/);
  });

  it('finds duplicate ids, unknown thresholds, flags, fields and answers', () => {
    expect(
      bad((p) => {
        p.rules.push(structuredClone(p.rules[0]!));
      }),
    ).toContainEqual(expect.stringContaining('duplicate id'));
    expect(
      bad((p) => {
        p.core.recentFeverDaysThreshold = 'nope';
      }),
    ).toContain('core references unknown threshold nope');
    expect(
      bad((p) => {
        p.rules[0]!.when = { op: 'flag', name: 'nope' };
      }),
    ).toContain('unknown flag nope');
    expect(
      bad((p) => {
        p.rules[0]!.when = { op: 'num', field: 'nope', cmp: 'lt', value: 1 };
      }),
    ).toContain('condition on nope uses unknown numeric field nope');
    expect(
      bad((p) => {
        p.rules[0]!.when = { op: 'tri', ref: 'nope', is: 'YES' };
      }),
    ).toContain('condition uses unknown answer nope');
    expect(
      bad((p) => {
        p.rules[0]!.when = { op: 'tri', ref: 'symptoms.', is: 'YES' };
      }),
    ).toContain('condition uses unknown answer symptoms.');
    expect(
      bad((p) => {
        p.rules[0]!.when = {
          op: 'trend',
          field: 'hematocrit',
          dir: 'rising',
          minRelativeChange: 'nope',
        };
      }),
    ).toContain('trend on hematocrit references unknown threshold nope');
    expect(
      bad((p) => {
        p.rules[0]!.when = { op: 'num', field: 'ageMonths', cmp: 'lt' };
      }),
    ).toContain('condition on ageMonths must give exactly one of threshold or value');
    expect(
      bad((p) => {
        p.rules[0]!.when = {
          op: 'num',
          field: 'ageMonths',
          cmp: 'lt',
          value: 1,
          threshold: 'infantAgeMonths',
        };
      }),
    ).toContain('condition on ageMonths must give exactly one of threshold or value');
  });

  it('checks danger sign tests and walks nested conditions', () => {
    expect(
      bad((p) => {
        p.dangerSigns[0]!.test = { kind: 'tri', ref: 'nope', is: 'YES' };
      }),
    ).toContain('danger sign CANNOT_KEEP_FLUIDS uses unknown answer nope');
    expect(
      bad((p) => {
        p.dangerSigns[1]!.test = { kind: 'num', field: 'nope', cmp: 'gte', value: 1 };
      }),
    ).toContain('danger sign PERSISTENT_VOMITING uses unknown numeric field nope');
    expect(
      bad((p) => {
        p.dangerSigns[0]!.applicableWhen = {
          op: 'not',
          of: { op: 'any', of: [{ op: 'flag', name: 'nope' }] },
        };
      }),
    ).toContain('unknown flag nope');
  });

  it('requires sources to exist and SOURCE items to cite something', () => {
    expect(
      bad((p) => {
        p.dangerSigns[0]!.sourceRefs = [{ doc: 'MISSING', section: '1' }];
      }),
    ).toContain('source document MISSING is not listed in sources');
    expect(
      bad((p) => {
        p.dangerSigns[0]!.sourceRefs = [];
      }),
    ).toContain('CANNOT_KEEP_FLUIDS is marked SOURCE but cites nothing');
  });

  it('enforces the structural safety invariants', () => {
    expect(
      bad((p) => {
        p.rules[0]!.level = 'HOME_CARE_WITH_TRIGGERS';
      }),
    ).toContainEqual(expect.stringContaining('can only raise'));
    expect(
      bad((p) => {
        p.uncertainDanger.level = 'EMERGENCY_NOW';
      }),
    ).toContain('uncertainDanger must not exceed SEE_DOCTOR_TODAY (spec 5.1: capped)');
    expect(
      bad((p) => {
        p.unknownEmergencyRule.level = 'SEE_DOCTOR_TODAY';
      }),
    ).toContain('unknownEmergencyRule must be EMERGENCY_NOW');
    expect(
      bad((p) => {
        p.levels.EMERGENCY_NOW.actions = [];
      }),
    ).toContain('level EMERGENCY_NOW has no actions');
    expect(
      bad((p) => {
        p.watchFor = [];
      }),
    ).toContain('watchFor must not be empty (spec 2.4)');
    expect(
      bad((p) => {
        p.returnImmediatelyIf = [];
      }),
    ).toContain('returnImmediatelyIf must not be empty (spec 2.4)');
    expect(
      bad((p) => {
        p.version = 'one';
      }),
    ).toContain('version one is not semver');
  });

  it('will not accept REVIEWED while anything is still open or the reviewer is unnamed', () => {
    const issues = bad((p) => {
      p.reviewStatus = 'REVIEWED';
    });
    expect(issues).toContain('REVIEWED needs reviewer name, registration number and date');
    expect(issues).toContainEqual(expect.stringContaining('is still open'));
    expect(issues).toContain('REVIEWED but threshold plateletRapidFallFraction is still open');
  });

  it('accepts REVIEWED only when every item is signed off and every threshold is decided', () => {
    const signedOff = edited((p) => {
      p.reviewStatus = 'REVIEWED';
      p.review = {
        reviewerName: 'Dr Example',
        registrationNumber: 'REG-0',
        reviewedOn: '2026-12-01',
      };
      for (const t of Object.values(p.thresholds)) {
        t.review = 'REVIEWED';
        t.value ??= 0.5;
      }
      for (const item of [
        ...p.dangerSigns,
        ...p.rules,
        ...p.riskFactors,
        ...p.testingAdvice,
        p.noFeverDangerSign,
        p.unknownEmergencyRule,
        p.uncertainDanger,
      ]) {
        item.review = 'REVIEWED';
      }
    });
    expect(checkProtocolIntegrity(signedOff)).toEqual([]);
    expect(renderChecklist(signedOff)).toContain('0 of');
  });
});

describe('release gate (spec 5.5)', () => {
  it('refuses a draft protocol unless drafts are allowed', () => {
    expect(() => {
      assertProtocolServable(protocol, { allowDraft: false });
    }).toThrow(ProtocolGateError);
    expect(() => {
      assertProtocolServable(protocol, { allowDraft: true });
    }).not.toThrow();
  });

  it('serves a reviewed protocol without the flag', () => {
    const reviewed = edited((p) => {
      p.reviewStatus = 'REVIEWED';
    });
    expect(() => {
      assertProtocolServable(reviewed, { allowDraft: false });
    }).not.toThrow();
    expect(showsDraftBanner(reviewed)).toBe(false);
  });

  it('ALLOW_DRAFT_PROTOCOL only works in dev, staging and test', () => {
    expect(allowDraftFromEnv({})).toBe(false);
    expect(allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'false', APP_ENV: 'staging' })).toBe(false);
    expect(allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'true', APP_ENV: 'staging' })).toBe(true);
    expect(allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'true', APP_ENV: 'development' })).toBe(true);
    expect(allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'true', APP_ENV: 'test' })).toBe(true);
  });

  it('ALLOW_DRAFT_PROTOCOL in production (or with no environment named) is a startup error', () => {
    expect(() =>
      allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'true', APP_ENV: 'production' }),
    ).toThrow(ProtocolGateError);
    expect(() => allowDraftFromEnv({ ALLOW_DRAFT_PROTOCOL: 'true' })).toThrow(ProtocolGateError);
  });
});
