#!/usr/bin/env bash
set -euo pipefail
# Domain & distribution/App Runner diagnostic helper
# Usage: ./scripts/diagnose-domains.sh [--prod enabl.health --dist <CLOUDFRONT_ID>] [--staging staging.enabl.health]
# Flags:
#   --prod <domain>
#   --staging <domain>
#   --dist <distribution_id>
#   --raw  (show raw distribution parts)
# Default domains: enabl.health, staging.enabl.health

PROD_DOMAIN="enabl.health"
STAGING_DOMAIN="staging.enabl.health"
REGION="us-east-1"
DIST_ID=""
SHOW_RAW=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --prod) PROD_DOMAIN="$2"; shift 2;;
    --staging) STAGING_DOMAIN="$2"; shift 2;;
    --dist) DIST_ID="$2"; shift 2;;
    --raw) SHOW_RAW=true; shift;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //'; exit 0;;
    *) echo "Unknown arg $1" >&2; exit 1;;
  esac
done

have(){ command -v "$1" >/dev/null 2>&1; }
for c in dig jq aws curl; do have $c || { echo "Missing required tool: $c" >&2; exit 1; }; done

log(){ echo -e "\n==== $1 ===="; }

dns_info(){ local d="$1"; echo "Domain: $d"; echo -n "A: "; dig +short "$d" A | sed 's/^/  /' || true; echo -n "CNAME: "; dig +short "$d" CNAME | sed 's/^/  /' || true; }

http_head(){ local url="$1"; echo "-- $url"; curl -fsS -o /dev/null -D - "$url" || echo "(request failed)"; }

origin_from_dist(){ local id="$1"; aws cloudfront get-distribution --id "$id" --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' --output text 2>/dev/null || true; }

log "DNS Records"
dns_info "$PROD_DOMAIN"
dns_info "$STAGING_DOMAIN"

if [[ -n "$DIST_ID" ]]; then
  log "CloudFront Distribution ($DIST_ID)"
  aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.{Status:Status,Domain:DomainName,Cert:DistributionConfig.ViewerCertificate.ACMCertificateArn,Aliases:DistributionConfig.Aliases.Items,Origin:DistributionConfig.Origins.Items[0].DomainName}' || true
fi

if [[ -n "$DIST_ID" ]]; then
  ORIGIN=$(origin_from_dist "$DIST_ID")
  log "Origin vs Direct Checks"
  echo "Origin domain: $ORIGIN"
  http_head "https://$ORIGIN/" || true
fi

log "Prod Domain HTTP"
http_head "https://$PROD_DOMAIN/" || true

log "Staging Domain HTTP"
http_head "https://$STAGING_DOMAIN/" || true

log "App Runner Services (summary)"
aws apprunner list-services --region "$REGION" --query 'ServiceSummaryList[].{Name:ServiceName,Status:Status,Arn:ServiceArn}' --output table || true

if $SHOW_RAW && [[ -n "$DIST_ID" ]]; then
  log "Raw Distribution Config (truncated origins + behaviors)"
  aws cloudfront get-distribution-config --id "$DIST_ID" --query '{Origins:DistributionConfig.Origins,DefaultCacheBehavior:DistributionConfig.DefaultCacheBehavior}' || true
fi

echo -e "\nDone. Review sections for mismatches:\n- Prod DNS should ALIAS to CloudFront\n- CloudFront origin should equal current App Runner service URL\n- HTTP responses should be 200/302."
