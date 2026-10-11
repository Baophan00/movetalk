#!/usr/bin/env python3
"""Two things the anon-key test cannot do, run as postgres instead of anon:

1. Prove the trigger that stops an assignment with submissions from being
   deleted. Through the API this path is unreachable, because RLS already
   refuses to delete a published assignment — so the guard would never be
   exercised. Running it as postgres removes RLS from the picture and hits
   the trigger directly.
2. Remove everything the live test created.

    python3 tests/sql/verify_guard_and_cleanup.py
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REF = os.environ.get("MT_REF", "fdqjvbarvjrmjlquarva")

try:
    TOKEN = subprocess.check_output(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
        stderr=subprocess.DEVNULL).decode().strip()
except Exception:
    sys.exit("No Supabase access token in the keychain. Run `supabase login` first.")
if not TOKEN:
    sys.exit("No Supabase access token in the keychain. Run `supabase login` first.")


def q(sql):
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/%s/database/query" % REF,
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


fails = 0

print("== 1. the delete guard, exercised as postgres ==")
st, body = q("delete from public.assignments "
             "where id in (select assignment_id from public.submissions);")
blocked = "assignment_has_submissions" in body
print(("PASS" if blocked else "FAIL") + " | an assignment with submissions is refused a delete")
if not blocked:
    fails += 1
    print("   http %s %s" % (st, body[:300]))

print()
print("== 2. removing the test data ==")
sql = open(os.path.join(ROOT, "sql", "998_cleanup_test_data.sql"), encoding="utf-8").read()
st, body = q(sql)
ok = st in (200, 201)
print(("PASS" if ok else "FAIL") + " | cleanup ran")
if not ok:
    fails += 1
    print("   http %s %s" % (st, body[:400]))
else:
    try:
        print("   " + json.dumps(json.loads(body)[0]))
    except Exception:
        print("   " + body[:300])

print()
print("== 3. the project is empty again ==")
st, body = q("""select
 (select count(*) from auth.users)          as users,
 (select count(*) from public.profiles)     as profiles,
 (select count(*) from public.classes)      as classes,
 (select count(*) from public.class_members) as members,
 (select count(*) from public.assignments)  as assignments,
 (select count(*) from public.assignment_questions)  as questions,
 (select count(*) from public.question_keys)         as keys,
 (select count(*) from public.submissions)           as submissions,
 (select count(*) from public.submission_answers)    as answers,
 (select count(*) from public.lesson_progress)       as progress;""")
try:
    row = json.loads(body)[0]
    print("   " + json.dumps(row))
    dirty = {k: v for k, v in row.items() if v}
    leftover_users = row.get("users", 0)
    if leftover_users:
        # the 2 vocab-app accounts are not ours; only flag mt-e2e leftovers
        st2, body2 = q("select count(*) as n from auth.users where email like 'mt-e2e-%';")
        n = json.loads(body2)[0]["n"]
        print("   test accounts left: %d" % n)
        if n:
            fails += 1
            print("FAIL | test accounts still present")
    dirty.pop("users", None)
    if dirty:
        fails += 1
        print("FAIL | homework rows left: %s" % dirty)
    else:
        print("PASS | no homework rows left")
except Exception:
    fails += 1
    print("FAIL | could not read the counts: " + body[:300])

print()
print("%d problem(s)" % fails)
sys.exit(1 if fails else 0)
