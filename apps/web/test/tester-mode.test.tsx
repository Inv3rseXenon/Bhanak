// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { EmergencyView } from '../src/components/EmergencyView';
import { Landing } from '../src/components/Landing';
import { Wizard } from '../src/components/Wizard';
import { FEEDBACK_URL_PLACEHOLDER } from '../src/config';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { mr } from '../src/i18n/mr';
import { englishMessages } from '../src/i18n/messages';
import type * as Config from '../src/config';
import { expectNoAxeViolations, fireEvent, renderApp, screen, waitFor, walk } from './helpers';

// This file runs the app as a private tester build (TESTER_MODE=true).
vi.mock('../src/config', async (importOriginal) => ({
  ...(await importOriginal<typeof Config>()),
  TESTER_MODE: true,
}));

const msg = (key: string): string => englishMessages[key] ?? `MISSING ${key}`;

const BANNER_EN =
  'TEST VERSION, NOT MEDICALLY REVIEWED. Not for real medical decisions. In an emergency call 108 or 112.';

const screens = () => [<Landing key="a" />, <Wizard key="b" />, <EmergencyView key="c" />];

describe('TESTER_MODE banner', () => {
  it('shows the exact banner text on every screen, replacing the draft banner', () => {
    for (const ui of screens()) {
      const { unmount } = renderApp(ui);
      expect(screen.getByTestId('tester-banner').textContent).toBe(BANNER_EN);
      expect(screen.queryByTestId('draft-banner')).toBeNull();
      unmount();
    }
  });

  it('stays on the result and the fail-safe screens too', () => {
    renderApp(<Wizard />);
    walk();
    expect(screen.getByTestId('tester-banner').textContent).toBe(BANNER_EN);
  });

  it('is shown in Hindi and Marathi', async () => {
    renderApp(<Landing />);
    for (const [button, text] of [
      ['हिन्दी', hi['banner.tester']],
      ['मराठी', mr['banner.tester']],
      ['English', en['banner.tester']],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: button }));
      await waitFor(() => {
        expect(screen.getByTestId('tester-banner').textContent).toBe(text);
      });
    }
  });

  it('is a persistent (sticky) banner at the very top of the page', () => {
    renderApp(<Landing />);
    const banner = screen.getByTestId('tester-banner');
    expect(banner.className).toContain('banner');
    expect(banner.previousElementSibling?.className).toBe('skip-link'); // nothing but the skip link before it
  });
});

describe('TESTER_MODE display floor', () => {
  it('never shows home care: a person with no fever and no warning sign sees TEST_AND_MONITOR', () => {
    renderApp(<Wizard />);
    walk({
      'intake.feverNow.title': en['intake.no'],
      'intake.feverSettled.title': en['intake.no'],
    });
    const result = screen.getByTestId('result');
    expect(result.getAttribute('data-level')).toBe('TEST_AND_MONITOR');
    expect(screen.getByTestId('level-label').textContent).toBe(en['level.TEST_AND_MONITOR']);
    expect(screen.getByTestId('unsure-note').textContent).toBe('If you are unsure, see a doctor.');
    expect(result.textContent).not.toContain(en['level.HOME_CARE_WITH_TRIGGERS']);
    expect(result.textContent).not.toContain(msg('dengue.headline.home_care'));
    // The warning signs and the go-to-hospital list are still there.
    expect(screen.getByText(en['result.returnNow'])).toBeTruthy();
    expect(screen.getByText(msg('dengue.return.breathing'))).toBeTruthy();
  });

  it('shows the unsure note in Hindi too', async () => {
    renderApp(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    await waitFor(() => {
      expect(screen.getByTestId('tester-banner').textContent).toBe(hi['banner.tester']);
    });
    // Answer by position-independent labels: the walker matches English titles, so finish in English.
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => {
      expect(screen.getByTestId('tester-banner').textContent).toBe(BANNER_EN);
    });
    walk({
      'intake.feverNow.title': en['intake.no'],
      'intake.feverSettled.title': en['intake.no'],
    });
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    await waitFor(() => {
      expect(screen.getByTestId('unsure-note').textContent).toBe(hi['result.unsure']);
    });
  });

  it('does not touch emergency results', () => {
    renderApp(<Wizard />);
    walk({ 'intake.fluids.title': en['intake.no'] });
    expect(screen.getByTestId('result').getAttribute('data-level')).toBe('EMERGENCY_NOW');
    expect(screen.queryByTestId('unsure-note')).toBeNull();
  });

  it('has no accessibility violations on the tester result screen', async () => {
    const { container } = renderApp(<Wizard />);
    walk();
    await expectNoAxeViolations(container);
  });
});

describe('Send feedback link', () => {
  it('is on every screen and opens the form safely', () => {
    for (const ui of screens()) {
      const { unmount } = renderApp(ui);
      const link = screen.getByTestId('feedback-link');
      expect(link.textContent).toBe(en['footer.feedback']);
      expect(link.getAttribute('href')).toBe(FEEDBACK_URL_PLACEHOLDER);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      unmount();
    }
  });

  it('is translated', async () => {
    renderApp(<Landing />);
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    await waitFor(() => {
      expect(screen.getByTestId('feedback-link').textContent).toBe(hi['footer.feedback']);
    });
  });
});

describe('landing page in tester mode', () => {
  it('says it is a private test version and hides the public waitlist', () => {
    renderApp(<Landing />);
    expect(screen.getByText(en['landing.tester'])).toBeTruthy();
    expect(screen.queryByText(en['landing.waitlist'])).toBeNull();
  });
});
