// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import NotFound from '../src/app/not-found';
import { EmergencyView } from '../src/components/EmergencyView';
import { Landing } from '../src/components/Landing';
import { Wizard } from '../src/components/Wizard';
import { en } from '../src/i18n/en';
import { hi } from '../src/i18n/hi';
import { mr } from '../src/i18n/mr';
import { englishMessages } from '../src/i18n/messages';
import { protocol } from '../src/lib/protocol';
import { strayEnglish } from './stray';
import { expectNoAxeViolations, fireEvent, renderApp, screen, waitFor } from './helpers';

const msg = (key: string): string => englishMessages[key] ?? `MISSING ${key}`;

describe('home page content', () => {
  it('has the sections of a complete home page, each with a heading', () => {
    renderApp(<Landing />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      en['home.watch.title'],
      en['landing.how.title'],
      en['home.features.title'],
      en['home.sources.title'],
      en['faq.title'],
      en['home.cta.title'],
      en['landing.not.title'],
    ]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows five features and six questions with answers', () => {
    renderApp(<Landing />);
    for (let n = 1; n <= 5; n += 1) {
      expect(screen.getByText(msg(`home.features.${n}.title`))).toBeTruthy();
    }
    for (let n = 1; n <= 6; n += 1) {
      expect(screen.getByText(msg(`faq.${n}.q`))).toBeTruthy();
      expect(screen.getByText(msg(`faq.${n}.a`))).toBeTruthy();
    }
    expect(document.querySelectorAll('.faq details')).toHaveLength(6);
  });

  it('cites only sources with a confirmed publisher, and says the protocol is not yet reviewed', () => {
    renderApp(<Landing />);
    const sources = document.querySelector('.sources');
    expect(sources?.textContent).toContain(
      'National Guidelines for Clinical Management of Dengue Fever 2023',
    );
    expect(sources?.textContent).toContain('World Health Organization');
    expect(sources?.textContent).not.toContain('CITATION NEEDED');
    expect(sources?.textContent).toContain(en['home.sources.draft']);
    expect(sources?.textContent).not.toMatch(/medically reviewed|reviewed by/i);
  });

  it('makes no medical claims beyond the protocol: no statistics, no testimonials, no cure words', () => {
    renderApp(<Landing />);
    const text = document.body.textContent;
    expect(text).not.toMatch(/\d+\s?%/);
    expect(text).not.toMatch(/testimonial|customers|trusted by|million|thousand/i);
    expect(text.toLowerCase()).not.toContain('you are fine');
  });

  it('has no accessibility violations (carousel, features, FAQ included)', async () => {
    const { container } = renderApp(<Landing />);
    await expectNoAxeViolations(container);
  });
});

describe('what-to-watch-for carousel', () => {
  const slides = () => screen.getAllByRole('group', { name: /^Slide \d of 5$/ });
  const dots = () => screen.getAllByRole('button', { name: /^Go to slide \d$/ });
  const next = () => screen.getByRole('button', { name: en['carousel.next'] });
  const previous = () => screen.getByRole('button', { name: en['carousel.prev'] });

  it('has five labelled slides built from the protocol watch-for guidance', () => {
    renderApp(<Landing />);
    expect(slides()).toHaveLength(5);
    expect(dots()).toHaveLength(5);
    for (const key of [
      'dengue.watch.fever_falls',
      'dengue.watch.drinks_and_urine',
      'dengue.watch.new_symptoms',
      'dengue.watch.daily_notes',
      'dengue.action.check_painkillers',
    ]) {
      expect(screen.getByText(msg(key))).toBeTruthy();
    }
    for (const key of protocol.watchFor) expect(msg(key)).toBeTruthy();
  });

  it('shows the critical phase days from the protocol, not from a constant in the page', () => {
    renderApp(<Landing />);
    const from = protocol.thresholds.criticalPhaseStartDay?.value ?? -1;
    const to = protocol.thresholds.criticalPhaseEndDay?.value ?? -1;
    const critical = [...document.querySelectorAll('.day-critical')].map((li) => li.textContent);
    expect(critical).toEqual(Array.from({ length: to - from + 1 }, (_, i) => String(from + i)));
    expect(
      screen.getByText(`Days ${String(from)} to ${String(to)}: the critical phase`),
    ).toBeTruthy();
  });

  it('moves with the Previous and Next buttons and the dots, and stops at both ends', () => {
    renderApp(<Landing />);
    expect(previous().hasAttribute('disabled')).toBe(true);
    expect(dots()[0]?.getAttribute('aria-current')).toBe('true');

    fireEvent.click(next());
    expect(dots()[1]?.getAttribute('aria-current')).toBe('true');
    expect(dots()[0]?.getAttribute('aria-current')).toBeNull();
    expect(screen.getAllByText('Slide 2 of 5').length).toBeGreaterThan(0);
    expect(previous().hasAttribute('disabled')).toBe(false);

    fireEvent.click(dots()[4]!);
    expect(next().hasAttribute('disabled')).toBe(true);
    fireEvent.click(previous());
    expect(dots()[3]?.getAttribute('aria-current')).toBe('true');
  });

  it('never moves by itself (no autoplay)', () => {
    vi.useFakeTimers();
    try {
      renderApp(<Landing />);
      vi.advanceTimersByTime(120_000);
      expect(dots()[0]?.getAttribute('aria-current')).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('is reachable by keyboard: the track can take focus and the controls are buttons', () => {
    renderApp(<Landing />);
    expect(screen.getByTestId('carousel-track').getAttribute('tabindex')).toBe('0');
    expect(next().tagName).toBe('BUTTON');
  });
});

/** The text a person sees, without the parts that are legitimately not translated. */
function visibleText(container: Element): string {
  const clone = container.cloneNode(true) as Element;
  // Document titles of the cited guidelines are proper nouns; the wordmark is the logo.
  for (const node of clone.querySelectorAll('[lang="en"], .logo, [data-testid="record"]')) {
    node.remove();
  }
  return clone.textContent;
}

describe.each([
  ['hi', 'हिन्दी', hi],
  ['mr', 'मराठी', mr],
] as const)('no English left on the screens (%s)', (_code, button, table) => {
  it('home page', async () => {
    const { container } = renderApp(<Landing />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => {
      expect(screen.getAllByText(table['landing.cta']).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(table['landing.headline']);
    expect(strayEnglish(visibleText(container))).toEqual([]);
    expect(document.title).toContain(table['meta.title'].replace('{brandName}', '').trim());
  });

  it('question screen', async () => {
    const { container } = renderApp(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(table['intake.who.title']);
    });
    expect(strayEnglish(visibleText(container))).toEqual([]);
  });

  it('emergency screen', async () => {
    const { container } = renderApp(<EmergencyView />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(table['emergency.title']);
    });
    expect(strayEnglish(visibleText(container))).toEqual([]);
  });

  it('page-not-found screen', async () => {
    const { container } = renderApp(<NotFound />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(table['notfound.title']);
    });
    expect(strayEnglish(visibleText(container))).toEqual([]);
  });
});

describe('no hard-coded English in the components', () => {
  const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
  const files = [
    ...readdirSync(join(srcRoot, 'components')).map((f) => join(srcRoot, 'components', f)),
    join(srcRoot, 'app', 'not-found.tsx'),
    join(srcRoot, 'app', 'layout.tsx'),
  ].filter((f) => f.endsWith('.tsx'));

  it('has no visible text written straight into the markup', () => {
    expect(files.length).toBeGreaterThan(8);
    for (const file of files) {
      const found: string[] = [];
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        // Text between a closing ">" and the next "<", with no {expression}: i.e. literal text.
        for (const match of line.matchAll(/>([^<>{}=\n]*[A-Za-z]{3,}[^<>{}=\n]*)</g)) {
          const text = match[1]?.trim() ?? '';
          if (text !== '') found.push(text);
        }
      }
      expect(found, file).toEqual([]);
    }
  });
});
