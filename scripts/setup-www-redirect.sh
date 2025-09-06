#!/bin/bash

# Setup www.enabl.health and redirect from enabl.health to www.enabl.health
# This script implements the proper redirect architecture

set -e

echo "🚀 Setting up www.enabl.health redirect architecture..."

# Step 1: Request new certificate covering both domains
echo "📜 Requesting SSL certificate for enabl.health and www.enabl.health..."
CERT_ARN=$(aws acm request-certificate \
  --domain-name "enabl.health" \
  --subject-alternative-names "www.enabl.health" "*.enabl.health" \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text)

echo "Certificate requested: $CERT_ARN"
echo "⚠️  You need to validate this certificate in ACM console before proceeding"

# Step 2: Create S3 bucket for redirect (already done)
echo "✅ S3 redirect bucket already created: enabl-health-redirect"

# Step 3: Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`enabl.health.`].Id' \
  --output text | sed 's|/hostedzone/||')

echo "Hosted Zone ID: $HOSTED_ZONE_ID"

# Step 4: Create temporary script to run after certificate validation
cat > complete-www-setup.sh << 'EOF'
#!/bin/bash

# Run this script AFTER validating the SSL certificate in ACM console

CERT_ARN="$1"
HOSTED_ZONE_ID="$2"

if [ -z "$CERT_ARN" ] || [ -z "$HOSTED_ZONE_ID" ]; then
  echo "Usage: $0 <CERT_ARN> <HOSTED_ZONE_ID>"
  exit 1
fi

echo "🔄 Updating certificate ARN in configurations..."

# Update www distribution config with new certificate
sed -i.bak "s|arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6|$CERT_ARN|g" www-cloudfront-config.json

# Update redirect distribution config with new certificate  
sed -i.bak "s|arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6|$CERT_ARN|g" redirect-cloudfront-config.json

echo "📝 Updating existing CloudFront distribution to use www.enabl.health..."

# Get current ETag
ETAG=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'ETag' --output text)

# Update existing distribution to use www.enabl.health
aws cloudfront update-distribution \
  --id EDBRVZPIVVSJJ \
  --distribution-config file://www-cloudfront-config.json \
  --if-match "$ETAG"

echo "🌍 Creating redirect CloudFront distribution..."

# Create new distribution for redirect
REDIRECT_DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config file://redirect-cloudfront-config.json \
  --query 'Distribution.Id' \
  --output text)

echo "Redirect distribution created: $REDIRECT_DIST_ID"

# Get the CloudFront domain names
WWW_DOMAIN=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.DomainName' --output text)
REDIRECT_DOMAIN=$(aws cloudfront get-distribution --id "$REDIRECT_DIST_ID" --query 'Distribution.DomainName' --output text)

echo "🌐 Setting up DNS records..."

# Create DNS record for www.enabl.health pointing to main distribution
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

# Update DNS record for enabl.health to point to redirect distribution
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

echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "  • www.enabl.health: Main site (CloudFront: EDBRVZPIVVSJJ)"
echo "  • enabl.health: Redirects to www.enabl.health (CloudFront: $REDIRECT_DIST_ID)"
echo ""
echo "⏳ Wait 10-15 minutes for CloudFront distributions to deploy"
echo "🧪 Then test:"
echo "  curl -I https://enabl.health (should redirect)"
echo "  curl -I https://www.enabl.health (should serve app)"

EOF

chmod +x complete-www-setup.sh

echo ""
echo "📋 Next steps:"
echo "1. Go to ACM console and validate the certificate: $CERT_ARN"
echo "2. Run: ./complete-www-setup.sh \"$CERT_ARN\" \"$HOSTED_ZONE_ID\""
echo ""
echo "Certificate ARN: $CERT_ARN"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
