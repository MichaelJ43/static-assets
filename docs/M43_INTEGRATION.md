# m43 design system — one-page integration guide

**Purpose:** This document is the handoff for **any** app or static site. Give an AI (or a human) this file plus a link to the [`static-assets` repository](https://github.com/MichaelJ43/static-assets). It describes how to apply shared **CSS** and the optional **analytics** client without opening other docs unless you need depth.

| Resource | URL / package |
|----------|-----------------|
| **Source & releases** | [github.com/MichaelJ43/static-assets](https://github.com/MichaelJ43/static-assets) |
| **Published assets (after deploy)** | `https://static.michaelj43.dev/v1/` — files: `m43-tokens.css`, `m43-shell.css`, `m43-primitives.css`, `m43-analytics.js` |
| **npm** | `@michaelj43/static-assets` (CSS via `import` or bundler; JS path in `package.json` `exports`) |

> **Path version:** The `/v1/` prefix is the stability contract. If a future `v2` ships breaking class or token renames, old consumers keep using `v1` until they migrate.

---

## 1. What you get

1. **Tokens** (`m43-tokens.css`) — `:root` custom properties (`--m43-*`), light/dark via `prefers-color-scheme`, base typography and links when the page uses a `.m43` wrapper or `body.m43`.
2. **Shell** (`m43-shell.css`) — page chrome: `m43-site-header`, `m43-site-footer`, `m43-main`, `m43-nav`, `m43-page` layout. Use the **`m43-` classes**; they do not require renaming existing app-specific BEM, but the **visual** shell should use these for consistency.
3. **Primitives** (`m43-primitives.css`) — buttons, labeled fields, error line, data tables, cards (including a narrow “auth card” style).
4. **Analytics** (`m43-analytics.js`) — optional, small script: sends `pageview` events to `POST {api}/analytics/events?v=1` with a stable `appId` per product. **No cookies;** CORS on the API must allow your page origin.

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
- **Header** — `class="m43-site-header"`; title in `<h1>`, intro in `.m43-intro`, nav links in `nav` with `class="m43-nav"`.
- **Main** — `class="m43-main"` (or `main` with that class).
- **Footer** — `class="m43-site-footer"`.
- **Section label** — `class="m43-section-title"`.
- **Primary / default button** — `class="m43-button m43-button--primary"`.
- **Secondary button** — `class="m43-button"`.
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

5. Do not remove working product features; only align chrome and shared UI. If something conflicts, keep the product behavior and leave a short comment.

After changes, list files touched and any follow-ups (e.g. CORS if origin is not under the allowed apex).
```

---

## 7. Pointers to deeper docs (optional)

- [Design details (tokens, layout philosophy)](design.md) — in this same repo, under `docs/`.
- [Deployment / Terraform / GitHub](deployment.md) — for maintainers of the CDN, not for app integration.
- [Architecture](architecture.md) — S3, CloudFront, how builds flow.

**This file** (`M43_INTEGRATION.md`) is the default single entry point for cross-repo implementation.
