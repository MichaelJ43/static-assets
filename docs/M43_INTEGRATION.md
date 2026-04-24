# m43 design system — one-page integration guide

**Purpose:** This document is the handoff for **any** app or static site. Give an AI (or a human) this file plus a link to the [`static-assets` repository](https://github.com/MichaelJ43/static-assets). It describes how to apply shared **CSS** and the optional **analytics** client without opening other docs unless you need depth.

| Resource | URL / package |
|----------|-----------------|
| **Source & releases** | [github.com/MichaelJ43/static-assets](https://github.com/MichaelJ43/static-assets) |
| **Published assets (after deploy)** | `https://static.michaelj43.dev/v1/` — files: `m43-tokens.css`, `m43-shell.css`, `m43-primitives.css`, `m43-analytics.js`, `m43-auth-header.js` |
| **npm** | `@michaelj43/static-assets` (CSS via `import` or bundler; JS path in `package.json` `exports`) |

> **Path version:** The `/v1/` prefix is the stability contract. If a future `v2` ships breaking class or token renames, old consumers keep using `v1` until they migrate.

**Terminology:** In UI literature, *chrome* sometimes means the **fixed header/footer/toolbars around a page** (not a browser name). In this system we use **site shell** in prose and the **`m43-shell.css`** file name to avoid confusion with **Google Chrome** the product.

## Browser support

**Supported engines (current, evergreen):** **Google Chrome**, **Mozilla Firefox**, **Apple Safari**, and **Microsoft Edge** (Chromium). Treat these as the test matrix for layout, tokens, focus rings, and the analytics script.

- **CSS:** `custom properties`, `prefers-color-scheme`, `:focus-visible`, and `text-decoration-thickness` are used as in modern baselines. Where `color-mix` is used for a primary button border, a **fallback** is provided for older Safari that does not support it.
- **Analytics (`m43-analytics.js`):** Standard Web APIs only (`fetch`, `sessionStorage`, `history`, `queueMicrotask`, with a `crypto.randomUUID` fallback). No plugin or single-vendor API.

If you need **legacy** browsers, retest in your app; m43 does not target Internet Explorer or pre-Chromium Edge.

---

## 1. What you get

1. **Tokens** (`m43-tokens.css`) — `:root` custom properties (`--m43-*`), light/dark via `prefers-color-scheme`, base typography and links when the page uses a `.m43` wrapper or `body.m43`.
2. **Shell** (`m43-shell.css`) — **site shell** layout: optional full-width **`m43-top-bar`** (from `m43-auth-header.js`), `m43-site-header`, `m43-site-footer`, `m43-main`, `m43-nav`, `m43-page`. Use the **`m43-` classes**; they do not require renaming existing app-specific BEM, but the **visual** shell should use these for consistency.
3. **Primitives** (`m43-primitives.css`) — buttons, labeled fields, error line, data tables, cards (including a narrow “auth card” style).
4. **Analytics** (`m43-analytics.js`) — optional, small script: sends `pageview` events to `POST {api}/analytics/events?v=1` with a stable `appId` per product. **No cookies;** CORS on the API must allow your page origin.
5. **Auth top bar** (`m43-auth-header.js`) — optional: full-width bar (logo placeholder, optional **Home** to your site root, **Log In** via the auth SPA with `returnUrl` set to the **current page**, or a **profile initial** and dropdown **Sign out** when `GET {api}/v1/auth/me` succeeds with the `sap_session` cookie). Matches **shared-api-platform** ([`auth-spa` query + login `returnUrl`](https://github.com/MichaelJ43/shared-api-platform/blob/main/auth-spa/src/main.ts), session cookie on the apex per [auth-and-dashboard](https://github.com/MichaelJ43/shared-api-platform/blob/main/docs/auth-and-dashboard.md)).

**Load order (CSS):** always **tokens → shell → primitives** (and after that, the app’s own CSS for product-specific layout).

---

## 2. Choose how you load assets

### A. CDN (any HTML, no bundler)

Add before `</head>` (CSS) and before `</body>` (script):

```html
<link
  rel="stylesheet"
  href="https://static.michaelj43.dev/v1/m43-tokens.css"
/>
<link
  rel="stylesheet"
  href="https://static.michaelj43.dev/v1/m43-shell.css"
/>
<link
  rel="stylesheet"
  href="https://static.michaelj43.dev/v1/m43-primitives.css"
/>
```

```html
<script
  src="https://static.michaelj43.dev/v1/m43-analytics.js"
  defer
  data-m43-app="replace-with-unique-app-id"
  data-m43-api="https://api.michaelj43.dev"
  data-m43-spa="true"
></script>
```

- `data-m43-app` (required) — Opaque `appId` for analytics and dashboards. **One value per app** (e.g. `portfolio-pages`, `card-game`, `iac-builder`, `auth-spa`, `analytics-dashboard`). Use stable ASCII, no secrets.
- `data-m43-api` (optional) — default `https://api.michaelj43.dev` (trailing slash removed automatically).
- `data-m43-spa` (optional) — set to `true` or `1` for **client-side navigation** (React Router, Vue Router, etc.); the script tracks `pushState` / `replaceState` / `popstate`. For strictly static multi-page sites, omit or set `false`.

**Debug:** add `?m43debug=1` to the page URL to log tracker diagnostics to the console.

**Auth top bar (`m43-auth-header.js`, optional, requires HTTPS page + shared-api-platform CORS and cookies on your apex):**

1. At the **top of the page body** (first inside `.m43-page__body` or equivalent, **not** inside a max-width header), add an **empty** placeholder the script will fill. It becomes a full-width **`m43-top-bar`** (logo, optional Home link, Log In / profile menu):

```html
<div class="m43-page__body m43">
  <div data-m43-auth-header></div>
  <header class="m43-site-header">
    <h1>Your app</h1>
    <p class="m43-intro">…</p>
    <nav class="m43-nav">…</nav>
  </header>
  <main class="m43-main">…</main>
</div>
```

   **Home link:** shown on every origin/path **except** when the current URL matches **`data-m43-home-url`** (default `https://michaelj43.dev/` — same origin and path as that URL, including `/` or `/index.html`). Subdomains (e.g. `static.*`) always see Home.

2. After other scripts (or with `defer`), load the client **once**:

```html
<script
  src="https://static.michaelj43.dev/v1/m43-auth-header.js"
  defer
  data-m43-auth
  data-m43-api="https://api.michaelj43.dev"
  data-m43-auth-origin="https://auth.michaelj43.dev"
  data-m43-home-url="https://michaelj43.dev/"
></script>
```

- `data-m43-auth` (required) — marks this script for configuration.
- `data-m43-api` (optional) — API base; default `https://api.michaelj43.dev` (trailing slash stripped).
- `data-m43-auth-origin` (optional) — sign-in page origin; default `https://auth.michaelj43.dev`. The script sends users to `…?returnUrl=<encodeURIComponent(current page URL)>`, which the [auth SPA](https://github.com/MichaelJ43/shared-api-platform/blob/main/auth-spa/src/main.ts) passes through to `POST /v1/auth/login` as `returnUrl` (server allow-listed per [returnUrl](https://github.com/MichaelJ43/shared-api-platform/blob/main/lambda/src/returnUrl.ts)).
- `data-m43-home-url` (optional) — URL used for the **Home** button and to decide when to hide it on the “root” page; default `https://michaelj43.dev/`.
- **Alternate mount** — if you cannot use `data-m43-auth-header`, set e.g. `data-m43-auth-mount="#x"` on the script and put `id="x"` on your container element.

`returnUrl` must be **https** to be accepted after login. Local **http** dev may fall back to `AUTH_DEFAULT_APP_URL` in the API.

### B. npm + bundler (Vite, esbuild, etc.)

```bash
npm install @michaelj43/static-assets
```

In your app entry (order matters):

```ts
import '@michaelj43/static-assets/m43-tokens.css'
import '@michaelj43/static-assets/m43-shell.css'
import '@michaelj43/static-assets/m43-primitives.css'
```

**Analytics in bundled apps:** either:

- add a **copy** step in build so the built site includes `m43-analytics.js` and reference it with a real URL in the built `index.html`, or  
- in React/Vue, `import` the script URL from `node_modules` and inject a `<script>` in your HTML template (must expose `data-m43-*` on the element that loads the bundle). The simplest pattern is to **keep the CDN `<script src=".../m43-analytics.js" defer ...>` in `index.html`** next to the app root; it does not need to go through the JS bundle.

---

## 3. Markup patterns (minimal)

- **Page wrapper** — e.g. `<div class="m43 m43-page">` or `body class="m43"`.
- **Optional auth bar** — empty `<div data-m43-auth-header></div>` at the top of `.m43-page__body` (see §2 CDN auth top bar).
- **Header** — `class="m43-site-header"`; title in `<h1>`, intro in `.m43-intro`, nav links in `nav` with `class="m43-nav"`.
- **Main** — `class="m43-main"` (or `main` with that class).
- **Footer** — `class="m43-site-footer"`.
- **Section label** — `class="m43-section-title"`.
- **Primary / default button** — `class="m43-button m43-button--primary"`.
- **Secondary button** — `class="m43-button"`.
- **Button as link** — `a` with the same `m43-button` / `m43-button--primary` classes uses **button** label colors, not the global **in-text** link color (`.m43 a` in tokens excludes `m43-button*`), so the label stays legible in light and dark.
- **Labeled field** — wrap in `class="m43-field"`, `label` + input with `class="m43-input"`.
- **Error text** — `class="m43-message--error"`.
- **Table** — `class="m43-table"`.
- **Narrow form card (e.g. sign-in)** — `class="m43-card m43-card--tight"`.

**Rule:** Use **`m43-` prefixed** classes for anything that should match the shared system. Keep existing product-specific class names (e.g. game table, code editor) in parallel; do not block those with global overrides.

---

## 4. Analytics and hosting constraints

- The browser sends **`Origin: https://your-site`**. The API must allow that origin (typically **HTTPS** and hostnames under a configured **apex** such as `michaelj43.dev` and its subdomains). Sites that only load on **non-matching** hosts (e.g. default `github.io` if the API is not configured for it) will get **CORS errors**; fix with a **custom domain** on that apex or a product change to the API’s CORS config.
- The tracker is **opt-in** per page. Omit the script on surfaces that should not report.

---

## 5. When you change the design system

- Prefer opening PRs in [`MichaelJ43/static-assets`](https://github.com/MichaelJ43/static-assets). After a release, **redeploy the CDN** (GitHub Action in that repo) so `static.michaelj43.dev` picks up new `v1` files, or bump the npm version and reinstall in each app if you use npm for CSS.

---

## 6. Copy-paste: prompt for an AI in another repository

Use this as the user message (replace placeholders):

```text
Implement the m43 design system in this project.

**Reference:** https://github.com/MichaelJ43/static-assets — follow docs/M43_INTEGRATION.md in that repo (same content as the integration guide: CSS load order, m43- classes, optional analytics script).

**Requirements:**

1. Add m43 **tokens, shell, and primitives** — via CDN
   `https://static.michaelj43.dev/v1/m43-tokens.css`, `m43-shell.css`, `m43-primitives.css` (or npm @michaelj43/static-assets with imports in the app entry) in the correct order before app-specific styles.

2. Apply a **.m43** (or body.m43) wrapper and map existing header/footer/main to **m43-site-header**, **m43-site-footer**, **m43-main** where it improves consistency without breaking layout.

3. For forms and buttons the user sees globally, use **m43-button**, **m43-field**, **m43-input**, **m43-message--error** as appropriate; keep app-specific BEM for complex widgets.

4. (Optional) Add `m43-analytics.js` from the same CDN v1 path with:
   - data-m43-app="<UNIQUE_STABLE_APP_ID>"
   - data-m43-api="https://api.michaelj43.dev" if not default
   - data-m43-spa="true" only if this is a client-side–routed SPA

4b. (Optional) Add `m43-auth-header.js` with `data-m43-auth`, a `data-m43-auth-header` mount at the **top** of the page body (full-width bar), and the same `data-m43-api` / `data-m43-auth-origin` as other apps on `*.michaelj43.dev` so Log In includes `returnUrl` and session cookies apply.

5. Do not remove working product features; only align the **site shell** and shared UI. If something conflicts, keep the product behavior and leave a short comment.

6. Verify the result in **Chrome, Firefox, Safari, and Edge** (current versions); m43 is built for that matrix (see “Browser support” at the top of this doc).

After changes, list files touched and any follow-ups (e.g. CORS if origin is not under the allowed apex).
```

---

## 7. Pointers to deeper docs (optional)

- [Design details (tokens, layout philosophy)](design.md) — in this same repo, under `docs/`.
- [Deployment / Terraform / GitHub](deployment.md) — for maintainers of the CDN, not for app integration.
- [Architecture](architecture.md) — S3, CloudFront, how builds flow.

**This file** (`M43_INTEGRATION.md`) is the default single entry point for cross-repo implementation.
