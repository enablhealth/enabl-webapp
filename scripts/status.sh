#!/bin/bash

# Check deployment status for all Enabl Health environments

echo "🚀 Enabl Health Deployment Status"
echo "=================================="
echo ""

# Function to check HTTP status
check_url() {
    local url=$1
    local name=$2
    
    if curl -s -I "$url" | grep -q "200 OK"; then
        echo "✅ $name: ONLINE ($url)"
    elif curl -s -I "$url" | grep -q "HTTP"; then
        STATUS=$(curl -s -I "$url" | head -n1 | cut -d' ' -f2-)
        echo "⚠️  $name: $STATUS ($url)"
    else
        echo "❌ $name: OFFLINE ($url)"
    fi
}

# Check Backend APIs
echo "🔧 Backend APIs:"
echo "---------------"
check_url "https://9zbq4e5m86.execute-api.us-east-1.amazonaws.com/dev/health" "Development Backend"
check_url "https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/health" "Staging Backend"
check_url "https://production-api.enabl.health/health" "Production Backend"
echo ""

# Check Frontend Applications
echo "🌐 Frontend Applications:"
echo "-------------------------"
check_url "https://dev.enabl.health" "Development Frontend"
check_url "https://staging.enabl.health" "Staging Frontend"
check_url "https://enabl.health" "Production Frontend"
echo ""

# Check App Runner Services
echo "📦 App Runner Services:"
echo "----------------------"

# Function to check App Runner service
check_apprunner() {
    local service_name=$1
    local env_name=$2
    
    SERVICE_STATUS=$(aws apprunner describe-service \
        --service-arn $(aws apprunner list-services \
            --region us-east-1 \
            --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn" \
            --output text 2>/dev/null) \
        --query 'Service.Status' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$SERVICE_STATUS" = "RUNNING" ]; then
        echo "✅ $env_name App Runner: RUNNING"
    elif [ "$SERVICE_STATUS" = "NOT_FOUND" ]; then
        echo "❌ $env_name App Runner: NOT FOUND"
    else
        echo "⚠️  $env_name App Runner: $SERVICE_STATUS"
    fi
}

check_apprunner "enabl-health-dev" "Development"
check_apprunner "enabl-health-staging" "Staging"
check_apprunner "enabl-health-prod" "Production"
echo ""

# Check CloudFront Distribution
echo "☁️  CloudFront Distribution:"
echo "----------------------------"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query 'DistributionList.Items[?Aliases.Items[0]==`enabl.health`].Id' \
    --output text 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ]; then
    DISTRIBUTION_STATUS=$(aws cloudfront get-distribution \
        --id $DISTRIBUTION_ID \
        --query 'Distribution.Status' \
        --output text)
    echo "✅ Production CloudFront: $DISTRIBUTION_STATUS (ID: $DISTRIBUTION_ID)"
else
    echo "❌ Production CloudFront: NOT FOUND"
fi
echo ""

# Check SSL Certificates
echo "🔐 SSL Certificates:"
echo "-------------------"
CERT_COUNT=$(aws acm list-certificates \
    --region us-east-1 \
    --query 'CertificateSummaryList[?DomainName==`enabl.health`]' \
    --output json | jq length 2>/dev/null || echo "0")

if [ "$CERT_COUNT" -gt 0 ]; then
    CERT_STATUS=$(aws acm list-certificates \
        --region us-east-1 \
        --query 'CertificateSummaryList[?DomainName==`enabl.health`].Status' \
        --output text)
    echo "✅ enabl.health SSL Certificate: $CERT_STATUS"
else
    echo "❌ enabl.health SSL Certificate: NOT FOUND"
fi
echo ""

# Summary and Next Steps
echo "📋 Summary & Next Steps:"
echo "------------------------"

# Count successful services
BACKEND_COUNT=$(curl -s -I "https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/health" | grep -c "200 OK" || echo "0")
STAGING_SERVICE=$(aws apprunner list-services --region us-east-1 --query 'ServiceSummaryList[?ServiceName==`enabl-health-staging`].ServiceName' --output text 2>/dev/null || echo "")

if [ "$BACKEND_COUNT" -eq 1 ] && [ -n "$STAGING_SERVICE" ]; then
    echo "🎯 Staging service present. Next steps:"
    echo "   1. Ensure env vars set in App Runner console"
    echo "   2. Link custom domain: staging.enabl.health"
    echo "   3. Add Route53 CNAME record"
    echo "   4. Redeploy if vars changed (make deploy-staging)"
elif [ "$BACKEND_COUNT" -eq 1 ]; then
    echo "🚀 Ready to create staging App Runner service:"
    echo "   Use: ./scripts/frontend-provision.sh --env staging"
else
    echo "⚠️  Deploy staging backend first:"
    echo "   cd ../enabl-backend-infrastructure"
    echo "   npx cdk deploy EnablBackendStack-staging"
fi

echo ""
echo "🔗 Useful Links & Tools:"
echo "------------------------"
echo "Provision script: scripts/frontend-provision.sh"
echo "App Runner Console: https://console.aws.amazon.com/apprunner/home?region=us-east-1"
echo "CloudFront Console: https://console.aws.amazon.com/cloudfront/home"
echo "Route53 Console: https://console.aws.amazon.com/route53/home"
echo "Certificate Manager: https://console.aws.amazon.com/acm/home?region=us-east-1"
