## Enabl Webapp Makefile (Simplified)
# Frontend provisioning & deployments now handled by scripts/frontend-provision.sh
# This Makefile supplies minimal convenience targets.

PROVISION=./scripts/frontend-provision.sh

provision-all:
	$(PROVISION)

provision-staging:
	$(PROVISION) --env staging

provision-production:
	$(PROVISION) --env production

recreate-staging:
	$(PROVISION) --env staging --recreate

recreate-production:
	$(PROVISION) --env production --recreate

deploy-staging:
	aws apprunner start-deployment --service-arn $$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-staging`].ServiceArn' --output text)

deploy-production:
	aws apprunner start-deployment --service-arn $$(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`enabl-health-prod`].ServiceArn' --output text)

status:
	./scripts/status.sh

.PHONY: provision-all provision-staging provision-production recreate-staging recreate-production deploy-staging deploy-production status
