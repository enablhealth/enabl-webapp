#!/usr/bin/env bash
set -euo pipefail

# create-cognito-app-clients.sh
# Idempotently create (or show) Cognito User Pool App Clients for Enabl Health SPA.
# Public SPA clients: no client secret, Authorization Code (with PKCE) flow.
# Adds environment-appropriate callback/logout URLs.
# Optionally patches scripts/frontend-config.json with the new production client id.

# Requirements: aws CLI (with cognito-idp permissions), jq.

usage(){ cat <<EOF
Usage: $0 --env dev|staging|production [--patch-frontend-config]

Creates (or reuses) the Cognito app client for the target environment.
Will NOT overwrite existing clients; prints existing client id instead.

Callbacks used:
  dev:        https://dev.enabl.health http://localhost:3000 http://127.0.0.1:3000
  staging:    https://staging.enabl.health
  production: https://enabl.health

Scopes: openid email profile
Flows:  code (PKCE) (implicit disabled)

Environment → Pool Mapping (expected existing pools):
  dev:        us-east-1_lBBFpwOnU
  staging:    us-east-1_ex9P9pFRA
  production: us-east-1_BGGioPbPY

NOTE: Add Google as IdP separately (see comments at end of file) once Google provider configured.
EOF
}

ENV=""
PATCH=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2;;
    --patch-frontend-config) PATCH=true; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

[[ -z "$ENV" ]] && { echo "--env required" >&2; usage; exit 1; }
command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

case $ENV in
  dev)        POOL_ID="us-east-1_lBBFpwOnU"; DOMAIN_URL="https://dev.enabl.health"; CALLBACKS=("https://dev.enabl.health" "http://localhost:3000" "http://127.0.0.1:3000");; 
  staging)    POOL_ID="us-east-1_ex9P9pFRA"; DOMAIN_URL="https://staging.enabl.health"; CALLBACKS=("https://staging.enabl.health");; 
  production) POOL_ID="us-east-1_BGGioPbPY"; DOMAIN_URL="https://enabl.health"; CALLBACKS=("https://enabl.health");; 
  *) echo "Invalid --env value" >&2; exit 1;;
 esac

CLIENT_NAME="enabl-webapp-${ENV}"

echo "🔍 Checking existing app clients in pool $POOL_ID for name $CLIENT_NAME"
EXISTING_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --max-results 60 \
  --query "UserPoolClients[?ClientName=='$CLIENT_NAME'].ClientId" --output text 2>/dev/null || true)

if [[ -n "$EXISTING_ID" && "$EXISTING_ID" != "None" ]]; then
  echo "✅ Exists: $CLIENT_NAME ($EXISTING_ID)"
  NEW_CLIENT_ID="$EXISTING_ID"
else
  echo "🛠 Creating app client $CLIENT_NAME"
  CB_JOIN=$(IFS=, ; echo "${CALLBACKS[*]}")
  NEW_CLIENT_JSON=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --no-generate-secret \
    --allowed-o-auth-flows code \
    --allowed-o-auth-flows-user-pool-client \
    --allowed-o-auth-scopes email openid profile \
    --supported-identity-providers COGNITO \
    --callback-urls "$CB_JOIN" \
    --logout-urls "$CB_JOIN" \
    --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --query 'UserPoolClient.{Id:ClientId,Name:ClientName}' --output json)
  NEW_CLIENT_ID=$(echo "$NEW_CLIENT_JSON" | jq -r '.Id')
  echo "✅ Created client id: $NEW_CLIENT_ID"
fi

if $PATCH && [[ "$ENV" == "production" ]]; then
  CFG_FILE="$(dirname "$0")/frontend-config.json"
  if [[ -f "$CFG_FILE" ]]; then
    echo "✏️  Patching production NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID in frontend-config.json"
    tmp=$(mktemp)
    jq --arg id "$NEW_CLIENT_ID" '.environments.production.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID = $id' "$CFG_FILE" > "$tmp"
    mv "$tmp" "$CFG_FILE"
    echo "✅ frontend-config.json updated"
  else
    echo "⚠️ Config file not found: $CFG_FILE" >&2
  fi
fi

echo "Summary: env=$ENV pool=$POOL_ID client=$NEW_CLIENT_ID"

echo "Next: (Optional) add Google IdP then update client to include Google." 
cat <<'NOTE'
--- Adding Google as Identity Provider ---
aws cognito-idp create-identity-provider \
  --user-pool-id <POOL_ID> \
  --provider-name Google \
  --provider-type Google \
  --provider-details client_id=<GOOGLE_CLIENT_ID>,client_secret=<GOOGLE_CLIENT_SECRET>,authorize_scopes="openid email profile" \
  --attribute-mapping email=email,name=name

aws cognito-idp update-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID> \
  --supported-identity-providers COGNITO Google
NOTE
