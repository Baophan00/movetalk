#!/usr/bin/env bash
# Verify the live backend, then put the project back to its documented state:
# the live test writes rows on purpose, so 998 wipes them and restore_demo.py
# puts the demo students back (the teacher portal should look alive).
set -uo pipefail
cd "$(dirname "$0")/.."

echo "===== live project test ====="
python3 tests/sql/live_project_test.py > /tmp/mt_live_test.txt 2>&1
echo "exit: $?"
grep -nE "passed|failed|FAIL|Traceback|Error" /tmp/mt_live_test.txt | head -20

echo
echo "===== wipe what the test wrote (998) ====="
MT_SQL=sql/998_cleanup_test_data.sql bash tools/apply_migration.sh 2>&1 | tail -3

echo
echo "===== put the demo dataset back ====="
python3 tests/sql/restore_demo.py 2>&1 | tail -5
