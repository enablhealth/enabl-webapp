#!/bin/bash

# Update App Runner production environment to use www.enabl.health

echo "🔄 Updating App Runner production environment to use www.enabl.health..."

aws apprunner update-service \
  --service-arn "arn:aws:apprunner:us-east-1:775525057465:service/enabl-health-prod/7e6ikh7qxk" \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "775525057465.dkr.ecr.us-east-1.amazonaws.com/enabl-webapp:production",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "RuntimeEnvironmentVariables": {
          "NEXT_PUBLIC_API_URL": "https://1ilk6lca5m.execute-api.us-east-1.amazonaws.com/production/",
          "NEXT_PUBLIC_AI_API_URL": "https://tj9g13ykme.execute-api.us-east-1.amazonaws.com/prod/",
          "NEXT_PUBLIC_COGNITO_USER_POOL_ID": "us-east-1_fUHVuOW4f",
          "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID": "43l54d4er9ej46hjnioeikgvd0",
          "NEXT_PUBLIC_COGNITO_DOMAIN": "enabl-auth-prod",
          "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "965402584740-1j4t43ijt0rvlg2lq9hhaots5kg9v2tm.apps.googleusercontent.com",
          "NODE_ENV": "production",
          "NEXT_PUBLIC_APP_ENV": "production",
          "NEXT_PUBLIC_APP_URL": "https://www.enabl.health"
        },
        "Port": "3000"
      }
    },
    "AutoDeploymentsEnabled": false
  }'

echo "✅ App Runner environment updated to use www.enabl.health"
