#!/usr/bin/env bash
# ============================================================
# Apply sql/001_homework.sql to the linked Supabase project through
# the Management API. No database password needed — it uses the access
# token that `supabase login` stored.
#
#   bash tools/apply_migration.sh
#
# Env overrides:
#   MT_REF     project ref        (default fdqjvbarvjrmjlquarva)
#   MT_SQL     file to run        (default sql/001_homework.sql)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${MT_REF:-fdqjvbarvjrmjlquarva}"
SQL_FILE="${MT_SQL:-$ROOT/sql/001_homework.sql}"

if [ ! -f "$SQL_FILE" ]; then
  echo "no such SQL file: $SQL_FILE" >&2
  exit 1
fi

TOKEN="$(security find-generic-password -s 'Supabase CLI' -w 2>/dev/null || true)"
if [ -z "$TOKEN" ]; then
  echo "No Supabase access token found." >&2
  echo "Run \`supabase login\` in your own Terminal first, then re-run this." >&2
  exit 1
fi

echo "== project: $REF =="
echo "== sql:     $SQL_FILE ($(wc -l < "$SQL_FILE" | tr -d ' ') lines) =="

PAYLOAD="$(python3 - "$SQL_FILE" <<'PY'
import json, sys
print(json.dumps({"query": open(sys.argv[1], encoding="utf-8").read()}))
PY
)"

HTTP="$(curl -s -o /tmp/mt_migration_out.json -w '%{http_code}' -X POST \
  "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "$PAYLOAD")"

echo "== http $HTTP =="
head -c 1200 /tmp/mt_migration_out.json
echo

if [ "$HTTP" != "200" ] && [ "$HTTP" != "201" ]; then
  echo "migration FAILED (http $HTTP)" >&2
  exit 1
fi
echo "migration applied"
