# Deployment Scripts for Enabl Health
# Simple deployment automation for different environments

# Create App Runner service for development
create-dev-service:
	aws apprunner create-service \
		--service-name "enabl-health-dev" \
		--source-configuration '{"CodeRepository": {"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp", "SourceCodeVersion": {"Type": "BRANCH", "Value": "development"}, "CodeConfiguration": {"ConfigurationSource": "REPOSITORY"}}, "AutoDeploymentsEnabled": true, "AuthenticationConfiguration": {"ConnectionArn": "arn:aws:apprunner:us-east-1:775525057465:connection/enabl-github-connection/7274f1f5f4bc443d90c25916cc77eb30"}}' \
		--instance-configuration '{"Cpu": "0.25 vCPU", "Memory": "0.5 GB"}' \
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
	aws apprunner start-deployment --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-dev`].ServiceArn' --output text)

# Update production service  
deploy-prod:
	aws apprunner start-deployment --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-prod`].ServiceArn' --output text)

.PHONY: create-dev-service create-prod-service deploy-dev deploy-prod
