# Agent context: `@michaelj43/static-assets`

**Cross-repo / consumer work:** [docs/M43_INTEGRATION.md](docs/M43_INTEGRATION.md) is the single “give this to an AI” handoff. Link that file (or the repo) when asking another codebase to adopt m43.

**Browsers:** Target current **Chrome, Firefox, Safari, and Edge** (see [M43_INTEGRATION.md#browser-support](docs/M43_INTEGRATION.md#browser-support)). Avoid UI-only jargon “chrome” in docs without disambiguation from the Chrome product.

## Purpose

This repository ships **shared front-end assets** for personal sites and apps: CSS design tokens (`m43-tokens.css`), **shell** (header / footer) and **form/table primitives** (`m43-shell.css`, `m43-primitives.css`), and a small **browser analytics** script (`m43-analytics.js`) that posts to a JSON ingest API. Built files live in `**dist/v1/`** and are versioned for stable CDN paths.

## Layout

- `src/css/` — source stylesheets; copied into `dist/v1/` by the build.
- `src/analytics-core.ts` — testable logic for the tracker (session id, config from `<script>`, `fetch` to the API). No side effects on import.
- `src/m43-analytics.ts` — browser entry: attaches `globalThis.M43Analytics` and calls `initM43Analytics()`. Bundled to `dist/v1/m43-analytics.js` (IIFE, minified).
- `src/m43-auth-header.ts` / `src/auth-header-core.ts` — optional **viewport-fixed top bar** (logo, Home, **Log In** / profile menu) for **shared-api-platform** (`GET /v1/auth/me`, `POST /v1/auth/logout`, `returnUrl` via auth origin); sets `--m43-top-bar-inset` for `.m43-page` padding. Bundled to `dist/v1/m43-auth-header.js`.
- `public/index.html` — human-readable stub at the bucket root; build copies to `dist/index.html`.
- `scripts/build.mjs` — copies CSS, copies `index.html`, runs **esbuild** for the analytics bundle.
- `deploy/terraform/aws/` — **S3** + **CloudFront (OAC)** + optional **Route 53** alias for a custom hostname. No compute in this stack.

## API contract (tracker)

- `POST {apiBase}/analytics/events?v=1` with JSON body `{ "event": { appId, sessionId, eventType, path, clientTimestamp, context? } }`.
- CORS in production must allow the **page origin**; that is an environment concern for the API, not this repo.
- `data-m43-app` (required) maps to `appId`. `data-m43-api` defaults to `https://api.michaelj43.dev`. `data-m43-spa` enables `history` hooks for client-side navigation.

## Conventions

- **Prefix** public CSS classes and JS globals with `m43` to avoid clashing with host apps.
- **Do not** add large frameworks to this package; keep deliverables as plain CSS and one small IIFE.
- **Tests** target `src/analytics-core.ts` and avoid importing `m43-analytics.ts` (which runs init in the browser).

## CI

- `ci` — `typecheck`, `lint`, `test:ci`, `build` on every push/PR to `main`.
- `deploy` — OIDC to AWS, Terraform apply, `aws s3 sync` of `dist/`, CloudFront invalidation. Requires GitHub **production** environment secrets/vars (see `docs/deployment.md`).

## Related work outside this repo

Host applications link or import these assets, then test end-to-end in their own deploy pipelines. The analytics **Lambda** and **DynamoDB** tables live in the API platform; this repo only ships the **client** script and styles.