# Deployment Scripts for Enabl Health
# Simple deployment automation for different environments

# Create App Runner service for development
create-dev-service:
	aws apprunner create-service \
		--service-name "enabl-health-dev" \
		--source-configuration '{"CodeRepository": {"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp", "SourceCodeVersion": {"Type": "BRANCH", "Value": "development"}, "CodeConfiguration": {"ConfigurationSource": "API", "CodeConfigurationValues": {"Runtime": "NODEJS_18", "BuildCommand": "npm ci && npm run build", "StartCommand": "npm start", "Port": "3000", "RuntimeEnvironmentVariables": {"NODE_ENV": "production", "PORT": "3000"}}}}, "AutoDeploymentsEnabled": true, "AuthenticationConfiguration": {"ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"}}' \
		--instance-configuration '{"Cpu": "0.25 vCPU", "Memory": "0.5 GB"}' \
		--region us-east-1

# Alternative: Create with repository config (current approach)
create-dev-service-repo:
	aws apprunner create-service \
		--service-name "enabl-health-devf" \
		--source-configuration '{"CodeRepository": {"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp", "SourceCodeVersion": {"Type": "BRANCH", "Value": "development"}, "CodeConfiguration": {"ConfigurationSource": "REPOSITORY"}}, "AutoDeploymentsEnabled": true, "AuthenticationConfiguration": {"ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"}}' \
		--instance-configuration '{"Cpu": "0.25 vCPU", "Memory": "0.5 GB"}' \
		--region us-east-1

# Create App Runner service for staging
create-staging-service:
	aws apprunner create-service \
		--service-name "enabl-health-staging" \
		--source-configuration '{"CodeRepository": {"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp", "SourceCodeVersion": {"Type": "BRANCH", "Value": "main"}, "CodeConfiguration": {"ConfigurationSource": "REPOSITORY"}}, "AutoDeploymentsEnabled": true, "AuthenticationConfiguration": {"ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"}}' \
		--instance-configuration '{"Cpu": "0.5 vCPU", "Memory": "1 GB"}' \
		--region us-east-1

# Create App Runner service for production
create-prod-service:
	aws apprunner create-service \
		--service-name "enabl-health-prod" \
		--source-configuration '{"CodeRepository": {"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp", "SourceCodeVersion": {"Type": "BRANCH", "Value": "main"}, "CodeConfiguration": {"ConfigurationSource": "REPOSITORY"}}, "AutoDeploymentsEnabled": true, "AuthenticationConfiguration": {"ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"}}' \
		--instance-configuration '{"Cpu": "1 vCPU", "Memory": "2 GB"}' \
		--region us-east-1

# Update development service
deploy-dev:
	aws apprunner start-deployment --service-arn $$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-dev`].ServiceArn' --output text)

# Update staging service
deploy-staging:
	aws apprunner start-deployment --service-arn $$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-staging`].ServiceArn' --output text)

# Update production service  
deploy-prod:
	aws apprunner start-deployment --service-arn $$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-prod`].ServiceArn' --output text)

# Quick deployment status check
status:
	@./scripts/deploy.sh status

# Check all deployment info
status-all:
	@./scripts/deploy.sh all

# Quick force deploy with status check
deploy-dev-quick: deploy-dev
	@echo "🕐 Waiting 10 seconds for deployment to start..."
	@sleep 10
	@./scripts/deploy.sh status

.PHONY: create-dev-service create-staging-service create-prod-service deploy-dev deploy-staging deploy-prod status status-all deploy-dev-quick
