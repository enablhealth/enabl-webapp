#!/bin/bash

# Check status and complete www.enabl.health setup

CERT_ARN="arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6"
HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"

echo "🔍 Checking current status..."

# Check certificate status
echo "📜 Certificate Status:"
CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --query 'Certificate.Status' --output text 2>/dev/null || echo "UNKNOWN")
echo "Status: $CERT_STATUS"

# Check certificate domains
echo ""
echo "📋 Certificate Domains:"
aws acm describe-certificate --certificate-arn "$CERT_ARN" --query 'Certificate.{DomainName:DomainName,SANs:SubjectAlternativeNames}' --output table 2>/dev/null || echo "Could not retrieve certificate details"

# Check current DNS records
echo ""
echo "🌐 Current DNS Records:"
aws route53 list-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --query 'ResourceRecordSets[?contains(Name,`enabl.health`)]' --output table

# Check CloudFront distribution
echo ""
echo "☁️ Current CloudFront Distribution:"
aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.{Status:Status,DomainName:DomainName,Aliases:DistributionConfig.Aliases.Items}' --output table

echo ""
echo "🧪 Testing Current Setup:"

# Test current enabl.health
echo "Testing https://enabl.health..."
curl -I https://enabl.health 2>/dev/null | head -1 || echo "❌ enabl.health not accessible"

# Test www.enabl.health
echo "Testing https://www.enabl.health..."
curl -I https://www.enabl.health 2>/dev/null | head -1 || echo "❌ www.enabl.health not accessible"

# Test API on www
echo "Testing https://www.enabl.health/api/config/auth..."
curl -s https://www.enabl.health/api/config/auth 2>/dev/null | jq -r '.userPoolId // "❌ API not working"' || echo "❌ API not accessible"

echo ""
echo "📋 Next Steps Based on Status:"

if [ "$CERT_STATUS" = "ISSUED" ]; then
    echo "✅ Certificate is validated!"
    echo "🚀 Ready to complete setup. Run:"
    echo "   ./complete-www-setup.sh \"$CERT_ARN\" \"$HOSTED_ZONE_ID\""
elif [ "$CERT_STATUS" = "PENDING_VALIDATION" ]; then
    echo "⏳ Certificate is still pending validation"
    echo "💡 DNS validation records should be in place. Wait 5-10 more minutes."
else
    echo "❓ Certificate status: $CERT_STATUS"
    echo "🔍 Check AWS ACM Console for details"
fi

echo ""
echo "🔗 Useful Links:"
echo "- ACM Console: https://console.aws.amazon.com/acm/home?region=us-east-1"
echo "- CloudFront Console: https://console.aws.amazon.com/cloudfront/home"
echo "- Route53 Console: https://console.aws.amazon.com/route53/home"
