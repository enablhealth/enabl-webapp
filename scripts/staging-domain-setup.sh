#!/usr/bin/env bash
set -euo pipefail
# Attach and validate staging custom domain (direct App Runner path, no CloudFront)
# Usage: ./scripts/staging-domain-setup.sh [staging.enabl.health]
# Requires: aws, jq
DOMAIN=${1:-staging.enabl.health}
REGION=us-east-1

have(){ command -v "$1" >/dev/null 2>&1; }
for c in aws jq; do have $c || { echo "Missing $c" >&2; exit 1; }; done

STG_ARN=$(aws apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='enabl-health-staging'].ServiceArn" --output text)
if [[ -z "$STG_ARN" || "$STG_ARN" == "None" ]]; then
  echo "Staging service not found" >&2; exit 1
fi

echo "Staging service ARN: $STG_ARN"

RAW_JSON=$(aws apprunner describe-custom-domains --service-arn "$STG_ARN" --region $REGION --output json || echo '{}')
MATCH_COUNT=$(echo "$RAW_JSON" | jq '[.CustomDomains[]? | select(.DomainName=="'$DOMAIN'")] | length')
if [[ "$MATCH_COUNT" -eq 0 ]]; then
  echo "Adding custom domain $DOMAIN to App Runner..."
  if ! aws apprunner associate-custom-domain --service-arn "$STG_ARN" --domain-name "$DOMAIN" --region $REGION >/dev/null 2>&1; then
    echo "Associate call returned non-zero (may already be in-progress). Continuing..."
  fi
  sleep 5
  RAW_JSON=$(aws apprunner describe-custom-domains --service-arn "$STG_ARN" --region $REGION --output json || echo '{}')
else
  echo "Domain already associated."
fi

DOMAIN_BLOCK=$(echo "$RAW_JSON" | jq '.CustomDomains[]? | select(.DomainName=="'$DOMAIN'")')
if [[ -z "$DOMAIN_BLOCK" ]]; then
  echo "Could not retrieve domain block after association attempt." >&2
  echo "Raw response:" >&2
  echo "$RAW_JSON" >&2
  exit 1
fi

# Field name variations fallback
STATUS=$(echo "$DOMAIN_BLOCK" | jq -r '.DomainNameStatus // .Status // "UNKNOWN"')
TARGET=$(echo "$DOMAIN_BLOCK" | jq -r '.AppRunnerDomainName // .DomainName // empty')
PENDING_VAL=$(echo "$DOMAIN_BLOCK" | jq '[.CertificateValidationRecords[]? | select(.ValidationStatus != "SUCCESS")]')
PENDING_COUNT=$(echo "$PENDING_VAL" | jq 'length')

echo "\nCurrent status: $STATUS"
echo "App Runner domain target (CNAME destination): $TARGET"

if [[ "$PENDING_COUNT" -gt 0 ]]; then
  echo "\nAdd/ensure these validation CNAME records in Route53:";
  echo "$PENDING_VAL" | jq -r '.[] | "  NAME: \(.Name)\n  TYPE: CNAME\n  VALUE: \(.Value)\n"'
else
  echo "No pending validation (all records validated or none required)."
fi

cat <<EONOTE

Route53 Required App Record (ONLY this CNAME, remove stray A records):
  staging.enabl.health. 300 IN CNAME $TARGET.

After adding records wait a few minutes, then rerun:
  aws apprunner describe-custom-domains --service-arn $STG_ARN --region $REGION \
    --query 'CustomDomains[?DomainName==`$DOMAIN`][0].DomainNameStatus'
Expect: ACTIVE

Then test:
  curl -I https://$DOMAIN/
EONOTE
