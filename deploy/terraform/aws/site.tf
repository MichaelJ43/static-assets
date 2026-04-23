locals {
  site_bucket_name = coalesce(var.site_bucket_name, "${local.name}-site-${random_id.suffix.hex}")
}

resource "aws_s3_bucket" "site" {
  bucket = local.site_bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Name must be unique per account. A fixed "${local.name}-oac" can collide with an OAC
# left from a prior partial apply or a lost state; include random_id like the S3 bucket.
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.name}-oac-${random_id.suffix.hex}"
  description                       = "OAC for ${aws_s3_bucket.site.bucket}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  custom_domain_host   = var.custom_domain != null ? trimspace(var.custom_domain) : ""
  use_custom_domain    = local.custom_domain_host != "" && var.acm_certificate_arn != null && trimspace(var.acm_certificate_arn) != ""
  route53_zone_id      = var.route53_hosted_zone_id != null ? trimspace(var.route53_hosted_zone_id) : ""
  create_route53_alias = local.use_custom_domain && local.route53_zone_id != ""
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${local.name} static CDN"
  price_class         = "PriceClass_100"

  aliases = local.use_custom_domain ? [local.custom_domain_host] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.site.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.id}"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    # assets are versioned under /v1/; index can be revalidated
    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 31536000

    forwarded_values {
      query_string = true
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = !local.use_custom_domain
    acm_certificate_arn            = local.use_custom_domain ? var.acm_certificate_arn : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = local.common_tags
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    sid     = "CloudFrontRead"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.site.arn}/*",
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket.json
}

# DNS: A + AAAA to CloudFront for the custom hostname, in the parent hosted zone
resource "aws_route53_record" "site_a" {
  count   = local.create_route53_alias ? 1 : 0
  zone_id = local.route53_zone_id
  name    = local.custom_domain_host
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_aaaa" {
  count   = local.create_route53_alias ? 1 : 0
  zone_id = local.route53_zone_id
  name    = local.custom_domain_host
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
