#!/bin/bash
set -euo pipefail

SERVICE_NAMES=("enabl-health-staging" "enabl-health-prod" "enabl-health-dev")
REGION="us-east-1"

echo "🔎 App Runner Deep Diagnostic"
echo "Region: $REGION"
echo "Time: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo "== Connections =="
aws apprunner list-connections --region "$REGION" --output table || true

echo
for NAME in "${SERVICE_NAMES[@]}"; do
  echo "==== Service: $NAME ===="
  ARN=$(aws apprunner list-services --region "$REGION" --query "ServiceSummaryList[?ServiceName=='$NAME'].ServiceArn" --output text 2>/dev/null || true)
  if [[ -z "$ARN" || "$ARN" == "None" ]]; then
    echo "(not found)"
    echo
    continue
  fi
  aws apprunner describe-service --service-arn "$ARN" --region "$REGION" \
    --query 'Service.{ServiceName:ServiceName,Status:Status,StatusReason:StatusReason,CreatedAt:CreatedAt,UpdatedAt:UpdatedAt,ServiceUrl:ServiceUrl,SourceConfigVersion:SourceConfiguration.CodeRepository.SourceCodeVersion}' \
    --output table || true
  echo
  echo "-- Recent Operations (latest first) --"
  aws apprunner list-operations --service-arn "$ARN" --region "$REGION" --max-results 5 \
    --query 'OperationSummaryList[].{Id:Id,Type:Type,Status:Status,CreatedAt:CreatedAt,UpdatedAt:UpdatedAt}' --output table || true
  echo
  FAILED_OP=$(aws apprunner list-operations --service-arn "$ARN" --region "$REGION" --max-results 10 --query 'OperationSummaryList[?Status==`FAILED`].Id' --output text 2>/dev/null || true)
  if [[ -n "$FAILED_OP" && "$FAILED_OP" != "None" ]]; then
    echo "-- FAILED Operation Details --"
    for OP in $FAILED_OP; do
      aws apprunner list-operations --service-arn "$ARN" --region "$REGION" --max-results 50 \
        --query "OperationSummaryList[?Id=='$OP']" --output json || true
    done
  fi
  echo
  echo "-- Suggested Next Action --"
  STATUS=$(aws apprunner describe-service --service-arn "$ARN" --region "$REGION" --query 'Service.Status' --output text 2>/dev/null || true)
  case "$STATUS" in
    CREATE_FAILED|OPERATION_FAILED)
      echo "Delete and recreate after confirming no deletion in progress:"
      echo "  aws apprunner delete-service --service-arn $ARN --region $REGION" ;;
    DELETED|DELETING)
      echo "Wait for deletion to finish before recreating." ;;
    RUNNING)
      echo "Service healthy. If new code not present, run: aws apprunner start-deployment --service-arn $ARN --region $REGION" ;;
    *)
      echo "Monitor until stable. Current status: $STATUS" ;;
  esac
  echo
 done

echo "✅ Diagnostics complete"
