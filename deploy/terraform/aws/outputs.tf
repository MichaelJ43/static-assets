output "site_bucket" {
  value       = aws_s3_bucket.site.bucket
  description = "S3 bucket for static files (sync `dist/` here)."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.site.id
  description = "For `aws cloudfront create-invalidation` after deploys."
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "Default CloudFront hostname (d*****.cloudfront.net) when no custom domain."
}

output "site_url" {
  value       = local.use_custom_domain ? "https://${local.custom_domain_host}" : "https://${aws_cloudfront_distribution.site.domain_name}"
  description = "Public site URL (HTTPS)."
  sensitive   = true
}

output "stack_prefix" {
  value       = local.name
  description = "Resource name prefix (project-environment)."
}
