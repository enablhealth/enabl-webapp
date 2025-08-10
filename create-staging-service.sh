#!/bin/bash

# Create staging App Runner service for Enabl Health
echo "🚀 Creating staging App Runner service..."

aws apprunner create-service \
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
  --region us-east-1

echo "✅ Staging service creation initiated"
