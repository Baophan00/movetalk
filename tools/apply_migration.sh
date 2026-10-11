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

if [ -n "${MT_SQL:-}" ]; then
  SQL_FILES=("$MT_SQL")
else
  # every migration, in filename order, concatenated into one payload
  SQL_FILES=("$ROOT"/sql/0*.sql)
fi

TOKEN="$(security find-generic-password -s 'Supabase CLI' -w 2>/dev/null || true)"
if [ -z "$TOKEN" ]; then
  echo "No Supabase access token found." >&2
  echo "Run \`supabase login\` in your own Terminal first, then re-run this." >&2
  exit 1
fi

echo "== project: $REF =="
for f in "${SQL_FILES[@]}"; do
  echo "== sql:     $(basename "$f") ($(wc -l < "$f" | tr -d ' ') lines) =="
done

PAYLOAD="$(python3 - "${SQL_FILES[@]}" <<'PY'
import json, sys
parts = []
for path in sys.argv[1:]:
    with open(path, encoding="utf-8") as f:
        parts.append(f.read())
print(json.dumps({"query": "\n\n".join(parts)}))
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
