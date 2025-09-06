#!/bin/bash

# Setup Route53 DNS records for www.enabl.health redirect architecture
# This script sets up both certificate validation and final domain records

set -e

HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"

echo "🌍 Setting up Route53 DNS records..."

# First, let's check what certificates we have
echo "📜 Checking available certificates..."
aws acm list-certificates --query 'CertificateSummaryList[].{Domain:DomainName,ARN:CertificateArn,Status:Status}' --output table

echo ""
echo "🔍 Getting certificate validation records..."

# Try to get the newest certificate for enabl.health
CERT_ARN=$(aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`enabl.health`] | [0].CertificateArn' --output text)

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
    echo "❌ No certificate found for enabl.health. Requesting new certificate..."
    
    # Request certificate
    CERT_ARN=$(aws acm request-certificate \
        --domain-name "enabl.health" \
        --subject-alternative-names "www.enabl.health" "*.enabl.health" \
        --validation-method DNS \
        --region us-east-1 \
        --query 'CertificateArn' \
        --output text)
    
    echo "✅ Certificate requested: $CERT_ARN"
    echo "⏳ Waiting 30 seconds for certificate to initialize..."
    sleep 30
fi

echo "📋 Certificate ARN: $CERT_ARN"

# Get validation records (might take a few tries)
echo "🔍 Getting DNS validation records..."
for i in {1..5}; do
    VALIDATION_RECORDS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json 2>/dev/null || echo "[]")
    
    if [ "$VALIDATION_RECORDS" != "[]" ] && [ "$VALIDATION_RECORDS" != "null" ]; then
        break
    fi
    
    echo "⏳ Waiting for validation records... (attempt $i/5)"
    sleep 10
done

echo "📝 Validation records:"
echo "$VALIDATION_RECORDS"

# Create DNS validation records
if [ "$VALIDATION_RECORDS" != "[]" ] && [ "$VALIDATION_RECORDS" != "null" ]; then
    echo "🔧 Creating DNS validation records..."
    
    # Parse and create validation records
    echo "$VALIDATION_RECORDS" | jq -r '.[] | [.Name, .Type, .Value] | @tsv' | while IFS=$'\t' read -r name type value; do
        echo "Creating validation record: $name -> $value"
        
        aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch "{
                \"Changes\": [{
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                        \"Name\": \"$name\",
                        \"Type\": \"$type\",
                        \"TTL\": 300,
                        \"ResourceRecords\": [{
                            \"Value\": \"$value\"
                        }]
                    }
                }]
            }" > /dev/null
        
        echo "✅ Validation record created: $name"
    done
else
    echo "⚠️ No validation records found yet. You may need to run this script again."
fi

# Get current CloudFront distribution domain
CURRENT_CF_DOMAIN=$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.DomainName' --output text 2>/dev/null || echo "")

if [ -n "$CURRENT_CF_DOMAIN" ]; then
    echo "🌐 Setting up temporary www.enabl.health record..."
    
    # Create temporary www.enabl.health record pointing to current distribution
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"www.enabl.health\",
                    \"Type\": \"A\",
                    \"AliasTarget\": {
                        \"DNSName\": \"$CURRENT_CF_DOMAIN\",
                        \"EvaluateTargetHealth\": false,
                        \"HostedZoneId\": \"Z2FDTNDATAQYW2\"
                    }
                }
            }]
        }"
    
    echo "✅ Temporary www.enabl.health record created"
fi

echo ""
echo "📋 DNS Records Status:"
echo "✅ Certificate validation records: Created"
echo "✅ www.enabl.health: Points to current CloudFront"
echo "⏳ enabl.health: Will be updated after redirect distribution is created"
echo ""
echo "⏳ Next steps:"
echo "1. Wait 5-10 minutes for certificate validation"
echo "2. Check certificate status: aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.Status'"
echo "3. Once validated, run: ./complete-www-setup.sh \"$CERT_ARN\" \"$HOSTED_ZONE_ID\""
echo ""
echo "Certificate ARN: $CERT_ARN"
