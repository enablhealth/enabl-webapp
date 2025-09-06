#!/bin/bash

# Idempotent S3 redirect setup for apex -> www
# enabl.health (HTTP only via S3 website) -> https://www.enabl.health

set -euo pipefail

REGION="us-east-1"
HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"
BUCKET="enabl-health-root-redirect"
WWW_HOST="www.enabl.health"
WEBSITE_ENDPOINT="${BUCKET}.s3-website-${REGION}.amazonaws.com"
S3_WEBSITE_HOSTED_ZONE_ID="Z3AQBSTGFYJSTF" # fixed for us-east-1 website

echo "🎯 Ensuring S3 redirect bucket exists and is configured: ${BUCKET}"

# Create bucket if missing (us-east-1: no LocationConstraint)
if ! aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  echo "🪣 Creating bucket $BUCKET"
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
fi

echo "🔓 Configuring public access settings for website hosting"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo "📜 Applying bucket policy to allow public website access"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    }
  ]
}
POLICY
)"

echo "🌐 Enabling website redirect to https://${WWW_HOST}"
aws s3api put-bucket-website \
  --bucket "$BUCKET" \
  --website-configuration "$(cat <<WEBCONF
{
  "RedirectAllRequestsTo": {
    "HostName": "${WWW_HOST}",
    "Protocol": "https"
  }
}
WEBCONF
)"

echo "🔎 Website endpoint: http://${WEBSITE_ENDPOINT}"

echo "🧭 Upserting Route53 A-alias for apex to S3 website endpoint"
TMP_JSON=$(mktemp)
cat > "$TMP_JSON" <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "enabl.health",
      "Type": "A",
      "AliasTarget": {
        "DNSName": "${WEBSITE_ENDPOINT}",
        "EvaluateTargetHealth": false,
        "HostedZoneId": "${S3_WEBSITE_HOSTED_ZONE_ID}"
      }
    }
  }]
}
EOF
aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file://"$TMP_JSON"
rm -f "$TMP_JSON"

echo "✅ DNS record updated to point apex to S3 website redirect"

cat <<NOTE

🎉 S3 Redirect Setup Complete!

Important:
- S3 website endpoints only support HTTP. Redirect works at http://enabl.health -> https://${WWW_HOST}
- For HTTPS on apex (https://enabl.health), use CloudFront redirect (see complete-www-setup.sh).

Test now:
  curl -I http://enabl.health     # Expect 301 to https://${WWW_HOST}
  curl -I https://${WWW_HOST} # Main site via CloudFront
NOTE
