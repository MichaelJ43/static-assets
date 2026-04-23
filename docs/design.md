# Design language (m43)

## Goals

- **One coherent look** for marketing- and product-adjacent surfaces: typography, color, and spacing that read as a family while allowing each app to keep product-specific UI (e.g. game tables, code drawers).
- **System tokens first**: consumers style against **`--m43-*` CSS custom properties** rather than hard-coded colors.
- **Light and dark** via `prefers-color-scheme` (default), with optional per-app overrides later.
- **Accessible defaults**: visible `:focus-visible` for interactive elements in the primitives layer; sufficient contrast in the default token set.

## Files

| File | Scope |
|------|--------|
| `m43-tokens.css` | `:root` variables, base `body` / link behavior when using `.m43` or `body.m43`. |
| `m43-shell.css` | Page chrome: `m43-site-header`, `m43-site-footer`, `m43-main`, `m43-nav`, `m43-page` layout. |
| `m43-primitives.css` | Buttons, fields, error text, data tables, cards (including a narrow card pattern useful for sign-in UIs). |

**Load order:** tokens → shell → primitives. Analytics is independent of CSS.

## Extension points

- Apps may **re-map** a token in a local `:root` block (e.g. a brand accent) after importing the token file.
- Layout max width is controlled by `--m43-content-max` (default `52rem`).

## Versioning

Breaking token renames or class renames should coincide with a **new major** path (e.g. `v2/` in the published tree) so existing sites keep working until they upgrade.
