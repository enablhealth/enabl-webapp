#!/bin/bash

# Add www.enabl.health to existing certificate
# Since we can't modify existing certificates, we need to request a new one

set -e

HOSTED_ZONE_ID="Z04675923OYMXX09GUGWD"

echo "🔍 Current certificate only covers enabl.health"
echo "📜 Need to request new certificate covering both enabl.health and www.enabl.health"

# Request new certificate with both domains
echo "🆕 Requesting new certificate..."
NEW_CERT_ARN=$(aws acm request-certificate \
    --domain-name "enabl.health" \
    --subject-alternative-names "www.enabl.health" "*.enabl.health" \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

echo "✅ New certificate requested: $NEW_CERT_ARN"

# Wait for validation records to be available
echo "⏳ Waiting for validation records..."
sleep 30

# Get validation records
echo "🔍 Getting DNS validation records..."
VALIDATION_RECORDS=$(aws acm describe-certificate --certificate-arn "$NEW_CERT_ARN" --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json)

echo "📝 Validation records:"
echo "$VALIDATION_RECORDS"

# Create DNS validation records
if [ "$VALIDATION_RECORDS" != "[]" ] && [ "$VALIDATION_RECORDS" != "null" ]; then
    echo "🔧 Creating DNS validation records..."
    
    echo "$VALIDATION_RECORDS" | jq -r '.[] | [.Name, .Type, .Value] | @tsv' | while IFS=$'\t' read -r name type value; do
        echo "Creating validation record: $name"
        
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
fi

# Update configuration files with new certificate
echo ""
echo "🔧 Updating configuration files..."

# Update www distribution config
sed -i.bak "s|arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6|$NEW_CERT_ARN|g" www-cloudfront-config.json

# Update redirect distribution config
sed -i.bak "s|arn:aws:acm:us-east-1:775525057465:certificate/bc631397-b94b-458c-9ce7-e9c5e75644b6|$NEW_CERT_ARN|g" redirect-cloudfront-config.json

echo "✅ Configuration files updated"

# Create completion script
cat > complete-www-setup-final.sh << EOF
#!/bin/bash

# Final setup script after certificate validation
NEW_CERT_ARN="$NEW_CERT_ARN"
HOSTED_ZONE_ID="$HOSTED_ZONE_ID"

echo "🔍 Checking certificate status..."
CERT_STATUS=\$(aws acm describe-certificate --certificate-arn "\$NEW_CERT_ARN" --query 'Certificate.Status' --output text)

if [ "\$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ Certificate not yet validated. Status: \$CERT_STATUS"
    echo "⏳ Wait for certificate validation to complete, then run this script again"
    exit 1
fi

echo "✅ Certificate validated!"

# Update existing CloudFront distribution
echo "🔄 Updating existing CloudFront distribution..."
ETAG=\$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'ETag' --output text)

aws cloudfront update-distribution \\
    --id EDBRVZPIVVSJJ \\
    --distribution-config file://www-cloudfront-config.json \\
    --if-match "\$ETAG"

echo "✅ Main distribution updated for www.enabl.health"

# Create redirect distribution
echo "🔄 Creating redirect distribution..."
REDIRECT_DIST_ID=\$(aws cloudfront create-distribution \\
    --distribution-config file://redirect-cloudfront-config.json \\
    --query 'Distribution.Id' \\
    --output text)

echo "✅ Redirect distribution created: \$REDIRECT_DIST_ID"

# Setup DNS
echo "🌐 Setting up DNS records..."
WWW_DOMAIN=\$(aws cloudfront get-distribution --id EDBRVZPIVVSJJ --query 'Distribution.DomainName' --output text)
REDIRECT_DOMAIN=\$(aws cloudfront get-distribution --id "\$REDIRECT_DIST_ID" --query 'Distribution.DomainName' --output text)

# www.enabl.health -> main distribution
aws route53 change-resource-record-sets \\
    --hosted-zone-id "\$HOSTED_ZONE_ID" \\
    --change-batch "{
        \\"Changes\\": [{
            \\"Action\\": \\"UPSERT\\",
            \\"ResourceRecordSet\\": {
                \\"Name\\": \\"www.enabl.health\\",
                \\"Type\\": \\"A\\",
                \\"AliasTarget\\": {
                    \\"DNSName\\": \\"\$WWW_DOMAIN\\",
                    \\"EvaluateTargetHealth\\": false,
                    \\"HostedZoneId\\": \\"Z2FDTNDATAQYW2\\"
                }
            }
        }]
    }"

# enabl.health -> redirect distribution
aws route53 change-resource-record-sets \\
    --hosted-zone-id "\$HOSTED_ZONE_ID" \\
    --change-batch "{
        \\"Changes\\": [{
            \\"Action\\": \\"UPSERT\\",
            \\"ResourceRecordSet\\": {
                \\"Name\\": \\"enabl.health\\",
                \\"Type\\": \\"A\\",
                \\"AliasTarget\\": {
                    \\"DNSName\\": \\"\$REDIRECT_DOMAIN\\",
                    \\"EvaluateTargetHealth\\": false,
                    \\"HostedZoneId\\": \\"Z2FDTNDATAQYW2\\"
                }
            }
        }]
    }"

echo ""
echo "🎉 WWW Setup Complete!"
echo "• www.enabl.health: Main site"
echo "• enabl.health: Redirects to www.enabl.health" 
echo ""
echo "⏳ Wait 10-15 minutes for CloudFront deployment"
echo "🧪 Test with: curl -I https://www.enabl.health"
EOF

chmod +x complete-www-setup-final.sh

echo ""
echo "📋 Next Steps:"
echo "1. Wait 5-10 minutes for certificate validation"
echo "2. Check status: aws acm describe-certificate --certificate-arn $NEW_CERT_ARN --query 'Certificate.Status'"
echo "3. Once ISSUED, run: ./complete-www-setup-final.sh"
echo ""
echo "New Certificate ARN: $NEW_CERT_ARN"
