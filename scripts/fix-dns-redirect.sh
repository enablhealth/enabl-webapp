#!/bin/bash

echo "=== Fixing enabl.health DNS Redirect ==="
echo ""

# Configuration
HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"
S3_WEBSITE_ENDPOINT="enabl-health-root-redirect.s3-website-us-east-1.amazonaws.com"
S3_HOSTED_ZONE_ID="Z3AQBSTGFYJSTF"  # US East 1 S3 website hosted zone ID

echo "1. Creating DNS change batch file..."
cat > /tmp/fix-dns-redirect.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "enabl.health",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "${S3_WEBSITE_ENDPOINT}",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "${S3_HOSTED_ZONE_ID}"
        }
      }
    }
  ]
}
EOF

echo "2. DNS configuration created:"
cat /tmp/fix-dns-redirect.json

echo ""
echo "3. Applying DNS changes to Route53..."
aws route53 change-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch file:///tmp/fix-dns-redirect.json

if [ $? -eq 0 ]; then
  echo "✅ DNS record updated successfully!"
  echo ""
  echo "4. Verifying S3 redirect is working..."
  echo "Direct S3 test:"
  curl -I "http://${S3_WEBSITE_ENDPOINT}/" 2>/dev/null | head -3
  
  echo ""
  echo "5. DNS propagation check (may take 5-10 minutes)..."
  echo "You can test with: curl -I http://enabl.health"
  echo ""
  echo "Expected result:"
  echo "HTTP/1.1 301 Moved Permanently"
  echo "Location: https://www.enabl.health/"
else
  echo "❌ DNS update failed. Check AWS credentials and try again."
fi

echo ""
echo "=== DNS Fix Complete ==="
