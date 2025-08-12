#!/usr/bin/env bash
set -euo pipefail

# Fix staging App Runner environment variables
# This adds all the missing NEXT_PUBLIC_* variables needed for runtime config

SERVICE_NAME="enabl-health-staging"
REGION="us-east-1"

echo "🔧 Fixing staging App Runner environment variables..."

# Get current service ARN
SERVICE_ARN=$(aws apprunner list-services --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
  --output text)

if [[ -z "$SERVICE_ARN" || "$SERVICE_ARN" == "None" ]]; then
  echo "❌ Service $SERVICE_NAME not found"
  exit 1
fi

echo "📍 Found service: $SERVICE_ARN"

# Update service with all required environment variables
aws apprunner update-service \
  --region "$REGION" \
  --service-arn "$SERVICE_ARN" \
  --source-configuration '{
    "AutoDeploymentsEnabled": true,
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/enablhealth/enabl-webapp",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "NODEJS_18",
          "BuildCommand": "npm ci --production=false && npm run build",
          "StartCommand": "npm start",
          "Port": "3000",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "NEXT_TELEMETRY_DISABLED": "1",
            "NEXT_PUBLIC_APP_ENV": "staging",
            "NEXT_PUBLIC_API_URL": "https://qw1ddr8oh3.execute-api.us-east-1.amazonaws.com/prod/",
            "NEXT_PUBLIC_AI_API_URL": "https://rs9kwccdr9.execute-api.us-east-1.amazonaws.com/prod/",
            "NEXT_PUBLIC_COGNITO_USER_POOL_ID": "us-east-1_ex9P9pFRA",
            "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID": "2stjv7o8orrnp9r1sno1k8kgan",
            "NEXT_PUBLIC_COGNITO_DOMAIN": "enabl-auth-staging",
            "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "665236506157-j0kr2dhcms8cvgjcoa27k11mejqn59qf.apps.googleusercontent.com"
          }
        }
      }
    }
  }'

if [[ $? -eq 0 ]]; then
  echo "✅ Service update initiated successfully"
  echo "⏳ Waiting for service to reach RUNNING status..."
  
  # Wait for service to be ready
  for i in {1..24}; do
    STATUS=$(aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" \
      --query 'Service.Status' --output text)
    
    echo "📊 Status: $STATUS (attempt $i/24)"
    
    if [[ "$STATUS" == "RUNNING" ]]; then
      echo "🎉 Service is now RUNNING with updated environment variables!"
      break
    elif [[ "$STATUS" == "OPERATION_IN_PROGRESS" ]]; then
      sleep 15
    else
      echo "⚠️ Unexpected status: $STATUS"
      sleep 10
    fi
  done
  
  echo "🔍 Verifying environment variables..."
  aws apprunner describe-service --region "$REGION" --service-arn "$SERVICE_ARN" \
    --query 'Service.SourceConfiguration.CodeRepository.CodeConfiguration.CodeConfigurationValues.RuntimeEnvironmentVariables' \
    --output table
    
else
  echo "❌ Service update failed"
  exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Test staging: https://staging.enabl.health/"
echo "2. Check runtime config: https://staging.enabl.health/api/config/auth"
echo "3. Monitor logs in App Runner console if issues persist"
