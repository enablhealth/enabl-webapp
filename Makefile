# Deployment Scripts for Enabl Health
# Simple deployment automation for different environments

# Create App Runner service for development
create-dev-service:
	aws apprunner create-service \
		--service-name "enabl-health-dev" \
		--source-configuration '{
			"ImageRepository": {
				"ImageIdentifier": "public.ecr.aws/docker/library/node:18-alpine",
				"ImageConfiguration": {
					"Port": "3000"
				}
			},
			"AutoDeploymentsEnabled": true,
			"CodeRepository": {
				"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp",
				"SourceCodeVersion": {
					"Type": "BRANCH",
					"Value": "development"
				},
				"CodeConfiguration": {
					"ConfigurationSource": "REPOSITORY"
				}
			}
		}' \
		--instance-configuration '{
			"Cpu": "0.25 vCPU",
			"Memory": "0.5 GB"
		}'

# Create App Runner service for production
create-prod-service:
	aws apprunner create-service \
		--service-name "enabl-health-prod" \
		--source-configuration '{
			"ImageRepository": {
				"ImageIdentifier": "public.ecr.aws/docker/library/node:18-alpine",
				"ImageConfiguration": {
					"Port": "3000"
				}
			},
			"AutoDeploymentsEnabled": true,
			"CodeRepository": {
				"RepositoryUrl": "https://github.com/enablhealth/enabl-webapp",
				"SourceCodeVersion": {
					"Type": "BRANCH",
					"Value": "main"
				},
				"CodeConfiguration": {
					"ConfigurationSource": "REPOSITORY"
				}
			}
		}' \
		--instance-configuration '{
			"Cpu": "1 vCPU",
			"Memory": "2 GB"
		}'

# Update development service
deploy-dev:
	aws apprunner start-deployment --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-dev`].ServiceArn' --output text)

# Update production service  
deploy-prod:
	aws apprunner start-deployment --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-prod`].ServiceArn' --output text)

.PHONY: create-dev-service create-prod-service deploy-dev deploy-prod
