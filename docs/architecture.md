# Architecture

## Overview

`@michaelj43/static-assets` is a **versioned static file bundle** published to a CDN and optionally consumed as an npm package. It has no server-side runtime: assets are **built once** and served from object storage in front of CloudFront.

## Components

| Piece | Role |
|--------|------|
| **S3** | Object store for `index.html` and the `v1/` content tree. Private bucket; no public policy—access only through CloudFront via **Origin Access Control (OAC)**. |
| **CloudFront** | Global HTTPS, caching, custom TLS certificate when configured. |
| **Route 53 (optional)** | `A` / `AAAA` alias records for the public hostname to the distribution. |
| **Build** | `npm run build` populates `dist/`: `dist/v1/*.css`, `dist/v1/m43-analytics.js` (+ source map), and `dist/index.html`. |
| **GitHub Actions** | CI validates and builds; **Deploy** applies Terraform, syncs `dist/`, invalidates the cache. |

## Data flow (deploy)

1. A workflow job builds artifacts into `dist/`.
2. **Terraform** ensures the S3 bucket and CloudFront distribution exist; outputs include bucket name and distribution id.
3. **`aws s3 sync`** uploads `dist/v1/` with long cache headers (immutable versioned files).
4. **`aws s3 cp`** uploads the root `index.html` with short cache headers.
5. **`aws cloudfront create-invalidation`** refreshes the edge for `/*`.

## Data flow (analytics, browser)

1. A page includes `m43-analytics.js` (script tag) with `data-m43-app=…`.
2. On load (and for SPAs, on history changes when `data-m43-spa` is set), the script sends a **JSON POST** to the configured API’s `/analytics/events` route with a query of `v=1`.
3. The API stores events (implementation is outside this repository).

## Isolation and blast radius

- A bug in **CSS** only affects appearance on sites that import it; rolling forward is a new deploy to the CDN.
- A bug in the **tracker** can be mitigated by redeploying a previous `v1` build or by replacing the script reference; it cannot corrupt server state by itself (read-only public ingest).
