# ADR 0021: Web app (M2): what was built, what was deferred, and the tester display floor

Status: Accepted · 2026-10-31 (M2 implementation decisions within spec sections 3, 6, 7, 14, 17, 19)

## Context

M2 is the first thing real people can try: an anonymous, no-backend triage app with a landing page. ADR 0003 and ADR 0004 name a larger stack (Tailwind, Radix, React Hook Form, Zustand, TanStack Query, i18next, self-hosted fonts). The first release goes to a few private testers with a DRAFT protocol, and the JavaScript budget on the triage route is 200 KB gzipped.

## Decision

1. **Ship only what M2 needs.** Next.js static export + React + plain CSS. Tailwind, Radix, React Hook Form, Zustand, TanStack Query and i18next are **not installed yet**; each arrives with the milestone that needs it (accounts and forms in M4, server state in M3 and later). There is no component library to learn, and every dependency saved is JavaScript not shipped. This is a deferral of ADR 0003/0004, not a reversal.
2. **Small typed i18n instead of i18next for now.** One flat key-to-text table per language; English is bundled, Hindi and Marathi load on demand; a missing key falls back to English. Compiler and tests enforce that all three languages define the same keys, the same numbers and the same placeholders. Hindi and Marathi carry a visible "translation under review" badge. Moving to i18next later is mechanical (the keys are already flat and namespaced by dot). Plural forms are not needed yet; Indian digit grouping is in `formatIndianNumber`.
3. **System fonts for now.** Self-hosted, subsetted Bricolage Grotesque, Inter and Noto Sans Devanagari (ADR 0004) need font files to be downloaded and checked for licence. Until then the page uses the device's own fonts, which also keeps it low-data. TODO W-003.
4. **The protocol is validated in Node, not in the browser.** `apps/web/scripts/verify-protocol.mjs` runs before every build: it parses the protocol and all three string files with the full schema, checks key parity, and applies the release gate (`allowDraftFromEnv`, `assertProtocolServable`). The browser bundle imports the validated JSON and the engine only, so zod is not shipped.
5. **Release gate on the web build (spec 5.5).** `pnpm build` (development and CI) and `pnpm build:tester` allow the DRAFT protocol explicitly (`APP_ENV` = `test` or `staging`). `pnpm build:release` sets nothing and therefore **refuses to build while the protocol is not REVIEWED**. `APP_ENV=production` with drafts allowed is also refused, and `TESTER_MODE=true` cannot be combined with `APP_ENV=production`. A mistyped `TESTER_MODE` (anything but `true` or `false`) fails the build rather than silently shipping without the banner.
6. **`TESTER_MODE` is a build flag, not a runtime switch.** It is inlined at build time and cannot be toggled by a URL or a setting. In a tester build: a persistent banner on every screen in en/hi/mr; a **display floor** (below); `noindex` meta, `robots.txt` Disallow and an `X-Robots-Tag` header; a "Send feedback" link. A build that is not a tester build but still has an unreviewed protocol shows the draft banner instead (spec 5.5) and is also noindex.
7. **The display floor changes only what is displayed.** `applyDisplayFloor(level, testerMode)` raises HOME_CARE_WITH_TRIGGERS to TEST_AND_MONITOR for display and never lowers any level. The engine, the protocol, the scenarios and the recorded engine level are untouched, so the clinical rules are tested exactly as they will ship. When the floor raises a result, the screen shows TEST_AND_MONITOR's own headline and actions, and "If you are unsure, see a doctor." The result still lists the warning signs and the "go to a hospital immediately" triggers. Tests prove it for all four levels and for all 163 clinical scenarios using the real engine.
8. **Nothing leaves the device.** No analytics, no cookies, no network API in the app source (a test scans for `fetch`, `XMLHttpRequest`, `sendBeacon`, `document.cookie`, third-party scripts and remote assets). The only things remembered are the chosen language and the "Large text" setting, in `localStorage` (wrapped for blocked storage). Results are not stored in M2 (spec 6 says anonymous results go to IndexedDB so they can be claimed on sign-up: deferred to M4, TODO W-005). A strict Content-Security-Policy in `public/_headers` (`connect-src 'self'`) makes the browser refuse any other request.
9. **Intake mapping is explicit.** Every question that was shown sends an explicit answer; one that was never shown sends nothing, which the engine reads as UNKNOWN. "Not sure" on pregnancy, blood thinner and lives-alone is sent as YES (cautious). "Not sure" on danger questions stays UNKNOWN so the protocol's policy applies. A test checks that every symptom the protocol looks at has a question.
10. **Fail-safe.** `assess()` turns any exception, an unknown level or an empty "return immediately" list into the spec 2.3 fail-safe screen with the exact required text and the 108 and 112 buttons.

## Alternatives rejected

- **A runtime tester switch or a URL parameter**: a tester link could be edited to remove the banner. A build flag cannot.
- **Putting the floor inside the engine or the protocol**: it would change the clinical rules under test and weaken the scenario suite. A display-layer floor leaves them untouched and is trivially removable.
- **Building the full ADR 0003 stack up front**: more code and more JavaScript for no M2 benefit.
- **Downloading web fonts now**: needs a download and licence check; not needed for a tester release.
- **Validating the protocol with zod in the browser**: about 50 KB of JavaScript to repeat a check already done at build time.

## Consequences

- Initial JavaScript on the check screen is about 204 KB gzipped, slightly over the 200 KB budget (TODO G-004). Likely cuts: strip review-only metadata (`basis`, `sourceRefs`, notes) from the bundled protocol at build time; load Hindi and Marathi chunks only on demand (already done).
- There is no service worker yet, so there is no offline use (M7).
- The floor over-triages by design. It is removed by building without `TESTER_MODE`; the public release needs a `REVIEWED` protocol anyway.

## Visual design (added 2026-10-31)

The first build was a plain functional skin and felt generic. The design was reworked for a worried family member on a phone, including older relatives:

- **One idea: the brand's heartbeat line.** A calm line, a small orange bump (the first hint) and, much later, the big spike ("Bhanak pehle, khatra baad mein"). It draws itself once on the landing page (static when motion is reduced) and is the progress meter in the question flow (`Pulse.tsx`).
- **Type:** a system serif stack for headlines (warm, readable, no font download) and system sans for text; 19 px body, larger on the question and result screens; extra line height for Devanagari. Everything is in rem, so browser text size works.
- **Ease of use:** one question per screen; answer rows at least 68 px tall with a visible tick when chosen; Yes and No side by side with "I'm not sure" full width below; 56 px or larger buttons; Back at the top left; the emergency numbers repeated at the foot of every question. A "Large text" switch (AA) raises the base size by a quarter and is remembered on the device.
- **Palette:** the spec's ink, teal, alert red and hint orange on white and a cool mist; level colours are never the only signal (icon and words as well). No dark mode yet (TODO W-012).
- **Restraint:** no cards for their own sake, no numbered steps (the three rows are not a strict sequence), no eyebrow labels, one animation.

## Complete translation and the home page (added 2026-10-31)

- **Nothing visible is hard-coded in English.** The headline, tagline, page title, navigation label, 404 page and the audit line on the result screen all come from the translation tables. Tests fail if any Hindi or Marathi string, or any Hindi or Marathi screen, shows a stray English word (allowed: the brand name and wordmark, medical abbreviations such as NS1, AST and ORS, the "AA" glyph, and the titles of cited guidelines, which carry `lang="en"`), and fail if a component has literal text in its markup.
- **Home page** (spec 19, without invented content): hero with trust facts; a "what to watch for" carousel; how it works; features; where the guidance comes from; questions people ask; a closing call to action. The carousel is built for older users: Previous and Next buttons, dots, swipe (CSS scroll snapping), keyboard focus, and **no automatic movement**. Its text is the protocol's own watch-for guidance, and the day strip reads the critical-phase days from the protocol, so the page cannot disagree with the rules. No testimonials, statistics or "trusted by" claims: none exist yet. Only sources with a confirmed publisher are listed; a draft protocol says so plainly, and "reviewed by" appears only once a real review is recorded.

## Signboard redesign and the check-first home page (added 2026-10-31)

The home page had become a generic list of sections. It was rebuilt around the one thing the product is for, starting a symptom check:

- **Design language: Indian hospital wayfinding.** Hospital signboards are bold, high-contrast, pictogram-led and trilingual. The home page uses that: the title is a sign (pictogram block, the language on screen large, the other two languages beneath), and the four possible answers are shown as signs in the level colours. The outcome signs list only what the person can actually be shown (a tester build shows three, because it never shows home care). The few labels needed in all three languages live in `src/i18n/signs.ts`, and a test checks them against the real tables.
- **The first question is in the hero.** "Who is this check for?" is three large doors that go straight into the check with the answer already given (`/check/#who=CHILD` starts at the age question; the part after # never reaches a server). Nothing else in the hero competes with them.
- **Full-width bands** (hero, outcomes, what to watch for, where to go, questions and sources, final call to action) instead of one narrow column; two-column layouts on wide screens, including an illustration beside the questions in the check flow.
- **Pictures are original SVG illustrations** of an Indian city hospital (108 ambulance, a black-and-yellow auto-rickshaw, a neem tree, a family walking to the entrance; the sun is the brand's hint orange). Real photographs were not used: they cannot be fetched or licensed from here. The illustrations cost no download, no licence and no image request, and are marked decorative for screen readers.
- Cut as not serving the check: the features list and the "how it works" rows.
