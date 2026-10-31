# apps/web

Static-export web app (Next.js, React, plain CSS): the anonymous triage app, the emergency screen and the landing page. Milestone **M2**. Decisions and what was deferred: [ADR 0021](../../docs/adr/0021-web-app-m2-decisions.md). Spec sections 3, 6, 7, 14, 17, 19.

## Run, test, build

From the repository root (PowerShell on this machine, see CLAUDE.md for the Node path):

```bash
pnpm --filter @bhanak/web dev       # local development server
pnpm --filter @bhanak/web test      # unit and component tests (vitest, jsdom, axe)
pnpm build                          # everything, drafts allowed (APP_ENV=test)
pnpm build:tester                   # private tester site -> apps/web/out
pnpm build:release                  # production gate: FAILS while the protocol is a DRAFT
```

Deploying the tester site: [docs/runbooks/tester-deploy.md](../../docs/runbooks/tester-deploy.md).

## Build-time settings

| Variable               | Effect                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `TESTER_MODE=true`     | Private tester build: banner on every screen, display floor (never below "Get tested and keep watching"), noindex, feedback link |
| `APP_ENV`              | `development`, `staging`, `test` allow a DRAFT protocol (with `ALLOW_DRAFT_PROTOCOL=true`); `production` never does              |
| `ALLOW_DRAFT_PROTOCOL` | `true` allows a DRAFT protocol (refused unless `APP_ENV` is development, staging or test)                                        |
| `FEEDBACK_URL`         | Target of "Send feedback" (a Google Form)                                                                                        |
| `WAITLIST_URL`         | External early-access form; shown on the public landing page only                                                                |

`scripts/verify-protocol.mjs` runs before every build and enforces the release gate. `scripts/verify-output.mjs` runs after it and checks the exported site (banner, noindex, robots.txt, headers, no tracking code).

## Layout

```
src/app/          pages: / (landing), /check (intake and result), /emergency, robots.txt
src/components/   Shell (banner, header, footer), Wizard, ResultView, FailSafeView, EmergencyView, Landing
src/lib/          intake (questions and answer mapping), assess (engine call, fail-safe), display (tester floor)
src/i18n/         en.ts, hi.ts, mr.ts (UI strings), messages.ts (loads clinical strings from @bhanak/protocols)
public/_headers   noindex header and Content-Security-Policy for Cloudflare Pages / Netlify
test/             display floor, intake mapping, i18n, release gate, privacy, and screen tests
```

## Rules for changes

- Urgency comes only from `@bhanak/triage-engine`. The web app maps answers in and displays the result; it never decides a level. `TESTER_MODE` only raises what is displayed.
- A question that was shown sends an explicit answer; one that was not shown sends nothing (the engine reads that as UNKNOWN). "Not sure" on pregnancy, blood thinner and lives-alone means yes.
- No network calls, cookies, analytics or third-party scripts (tests enforce this). The only stored values are the chosen language and the "Large text" setting (`localStorage`, never sent anywhere).
- Add a string to `en.ts` first; `hi.ts` and `mr.ts` then fail to compile until they have it. Never write the brand name in a string (use `{brandName}`).
- Hindi and Marathi stay behind the "translation under review" badge until a native-speaking doctor signs them off.
