# `@michaelj43/static-assets`

Shared **CSS** (design tokens, site shell, form/table primitives) and a small **`m43-analytics.js`** client for JSON event ingest. Artifacts are built into **`dist/v1/`** and intended to be published to a static CDN and/or consumed as an npm package.

**Handing this to an AI in another repo?** Start with **[docs/M43_INTEGRATION.md](docs/M43_INTEGRATION.md)** — a single, copy-pasteable integration guide (includes a ready-made agent prompt). Stable reference: [github.com/MichaelJ43/static-assets](https://github.com/MichaelJ43/static-assets).

## Quick start (npm)

```bash
npm install @michaelj43/static-assets
```

```css
@import "@michaelj43/static-assets/m43-tokens.css";
@import "@michaelj43/static-assets/m43-shell.css";
```

```html
<script
  src="https://<your-cdn-host>/v1/m43-analytics.js"
  defer
  data-m43-app="my-app-id"
  data-m43-spa="true"
></script>
```

## Build

```bash
npm ci
npm run build
```

Outputs: `dist/v1/m43-*.css`, `dist/v1/m43-analytics.js`, `dist/index.html`.

## Docs

- **[Integrate m43 in any app (agent-friendly)](docs/M43_INTEGRATION.md)** (start here for cross-repo work)
- [Architecture](docs/architecture.md)
- [Design language](docs/design.md)
- [Deployment (AWS, GitHub Actions)](docs/deployment.md)
- [AGENTS.md](AGENTS.md) (context for maintainers and automation)

## License

MIT
