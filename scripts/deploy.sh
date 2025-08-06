#!/bin/bash

# Enabl Health Deployment Helper
# Quick commands to check and manage deployments

set -e

echo "🚀 Enabl Health Deployment Helper"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get service ARN
get_service_arn() {
    local service_name=$1
    aws apprunner list-services --query "ServiceSummaryList[?ServiceName==\`$service_name\`].ServiceArn" --output text
}

# Function to check service status
check_status() {
    local service_name=$1
    echo -e "${BLUE}📊 Checking status for $service_name...${NC}"
    
    local service_arn=$(get_service_arn $service_name)
    if [ -z "$service_arn" ]; then
        echo -e "${RED}❌ Service $service_name not found${NC}"
        return 1
    fi
    
    aws apprunner describe-service --service-arn $service_arn \
        --query 'Service.{Status:Status,URL:ServiceUrl,LastUpdated:UpdatedAt,AutoDeploy:SourceConfiguration.AutoDeploymentsEnabled}' \
        --output table
}

# Function to force deployment
force_deploy() {
    local service_name=$1
    echo -e "${YELLOW}🚀 Forcing deployment for $service_name...${NC}"
    
    local service_arn=$(get_service_arn $service_name)
    if [ -z "$service_arn" ]; then
        echo -e "${RED}❌ Service $service_name not found${NC}"
        return 1
    fi
    
    local operation_id=$(aws apprunner start-deployment --service-arn $service_arn --query 'OperationId' --output text)
    echo -e "${GREEN}✅ Deployment started with Operation ID: $operation_id${NC}"
    echo -e "${BLUE}🔗 Monitor in AWS Console: https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services${NC}"
}

# Function to get recent commits
check_commits() {
    echo -e "${BLUE}📝 Recent commits on development branch:${NC}"
    git log --oneline -5 --color=always
    echo
}

# Main menu
case ${1:-menu} in
    "dev-status"|"status")
        check_status "enabl-health-dev"
        ;;
    "prod-status")
        check_status "enabl-health-prod"
        ;;
    "dev-deploy"|"deploy")
        force_deploy "enabl-health-dev"
        ;;
    "prod-deploy")
        force_deploy "enabl-health-prod"
        ;;
    "commits")
        check_commits
        ;;
    "all")
        check_commits
        echo
        check_status "enabl-health-dev"
        echo
        check_status "enabl-health-prod" 2>/dev/null || echo -e "${YELLOW}⚠️ Production service not found${NC}"
        ;;
    "menu"|*)
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo -e "  ${GREEN}status${NC}      - Check development service status"
        echo -e "  ${GREEN}deploy${NC}      - Force development deployment"
        echo -e "  ${GREEN}prod-status${NC} - Check production service status"
        echo -e "  ${GREEN}prod-deploy${NC} - Force production deployment"
        echo -e "  ${GREEN}commits${NC}     - Show recent commits"
        echo -e "  ${GREEN}all${NC}         - Show everything"
        echo
        echo "Examples:"
        echo "  $0 deploy    # Force deploy to development"
        echo "  $0 status    # Check development status"
        echo "  $0 all       # Show complete status"
        ;;
esac
