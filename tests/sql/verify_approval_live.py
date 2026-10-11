#!/usr/bin/env python3
"""End-to-end proof of the student-approval flow against the live project,
using only the public anon key — the same path a browser takes.

    python3 tests/sql/verify_approval_live.py

It creates a throwaway student, gives them one piece of work, and checks that
they cannot see it until the teacher accepts them (and lose it again if the
teacher turns them down). Everything it creates is removed at the end.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REF = "fdqjvbarvjrmjlquarva"
TEACHER = "demo.teacher@movetalk.test"
PASSWORD = "MoveTalk123!"
TS = str(int(time.time()))
TMP_EMAIL = "mt-approve-%s@movetalk.test" % TS
FAILED = []
TOTAL = [0]


def read_config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    return (re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", src).group(1),
            re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']*)'", src).group(1))


URL, KEY = read_config()


def t(name, ok, detail=""):
    TOTAL[0] += 1
    print(("PASS | " if ok else "FAIL | ") + name + (" | %s" % (detail,) if detail else ""))
    if not ok:
        FAILED.append(name)


def req(method, path, body=None, token=None, extra=None):
    headers = {"apikey": KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if extra:
        headers.update(extra)
    r = urllib.request.Request(URL + path,
                               data=json.dumps(body).encode() if body is not None else None,
                               headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt.strip() else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, txt


def rest(path, token=None):
    return req("GET", "/rest/v1/" + path, token=token)


def insert(table, rows, token, upsert=False):
    extra = {"Prefer": "return=representation"}
    if upsert:
        extra["Prefer"] += ",resolution=merge-duplicates"
    return req("POST", "/rest/v1/" + table, rows, token, extra)


def rpc(name, args, token):
    return req("POST", "/rest/v1/rpc/" + name, args, token)


def mgmt(sql):
    token = os.environ.get("SUPABASE_TOKEN") or ""
    if not token:
        try:
            import subprocess
            token = subprocess.check_output(
                ["security", "find-generic-password", "-s", "Supabase CLI", "-w"]).decode().strip()
        except Exception:
            return 0, "no management token"
    r = urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % REF,
                               data=json.dumps({"query": sql}).encode(),
                               headers={"Authorization": "Bearer " + token,
                                        "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


def session(email, password):
    st, d = req("POST", "/auth/v1/token?grant_type=password",
                {"email": email, "password": password})
    if isinstance(d, dict) and d.get("access_token"):
        return d["access_token"]
    return None


def main():
    tt = session(TEACHER, PASSWORD)
    if not tt:
        sys.exit("cannot sign in as the demo teacher")

    st, d = req("POST", "/auth/v1/signup",
                {"email": TMP_EMAIL, "password": PASSWORD,
                 "data": {"role": "student", "full_name": "Approval Probe"}})
    sto = d.get("access_token") or (d.get("session") or {}).get("access_token")
    uid = (d.get("user") or {}).get("id")
    if not sto or not uid:
        sys.exit("cannot sign up the probe student: %s" % d)
    t("the probe student can sign up", True, TMP_EMAIL)

    st, rows = rest("profiles?select=status&id=eq." + uid, token=sto)
    t("a new student is pending", st == 200 and rows and rows[0]["status"] == "pending", rows)

    # the teacher gives them one piece of work
    st, rows = rest("profiles?select=id&email=eq." + TEACHER, token=tt)
    tid = rows[0]["id"]
    st, rows = insert("assignments", [{"teacher_id": tid, "title": "Approval probe " + TS,
                                       "instructions": "probe", "kind": "custom",
                                       "status": "draft"}], tt)
    if st not in (200, 201) or not rows:
        sys.exit("cannot create the probe assignment: %s %s" % (st, rows))
    aid = rows[0]["id"]
    st, d = insert("assignment_recipients", [{"assignment_id": aid, "student_id": uid}], tt)
    t("the teacher can aim work at them", st in (200, 201), (st, d))
    st, d = req("PATCH", "/rest/v1/assignments?id=eq." + aid, {"status": "published"}, tt,
                {"Prefer": "return=representation"})
    t("the teacher can publish it", st in (200, 201), (st, d))

    st, rows = rest("assignments?select=id", token=sto)
    t("while pending they still see no work", st == 200 and not rows, (st, rows))

    st, d = rpc("start_submission", {"p_assignment": aid}, sto)
    t("while pending they cannot start working", st >= 400, (st, d))

    st, d = rpc("approve_student", {"p_student": uid}, tt)
    t("the teacher accepts them", st == 200 and d.get("status") == "active", (st, d))

    st, rows = rest("assignments?select=id,title", token=sto)
    t("accepted, the work appears for them",
      st == 200 and rows and rows[0]["id"] == aid, (st, rows))

    st, d = rpc("start_submission", {"p_assignment": aid}, sto)
    t("accepted, they can start the work", st == 200, (st, d))

    st, d = rpc("reject_student", {"p_student": uid}, tt)
    t("the teacher can turn them down again", st == 200 and d.get("status") == "rejected", (st, d))
    st, rows = rest("assignments?select=id", token=sto)
    t("turned down, the work is gone again", st == 200 and not rows, (st, rows))

    # ---- clean up ----
    # A published assignment is deliberately not deletable through the API
    # (that is the point of the guard), so the operator removes it.
    req("DELETE", "/rest/v1/submissions?student_id=eq." + uid, token=tt)
    st, d = mgmt("delete from public.submissions where assignment_id = '%s'; "
                 "delete from public.assignment_recipients where assignment_id = '%s'; "
                 "delete from public.assignment_questions where assignment_id = '%s'; "
                 "delete from public.assignments where id = '%s'; "
                 "delete from public.profiles where id = '%s'; "
                 "delete from auth.users where id = '%s';"
                 % (aid, aid, aid, aid, uid, uid))
    t("the operator cleanup runs", st == 201, (st, d))
    st2, left = mgmt("select count(*) as n from auth.users where email like 'mt-approve-%%';")
    left_n = left[0]["n"] if isinstance(left, list) and left else "?"
    print("\ncleanup: probe accounts left -> %s" % left_n)
    t("nothing was left behind", str(left_n) == "0", left_n)

    print()
    print("%d passed, %d failed" % (TOTAL[0] - len(FAILED), len(FAILED)))
    sys.exit(1 if FAILED else 0)


if __name__ == "__main__":
    main()
