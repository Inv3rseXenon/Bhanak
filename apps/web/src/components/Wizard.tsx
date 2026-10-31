'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TESTER_MODE } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import { assess } from '../lib/assess';
import type { Assessment } from '../lib/assess';
import {
  LAB_FIELDS,
  LAB_TESTS,
  tempUnit,
  toTriageInput,
  validateStep,
  visibleSteps,
} from '../lib/intake';
import type { Answers, Step } from '../lib/intake';
import { protocol } from '../lib/protocol';
import { FailSafeView } from './FailSafeView';
import { BackIcon } from './Icons';
import { PulseProgress } from './Pulse';
import { ResultView } from './ResultView';
import { EntranceScene } from './Scenes';

type Setter = (key: string, value: string | string[]) => void;

function TriButtons({
  step,
  answers,
  onPick,
}: {
  step: Step;
  answers: Answers;
  onPick: (value: string) => void;
}) {
  const { t } = useI18n();
  const options = [
    ['YES', 'intake.yes'],
    ['NO', 'intake.no'],
    ['UNKNOWN', 'intake.notSure'],
  ] as const;
  return (
    <div className="choices choices-tri">
      {options.map(([value, labelKey]) => (
        <button
          key={value}
          type="button"
          className="choice"
          aria-pressed={answers[step.id] === value}
          onClick={() => {
            onPick(value);
          }}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}

function StepBody({
  step,
  answers,
  set,
  advance,
}: {
  step: Step;
  answers: Answers;
  set: Setter;
  /** Move on, optionally with an answer that was just given (state updates are asynchronous). */
  advance: (patch?: Answers) => void;
}) {
  const { t } = useI18n();
  const text = (key: string): string => {
    const value = answers[key];
    return typeof value === 'string' ? value : '';
  };

  switch (step.kind) {
    case 'tri':
      return (
        <TriButtons
          step={step}
          answers={answers}
          onPick={(value) => {
            advance({ [step.id]: value });
          }}
        />
      );
    case 'choice':
      return (
        <div className="choices">
          {step.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              className="choice"
              aria-pressed={answers[step.id] === option.value}
              onClick={() => {
                advance({ [step.id]: option.value });
              }}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      );
    case 'multi': {
      const stored = answers[step.id];
      const selected: string[] = Array.isArray(stored) ? stored : [];
      return (
        <div className="choices">
          {step.options?.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label key={option.value} className="choice choice-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    set(
                      step.id,
                      checked
                        ? selected.filter((value) => value !== option.value)
                        : [...selected, option.value],
                    );
                  }}
                />
                <span>{t(option.labelKey)}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case 'age': {
      const unit = text('ageUnit') === 'MONTHS' ? 'MONTHS' : 'YEARS';
      return (
        <div>
          <label htmlFor="age-input" className="field-label">
            {t('intake.age.label')}
          </label>
          <input
            id="age-input"
            className="input"
            inputMode="numeric"
            autoComplete="off"
            value={text('age')}
            onChange={(event) => {
              set('age', event.target.value);
            }}
          />
          <div
            role="radiogroup"
            aria-label={`${t('intake.age.years')} / ${t('intake.age.months')}`}
            className="unit-switch"
          >
            {(['YEARS', 'MONTHS'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={unit === value}
                className="choice"
                onClick={() => {
                  set('ageUnit', value);
                }}
              >
                {t(value === 'YEARS' ? 'intake.age.years' : 'intake.age.months')}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case 'count':
      return (
        <div>
          <label htmlFor="count-input" className="field-label">
            {t('intake.count.label')}
          </label>
          <input
            id="count-input"
            className="input"
            inputMode="numeric"
            autoComplete="off"
            value={text(step.id) === 'UNKNOWN' ? '' : text(step.id)}
            onChange={(event) => {
              set(step.id, event.target.value);
            }}
          />
          <button
            type="button"
            className="choice"
            aria-pressed={text(step.id) === 'UNKNOWN'}
            onClick={() => {
              advance({ [step.id]: 'UNKNOWN' });
            }}
          >
            {t('intake.notSure')}
          </button>
        </div>
      );
    case 'temp':
      return (
        <div>
          <label htmlFor="temp-input" className="field-label">
            {t('intake.maxTemp.label')}
          </label>
          <input
            id="temp-input"
            className="input"
            inputMode="decimal"
            autoComplete="off"
            value={text('maxTemp') === 'UNKNOWN' ? '' : text('maxTemp')}
            onChange={(event) => {
              set('maxTemp', event.target.value);
            }}
          />
          <div role="radiogroup" aria-label={t('intake.maxTemp.label')} className="unit-switch">
            {(['C', 'F'] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                role="radio"
                aria-checked={tempUnit(answers) === unit}
                className="choice"
                onClick={() => {
                  set('tempUnit', unit);
                }}
              >
                {unit === 'C' ? '°C' : '°F'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="choice choice-plain"
            onClick={() => {
              advance({ maxTemp: 'UNKNOWN' });
            }}
          >
            {t('intake.skip')}
          </button>
        </div>
      );
    case 'labs':
      return (
        <div className="lab-fields">
          {LAB_FIELDS.map((field) => (
            <div key={field}>
              <label htmlFor={`lab-${field}`} className="field-label">
                {t(`intake.labs.${field}`)}
              </label>
              <input
                id={`lab-${field}`}
                className="input"
                inputMode="decimal"
                autoComplete="off"
                value={text(`lab.${field}`)}
                onChange={(event) => {
                  set(`lab.${field}`, event.target.value);
                }}
              />
            </div>
          ))}
          {LAB_TESTS.map((test) => (
            <div key={test}>
              <label htmlFor={`lab-${test}`} className="field-label">
                {t(`intake.labs.${test}`)}
              </label>
              <select
                id={`lab-${test}`}
                className="input"
                value={text(`lab.${test}`)}
                onChange={(event) => {
                  set(`lab.${test}`, event.target.value);
                }}
              >
                <option value="">{t('intake.labs.notEntered')}</option>
                <option value="POSITIVE">{t('intake.labs.positive')}</option>
                <option value="NEGATIVE">{t('intake.labs.negative')}</option>
                <option value="NOT_DONE">{t('intake.labs.notDone')}</option>
              </select>
            </div>
          ))}
        </div>
      );
  }
}

/** Questions on the left; on wide screens an illustration of a hospital entrance on the right. */
function CheckLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wrap check-layout">
      <div className="check-main">{children}</div>
      <aside className="check-aside" aria-hidden="true">
        <EntranceScene />
      </aside>
    </div>
  );
}

/** "Who is this for?" can be answered on the home page: /check/#who=CHILD starts at the age question. */
const WHO_FROM_HASH = /^#who=(SELF|CHILD|FAMILY)$/;

/** Guided intake: one question per screen, Back keeps answers, "not sure" on every danger question. */
export function Wizard() {
  const { t, has } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepId, setStepId] = useState('who');
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const steps = useMemo(() => visibleSteps(answers), [answers]);
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === stepId),
  );
  const step = steps[index];

  useEffect(() => {
    const match = WHO_FROM_HASH.exec(window.location.hash);
    if (match?.[1] !== undefined) {
      setAnswers({ who: match[1] });
      setStepId('age');
    }
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [stepId]);

  const finish = (final: Answers) => {
    const now = new Date();
    const input = toTriageInput(final, now, -now.getTimezoneOffset());
    setAssessment(assess(input, protocol, now, TESTER_MODE));
  };

  const restart = () => {
    setAnswers({});
    setStepId('who');
    setError(null);
    setAssessment(null);
  };

  if (assessment !== null) {
    return (
      <CheckLayout>
        {assessment.kind === 'ok' ? (
          <ResultView result={assessment.result} display={assessment.display} onRestart={restart} />
        ) : (
          <FailSafeView onRetry={restart} />
        )}
      </CheckLayout>
    );
  }
  if (step === undefined) return null; // unreachable: visibleSteps always starts with "who"

  const set: Setter = (key, value) => {
    setError(null);
    setAnswers((previous) => ({ ...previous, [key]: value }));
  };

  const advance = (patch: Answers = {}) => {
    const next = { ...answers, ...patch };
    const problem = validateStep(step, next);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setAnswers(next);
    setError(null);
    const list = visibleSteps(next);
    const here = list.findIndex((candidate) => candidate.id === step.id);
    const following = list[here + 1];
    if (following === undefined) finish(next);
    else setStepId(following.id);
  };

  const back = () => {
    const previous = steps[index - 1];
    if (previous !== undefined) {
      setError(null);
      setStepId(previous.id);
    }
  };

  const isLast = index === steps.length - 1;
  const autoAdvances = step.kind === 'tri' || step.kind === 'choice';

  return (
    <CheckLayout>
      <section aria-labelledby="step-title" data-testid="wizard" className="screen">
        <div className="screen-top">
          {index > 0 ? (
            <button type="button" className="back-link" onClick={back}>
              <BackIcon />
              {t('intake.back')}
            </button>
          ) : (
            <span />
          )}
          <p className="progress-text" data-testid="progress">
            {t('intake.progress', { current: index + 1, total: steps.length })}
          </p>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
          aria-label={t('intake.progress', { current: index + 1, total: steps.length })}
        >
          <PulseProgress value={index + 1} max={steps.length} />
        </div>

        <h1 id="step-title" ref={heading} tabIndex={-1} className="question">
          {t(step.titleKey)}
        </h1>
        {step.helpKey !== undefined && has(step.helpKey) ? (
          <p className="help">{t(step.helpKey)}</p>
        ) : null}

        <StepBody step={step} answers={answers} set={set} advance={advance} />

        {error !== null ? (
          <p role="alert" className="error" data-testid="step-error">
            {t(error)}
          </p>
        ) : null}

        {autoAdvances ? null : (
          <div className="nav-buttons">
            <button
              type="button"
              className="button button-primary button-large"
              onClick={() => {
                advance();
              }}
            >
              {t(isLast ? 'intake.seeResult' : 'intake.next')}
            </button>
          </div>
        )}

        <p className="emergency-bar" role="note">
          <span>{t('intake.emergencyBar')}</span> <a href="tel:108">108</a>{' '}
          <a href="tel:112">112</a>
        </p>
      </section>
    </CheckLayout>
  );
}
