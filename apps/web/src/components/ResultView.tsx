'use client';

import { useEffect, useRef, useState } from 'react';
import type { TriageResult } from '@bhanak/triage-engine';
import { useI18n } from '../i18n/I18nProvider';
import type { DisplayModel } from '../lib/display';
import { buildSummaryText } from '../lib/summary';
import { CallButtons } from './CallButtons';
import { RestartIcon, ShareIcon } from './Icons';
import { LevelIcon } from './LevelIcon';

function List({ title, keys, className }: { title: string; keys: string[]; className?: string }) {
  const { t } = useI18n();
  if (keys.length === 0) return null;
  return (
    <section className={className}>
      <h2>{title}</h2>
      <ul>
        {keys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </section>
  );
}

export function ResultView({
  result,
  display,
  onRestart,
}: {
  result: TriageResult;
  display: DisplayModel;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const share = async () => {
    const text = buildSummaryText(t, result, display, new Date().toLocaleDateString());
    try {
      if (typeof navigator.share === 'function') await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* the person cancelled sharing, or clipboard is blocked: nothing to report */
    }
  };

  const reasonKeys = result.reasons.map((reason) => reason.i18nKey);
  const riskKeys = result.riskFactorIds.map((id) => `dengue.risk.${id.toLowerCase()}`);
  const urgent = display.level === 'EMERGENCY_NOW';

  return (
    <article aria-labelledby="result-title" data-testid="result" data-level={display.level}>
      <h1 id="result-title" ref={heading} tabIndex={-1} className="visually-hidden">
        {t('result.title')}
      </h1>
      <div className={`level-card level-${display.level}`} role="status" aria-live="polite">
        <span className="level-icon">
          <LevelIcon level={display.level} />
        </span>
        <div>
          <p className="level-label" data-testid="level-label">
            {t(`level.${display.level}`)}
          </p>
          <p className="level-headline">{t(display.headlineKey)}</p>
          {display.showUnsureNote ? (
            <p className="level-unsure" data-testid="unsure-note">
              {t('result.unsure')}
            </p>
          ) : null}
        </div>
      </div>

      {urgent ? <CallButtons /> : null}

      <List title={t('result.todo')} keys={display.actionKeys} />
      <List title={t('result.critical')} keys={result.criticalPhaseNotes} className="note-box" />
      <List title={t('result.why')} keys={reasonKeys} />
      <List title={t('result.risks')} keys={riskKeys} />
      <List title={t('result.testing')} keys={result.testingAdvice} />
      <List title={t('result.watch')} keys={result.watchFor} />
      <List
        title={t('result.returnNow')}
        keys={result.returnImmediatelyIf}
        className="return-box"
      />

      {urgent ? null : <CallButtons />}

      <div className="result-actions">
        <button type="button" className="button button-secondary" onClick={() => void share()}>
          <ShareIcon />
          {t('result.share')}
        </button>
        <button type="button" className="button button-secondary" onClick={onRestart}>
          <RestartIcon />
          {t('result.startOver')}
        </button>
        <p role="status" className="meta">
          {copied ? t('result.shareDone') : ''}
        </p>
      </div>

      <p className="meta" data-testid="record">
        {t('result.record', {
          protocol: `${result.protocolId} ${result.protocolVersion} (${result.protocolReviewStatus})`,
          engine: result.engineVersion,
          hash: result.inputHash.slice(0, 8),
        })}
      </p>
    </article>
  );
}
