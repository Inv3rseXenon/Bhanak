import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import type { ReactElement } from 'react';
import { afterEach, expect } from 'vitest';
import { Shell } from '../src/components/Shell';
import { en } from '../src/i18n/en';
import { I18nProvider } from '../src/i18n/I18nProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

/** Render a screen inside the same provider and shell as the real app. */
export function renderApp(ui: ReactElement) {
  return render(
    <I18nProvider>
      <Shell>{ui}</Shell>
    </I18nProvider>,
  );
}

const click = (label: string): void => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

const type = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

export type Overrides = Partial<Record<keyof typeof en, string>>;

/**
 * Answer the intake screens until a result (or the fail-safe) appears. Every question is answered
 * "No" unless `overrides` maps its title to a different button label.
 */
export function walk(overrides: Overrides = {}, onScreen?: (title: string) => void): void {
  const byTitle: Overrides = {
    'intake.who.title': en['intake.who.self'],
    'intake.sex.title': en['intake.sex.male'],
    'intake.feverNow.title': en['intake.yes'],
    'intake.onset.title': en['intake.onset.d2'],
    'intake.fluids.title': en['intake.yes'],
    ...overrides,
  };
  for (let guard = 0; guard < 80; guard += 1) {
    if (screen.queryAllByTestId(/^(result|failsafe)$/).length > 0) return;
    const title = screen.getByRole('heading', { level: 1 }).textContent;
    onScreen?.(title);
    const entry = Object.entries(byTitle).find(([key]) => en[key as keyof typeof en] === title);
    if (entry?.[1] !== undefined) {
      click(entry[1]);
    } else if (title === en['intake.age.title']) {
      type(en['intake.age.label'], '30');
      click(en['intake.next']);
    } else if (title === en['intake.vomiting.title'] || title === en['intake.urine.title']) {
      type(en['intake.count.label'], title === en['intake.urine.title'] ? '4' : '0');
      click(en['intake.next']);
    } else if (title === en['intake.maxTemp.title']) {
      click(en['intake.skip']);
    } else if (
      title === en['intake.conditions.title'] ||
      title === en['intake.other.title'] ||
      title === en['intake.labs.title']
    ) {
      click(en['intake.next']);
    } else {
      click(en['intake.no']);
    }
  }
  throw new Error('the intake did not finish');
}

export async function expectNoAxeViolations(container: Element): Promise<void> {
  // jsdom has no layout, so colour contrast is checked by design (see globals.css), not here.
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
  ).toEqual([]);
}

export { fireEvent, screen, waitFor };
