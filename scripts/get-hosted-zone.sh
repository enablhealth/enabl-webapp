#!/bin/bash

# Get Route53 Hosted Zone ID for enabl.health domain

echo "🔍 Looking up Route53 Hosted Zone for enabl.health..."
echo ""

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query 'HostedZones[?Name==`enabl.health.`].Id' --output text | sed 's|/hostedzone/||')

if [ -n "$HOSTED_ZONE_ID" ]; then
    echo "✅ Found hosted zone ID: $HOSTED_ZONE_ID"
    echo ""
    echo "📋 Use this command to configure staging DNS:"
    echo ""
    echo "aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '"
    echo "{"
    echo "  \"Changes\": [{"
    echo "    \"Action\": \"UPSERT\","
    echo "    \"ResourceRecordSet\": {"
    echo "      \"Name\": \"staging.enabl.health\","
    echo "      \"Type\": \"CNAME\","
    echo "      \"TTL\": 300,"
    echo "      \"ResourceRecords\": [{\"Value\": \"YOUR_APPRUNNER_CNAME_TARGET\"}]"
    echo "    }"
    echo "  }]"
    echo "}'"
    echo ""
    echo "🔄 For production (CloudFront alias):"
    echo ""
    echo "aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '"
    echo "{"
    echo "  \"Changes\": [{"
    echo "    \"Action\": \"UPSERT\","
    echo "    \"ResourceRecordSet\": {"
    echo "      \"Name\": \"enabl.health\","
    echo "      \"Type\": \"A\","
    echo "      \"AliasTarget\": {"
    echo "        \"DNSName\": \"YOUR_CLOUDFRONT_DISTRIBUTION_DOMAIN\","
    echo "        \"EvaluateTargetHealth\": false,"
    echo "        \"HostedZoneId\": \"Z2FDTNDATAQYW2\""
    echo "      }"
    echo "    }"
    echo "  }]"
    echo "}'"
else
    echo "❌ No hosted zone found for enabl.health"
    echo "Please create a hosted zone first:"
    echo "aws route53 create-hosted-zone --name enabl.health --caller-reference $(date +%s)"
fi
