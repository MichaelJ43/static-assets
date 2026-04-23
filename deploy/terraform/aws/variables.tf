variable "project" {
  description = "Short project / resource name prefix for this stack."
  type        = string
  default     = "static-assets"
}

variable "environment" {
  description = "Deployment label (e.g. prod)."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Region for S3 and CloudFront (ACM for CloudFront must be in us-east-1)."
}

variable "site_bucket_name" {
  description = "Optional fixed S3 bucket name. If null, a unique name is generated."
  type        = string
  default     = null
}

variable "custom_domain" {
  description = "CloudFront alternate domain (e.g. static.michaelj43.dev). Requires acm_certificate_arn."
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ACM cert in us-east-1 for custom_domain (and wildcard parent if you use it)."
  type        = string
  default     = null
  sensitive   = true
}

variable "route53_hosted_zone_id" {
  description = "Public hosted zone ID for the parent domain of custom_domain (e.g. michaelj43.dev for static.michaelj43.dev)."
  type        = string
  default     = null
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Extra tags for supported resources."
}
