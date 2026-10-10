#!/usr/bin/env bash
# ============================================================
# MoveTalk v2 — run the homework migration + RLS test suite
# against a throwaway Postgres container that emulates the
# Supabase auth surface.
#
#   bash tests/sql/run.sh
#
# Exit code 0 = every assertion passed.
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CTR=movetalk-pg-test
PORT=55432
IMAGE=postgres:16-alpine
PGUSER=postgres

cleanup() { docker rm -f "$CTR" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== starting $IMAGE =="
cleanup
docker run -d --name "$CTR" -e POSTGRES_PASSWORD=test -e POSTGRES_DB=movetalk \
  -p "$PORT:5432" "$IMAGE" >/dev/null || exit 1

echo "== waiting for postgres =="
for i in $(seq 1 60); do
  if docker exec "$CTR" pg_isready -U "$PGUSER" -d movetalk >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$CTR" pg_isready -U "$PGUSER" -d movetalk >/dev/null 2>&1 || { echo "postgres never came up"; exit 1; }

run() {  # run() <label> <file>
  local label="$1" file="$2"
  echo
  echo "---- $label ----"
  docker exec -i "$CTR" psql -U "$PGUSER" -d movetalk -v ON_ERROR_STOP=1 -q -f - < "$file"
  local rc=$?
  if [ $rc -ne 0 ]; then echo "FAILED: $label (psql exit $rc)"; exit 1; fi
}

run "0. supabase auth shim"        "$ROOT/tests/sql/000_shim.sql"

# Run the migration twice on purpose: it must be safe to re-run.
run "1. migration (first run)"     "$ROOT/sql/001_homework.sql"
run "2. migration (re-run / idempotency)" "$ROOT/sql/001_homework.sql"
echo "   -> migration is idempotent"

run "3. api role grants"           "$ROOT/tests/sql/900_grants.sql"

echo
echo "===== RLS + integrity test suite ====="
docker exec -i "$CTR" psql -U "$PGUSER" -d movetalk -v ON_ERROR_STOP=1 -f - < "$ROOT/tests/sql/rls_test.sql" > /tmp/mt_rls_out.txt 2>&1
TESTRC=$?
grep -vE '^\s*$|^ t_[a-z]+ *$|^-+$|^\(1 row\)$' /tmp/mt_rls_out.txt | head -60
if [ $TESTRC -ne 0 ]; then
  echo
  echo "!!! the test file itself errored (psql exit $TESTRC) — see /tmp/mt_rls_out.txt"
  tail -20 /tmp/mt_rls_out.txt
  exit 1
fi

echo
echo "===== RESULT ====="
RES="$(docker exec -i "$CTR" psql -U "$PGUSER" -d movetalk -tA -c \
  "select count(*) filter (where ok) || ' ' || count(*) filter (where ok is not true) from public.t_results")"
PASSED="$(echo "$RES" | cut -d' ' -f1)"
FAILED="$(echo "$RES" | cut -d' ' -f2)"
echo "assertions passed: $PASSED"
echo "assertions failed: $FAILED"

if [ "$FAILED" != "0" ]; then
  echo
  echo "!!! $FAILED assertion(s) failed !!!"
  docker exec -i "$CTR" psql -U "$PGUSER" -d movetalk -c \
    "select name, detail from public.t_results where ok is not true order by ord"
  exit 1
fi
echo "ALL GREEN"
