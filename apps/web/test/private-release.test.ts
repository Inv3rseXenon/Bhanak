import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import robots from '../src/app/robots';
import { isIndexable } from '../src/lib/seo';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(webRoot, 'src');

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* sourceFiles(full);
    else if (/\.(ts|tsx|css|js|mjs)$/.test(name)) yield full;
  }
}

const sources = [...sourceFiles(srcRoot)].map((file) => ({
  file: relative(webRoot, file).split(sep).join('/'),
  text: readFileSync(file, 'utf8'),
}));

describe('private tester release: nothing leaves the device', () => {
  it('finds the source files', () => {
    expect(sources.length).toBeGreaterThan(15);
  });

  it('uses no network API in the app source', () => {
    const forbidden = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bsendBeacon\b/,
      /\bWebSocket\b/,
      /\bEventSource\b/,
      /navigator\.serviceWorker/,
    ];
    for (const { file, text } of sources) {
      for (const pattern of forbidden)
        expect(text, `${file} ${String(pattern)}`).not.toMatch(pattern);
    }
  });

  it('sets no cookies and uses no storage except the remembered language', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/document\.cookie/);
      expect(text, file).not.toMatch(/indexedDB|sessionStorage/);
      if (!file.endsWith('I18nProvider.tsx')) expect(text, file).not.toMatch(/localStorage/);
    }
    const provider = sources.find((s) => s.file.endsWith('I18nProvider.tsx'))?.text ?? '';
    const keys = [...provider.matchAll(/(?:get|set)Item\(([^,)]+)/g)].map((m) => m[1]);
    expect(new Set(keys)).toEqual(new Set(['STORAGE_KEY']));
    expect(provider).toMatch(/STORAGE_KEY = 'lang'/);
  });

  it('loads no analytics, tracking, ad or third-party script', () => {
    const forbidden =
      /gtag|google-analytics|googletagmanager|plausible|mixpanel|segment|hotjar|clarity|sentry|posthog|facebook|fbq|<script/i;
    for (const { file, text } of sources) expect(text, file).not.toMatch(forbidden);
    const pkg = JSON.parse(readFileSync(join(webRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      '@bhanak/shared',
      '@bhanak/triage-engine',
      'next',
      'react',
      'react-dom',
    ]);
  });

  it('references no remote asset (fonts, images, scripts, styles)', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/(?:src|href)=["']https?:\/\/(?!docs\.google\.com)/);
      expect(text, file).not.toMatch(/url\(\s*["']?https?:/);
      expect(text, file).not.toMatch(/@import/);
    }
  });

  it('ships response headers that block indexing and every third party', () => {
    const headers = readFileSync(join(webRoot, 'public', '_headers'), 'utf8');
    expect(headers).toMatch(/X-Robots-Tag: noindex, nofollow/);
    expect(headers).toMatch(/Referrer-Policy: no-referrer/);
    const csp = /Content-Security-Policy: (.*)/.exec(headers)?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/https?:\/\//);
  });
});

describe('indexing', () => {
  it('a tester build is never indexable, whatever the review status', () => {
    expect(isIndexable(true, 'REVIEWED')).toBe(false);
    expect(isIndexable(true, 'DRAFT')).toBe(false);
  });
  it('an unreviewed protocol is never indexable', () => {
    expect(isIndexable(false, 'DRAFT')).toBe(false);
  });
  it('only a reviewed, non-tester build may be indexed', () => {
    expect(isIndexable(false, 'REVIEWED')).toBe(true);
  });
  it('robots.txt disallows everything for the current (draft) protocol', () => {
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});
