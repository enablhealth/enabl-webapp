#!/usr/bin/env bash
echo "[removed] setup-cloudfront.sh deprecated. CloudFront handled in frontend-provision.sh (production)." >&2
exit 1

if [ -z "$CERT_ARN" ]; then
    echo "🔐 Requesting SSL certificate..."
    CERT_ARN=$(aws acm request-certificate \
        --domain-name enabl.health \
        --subject-alternative-names "*.enabl.health" \
        --validation-method DNS \
        --region us-east-1 \
        --query 'CertificateArn' \
        --output text)
    
    echo "📜 SSL Certificate requested: $CERT_ARN"
    echo ""
    echo "⚠️  IMPORTANT: Please validate the certificate in AWS Console:"
    echo "   1. Go to: https://console.aws.amazon.com/acm/home?region=us-east-1"
    echo "   2. Click on the certificate"
    echo "   3. Add the DNS validation records to Route53"
    echo "   4. Wait for validation to complete (Status: Issued)"
    echo ""
    echo "Press Enter when certificate validation is complete..."
    read -r
else
    echo "✅ Found existing certificate: $CERT_ARN"
fi

# Create CloudFront distribution
echo "☁️  Creating CloudFront distribution..."

# Create distribution config file
cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "enabl-production-$(date +%s)",
    "Comment": "Enabl Health Production Distribution",
    "DefaultCacheBehavior": {
        "TargetOriginId": "enabl-app-runner-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "all"
            },
            "Headers": {
                "Quantity": 5,
                "Items": ["Authorization", "CloudFront-Forwarded-Proto", "Host", "User-Agent", "Accept"]
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "MinTTL": 0,
        "DefaultTTL": 3600,
        "MaxTTL": 86400
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "enabl-app-runner-origin",
                "DomainName": "$SERVICE_URL",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "https-only",
                    "OriginSslProtocols": {
                        "Quantity": 1,
                        "Items": ["TLSv1.2"]
                    }
                }
            }
        ]
    },
    "CacheBehaviors": {
        "Quantity": 1,
        "Items": [
            {
                "PathPattern": "/api/*",
                "TargetOriginId": "enabl-app-runner-origin",
                "ViewerProtocolPolicy": "https-only",
                "AllowedMethods": {
                    "Quantity": 7,
                    "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                },
                "ForwardedValues": {
                    "QueryString": true,
                    "Cookies": {
                        "Forward": "all"
                    },
                    "Headers": {
                        "Quantity": 1,
                        "Items": ["*"]
                    }
                },
                "TrustedSigners": {
                    "Enabled": false,
                    "Quantity": 0
                },
                "MinTTL": 0,
                "DefaultTTL": 0,
                "MaxTTL": 0
            }
        ]
    },
    "Enabled": true,
    "Aliases": {
        "Quantity": 1,
        "Items": ["enabl.health"]
    },
    "PriceClass": "PriceClass_All",
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    }
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text)

DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution \
    --id $DISTRIBUTION_ID \
    --query 'Distribution.DomainName' \
    --output text)

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
echo "🌐 Distribution domain: $DISTRIBUTION_DOMAIN"

# Clean up temp file
rm /tmp/cloudfront-config.json

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Wait for CloudFront deployment (10-15 minutes)"
echo ""
echo "2. Configure DNS in Route53:"
echo "   aws route53 change-resource-record-sets --hosted-zone-id Z04675923OYMXX09GUGWD --change-batch '{"
echo "     \"Changes\": [{"
echo "       \"Action\": \"UPSERT\","
echo "       \"ResourceRecordSet\": {"
echo "         \"Name\": \"enabl.health\","
echo "         \"Type\": \"A\","
echo "         \"AliasTarget\": {"
echo "           \"DNSName\": \"$DISTRIBUTION_DOMAIN\","
echo "           \"EvaluateTargetHealth\": false,"
echo "           \"HostedZoneId\": \"Z2FDTNDATAQYW2\""
echo "         }"
echo "       }"
echo "     }]"
echo "   }'"
echo ""
echo "3. Test the production environment:"
echo "   curl -I https://enabl.health"
echo ""
echo "🎉 Production environment will be accessible at: https://enabl.health"
echo "📊 Monitor distribution: https://console.aws.amazon.com/cloudfront/home?region=us-east-1#/distributions/$DISTRIBUTION_ID"
