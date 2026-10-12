#!/usr/bin/env python3
"""Put the demo dataset back after a cleanup run.

    python3 tests/sql/restore_demo.py

Two steps, both through documented paths:

  1. the two demo accounts, created by the ordinary PUBLIC SIGNUP endpoint
     (anon key only). A hand-written `insert into auth.users` does not work —
     GoTrue answers 500 "Database error querying schema" on a password
     sign-in — so the accounts have to go through signup, like the seeder.
     Existing accounts are signed into instead.
  2. `sql/996_restore_demo.sql` as the operator, through the Management API:
     statuses, recipients, submissions, lesson parts. No teacher password is
     needed anywhere in this file.

Password for both demo students: MoveTalk123! (never used for the owner's
account). Remove them again with sql/998_cleanup_test_data.sql.
"""
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PASSWORD = "MoveTalk123!"
ACCOUNTS = [("demo.student@movetalk.test", "Demo Student"),
            ("demo.waiting@movetalk.test", "Demo Waiting")]


def read_config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    url = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", src)
    key = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']*)'", src)
    return (url.group(1) if url else ""), (key.group(1) if key else "")


URL, KEY = read_config()
if not URL or not KEY:
    sys.exit("config.js has no SUPABASE_URL / SUPABASE_ANON_KEY")


def req(method, path, body=None):
    r = urllib.request.Request(URL + path,
                               data=json.dumps(body).encode() if body is not None else None,
                               headers={"apikey": KEY, "Content-Type": "application/json"},
                               method=method)
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            text = resp.read().decode()
            return resp.status, (json.loads(text) if text.strip() else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            return e.code, json.loads(text)
        except Exception:
            return e.code, text


def session(email, name):
    """Sign up, or sign in when the account is already there."""
    st, d = req("POST", "/auth/v1/signup",
                {"email": email, "password": PASSWORD,
                 "data": {"role": "student", "full_name": name}})
    tok = (d or {}).get("access_token") or ((d or {}).get("session") or {}).get("access_token") \
        if isinstance(d, dict) else None
    if not tok:
        st, d = req("POST", "/auth/v1/token?grant_type=password",
                    {"email": email, "password": PASSWORD})
        tok = (d or {}).get("access_token") if isinstance(d, dict) else None
    return tok, st, d


def mgmt_file(path):
    """Run a .sql file as postgres, the way tools/apply_migration.sh does."""
    try:
        tok = subprocess.check_output(
            ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
            stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        sys.exit("No Supabase access token in the keychain — run `supabase login` first.")
    ref = re.search(r"https://([a-z0-9]+)\.supabase\.co", URL)
    if not tok or not ref:
        sys.exit("no token or no project ref")
    sql = open(path, encoding="utf-8").read()
    r = urllib.request.Request(
        "https://api.supabase.com/v1/projects/%s/database/query" % ref.group(1),
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            return resp.status, json.loads(resp.read().decode() or "[]")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    print("== project: %s ==" % URL)
    for email, name in ACCOUNTS:
        tok, st, d = session(email, name)
        print("   %-28s %s  session: %s" % (email, st, "yes" if tok else d))
        if not tok:
            sys.exit("could not get a session for %s" % email)

    st, out = mgmt_file(os.path.join(ROOT, "sql", "996_restore_demo.sql"))
    print("   sql/996_restore_demo.sql -> http %s" % st)
    print("   %s" % out)
    if st not in (200, 201):
        sys.exit(1)
    print("\nDone. Sign in as the teacher: a waiting request, one accepted student "
          "with marked and unmarked work and lesson parts opened.")


if __name__ == "__main__":
    main()
