#!/bin/bash

# Setup Staging Environment for Enabl Health
# This script creates the staging App Runner service and configures it

set -e

echo "🚀 Setting up Enabl Health Staging Environment"
echo "============================================="

# Step 1: Create App Runner service for staging
echo "📦 Creating App Runner service for staging..."
SERVICE_ARN=$(aws apprunner create-service \
    --service-name "enabl-health-staging" \
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
        "AutoDeploymentsEnabled": true,
        "AuthenticationConfiguration": {
            "ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"
        }
    }' \
    --instance-configuration '{
        "Cpu": "0.5 vCPU",
        "Memory": "1 GB"
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
echo "1. Go to AWS Console > App Runner > enabl-health-staging"
echo "2. Go to Configuration > Environment variables"
echo "3. Add these environment variables:"
echo ""
echo "   NEXT_PUBLIC_API_URL=https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/"
echo "   NEXT_PUBLIC_AI_API_URL=https://rs9kwccdr9.execute-api.us-east-1.amazonaws.com/prod/"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ex9P9pFRA"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=2stjv7o8orrnp9r1sno1k8kgan"
echo "   NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth-staging"
echo "   NEXT_PUBLIC_GOOGLE_CLIENT_ID=665236506157-j0kr2dhcms8cvgjcoa27k11mejqn59qf.apps.googleusercontent.com"
echo "   NODE_ENV=production"
echo "   NEXT_PUBLIC_APP_ENV=staging"
echo ""
echo "4. Go to Configuration > Custom domains"
echo "5. Add domain: staging.enabl.health"
echo "6. Note the CNAME target for DNS configuration"
echo ""
echo "7. Configure DNS in Route53:"
echo "   aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXXX --change-batch '{"
echo "     \"Changes\": [{"
echo "       \"Action\": \"CREATE\","
echo "       \"ResourceRecordSet\": {"
echo "         \"Name\": \"staging.enabl.health\","
echo "         \"Type\": \"CNAME\","
echo "         \"TTL\": 300,"
echo "         \"ResourceRecords\": [{\"Value\": \"CNAME_TARGET_FROM_STEP_6\"}]"
echo "       }"
echo "     }]"
echo "   }'"
echo ""
echo "🎉 Staging environment will be accessible at: https://staging.enabl.health"
