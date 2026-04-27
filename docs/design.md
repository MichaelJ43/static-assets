# Design language (m43)

## Goals

- **One coherent look** for marketing- and product-adjacent surfaces: typography, color, and spacing that read as a family while allowing each app to keep product-specific UI (e.g. game tables, code drawers).
- **System tokens first**: consumers style against **`--m43-*` CSS custom properties** rather than hard-coded colors.
- **Light and dark** via `prefers-color-scheme` (default), with optional per-app overrides later.
- **Accessible defaults**: visible `:focus-visible` for interactive elements in the primitives layer; sufficient contrast in the default token set.
- **Browser matrix:** current **Chrome, Firefox, Safari, and Edge**; see [M43_INTEGRATION.md](M43_INTEGRATION.md#browser-support).

## Files

| File | Scope |
|------|--------|
| `m43-tokens.css` | `:root` variables, base `body` / link behavior when using `.m43` or `body.m43`. |
| `m43-shell.css` | **Site shell** (header, footer, main): `m43-site-header`, `m43-site-footer`, `m43-main`, `m43-nav`, `m43-page` layout. |
| `m43-primitives.css` | Buttons, fields, error text, data tables, cards (including a narrow card pattern useful for sign-in UIs), **hint callout** and **inset pre** (see below). |

**Load order:** tokens → shell → primitives. Analytics is independent of CSS.

## Callout and inset monospace (advisories, remediation)

Use these when a product page needs a **tinted advisory panel** and/or a **fixed-width, scrollable** block (remediation copy, log excerpts) that must track **light and dark** the same way as the rest of m43 (`prefers-color-scheme` on `:root`).

| Class | Role | Tokens (defined in `m43-tokens.css`) |
|-------|------|----------------------------------------|
| `m43-callout-hint` | Container for a grouped list of hints or notes; warm background and border. | `--m43-surface-hint`, `--m43-border-hint` |
| `m43-inset` (often on `<pre>`) | Inset block with mono font; nested under a callout or standalone. | `--m43-surface-inset` (border uses `--m43-border`) |
| `m43-details--remediation` (on `<details>`) | Optional: styles the disclosure and spacing before an inset `<pre>`. | — |

**Markup sketch:**

```html
<div class="m43-callout-hint">
  <strong>Security hints</strong>
  <ul>
    <li>
      Short message
      <details class="m43-details--remediation">
        <summary>Remediation</summary>
        <pre class="m43-inset">…steps or references…</pre>
      </details>
    </li>
  </ul>
</div>
```

Keep app-specific BEM (e.g. `hints-list`, `hints-item--warning`) **alongside** these classes; the m43 classes only supply theme-aware color and type.

## Extension points

- Apps may **re-map** a token in a local `:root` block (e.g. a brand accent) after importing the token file.
- Layout max width is controlled by `--m43-content-max` (default `52rem`).

## Versioning

Breaking token renames or class renames should coincide with a **new major** path (e.g. `v2/` in the published tree) so existing sites keep working until they upgrade.
