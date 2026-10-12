#!/usr/bin/env python3
"""Prove, on the REAL Supabase project, that a teacher may read the lesson-part
progress of an accepted student — and nothing for a student who is still waiting.

    python3 tests/sql/verify_teacher_progress_live.py

Every request goes through the public API with the anon key, so what is under
test is Row Level Security, not the superuser path. The only operator step is
putting this run's teacher on the allowlist (as a school admin would) and one
row inserted behind RLS to prove the pending case is really invisible.

What it checks:
  1. a pending student's progress rows are invisible to the teacher
  2. after approve_student the student can write their own progress
  3. the teacher now reads exactly those rows (the 004 fix)
  4. an anonymous caller still reaches nothing

Everything it creates is mt-tp-*@movetalk.test and is deleted again at the end,
including the auth.users rows. Exit code 0 = all green.
"""
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = KEY = ""

PASS = FAIL = 0


def t(name, ok, detail=""):
    global PASS, FAIL
    if ok:
        PASS += 1
        print("PASS | " + name)
    else:
        FAIL += 1
        print("FAIL | " + name + (" | " + str(detail) if detail else ""))


def read_config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    url = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", src)
    key = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']*)'", src)
    return (url.group(1) if url else ""), (key.group(1) if key else "")


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
            text = resp.read().decode()
            return resp.status, (json.loads(text) if text.strip() else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            return e.code, json.loads(text)
        except Exception:
            return e.code, text


def signup(email, password, role, name):
    st, d = req("POST", "/auth/v1/signup",
                body={"email": email, "password": password,
                      "data": {"role": role, "full_name": name}})
    if st not in (200, 201) or not isinstance(d, dict):
        return None, None, d
    return (d.get("access_token") or (d.get("session") or {}).get("access_token"),
            (d.get("user") or {}).get("id"), d)


def mgmt(sql):
    """Operator path: run SQL as postgres through the Management API."""
    try:
        tok = subprocess.check_output(
            ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
            stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return None, "no Supabase access token in the keychain"
    ref = re.search(r"https://([a-z0-9]+)\.supabase\.co", URL)
    if not tok or not ref:
        return None, "no token or no project ref"
    r = urllib.request.Request(
        "https://api.supabase.com/v1/projects/%s/database/query" % ref.group(1),
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode() or "[]")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def rows(token, filt):
    st, d = req("GET", "/rest/v1/lesson_progress?select=id,student_id,track,part&" + filt,
                token=token)
    return st, (d if isinstance(d, list) else [])


def main():
    global URL, KEY
    URL, KEY = read_config()
    if not URL or not KEY:
        sys.exit("config.js has no SUPABASE_URL / SUPABASE_ANON_KEY")

    ts = str(int(time.time()))
    pw = "MtTest!" + ts
    teacher_email = "mt-tp-t+%s@movetalk.test" % ts
    student_email = "mt-tp-s+%s@movetalk.test" % ts
    name = "TEST_TP_" + ts
    sid = tid = None

    print("== project: %s ==" % URL)
    print("== run id:  %s ==\n" % ts)

    try:
        # ---- 0. the project is reachable and anon is still shut out ----
        st, d = req("GET", "/rest/v1/lesson_progress?select=id&limit=1")
        t("an anonymous caller cannot read lesson progress", st in (401, 403), (st, d))

        # ---- 1. the teacher, and a student who is only waiting ----
        st, _ = mgmt("insert into public.teacher_allowlist(email, note) "
                     "values ('%s','teacher-progress verification') "
                     "on conflict (email) do nothing" % teacher_email)
        tt, tid, tinfo = signup(teacher_email, pw, "teacher", name + " Teacher")
        t("the teacher account was created and is signed in", bool(tt and tid), tinfo)
        ss, sid, sinfo = signup(student_email, pw, "student", name + " Student")
        t("the student account was created and is signed in", bool(ss and sid), sinfo)
        if not (tt and ss):
            raise SystemExit("cannot continue without both accounts")

        st, d = req("GET", "/rest/v1/profiles?select=role,status&id=eq." + sid, token=ss)
        t("a new student starts pending", st == 200 and d and d[0]["status"] == "pending", d)

        # a row that exists but belongs to a student who has not been accepted
        st, _ = mgmt("insert into public.lesson_progress(student_id,track,lesson_no,part) "
                     "values ('%s','a1',1,'reading') on conflict do nothing" % sid)
        st, d = mgmt("select count(*)::int as n from public.lesson_progress "
                     "where student_id = '%s'" % sid)
        t("the waiting student does have a progress row in the database",
          st == 201 and d and d[0]["n"] == 1, d)

        # ---- 2. the rule's boundary: waiting = invisible ----
        st, rows_seen = rows(tt, "student_id=eq." + sid)
        t("the teacher sees nothing of a student who has not been accepted",
          st == 200 and len(rows_seen) == 0, (st, rows_seen))

        # ---- 3. accept, then the student writes their own progress ----
        st, d = req("POST", "/rest/v1/rpc/approve_student", body={"p_student": sid}, token=tt)
        t("the teacher accepts the student", st in (200, 201) and (d or {}).get("status") == "active",
          (st, d))

        st, d = req("POST", "/rest/v1/lesson_progress",
                    body=[{"student_id": sid, "track": "a1", "lesson_no": 1, "part": "vocab"},
                          {"student_id": sid, "track": "a1", "lesson_no": 1, "part": "grammar"}],
                    token=ss, extra={"Prefer": "return=representation"})
        t("the accepted student records two parts themselves",
          st in (200, 201) and isinstance(d, list) and len(d) == 2, (st, d))

        st, own = rows(ss, "student_id=eq." + sid)
        t("the student reads their own three parts", st == 200 and len(own) == 3, (st, own))

        # ---- 4. the fix: the teacher reads the accepted student's parts ----
        st, seen = rows(tt, "student_id=eq." + sid)
        t("the teacher now reads the accepted student's 3 lesson parts",
          st == 200 and len(seen) == 3, (st, seen))
        t("... and they are that student's rows",
          sorted(r["part"] for r in seen) == ["grammar", "reading", "vocab"],
          sorted(r["part"] for r in seen))

        st, allrows = req("GET", "/rest/v1/lesson_progress?select=id,student_id", token=tt)
        t("the teacher's unscoped read includes this student",
          st == 200 and isinstance(allrows, list) and
          any(r.get("student_id") == sid for r in allrows),
          (st, len(allrows) if isinstance(allrows, list) else allrows))

        # ---- 5. still shut out from the outside ----
        st, _ = req("GET", "/rest/v1/lesson_progress?select=id&limit=1")
        t("anon still reads nothing after the change", st in (401, 403), st)

    finally:
        if sid:
            mgmt("delete from public.lesson_progress where student_id = '%s'" % sid)
        mgmt("delete from public.teacher_allowlist where email like 'mt-tp-%'")
        if tid or sid:
            mgmt("delete from auth.users where email like 'mt-tp-%'")
        st, d = mgmt("select (select count(*)::int from auth.users where email like 'mt-tp-%') as users,"
                     " (select count(*)::int from public.profiles where email like 'mt-tp-%') as profiles,"
                     " (select count(*)::int from public.lesson_progress lp join public.profiles p"
                     "    on p.id = lp.student_id where p.email like 'mt-tp-%') as progress")
        left = d[0] if isinstance(d, list) and d else d
        print("\n== after cleanup: %s ==" % left)

    print("\n%d passed, %d failed" % (PASS, FAIL))
    sys.exit(0 if FAIL == 0 else 1)


if __name__ == "__main__":
    main()
