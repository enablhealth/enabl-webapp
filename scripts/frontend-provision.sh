#!/usr/bin/env bash
set -euo pipefail
# Unified frontend provisioning for App Runner (staging + production) + optional CloudFront + Route53.
# Idempotent: creates service if missing, recreates if --recreate, verifies RUNNING, ensures (optional) CloudFront for prod.
# Requires: jq, aws CLI configured; config: scripts/frontend-config.json

CONFIG_FILE="$(dirname "$0")/frontend-config.json"
if ! command -v jq >/dev/null 2>&1; then echo "jq required" >&2; exit 1; fi
[[ -f "$CONFIG_FILE" ]] || { echo "Missing $CONFIG_FILE" >&2; exit 1; }

ACTION="provision" # provision|delete
TARGET_ENV=""       # staging|production (blank = both)
RECREATE=false
WITH_CF=true         # allow toggle for CloudFront prod

while [[ $# -gt 0 ]]; do
  case $1 in
    --env) TARGET_ENV="$2"; shift 2 ;;
    --recreate) RECREATE=true; shift ;;
    --delete) ACTION="delete"; shift ;;
    --no-cloudfront) WITH_CF=false; shift ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--env staging|production] [--recreate] [--delete] [--no-cloudfront]

Default runs provisioning for both environments defined in config.
EOF
      exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

REGION=$(jq -r '.region' "$CONFIG_FILE")
CONNECTION_ARN=$(jq -r '.connectionArn' "$CONFIG_FILE")

get_envs(){
  if [[ -n "$TARGET_ENV" ]]; then echo "$TARGET_ENV"; else jq -r '.environments | keys[]' "$CONFIG_FILE"; fi
}

service_arn(){ local name="$1"; aws apprunner list-services --region "$REGION" --query "ServiceSummaryList[?ServiceName=='$name'].ServiceArn" --output text 2>/dev/null || true; }
service_status(){ local name="$1"; aws apprunner list-services --region "$REGION" --query "ServiceSummaryList[?ServiceName=='$name'].Status" --output text 2>/dev/null || true; }

delete_service(){ local name="$1"; local arn; arn=$(service_arn "$name"); [[ -z "$arn" || "$arn" == None ]] && return 0; echo "🗑 Deleting $name"; aws apprunner delete-service --service-arn "$arn" --region "$REGION" || true; for i in {1..36}; do arn=$(service_arn "$name"); [[ -z "$arn" || "$arn" == None ]] && { echo "✓ deleted"; return 0; }; sleep 5; done; echo "⚠️ delete timeout"; }

build_env_vars_json(){
  local envKey="$1"
  jq -r --arg k "$envKey" '.environments[$k].env | to_entries | map("\"\(.key)\":\"\(.value)\"") | join(",")' "$CONFIG_FILE"
}

create_service(){
  local envKey="$1"; local name cpu mem auto branch envjson
  name=$(jq -r --arg k "$envKey" '.environments[$k].serviceName' "$CONFIG_FILE")
  cpu=$(jq -r --arg k "$envKey" '.environments[$k].cpu' "$CONFIG_FILE")
  mem=$(jq -r --arg k "$envKey" '.environments[$k].memory' "$CONFIG_FILE")
  auto=$(jq -r --arg k "$envKey" '.environments[$k].autoDeploy' "$CONFIG_FILE")
  branch=$(jq -r --arg k "$envKey" '.environments[$k].branch' "$CONFIG_FILE")
  envjson=$(build_env_vars_json "$envKey")
  echo "🚀 Creating $name (env $envKey)"
  aws apprunner create-service \
    --service-name "$name" \
    --source-configuration "{\"CodeRepository\":{\"RepositoryUrl\":\"https://github.com/enablhealth/enabl-webapp\",\"SourceCodeVersion\":{\"Type\":\"BRANCH\",\"Value\":\"$branch\"},\"CodeConfiguration\":{\"ConfigurationSource\":\"API\",\"CodeConfigurationValues\":{\"Runtime\":\"NODEJS_18\",\"BuildCommand\":\"rm -rf .next && npm ci --no-audit --no-fund && npm run build\",\"StartCommand\":\"npm start\",\"Port\":\"3000\",\"RuntimeEnvironmentVariables\":{${envjson}}}}},\"AutoDeploymentsEnabled\":${auto},\"AuthenticationConfiguration\":{\"ConnectionArn\":\"$CONNECTION_ARN\"}}" \
    --instance-configuration "{\"Cpu\": \"$cpu\", \"Memory\": \"$mem\"}" \
    --region "$REGION" >/dev/null
}

poll_running(){ local name="$1"; echo "⏳ Polling $name"; for i in {1..120}; do st=$(service_status "$name"); echo "  -> $st"; case $st in RUNNING) return 0;; CREATE_FAILED|OPERATION_FAILED) return 1;; esac; sleep 5; done; return 1; }

ensure_service(){
  local envKey="$1"; local name; name=$(jq -r --arg k "$envKey" '.environments[$k].serviceName' "$CONFIG_FILE")
  local st; st=$(service_status "$name")
  if $RECREATE && [[ -n "$st" && "$st" != None ]]; then delete_service "$name"; st=""; fi
  if [[ -z "$st" || "$st" == None ]]; then create_service "$envKey"; poll_running "$name" || echo "⚠️ $name not RUNNING"; else echo "ℹ️ $name exists (status $st)"; fi
}

ensure_cert(){
  local domain="$1"; local arn
  arn=$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='$domain'].CertificateArn" --output text 2>/dev/null || true)
  if [[ -z "$arn" || "$arn" == None ]]; then
    echo "🔐 Requesting certificate for $domain (+ SAN *.${domain#*.})"
    arn=$(aws acm request-certificate --domain-name "$domain" --subject-alternative-names "*.${domain#*.}" --validation-method DNS --region us-east-1 --query 'CertificateArn' --output text)
    echo "   Certificate ARN: $arn (add DNS validation records)"
  else
    echo "✅ Certificate exists: $arn"
  fi
  echo "$arn"
}

ensure_cloudfront(){
  local domain="$1"; local svcURL="$2"; local certArn="$3"
  local distId; distId=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='$domain'].Id" --output text 2>/dev/null || true)
  if [[ -n "$distId" && "$distId" != None ]]; then
    echo "✅ CloudFront distribution exists: $distId"; return 0
  fi
  echo "☁️ Creating CloudFront distribution for $domain (origin $svcURL)"
  local cfg
  cfg=$(cat <<JSON
{
  "CallerReference": "frontend-${domain}-$(date +%s)",
  "Comment": "Frontend ${domain}",
  "Enabled": true,
  "Origins": {"Quantity":1,"Items":[{"Id":"apprunner-origin","DomainName":"$svcURL","CustomOriginConfig":{"HTTPPort":80,"HTTPSPort":443,"OriginProtocolPolicy":"https-only","OriginSslProtocols":{"Quantity":1,"Items":["TLSv1.2"]}}}]},
  "DefaultCacheBehavior": {"TargetOriginId":"apprunner-origin","ViewerProtocolPolicy":"redirect-to-https","AllowedMethods":{"Quantity":2,"Items":["GET","HEAD"],"CachedMethods":{"Quantity":2,"Items":["GET","HEAD"]}},"ForwardedValues":{"QueryString":true,"Cookies":{"Forward":"all"}},"TrustedSigners":{"Enabled":false,"Quantity":0},"MinTTL":0,"DefaultTTL":3600,"MaxTTL":86400},
  "Aliases": {"Quantity":1,"Items":["$domain"]},
  "ViewerCertificate": {"ACMCertificateArn":"$certArn","SSLSupportMethod":"sni-only","MinimumProtocolVersion":"TLSv1.2_2021"},
  "PriceClass": "PriceClass_100"
}
JSON
)
  distId=$(aws cloudfront create-distribution --distribution-config "$cfg" --query 'Distribution.Id' --output text)
  echo "   Distribution ID: $distId (propagation ~15m)"
}

ensure_dns(){
  local domain="$1" target="$2"; local zoneId
  zoneId=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${domain#*.}.'].Id" --output text 2>/dev/null || true)
  [[ -z "$zoneId" ]] && { echo "⚠️ Hosted zone for $domain not found"; return 0; }
  echo "🔗 Upserting DNS record $domain -> $target"
  aws route53 change-resource-record-sets --hosted-zone-id "$zoneId" --change-batch "{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$domain\",\"Type\":\"A\",\"AliasTarget\":{\"DNSName\":\"$target\",\"EvaluateTargetHealth\":false,\"HostedZoneId\":\"Z2FDTNDATAQYW2\"}}}]}" >/dev/null || true
}

provision_env(){
  local envKey="$1"; ensure_service "$envKey"
  local name svcURL arn
  name=$(jq -r --arg k "$envKey" '.environments[$k].serviceName' "$CONFIG_FILE")
  arn=$(service_arn "$name")
  svcURL=$(aws apprunner describe-service --service-arn "$arn" --region "$REGION" --query 'Service.ServiceUrl' --output text 2>/dev/null || true)
  local domain; domain=$(jq -r --arg k "$envKey" '.environments[$k].customDomain // empty' "$CONFIG_FILE")
  if [[ -n "$domain" ]]; then
    echo "📌 Link custom domain manually in App Runner console (one-time): $domain -> $svcURL"
  fi
  if [[ "$envKey" == "production" ]]; then
    local cfEnabled; cfEnabled=$(jq -r '.environments.production.cloudFrontEnabled // false' "$CONFIG_FILE")
    if $WITH_CF && [[ "$cfEnabled" == true ]]; then
      local certArn; certArn=$(ensure_cert "$domain")
      echo "👉 Ensure certificate validated before CloudFront deployment."
      ensure_cloudfront "$domain" "$svcURL" "$certArn" || true
      local distDomain; distDomain=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='$domain'].DomainName" --output text 2>/dev/null || true)
      [[ -n "$distDomain" ]] && ensure_dns "$domain" "$distDomain"
    fi
  fi
  echo "✅ $envKey summary: service=$name url=$svcURL"
}

delete_env(){ local envKey="$1"; local name; name=$(jq -r --arg k "$envKey" '.environments[$k].serviceName' "$CONFIG_FILE"); delete_service "$name"; }

main(){
  echo "Frontend Provision (region $REGION) action=$ACTION env=${TARGET_ENV:-all} recreate=$RECREATE"
  for e in $(get_envs); do
    if [[ "$ACTION" == provision ]]; then provision_env "$e"; else delete_env "$e"; fi
  done
  echo "Done."; echo "Run scripts/status.sh for verification.";
}

main "$@"
