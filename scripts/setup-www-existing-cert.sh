#!/bin/bash

# Use existing certificate for www.enabl.health setup
# This assumes the existing certificate already covers www.enabl.health

set -e

EXISTING_CERT_ARN="arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6"
HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"

echo "🔍 Using existing certificate for www.enabl.health setup..."
echo "Certificate ARN: $EXISTING_CERT_ARN"

echo ""
echo "📋 Checking certificate domains..."

# Try to get certificate details
CERT_DETAILS=$(aws acm describe-certificate --certificate-arn "$EXISTING_CERT_ARN" 2>/dev/null || echo "ERROR")

if [ "$CERT_DETAILS" != "ERROR" ]; then
    echo "✅ Certificate found"
    echo "$CERT_DETAILS" | jq -r '.Certificate | "Domain: \(.DomainName)\nSANs: \(.SubjectAlternativeNames | join(", "))\nStatus: \(.Status)"'
else
    echo "⚠️ Could not retrieve certificate details, proceeding anyway"
fi

echo ""
echo "🔄 Setting up www.enabl.health with existing certificate..."

# Update existing CloudFront distribution to use www.enabl.health
echo "1. Updating existing CloudFront distribution..."

# Get current ETag
ETAG=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'ETag' --output text)
echo "Current ETag: $ETAG"

# Update distribution
aws cloudfront update-distribution \
    --id EDBRVZPIVVSJJ \
    --distribution-config file://www-cloudfront-config.json \
    --if-match "$ETAG"

echo "✅ CloudFront distribution updated to use www.enabl.health"

# Wait a moment before creating redirect distribution
echo ""
echo "2. Creating redirect distribution..."
sleep 5

# Create redirect distribution
REDIRECT_DIST_ID=$(aws cloudfront create-distribution \
    --distribution-config file://redirect-cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text)

echo "✅ Redirect distribution created: $REDIRECT_DIST_ID"

# Get CloudFront domain names
echo ""
echo "3. Setting up DNS records..."

WWW_DOMAIN=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.DomainName' --output text)
REDIRECT_DOMAIN=$(aws cloudfront get-distribution --id "$REDIRECT_DIST_ID" --query 'Distribution.DomainName' --output text)

echo "WWW Domain: $WWW_DOMAIN"
echo "Redirect Domain: $REDIRECT_DOMAIN"

# Create DNS record for www.enabl.health
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
                \"Name\": \"www.enabl.health\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"DNSName\": \"$WWW_DOMAIN\",
                    \"EvaluateTargetHealth\": false,
                    \"HostedZoneId\": \"Z2FDTNDATAQYW2\"
                }
            }
        }]
    }"

echo "✅ www.enabl.health DNS record created"

# Update DNS record for enabl.health to point to redirect
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"UPSERT\",
            \"ResourceRecordSet\": {
                \"Name\": \"enabl.health\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"DNSName\": \"$REDIRECT_DOMAIN\",
                    \"EvaluateTargetHealth\": false,
                    \"HostedZoneId\": \"Z2FDTNDATAQYW2\"
                }
            }
        }]
    }"

echo "✅ enabl.health DNS record updated for redirect"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Summary:"
echo "• www.enabl.health: Main site (CloudFront: EDBRVZPIVVSJJ)"
echo "• enabl.health: Redirects to www.enabl.health (CloudFront: $REDIRECT_DIST_ID)"
echo ""
echo "⏳ Wait 10-15 minutes for CloudFront distributions to deploy"
echo "🧪 Then test:"
echo "  curl -I https://enabl.health (should redirect to www.enabl.health)"
echo "  curl -I https://www.enabl.health (should serve app)"
echo "  curl -s https://www.enabl.health/api/config/auth (should return JSON)"
