#!/usr/bin/env bash
set -euo pipefail
# Normalize CloudFront default cache behavior header forwarding & allowed methods; then invalidate.
# Usage: ./scripts/cloudfront-fix-forwarding.sh <DISTRIBUTION_ID>
# Requires: aws, jq

if [[ $# -lt 1 ]]; then echo "Usage: $0 <distribution_id>" >&2; exit 1; fi
DIST_ID=$1
TMP=$(mktemp)
aws cloudfront get-distribution-config --id "$DIST_ID" > "$TMP" || { echo "Failed to fetch distribution" >&2; exit 1; }
ETAG=$(jq -r '.ETag' "$TMP")
# Build updated config preserving existing except forwarding headers minimized.
UPDATED=$(jq '.DistributionConfig as $d | $d
  | .DefaultCacheBehavior.ForwardedValues.QueryString=true
  | .DefaultCacheBehavior.ForwardedValues.Cookies={"Forward":"all"}
  | .DefaultCacheBehavior.ForwardedValues.Headers={"Quantity":0}
  | .DefaultCacheBehavior.AllowedMethods.Items=["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"]
  | .DefaultCacheBehavior.AllowedMethods.Quantity=7
  | .DefaultCacheBehavior.AllowedMethods.CachedMethods={"Quantity":2,"Items":["GET","HEAD"]}' "$TMP")

# Write stripped config file
CONF=$(mktemp)
echo "$UPDATED" > "$CONF"
aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" --distribution-config file://"$CONF"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths '/*'

echo "Update submitted. Propagation may take ~5-10 minutes."
