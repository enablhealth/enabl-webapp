#!/bin/bash

# Final WWW setup using existing wildcard certificate
# Uses *.enabl.health certificate which covers www.enabl.health

set -e

WILDCARD_CERT_ARN="arn:aws:acm:us-east-1:775525057465:certificate/20d113c9-4870-43f4-85bc-1ff14051f515"
HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"

echo "🚀 Setting up www.enabl.health with wildcard certificate..."
echo "Certificate ARN: $WILDCARD_CERT_ARN"

# Step 1: Update existing CloudFront distribution to use www.enabl.health
echo ""
echo "1️⃣ Updating existing CloudFront distribution (EDBRVZPIVVSJJ) to use www.enabl.health..."

# Get current ETag
ETAG=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'ETag' --output text)
echo "Current ETag: $ETAG"

# Update the distribution
aws cloudfront update-distribution \
    --id EDBRVZPIVVSJJ \
    --distribution-config file://www-cloudfront-config.json \
    --if-match "$ETAG"

echo "✅ Main distribution updated for www.enabl.health"

# Step 2: Create redirect distribution
echo ""
echo "2️⃣ Creating redirect distribution for enabl.health → www.enabl.health..."

REDIRECT_DIST_ID=$(aws cloudfront create-distribution \
    --distribution-config file://redirect-cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text)

echo "✅ Redirect distribution created: $REDIRECT_DIST_ID"

# Step 3: Setup DNS records
echo ""
echo "3️⃣ Setting up DNS records..."

# Get CloudFront domains
WWW_DOMAIN=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.DomainName' --output text)
REDIRECT_DOMAIN=$(aws cloudfront get-distribution --id "$REDIRECT_DIST_ID" --query 'Distribution.DomainName' --output text)

echo "WWW Domain: $WWW_DOMAIN"
echo "Redirect Domain: $REDIRECT_DOMAIN"

# Create DNS record for www.enabl.health pointing to main distribution
echo "Creating www.enabl.health DNS record..."
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

# Update DNS record for enabl.health to point to redirect distribution
echo "Updating enabl.health DNS record for redirect..."
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

# Step 4: Update App Runner environment
echo ""
echo "4️⃣ Updating App Runner environment variables..."

# Find the correct App Runner service ARN
APP_RUNNER_SERVICES=$(aws apprunner list-services --query 'ServiceSummaryList[?contains(ServiceName,`enabl`) && contains(ServiceName,`prod`)].ServiceArn' --output text)

if [ -n "$APP_RUNNER_SERVICES" ]; then
    for SERVICE_ARN in $APP_RUNNER_SERVICES; do
        echo "Updating App Runner service: $SERVICE_ARN"
        
        # Note: This is a simplified update - you may need to adjust based on your exact configuration
        echo "⚠️  App Runner environment update should be done via AWS Console"
        echo "   Change NEXT_PUBLIC_APP_URL to: https://www.enabl.health"
        break
    done
else
    echo "⚠️  Could not find App Runner service. Update environment variables manually:"
    echo "   Set NEXT_PUBLIC_APP_URL=https://www.enabl.health"
fi

echo ""
echo "🎉 WWW Setup Complete!"
echo ""
echo "📋 Architecture Summary:"
echo "┌─────────────────┐    301 Redirect    ┌─────────────────┐"
echo "│  enabl.health   │ ───────────────► │ www.enabl.health │"
echo "│ (CloudFront)    │                  │  (CloudFront)    │"
echo "│ $REDIRECT_DIST_ID │                  │   EDBRVZPIVVSJJ   │"
echo "└─────────────────┘                  └─────────────────┘"
echo "                                              │"
echo "                                              ▼"
echo "                                    ┌─────────────────┐"
echo "                                    │   App Runner    │"
echo "                                    │ 7e6ikh7qxk...   │"
echo "                                    └─────────────────┘"
echo ""
echo "⏳ Deployment Status:"
echo "• CloudFront distributions: Deploying (10-15 minutes)"
echo "• DNS propagation: Up to 48 hours globally"
echo "• App Runner: Update env vars via AWS Console"
echo ""
echo "🧪 Testing (after deployment):"
echo "curl -I https://enabl.health          # Should redirect (301)"
echo "curl -I https://www.enabl.health      # Should serve app (200)"
echo "curl -s https://www.enabl.health/api/config/auth  # Should return JSON"
echo ""
echo "🔗 Useful Links:"
echo "• CloudFront Console: https://console.aws.amazon.com/cloudfront/home"
echo "• Route53 Console: https://console.aws.amazon.com/route53/home"
echo "• App Runner Console: https://console.aws.amazon.com/apprunner/home?region=us-east-1"
