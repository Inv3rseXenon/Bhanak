// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { FailSafeView } from '../src/components/FailSafeView';
import { EmergencyView } from '../src/components/EmergencyView';
import { Landing } from '../src/components/Landing';
import { Wizard } from '../src/components/Wizard';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { englishMessages } from '../src/i18n/messages';

const msg = (key: string): string => englishMessages[key] ?? `MISSING ${key}`;
import { assess } from '../src/lib/assess';
import { DANGER_SYMPTOM_KEYS, toTriageInput } from '../src/lib/intake';
import { protocol } from '../src/lib/protocol';
import type { Protocol } from '@bhanak/triage-engine';
import { expectNoAxeViolations, fireEvent, renderApp, screen, waitFor, walk } from './helpers';

// Normal (non-tester) build: the config is read from the environment, where TESTER_MODE is unset.

describe('draft banner (normal build, unreviewed protocol)', () => {
  it('is on every screen and carries the exact draft text', () => {
    for (const ui of [<Landing key="a" />, <Wizard key="b" />, <EmergencyView key="c" />]) {
      const { unmount } = renderApp(ui);
      expect(screen.getByTestId('draft-banner').textContent).toBe(en['banner.draft']);
      expect(screen.queryByTestId('tester-banner')).toBeNull();
      unmount();
    }
  });

  it('has an always-visible Emergency link and the permanent disclaimer on every screen', () => {
    for (const ui of [<Landing key="a" />, <Wizard key="b" />, <EmergencyView key="c" />]) {
      const { unmount } = renderApp(ui);
      expect(screen.getByTestId('emergency-link').getAttribute('href')).toMatch(/^\/emergency\/?$/);
      expect(screen.getByText(en['footer.disclaimer'])).toBeTruthy();
      unmount();
    }
  });

  it('shows no feedback link outside tester mode', () => {
    renderApp(<Landing />);
    expect(screen.queryByTestId('feedback-link')).toBeNull();
  });
});

describe('landing page', () => {
  it('links to the check and the emergency screen, and does not diagnose', () => {
    renderApp(<Landing />);
    const hrefs = (name: string): (string | null)[] =>
      screen.getAllByRole('link', { name }).map((link) => link.getAttribute('href'));
    expect(hrefs(en['landing.cta']).every((href) => /^\/check\/?$/.test(href ?? ''))).toBe(true);
    expect(
      hrefs(en['landing.emergency']).every((href) => /^\/emergency\/?$/.test(href ?? '')),
    ).toBe(true);
    expect(document.body.textContent).toContain('does not diagnose');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderApp(<Landing />);
    await expectNoAxeViolations(container);
  });
});

describe('emergency screen', () => {
  it('offers 108, 112 and the hospital search without login or consent', () => {
    renderApp(<EmergencyView />);
    expect(screen.getByRole('link', { name: en['result.call108'] }).getAttribute('href')).toBe(
      'tel:108',
    );
    expect(screen.getByRole('link', { name: en['result.call112'] }).getAttribute('href')).toBe(
      'tel:112',
    );
    expect(screen.getByRole('link', { name: en['result.findHospital'] })).toBeTruthy();
    for (const key of protocol.returnImmediatelyIf) {
      expect(document.body.textContent).toContain(msg(key));
    }
  });

  it('has no accessibility violations', async () => {
    const { container } = renderApp(<EmergencyView />);
    await expectNoAxeViolations(container);
  });
});

describe('guided intake', () => {
  it('asks one question per screen, starting with who it is for', () => {
    renderApp(<Wizard />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en['intake.who.title']);
    expect(screen.getByTestId('progress').textContent).toMatch(/^Question 1 of \d+$/);
    expect(screen.getByRole('link', { name: '108' }).getAttribute('href')).toBe('tel:108');
  });

  it('asks every danger question with Yes, No and "I\'m not sure"', () => {
    renderApp(<Wizard />);
    const dangerTitles = new Map<string, string>(
      DANGER_SYMPTOM_KEYS.map((key) => [en[`q.${key}.title`], key]),
    );
    const seen = new Set<string>();
    walk({}, (title) => {
      const key = dangerTitles.get(title);
      if (key === undefined) return;
      seen.add(key);
      for (const label of [en['intake.yes'], en['intake.no'], en['intake.notSure']]) {
        expect(screen.queryByRole('button', { name: label }), `${key}: ${label}`).not.toBeNull();
      }
    });
    // A man with no pregnancy question is not asked about periods or fetal movement.
    const expected = DANGER_SYMPTOM_KEYS.filter(
      (key) => key !== 'heavyMenstrualBleeding' && key !== 'reducedFetalMovement',
    );
    expect([...seen].sort()).toEqual([...expected].sort());
  });

  it('keeps the answers when going Back', () => {
    renderApp(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: en['intake.who.child'] }));
    fireEvent.change(screen.getByLabelText(en['intake.age.label']), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: en['intake.back'] }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en['intake.who.title']);
    expect(
      screen.getByRole('button', { name: en['intake.who.child'] }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('will not move past an invalid age', () => {
    renderApp(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: en['intake.who.self'] }));
    fireEvent.change(screen.getByLabelText(en['intake.age.label']), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: en['intake.next'] }));
    expect(screen.getByTestId('step-error').textContent).toBe(en['error.age']);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en['intake.age.title']);
  });

  it('has no accessibility violations on a question screen', async () => {
    const { container } = renderApp(<Wizard />);
    await expectNoAxeViolations(container);
  });
});

describe('results', () => {
  it('is an emergency when a feverish person cannot keep fluids down', () => {
    const { container } = renderApp(<Wizard />);
    walk({ 'intake.fluids.title': en['intake.no'] });
    expect(screen.getByTestId('result').getAttribute('data-level')).toBe('EMERGENCY_NOW');
    expect(screen.getByTestId('level-label').textContent).toBe(en['level.EMERGENCY_NOW']);
    expect(screen.getByRole('link', { name: en['result.call108'] }).getAttribute('href')).toBe(
      'tel:108',
    );
    expect(screen.getByRole('link', { name: en['result.call112'] }).getAttribute('href')).toBe(
      'tel:112',
    );
    expect(container.textContent).toContain(msg('dengue.headline.emergency'));
    return expectNoAxeViolations(container);
  });

  it('always shows the return-immediately list, the warning signs and a record of the rules used', () => {
    renderApp(<Wizard />);
    walk();
    expect(screen.getByText(en['result.returnNow'])).toBeTruthy();
    expect(screen.getByText(msg('dengue.return.breathing'))).toBeTruthy();
    expect(screen.getByTestId('record').textContent).toMatch(/dengue 0\.1\.0 \(draft\)/);
    expect(screen.getByTestId('record').textContent).toMatch(/engine 0\.1\.0/);
  });

  it('shows the engine level unchanged when nothing is wrong: home care with warning signs', () => {
    renderApp(<Wizard />);
    walk({
      'intake.feverNow.title': en['intake.no'],
      'intake.feverSettled.title': en['intake.no'],
    });
    const result = screen.getByTestId('result');
    expect(result.getAttribute('data-level')).toBe('HOME_CARE_WITH_TRIGGERS');
    expect(screen.queryByTestId('unsure-note')).toBeNull();
    // Even the mildest result never says the person is fine.
    expect(result.textContent).toContain(msg('dengue.headline.home_care'));
    expect(result.textContent.toLowerCase()).not.toContain('you are fine');
  });

  it('can start again from the result', () => {
    renderApp(<Wizard />);
    walk();
    fireEvent.click(screen.getByRole('button', { name: en['result.startOver'] }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(en['intake.who.title']);
  });
});

describe('fail-safe (spec 2.3)', () => {
  it('is shown when the engine cannot assess, with the exact text and the emergency numbers', () => {
    const broken = null as unknown as Protocol;
    const input = toTriageInput({ age: '30' }, new Date(), 330);
    expect(assess(input, broken, new Date(), false)).toEqual({ kind: 'failsafe' });

    renderApp(<FailSafeView onRetry={() => undefined} />);
    expect(screen.getByTestId('failsafe').textContent).toContain(en['failsafe.body']);
    expect(screen.getByRole('link', { name: en['result.call108'] }).getAttribute('href')).toBe(
      'tel:108',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = renderApp(<FailSafeView onRetry={() => undefined} />);
    await expectNoAxeViolations(container);
  });
});

describe('languages', () => {
  it('switches to Hindi, shows the "translation under review" badge and the Hindi draft banner', async () => {
    renderApp(<Landing />);
    expect(screen.queryByText(hi['review.badge'])).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    await waitFor(() => {
      expect(screen.getByText(hi['review.badge'])).toBeTruthy();
    });
    expect(screen.getByTestId('draft-banner').textContent).toBe(hi['banner.draft']);
    expect(document.documentElement.lang).toBe('hi');
    expect(screen.getAllByRole('link', { name: hi['landing.cta'] }).length).toBeGreaterThan(0);
  });

  it('switches back to English and drops the badge', async () => {
    renderApp(<Landing />);
    fireEvent.click(screen.getByRole('button', { name: 'मराठी' }));
    await waitFor(() => {
      expect(screen.getByText('भाषांतराचे पुनरावलोकन सुरू आहे')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => {
      expect(screen.queryByText('भाषांतराचे पुनरावलोकन सुरू आहे')).toBeNull();
    });
  });
});
