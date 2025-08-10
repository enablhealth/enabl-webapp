#!/bin/bash

# Production Deployment Safety Script
# Ensures safe production deployments following Copilot instructions

set -e

SCRIPT_DIR=$(dirname "$0")

echo "🛡️ Production Deployment Safety Check"
echo "======================================"

# Pre-deployment validation
echo ""
echo "1️⃣ Validating configuration files..."
if ! "$SCRIPT_DIR/validate-config.sh"; then
  echo "❌ Configuration validation failed!"
  exit 1
fi

echo ""
echo "2️⃣ Checking current production status..."

# Check if production is already running
PROD_STATUS=$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-prod`].Status' --output text 2>/dev/null || echo "NOT_FOUND")

if [[ "$PROD_STATUS" == "RUNNING" ]]; then
  echo "⚠️ Production service is currently RUNNING"
  echo "   URL: https://enabl.health"
  
  # Test current production configuration
  echo ""
  echo "3️⃣ Testing current production API configuration..."
  PROD_CONFIG=$(curl -s https://enabl.health/api/config/auth 2>/dev/null || echo '{"error":"failed"}')
  CURRENT_ENV=$(echo "$PROD_CONFIG" | jq -r '.appEnv // "unknown"')
  CURRENT_POOL=$(echo "$PROD_CONFIG" | jq -r '.userPoolId // "unknown"')
  CURRENT_DOMAIN=$(echo "$PROD_CONFIG" | jq -r '.domain // "unknown"')
  
  echo "   Current Environment: $CURRENT_ENV"
  echo "   Current User Pool: $CURRENT_POOL"
  echo "   Current Domain: $CURRENT_DOMAIN"
  
  # Validate current production state
  if [[ "$CURRENT_POOL" == *"lBBFpwOnU"* ]]; then
    echo "🚨 CRITICAL: Production is using DEV user pool!"
    echo "   This will cause authentication failures."
    echo "   Deployment is REQUIRED to fix this issue."
  elif [[ "$CURRENT_DOMAIN" == *"-dev"* ]]; then
    echo "🚨 CRITICAL: Production is using DEV Cognito domain!"
    echo "   This will cause authentication failures."
    echo "   Deployment is REQUIRED to fix this issue."
  else
    echo "✅ Current production configuration appears valid"
  fi
fi

echo ""
echo "4️⃣ Deployment readiness check..."

# Check if we should proceed
read -p "Do you want to proceed with production deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled by user"
  exit 1
fi

echo ""
echo "5️⃣ Starting production deployment..."

# Deploy production with safety checks
"$SCRIPT_DIR/frontend-provision.sh" --env production --recreate

echo ""
echo "6️⃣ Post-deployment validation..."

# Wait for deployment to complete
echo "⏳ Waiting for deployment to stabilize..."
sleep 30

# Test new production configuration
RETRY_COUNT=0
MAX_RETRIES=10

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
  echo "🧪 Testing new production configuration (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  NEW_CONFIG=$(curl -s https://enabl.health/api/config/auth 2>/dev/null || echo '{"error":"failed"}')
  NEW_ENV=$(echo "$NEW_CONFIG" | jq -r '.appEnv // "unknown"')
  NEW_POOL=$(echo "$NEW_CONFIG" | jq -r '.userPoolId // "unknown"')
  NEW_DOMAIN=$(echo "$NEW_CONFIG" | jq -r '.domain // "unknown"')
  NEW_SOURCE=$(echo "$NEW_CONFIG" | jq -r '.source // "unknown"')
  
  if [[ "$NEW_SOURCE" == "runtime-environment-variables" ]]; then
    echo "✅ Production is using runtime environment variables"
    
    if [[ "$NEW_ENV" == "production" && "$NEW_POOL" == "us-east-1_BGGioPbPY" && "$NEW_DOMAIN" == "enabl-auth" ]]; then
      echo "🎉 Production deployment SUCCESSFUL!"
      echo ""
      echo "📊 Final Configuration:"
      echo "   Environment: $NEW_ENV"
      echo "   User Pool: $NEW_POOL"
      echo "   Domain: $NEW_DOMAIN"
      echo "   Source: $NEW_SOURCE"
      echo ""
      echo "🔗 Test authentication: https://enabl-auth.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=2ujfphb9dhu5imkuvq571pllib&response_type=code&redirect_uri=https%3A%2F%2Fenabl.health&scope=openid+email+profile"
      exit 0
    else
      echo "⚠️ Configuration values don't match expected production values"
      echo "   Expected: production, us-east-1_BGGioPbPY, enabl-auth"
      echo "   Actual: $NEW_ENV, $NEW_POOL, $NEW_DOMAIN"
    fi
  else
    echo "⚠️ Production not yet using runtime configuration (source: $NEW_SOURCE)"
  fi
  
  ((RETRY_COUNT++))
  if [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; then
    echo "   Waiting 10 seconds before retry..."
    sleep 10
  fi
done

echo "❌ Production deployment validation failed after $MAX_RETRIES attempts"
echo "   Manual investigation required"
exit 1
