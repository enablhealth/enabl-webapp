#!/bin/bash

# Setup Production Environment for Enabl Health
# This script creates the production App Runner service and configures it

set -e

echo "🚀 Setting up Enabl Health Production Environment"
echo "================================================"

# Step 1: Create App Runner service for production
echo "📦 Creating App Runner service for production..."
SERVICE_ARN=$(aws apprunner create-service \
    --service-name "enabl-health-prod" \
    --source-configuration '{
        "CodeRepository": {
            "RepositoryUrl": "https://github.com/enablhealth/enabl-webapp",
            "SourceCodeVersion": {
                "Type": "BRANCH",
                "Value": "main"
            },
            "CodeConfiguration": {
                "ConfigurationSource": "REPOSITORY"
            }
        },
        "AutoDeploymentsEnabled": false,
        "AuthenticationConfiguration": {
            "ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"
        }
    }' \
    --instance-configuration '{
        "Cpu": "1 vCPU",
        "Memory": "2 GB"
    }' \
    --region us-east-1 \
    --query 'Service.ServiceArn' \
    --output text)

echo "✅ Created App Runner service: $SERVICE_ARN"

# Step 2: Wait for service to be running
echo "⏳ Waiting for service to be ready..."
aws apprunner wait service-running --service-arn $SERVICE_ARN

# Step 3: Get service URL
SERVICE_URL=$(aws apprunner describe-service \
    --service-arn $SERVICE_ARN \
    --query 'Service.ServiceUrl' \
    --output text)

echo "🌐 Service is running at: https://$SERVICE_URL"

# Step 4: Instructions for next steps
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Go to AWS Console > App Runner > enabl-health-prod"
echo "2. Go to Configuration > Environment variables"
echo "3. Add these environment variables:"
echo ""
echo "   NEXT_PUBLIC_API_URL=https://production-api.enabl.health/"
echo "   NEXT_PUBLIC_AI_API_URL=https://production-ai-api.enabl.health/"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PROD_POOL"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=production-client-id"
echo "   NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth"
echo "   NEXT_PUBLIC_GOOGLE_CLIENT_ID=965402584740-1j4t43ijt0rvlg2lq9hhaots5kg9v2tm.apps.googleusercontent.com"
echo "   NODE_ENV=production"
echo "   NEXT_PUBLIC_APP_ENV=production"
echo ""
echo "4. Go to Configuration > Custom domains"
echo "5. Add domain: enabl.health"
echo "6. Note the App Runner URL for CloudFront origin"
echo ""
echo "7. Set up CloudFront Distribution:"
echo "   - Origin: $SERVICE_URL"
echo "   - Custom domain: enabl.health"
echo "   - SSL certificate: AWS Certificate Manager"
echo ""
echo "8. Configure DNS in Route53:"
echo "   aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXXX --change-batch '{"
echo "     \"Changes\": [{"
echo "       \"Action\": \"CREATE\","
echo "       \"ResourceRecordSet\": {"
echo "         \"Name\": \"enabl.health\","
echo "         \"Type\": \"A\","
echo "         \"AliasTarget\": {"
echo "           \"DNSName\": \"CLOUDFRONT_DISTRIBUTION_DOMAIN\","
echo "           \"EvaluateTargetHealth\": false,"
echo "           \"HostedZoneId\": \"Z2FDTNDATAQYW2\""
echo "         }"
echo "       }"
echo "     }]"
echo "   }'"
echo ""
echo "🎉 Production environment will be accessible at: https://enabl.health"
