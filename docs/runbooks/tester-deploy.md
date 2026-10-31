# Runbook: private tester deploy (Cloudflare Pages or Netlify)

For a small group of testers (friends, family, a doctor) to try the web app. **Not a public launch.** The protocol is a DRAFT, so the site is built in `TESTER_MODE`: a banner on every screen, nothing shown below "Get tested and keep watching", `noindex` everywhere, no analytics, no cookies, nothing sent to any server.

## What you are deploying

| Item             | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Build command    | `pnpm build:tester` (run from the repository root)          |
| Output directory | `apps/web/out` (a static site: plain HTML, JS and CSS)      |
| Node             | 24 (see `.nvmrc`)                                           |
| Package manager  | pnpm 10 (see `packageManager` in the root `package.json`)   |
| Server code      | None. No functions, no database, no API keys                |
| Files            | About 47, under 1 MB in total, so well inside any free plan |

`pnpm build:tester` sets `TESTER_MODE=true`, `APP_ENV=staging` and `ALLOW_DRAFT_PROTOCOL=true` itself, then builds only the web app and what it depends on. Afterwards `apps/web/scripts/verify-output.mjs` checks the result and fails the build if any page lacks the banner or the `noindex` tag, if `robots.txt` allows anything, or if tracking code is present.

The one setting you add yourself is `FEEDBACK_URL` (the Google Form link, see "Feedback form"). Without it the "Send feedback" button points at a placeholder form and the build prints a warning.

## Option A (simplest): build on your computer, upload the folder

No build server, no repository access for the host, no pnpm-version surprises.

1. In a terminal at the repository root (PowerShell on this machine; see CLAUDE.md for the Node path):

   ```bash
   pnpm install --frozen-lockfile
   ```

   Then set your form link and build (PowerShell):

   ```powershell
   $env:FEEDBACK_URL = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform"
   pnpm build:tester
   ```

   Look for these two lines at the end. If either is missing, do not upload:

   ```
   verify-protocol OK: dengue 0.1.0 (DRAFT), TESTER_MODE=on
   verify-output OK: ... noindex everywhere, tester banner on every page
   ```

2. **Run `pnpm build:tester` last.** `pnpm build` and `pnpm check` also write to `apps/web/out`, but without the tester banner. The tester output is the one the check above confirms.
3. Upload the folder `apps/web/out`:
   - **Cloudflare Pages:** Workers & Pages, Create, Pages, "Upload assets". Name the project, drag in the `out` folder, Deploy.
   - **Netlify:** Sites, "Add new site", "Deploy manually", drag in the `out` folder. (Or use the Netlify Drop page.)
4. Open the address the host gives you and run the checks in "After every deploy".

To update: repeat steps 1 to 3. Both hosts keep earlier deployments, so you can roll back from their dashboards.

## Option B: build on the host from GitHub

Use this when you want every push to `main` to redeploy.

| Setting                | Cloudflare Pages                                                         | Netlify                           |
| ---------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| Repository             | `Inv3rseXenon/Bhanak`, branch `main`                                     | same                              |
| Build command          | `corepack enable && pnpm install --frozen-lockfile && pnpm build:tester` | same                              |
| Build output directory | `apps/web/out`                                                           | Publish directory: `apps/web/out` |
| Root directory         | repository root (leave empty)                                            | repository root (leave empty)     |
| Environment variable   | `NODE_VERSION` = `24`                                                    | `NODE_VERSION` = `24`             |
| Environment variable   | `FEEDBACK_URL` = your form link                                          | `FEEDBACK_URL` = your form link   |

Notes:

- `corepack enable` makes the host use the pnpm version pinned in `package.json`. The `docs/sources/*.pdf` files are not in the repository, and the build does not need them.
- Do **not** set `APP_ENV=production` or leave `ALLOW_DRAFT_PROTOCOL` to chance: `pnpm build:tester` sets both correctly. A production build refuses an unreviewed protocol on purpose.
- If the host's first build fails on pnpm or Node, fall back to Option A. Check the host's current documentation for supported Node and pnpm versions; this runbook does not rely on them.
- Turn off preview deployments for pull requests (or restrict them) so that no unreviewed branch is public.

## Keeping it private

A site address nobody has been told is not access control. The site is `noindex`, so search engines are asked to skip it, but anyone with the link can open it. That is acceptable for a draft with no personal data, but to limit it to named people:

- **Cloudflare:** put the Pages project behind Cloudflare Access (Zero Trust) with a policy that allows only the testers' email addresses. Check the current plan limits.
- **Netlify:** site password protection is available on some paid plans. Check the current plans.

Do not add a custom domain with the product name until the founder has decided on the domain (TODO F-001).

## Feedback form

1. Create a Google Form for testers. Suggested questions: which language; which device and browser; the scenario they tried; what result they got; was anything confusing; anything missing. Mark nothing as required.
2. Put a notice at the top: "Do not enter your name, phone number or any real health details. Describe the situation in general terms."
3. Copy the "Send" link (the `.../viewform` address) and set it as `FEEDBACK_URL` (above). The app opens it in a new tab with no referrer.

Responses are stored by Google, outside this product. Do not collect personal data through the form; the app itself collects none.

## After every deploy

Replace `SITE` with the address of the deployment.

```bash
curl -s SITE/robots.txt
curl -sI SITE/ | grep -i -E "x-robots-tag|content-security-policy|referrer-policy"
curl -s SITE/ | grep -c "TEST VERSION, NOT MEDICALLY REVIEWED"
curl -s SITE/ | grep -o '<meta name="robots"[^>]*>'
```

Expected: `Disallow: /`; an `X-Robots-Tag: noindex, nofollow, noarchive` header and a CSP header; a count of 1 or more; and `content="noindex, nofollow..."`.

Then on a real phone:

1. The yellow banner is at the top of the home page, the check, the result and the emergency page, and stays when you scroll.
2. Switch to हिन्दी and मराठी: the banner and a "translation under review" notice appear.
3. Run the smoke checks below.
4. Tap "Send feedback": your form opens in a new tab.
5. Tap Emergency in the header: the emergency page shows Call 108 and Call 112.

## Smoke checks for testers

Each takes about two minutes. Answer every other question "No", "Yes" to "Can the person drink, and keep the drinks down?", and use ordinary numbers (0 vomits, 4 times passing urine) unless the row says otherwise.

| #   | Situation                                                                 | Expected result                                                                         |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Adult, fever now, started 2 days ago, cannot keep drinks down             | Emergency, call 108 or 112                                                              |
| 2   | Adult, fever now, started 2 days ago, bleeding gums                       | Emergency                                                                               |
| 3   | Adult, fever now, started 2 days ago, answer "I'm not sure" to belly pain | See a doctor today (or higher)                                                          |
| 4   | Adult, no fever now, no fever in the last 2 days, no other symptom        | Get tested and keep watching, with "If you are unsure, see a doctor." Never "home care" |
| 5   | Child under 5 with fever, passing little urine                            | See a doctor today (or higher)                                                          |
| 6   | Any of the above in Hindi and Marathi                                     | Same level; "translation under review" notice visible                                   |

If a tester reports a different result, **do not change a rule or number to match what they expected.** Record it in the feedback form, and bring it to the reviewing doctor (see `docs/clinical-review-checklist.md`).

## What testers should be told

- This is a test version. It has **not been reviewed by a doctor** and must not be used for real medical decisions.
- In an emergency, call 108 or 112.
- Nothing you enter is sent anywhere or saved. Closing the page clears it.
- Hindi and Marathi texts are first drafts and are still being checked.
- It needs an internet connection to open. Working with no signal is planned (milestone M7), so in an emergency call 108 or 112 rather than relying on the page.

## Known limits of this release

| Limit                                       | Why                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No offline use                              | The service worker and install flow arrive in M7. Once the check screen has loaded, its questions and result work without signal, but opening a new page (including Emergency) needs a connection |
| Hospital search opens Google Maps           | A plain link (spec 7). It is a click by the user; the app itself sends nothing                                                                                                                    |
| "Save to my diary" is missing               | Diary and accounts arrive in M4 and M5                                                                                                                                                            |
| Initial JavaScript is about 204 KB gzipped  | Slightly over the 200 KB budget on the check screen (TODO G-004); not a blocker for testers                                                                                                       |
| Placeholder feedback link until you set one | `FEEDBACK_URL` (above)                                                                                                                                                                            |

## Going public later

This runbook is for the tester release only. A public release needs, at minimum: a named reviewing doctor and a `REVIEWED` protocol (otherwise `pnpm build:release` refuses to build), reviewed Hindi and Marathi text, a regulatory lawyer's confirmation (`docs/regulatory-notes.md`), real brand details (`pnpm check:brand --strict`), and removal of the noindex headers in `apps/web/public/_headers` (TODO W-004). See `docs/TODO.md`.
