# Deployment (AWS + GitHub Actions)

## Prerequisites

- An AWS account and a role suitable for **Terraform** and **S3/CloudFront/Route 53** in the target region (typically `us-east-1` so the TLS certificate for CloudFront is co-located with the distribution’s requirement for cert in that region when using a custom domain).
- A **Remote Terraform backend** (S3 + DynamoDB lock) for Terraform state.
- (Optional) **ACM** certificate in `us-east-1` for the public hostname (e.g. `static.michaelj43.dev` or a wildcard for `*.michaelj43.dev`), validated via DNS.
- (Optional) **Route 53** public hosted zone for the domain that will own the `A`/`AAAA` alias to CloudFront.

## What the workflow does

The **Deploy** workflow (`.github/workflows/deploy.yml`):

1. Assumes the **OIDC** role and runs **Terraform** in `deploy/terraform/aws/`.
2. **Builds** the package (`npm run build`).
3. **Syncs** `dist/v1/**` to `s3://<bucket>/v1/` with long-lived cache, and `dist/index.html` to the bucket root with a short cache.
4. **Invalidates** CloudFront `/*`.

## GitHub: Environment `production` — required secrets

| Secret | Purpose |
|--------|---------|
| `AWS_REGION` | Example: `us-east-1` |
| `AWS_ROLE_ARN` | IAM role ARN for OIDC (`sts:AssumeRoleWithWebIdentity` from this repo) |
| `TF_STATE_BUCKET` | S3 bucket for remote Terraform state |
| `TF_STATE_LOCK_TABLE` | DynamoDB table for state locking |
| `TF_ACM_CERTIFICATE_ARN` | (Optional) ACM cert ARN in `us-east-1` for HTTPS on the custom domain |
| `TF_ROUTE53_HOSTED_ZONE_ID` | (Optional) Public hosted zone ID for DNS if Terraform should create records |
| `TF_SITE_BUCKET_NAME` | (Optional) Fixed S3 bucket name; if unset, Terraform generates a name |

**Note:** If `TF_ACM_CERTIFICATE_ARN` or `TF_ROUTE53_HOSTED_ZONE_ID` is omitted, the stack still works with the default `*.cloudfront.net` hostname and no Route 53 records.

## GitHub: variables (repository or `production` environment)

| Variable | Purpose |
|----------|---------|
| `TF_CUSTOM_DOMAIN` | (Optional) Public hostname, e.g. `static.michaelj43.dev` — passed as `TF_VAR_custom_domain` |

## Terraform inputs (reference)

- `project` (default `static-assets`), `environment` (default `prod`)
- `custom_domain`, `acm_certificate_arn`, `route53_hosted_zone_id` — for custom host + DNS
- `site_bucket_name` — optional pin for the bucket name

## First-time bootstrap

1. Create the remote state **bucket and lock table** (if you do not already have them for other work).
2. Wire **OIDC** in IAM for GitHub → `AWS_ROLE_ARN` with `sts:AssumeRoleWithWebIdentity` for the repository and environment.
3. Add the secrets/variables, then run **Deploy** (or `terraform init` + `apply` locally with the same `TF_VAR_*`).

## Post-deploy use

- CSS: `https://<host>/v1/m43-tokens.css` (and shell/primitives as needed).
- JS: `https://<host>/v1/m43-analytics.js` with `data-m43-app` set.

For npm-based apps, add the package dependency and `import` the CSS from the `exports` map, or point Vite/rollup at `node_modules` paths in your own copy step if you do not use package exports.

## npm publishing

Publishing the package to the npm registry is **not** automated in the default workflow. If you add it, use a `release` workflow with `NPM_TOKEN` and `npm publish` only from tagged versions.

## Troubleshooting (Terraform)

### `OriginAccessControlAlreadyExists` (HTTP 409)

CloudFront OAC **names are unique per AWS account**. A fixed name like `static-assets-prod-oac` can collide if an OAC with that name already exists (e.g. a **partial apply** that wrote the OAC in AWS but did not record it in state, or a **re-run** with an empty or wrong state). This repo’s Terraform now uses a **per-stack suffix** on the OAC name (same `random_id` as the S3 bucket) so a fresh apply can create a new OAC without a name collision.

**Orphans:** an old, unused OAC in the account can be deleted in the **CloudFront** console (Origin access) to reduce clutter; it does not accrue much cost.

### “Plan: N to add” on every run / duplicate S3 buckets

If **terraform plan** always wants to **create** the whole stack, the **remote state** in `TF_STATE_BUCKET` is not the one Terraform is reading (wrong key, region, or bucket) or the state was reset. **Do not** re-run `apply` repeatedly with empty state, or you will create duplicate S3 buckets and hit other unique-name conflicts. Fix backend configuration and, if needed, `terraform import` or remove stray resources in AWS to match a single state file.

### Stale partial state

If a run failed after creating the bucket but before CloudFront, the next `apply` will continue from state. If state and AWS disagree, use `terraform plan -refresh-only` and fix drift with import or `terraform apply`’s replace guidance.
