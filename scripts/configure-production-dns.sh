#!/bin/bash

# Configure DNS for production domain

echo "🔗 Configuring DNS for enabl.health..."

aws route53 change-resource-record-sets \
  --hosted-zone-id Z04675923OYMXX09GUGWD \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "enabl.health",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d1cbn4sju1hvxd.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    }]
  }'

echo ""
echo "✅ DNS configured for production domain"
echo "🌐 enabl.health will point to CloudFront distribution"
echo "⏳ DNS propagation may take 5-10 minutes"
