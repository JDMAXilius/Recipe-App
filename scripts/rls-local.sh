#!/usr/bin/env bash
# RLS attack suite against a throwaway local Supabase (A5). Needs Docker
# running. Builds a fresh database from supabase/migrations, runs the
# attacks, then stops the stack. Never touches production.
set -euo pipefail
cd "$(dirname "$0")/.."
SB="npx -y supabase@2"
$SB start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,mailpit,realtime,postgres-meta
trap '$SB stop --no-backup >/dev/null' EXIT
eval "$($SB status -o env)"
RLS_URL="$API_URL" RLS_ANON_KEY="$ANON_KEY" node supabase/migrations/tests/rls-attacks.test.mjs
