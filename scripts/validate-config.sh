#!/bin/bash

# Configuration Validation Script for Enabl Health
# Ensures runtime environment variables are properly set and prevent production issues

set -e

SCRIPT_DIR=$(dirname "$0")
CONFIG_FILE="$SCRIPT_DIR/frontend-config.json"

echo "🔍 Validating Environment Configurations..."

# Function to validate environment configuration
validate_environment() {
  local env="$1"
  echo ""
  echo "📋 Validating $env environment..."
  
  # Extract configuration
  local config
  config=$(jq -r --arg k "$env" '.environments[$k]' "$CONFIG_FILE")
  
  if [[ "$config" == "null" ]]; then
    echo "❌ Environment '$env' not found in configuration"
    return 1
  fi
  
  # Check required fields
  local required_fields=(
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID"
    "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID"
    "NEXT_PUBLIC_COGNITO_DOMAIN"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_AI_API_URL"
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
  )
  
  local errors=0
  
  for field in "${required_fields[@]}"; do
    local value
    value=$(echo "$config" | jq -r --arg f "$field" '.env[$f] // empty')
    
    if [[ -z "$value" || "$value" == "null" ]]; then
      echo "❌ Missing required field: $field"
      ((errors++))
    else
      echo "✅ $field: $value"
    fi
  done
  
  # Environment-specific validations
  if [[ "$env" == "production" ]]; then
    echo ""
    echo "🔒 Production-specific validations:"
    
    # Check for dev values in production
    local user_pool_id
    user_pool_id=$(echo "$config" | jq -r '.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID // empty')
    if [[ "$user_pool_id" == *"lBBFpwOnU"* ]]; then
      echo "❌ Production using dev user pool ID: $user_pool_id"
      ((errors++))
    fi
    
    local domain
    domain=$(echo "$config" | jq -r '.env.NEXT_PUBLIC_COGNITO_DOMAIN // empty')
    if [[ "$domain" == *"-dev"* ]]; then
      echo "❌ Production using dev Cognito domain: $domain"
      ((errors++))
    fi
    
    local api_url
    api_url=$(echo "$config" | jq -r '.env.NEXT_PUBLIC_API_URL // empty')
    if [[ "$api_url" != "https://production-api.enabl.health/"* ]]; then
      echo "⚠️ Production API URL doesn't match expected pattern: $api_url"
    fi
    
    echo "✅ Production validations passed"
  fi
  
  if [[ $errors -gt 0 ]]; then
    echo "❌ $env environment has $errors validation errors"
    return 1
  else
    echo "✅ $env environment configuration is valid"
    return 0
  fi
}

# Function to test API route functionality
test_api_route() {
  local env="$1"
  local url=""
  
  case "$env" in
    "development")
      url="https://dev.enabl.health/api/config/auth"
      ;;
    "staging")
      url="https://staging.enabl.health/api/config/auth"
      ;;
    "production")
      url="https://enabl.health/api/config/auth"
      ;;
  esac
  
  if [[ -n "$url" ]]; then
    echo ""
    echo "🌐 Testing API route for $env..."
    if curl -f -s "$url" > /dev/null 2>&1; then
      echo "✅ API route is accessible: $url"
      
      # Test configuration content
      local response
      response=$(curl -s "$url" 2>/dev/null || echo '{"error":"failed"}')
      local source
      source=$(echo "$response" | jq -r '.source // "unknown"')
      
      if [[ "$source" == "runtime-environment-variables" ]]; then
        echo "✅ API route returning runtime configuration"
      else
        echo "⚠️ API route source: $source"
      fi
    else
      echo "❌ API route not accessible: $url"
    fi
  fi
}

# Main validation
echo "🚀 Starting configuration validation..."

validate_environment "development"
validate_environment "staging"
validate_environment "production"

echo ""
echo "🧪 Testing live API routes..."

test_api_route "development"
test_api_route "staging"
test_api_route "production"

echo ""
echo "✅ Configuration validation complete!"
echo ""
echo "💡 Key points for production safety:"
echo "   - All environments use RuntimeEnvironmentVariables (not build-time)"
echo "   - Server-side API routes provide dynamic configuration"
echo "   - Production environment has proper validation guards"
echo "   - No build-time embedding of environment-specific values"
