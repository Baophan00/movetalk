#!/usr/bin/env python3
"""End-to-end check of the homework system against the REAL Supabase project.

Uses only the public anon key + the Auth/REST APIs, so every request goes
through the same Row Level Security path a browser would. Nothing here is
simulated.

    python3 tests/sql/live_project_test.py

Reads SUPABASE_URL / SUPABASE_ANON_KEY from config.js.
Everything it creates is named TEST_<timestamp> so it is easy to spot, and
the run prints exactly what it could not clean up (some rows are meant to be
undeletable through the API — that is the point of the integrity triggers).
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read_config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    url = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", src)
    key = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']*)'", src)
    return (url.group(1) if url else ""), (key.group(1) if key else "")


URL, KEY = read_config()
if not URL or not KEY:
    sys.exit("config.js has no SUPABASE_URL / SUPABASE_ANON_KEY yet.")

PASS, FAIL = 0, 0
LEFTOVER = []


def t(name, ok, detail=""):
    global PASS, FAIL
    if ok:
        PASS += 1
        print("PASS | " + name)
    else:
        FAIL += 1
        print("FAIL | " + name + (" | " + str(detail) if detail else ""))


def req(method, path, body=None, token=None, extra_headers=None, raw=False):
    url = URL + path
    data = None
    headers = {"apikey": KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if extra_headers:
        headers.update(extra_headers)
    if body is not None:
        data = json.dumps(body).encode()
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            text = resp.read().decode()
            if raw:
                return resp.status, text
            return resp.status, (json.loads(text) if text.strip() else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            parsed = json.loads(text)
        except Exception:
            parsed = text
        return e.code, parsed


def rest(path, token=None, **kw):
    return req("GET", "/rest/v1/" + path, token=token, **kw)


def rpc(name, args, token):
    return req("POST", "/rest/v1/rpc/" + name, body=args, token=token)


def insert(table, rows, token, upsert=False):
    h = {"Prefer": "return=representation" +
         (",resolution=merge-duplicates" if upsert else "")}
    return req("POST", "/rest/v1/" + table, body=rows, token=token, extra_headers=h)


def patch(table, filt, body, token):
    return req("PATCH", "/rest/v1/%s?%s" % (table, filt), body=body, token=token,
               extra_headers={"Prefer": "return=representation"})


def signup(email, password, role, name):
    st, d = req("POST", "/auth/v1/signup",
                body={"email": email, "password": password,
                      "data": {"role": role, "full_name": name}})
    if st not in (200, 201) or not isinstance(d, dict):
        return None, None, d
    return (d.get("access_token") or (d.get("session") or {}).get("access_token"),
            (d.get("user") or {}).get("id"), d)


def mgmt(sql):
    """Run SQL as postgres through the Management API — the operator path.

    Used only to put the test teacher on the allowlist, exactly as a school
    admin would. Everything else in this file goes through the public API.
    """
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
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    ts = str(int(time.time()))
    pw = "MtTest!" + ts
    teacher_email = "mt-e2e-teacher+%s@movetalk.test" % ts
    s1_email = "mt-e2e-s1+%s@movetalk.test" % ts
    s2_email = "mt-e2e-s2+%s@movetalk.test" % ts
    name = "TEST_" + ts

    print("== project: %s ==" % URL)
    print("== run id:  %s ==" % ts)
    print()

    # ---------- 0. the schema exists ----------
    # anon has had its table privileges revoked on purpose, so a 401/403
    # here is correct; only a 404 would mean the migration has not run.
    st, body = rest("assignments?select=id&limit=1")
    blob = json.dumps(body)
    t("the homework tables exist in the project",
      st != 404 and "does not exist" not in blob,
      "GET /assignments -> %s %s (run sql/001_homework.sql first)" % (st, blob[:120]))
    st2, _ = rest("question_keys?select=question_id&limit=1")
    if st == 404 or "does not exist" in blob:
        print("\n%d passed, %d failed" % (PASS, FAIL))
        sys.exit(1)
    t("an anonymous caller cannot even reach the tables (grants revoked)",
      st in (401, 403) and st2 in (401, 403), (st, st2))

    # ---------- 1. signups + server-side roles ----------
    # A teacher account now needs proof. The operator puts this run's teacher
    # on the allowlist the same way a school admin would; on a brand new
    # project the very first account is accepted without it.
    st, d = mgmt("insert into public.teacher_allowlist(email, note) values ('%s','live test run') "
                 "on conflict (email) do nothing;" % teacher_email)
    t("the operator can allowlist an email", st in (200, 201), (st, d))

    tt, tid, tinfo = signup(teacher_email, pw, "teacher", name + " Teacher")
    t("teacher can sign up", bool(tt), tinfo)
    s1, s1id, s1info = signup(s1_email, pw, "student", name + " S1")
    t("student 1 can sign up", bool(s1), s1info)
    s2, s2id, s2info = signup(s2_email, pw, "student", name + " S2")
    t("student 2 can sign up", bool(s2), s2info)
    if not (tt and s1 and s2):
        sys.exit("cannot continue without sessions")

    st, rows = rest("profiles?select=id,role,full_name&id=eq." + tid, token=tt)
    t("the allowlisted email was given the teacher role by the database",
      st == 200 and rows and rows[0]["role"] == "teacher", rows)
    st, rows = rest("profiles?select=role&id=eq." + s1id, token=s1)
    t("the database assigned the role 'student'", st == 200 and rows and rows[0]["role"] == "student", rows)

    st, rows = rest("profiles?select=status&id=eq." + s1id, token=s1)
    t("a student who has just signed up is waiting to be accepted",
      st == 200 and rows and rows[0]["status"] == "pending", rows)
    st, rows = rest("profiles?select=status&id=eq." + tid, token=tt)
    t("the teacher themself is active from the start",
      st == 200 and rows and rows[0]["status"] == "active", rows)

    # ---------- 2. a student cannot promote themselves ----------
    st, d = patch("profiles", "id=eq." + s1id, {"role": "teacher"}, s1)
    t("a student cannot make themselves a teacher",
      st >= 400 and "role_change_not_allowed" in json.dumps(d), (st, d))

    # ---------- 2b. the teacher is the one who lets a student in ----------
    st, d = rpc("approve_student", {"p_student": s2id}, s1)
    t("a student cannot accept another student", st >= 400, (st, d))

    st, d = rpc("approve_student", {"p_student": s1id}, s1)
    t("a student cannot accept themself", st >= 400, (st, d))

    st, rows = rest("assignments?select=id", token=s1)
    t("a waiting student sees no work at all", st == 200 and not rows, (st, rows))

    st, d = insert("lesson_progress",
                   [{"student_id": s1id, "track": "a1", "lesson_no": 1, "part": "vocab"}], s1)
    t("a waiting student cannot record progress", st >= 400, (st, d))

    st, d = rpc("approve_student", {"p_student": "00000000-0000-0000-0000-0000000000ff"}, tt)
    t("accepting somebody who does not exist is refused", st >= 400, (st, d))

    st, d = rpc("approve_student", {"p_student": s1id}, tt)
    t("the teacher accepts student 1", st == 200 and d and d.get("status") == "active", (st, d))
    st, d = rpc("approve_student", {"p_student": s2id}, tt)
    t("the teacher accepts student 2", st == 200 and d and d.get("status") == "active", (st, d))

    st, rows = rest("profiles?select=status&id=eq." + s1id, token=s1)
    t("an accepted student is active from then on",
      st == 200 and rows and rows[0]["status"] == "active", rows)

    # ---------- 3. class ----------
    code = "TT-" + ts[-4:]
    st, rows = insert("classes", [{"teacher_id": tid, "name": name + " Class", "join_code": code}], tt)
    t("teacher can create a class", st in (200, 201) and rows, (st, rows))
    if not rows:
        sys.exit("class creation failed")
    cid = rows[0]["id"]
    LEFTOVER.append(("classes", cid, name + " Class"))

    st, d = insert("classes", [{"teacher_id": s1id, "name": "nope", "join_code": "TT-9999"}], s1)
    t("a student cannot create a class", st >= 400, (st, d))

    st, d = rpc("join_class_by_code", {"p_code": code}, s1)
    t("student 1 joins with the class code", st == 200, (st, d))

    st, d = rpc("join_class_by_code", {"p_code": "WRONG"}, s2)
    t("a wrong join code is rejected", st >= 400 and "invalid_join_code" in json.dumps(d), (st, d))

    st, rows = rest("class_members?select=student_id", token=s1)
    t("student 1 can see their own membership", st == 200 and rows, rows)

    # ---------- 4. assignment referencing an existing lesson ----------
    st, rows = insert("assignments", [{
        "teacher_id": tid, "title": name + " Homework", "instructions": "Open lesson A1-3.",
        "kind": "lesson", "lesson_track": "a1", "lesson_no": 3,
        "due_at": time.strftime("%Y-%m-%d", time.gmtime(time.time() + 7 * 86400)),
        "status": "draft"}], tt)
    t("teacher can create a lesson assignment (draft)", st in (200, 201) and rows, (st, rows))
    if not rows:
        sys.exit("assignment creation failed")
    aid = rows[0]["id"]
    LEFTOVER.append(("assignments", aid, name + " Homework"))

    st, qs = insert("assignment_questions", [
        {"assignment_id": aid, "ord": 1, "qtype": "mcq", "prompt": "___ you work nearby?",
         "options": ["Do", "Are", "Is", "Does"], "points": 1},
        {"assignment_id": aid, "ord": 2, "qtype": "fill",
         "prompt": "Mai keeps her promises. She is very ______.", "options": None, "points": 2},
        {"assignment_id": aid, "ord": 3, "qtype": "text",
         "prompt": "Write three sentences about a colleague.", "options": None, "points": 3}], tt)
    t("teacher can add questions", st in (200, 201) and isinstance(qs, list) and len(qs) == 3, (st, qs))
    if st not in (200, 201) or not isinstance(qs, list) or len(qs) != 3:
        print("\n%d passed, %d failed" % (PASS, FAIL))
        print("stopping: the questions could not be created")
        sys.exit(1)
    q1, q2, q3 = [q["id"] for q in sorted(qs, key=lambda x: x["ord"])]

    st, d = insert("question_keys", [
        {"question_id": q1, "correct": [0], "explanation": "action verb -> DO"},
        {"question_id": q2, "correct": ["reliable", "very reliable"], "explanation": "reliable = dependable"}], tt)
    t("teacher can store the answer keys", st in (200, 201), (st, d))

    # ---------- 5. the key is invisible to students ----------
    st, rows = rest("question_keys?select=question_id", token=s1)
    t("a student cannot read any answer key", st == 200 and not rows, (st, rows))

    st, rows = rest("assignment_questions?select=id,qtype", token=s1)
    t("...but a student cannot even see the draft assignment's questions",
      st == 200 and not rows, (st, rows))

    # ---------- 6. publish gate ----------
    st, rows = rest("assignments?select=id", token=s1)
    t("a draft assignment is invisible to students", st == 200 and not rows, (st, rows))

    st, d = insert("assignment_recipients", [{"assignment_id": aid, "class_id": cid}], tt)
    t("teacher can target the class", st in (200, 201), (st, d))

    st, d = patch("assignments", "id=eq." + aid, {"status": "published"}, tt)
    t("teacher can publish", st in (200, 201), (st, d))

    st, rows = rest("assignments?select=id,title,due_at", token=s1)
    t("student 1 sees the published assignment", st == 200 and len(rows) == 1, rows)

    st, rows = rest("assignments?select=id", token=s2)
    t("student 2 (not in the class) sees nothing", st == 200 and not rows, rows)

    st, rows = rest("assignment_questions?select=id,ord,qtype,prompt,points&order=ord", token=s1)
    t("student 1 can read the 3 published questions", st == 200 and len(rows) == 3, rows)

    st, rows = rest("question_keys?select=question_id", token=s1)
    t("student 1 STILL cannot read the answer keys", st == 200 and not rows, (st, rows))

    st, d = insert("assignment_questions", [{"assignment_id": aid, "ord": 9, "qtype": "text", "prompt": "late edit"}], tt)
    t("questions are locked once published", st >= 400 and "questions_locked" in json.dumps(d), (st, d))

    # ---------- 7. student answers + server-side marking ----------
    st, d = rpc("start_submission", {"p_assignment": aid}, s2)
    t("student 2 cannot start work they were not given", st >= 400, (st, d))

    st, sid = rpc("start_submission", {"p_assignment": aid}, s1)
    t("student 1 can start a submission", st == 200 and sid, (st, sid))
    LEFTOVER.append(("submissions", sid, "student 1"))

    st, sid2 = rpc("start_submission", {"p_assignment": aid}, s1)
    t("starting again returns the same open submission (no duplicates)", sid2 == sid, (sid, sid2))

    st, d = insert("submission_answers", [
        {"submission_id": sid, "question_id": q1, "answer": 0},
        {"submission_id": sid, "question_id": q2, "answer": "Very Reliable"},
        {"submission_id": sid, "question_id": q3, "answer": "My colleague is very reliable."}], s1)
    t("student 1 can save answers (case-insensitive fill answer)", st in (200, 201), (st, d))

    st, d = insert("submission_answers", [{"submission_id": sid, "question_id": q1,
                                          "answer": 1, "is_correct": True, "points_awarded": 99}],
                   s1, upsert=True)
    st, rows = rest("submission_answers?select=is_correct,points_awarded&question_id=eq." + q1, token=s1)
    t("a student cannot fake is_correct / points (the DB nulls them)",
      rows and rows[0]["is_correct"] is None and rows[0]["points_awarded"] is None, rows)
    # put the right answer back
    insert("submission_answers", [{"submission_id": sid, "question_id": q1, "answer": 0}], s1, upsert=True)

    st, d = rpc("submit_assignment", {"p_assignment": aid}, s1)
    t("the server auto-marks the mcq and the fill-in (3 of 6)",
      st == 200 and d and d.get("score") == 3 and d.get("max_score") == 6, (st, d))

    st, d = rpc("submit_assignment", {"p_assignment": aid}, s1)
    t("a student cannot submit twice", st >= 400 and "already_submitted" in json.dumps(d), (st, d))

    st, rows = rest("submissions?select=status,score,max_score", token=s1)
    t("student 1 sees their own submitted record",
      rows and rows[0]["status"] == "submitted" and rows[0]["score"] == 3, rows)

    st, d = rpc("grade_submission", {"p_submission": sid, "p_answers": {}, "p_feedback": "x", "p_status": "graded"}, s1)
    t("a student cannot call the grading RPC", st >= 400 and "teacher_only" in json.dumps(d), (st, d))

    # ---------- 8. teacher grades, student sees feedback ----------
    st, rows = rest("submissions?select=id,student_id,score,status", token=tt)
    t("the teacher sees the submissions for their assignment", st == 200 and rows, rows)

    st, d = rpc("grade_submission", {"p_submission": sid,
                                     "p_answers": {q3: 3},
                                     "p_feedback": "Good work - watch the article before colleague.",
                                     "p_status": "graded"}, tt)
    t("teacher grades the written answer -> 6/6",
      st == 200 and d and d.get("score") == 6 and d.get("status") == "graded", (st, d))

    st, rows = rest("submissions?select=status,score,max_score,feedback", token=s1)
    t("student 1 sees the final score and the feedback",
      rows and rows[0]["status"] == "graded" and rows[0]["score"] == 6 and
      "Good work" in (rows[0]["feedback"] or ""), rows)

    st, rows = rest("submission_answers?select=question_id,is_correct,points_awarded", token=s1)
    t("student 1 gets per-question marks back",
      st == 200 and len(rows) == 3 and any(r["points_awarded"] == 2 for r in rows), rows)

    # ---------- 9. unauthorized access ----------
    st, rows = rest("submissions?select=id", token=s2)
    t("student 2 cannot see student 1's submission", st == 200 and not rows, (st, rows))

    st, rows = rest("profiles?select=id,email&limit=50", token=s1)
    allowed = {s1id, tid}          # own row + the teacher of a class they joined
    t("student 1 sees only their own profile and their teacher's",
      st == 200 and rows and all(r["id"] in allowed for r in rows),
      [r["id"] for r in rows])

    st_anon, _ = req("GET", "/rest/v1/assignments?select=id")
    t("an anonymous caller cannot read assignments", st_anon in (401, 403), st_anon)

    st, d = patch("assignments", "id=eq." + aid, {"status": "draft"}, tt)
    t("a published assignment cannot be reverted to draft after submissions",
      st >= 400 and "assignment_locked" in json.dumps(d), (st, d))

    # the teacher's own delete is refused by RLS (a published assignment is
    # not deletable), so what matters is that the row survives. The trigger
    # that guards the owner path is checked separately as postgres.
    st, d = req("DELETE", "/rest/v1/assignments?id=eq." + aid, token=tt)
    st2, rows = rest("assignments?select=id&id=eq." + aid, token=tt)
    t("an assignment with submissions cannot be deleted by its teacher",
      st2 == 200 and rows and len(rows) == 1, (st, st2, rows))

    st, d = req("DELETE", "/rest/v1/assignments?id=eq." + aid, token=s1)
    st2, rows = rest("assignments?select=id&id=eq." + aid, token=tt)
    t("a student cannot delete an assignment, and it survives",
      rows and len(rows) == 1, (st, st2, rows))

    # ---------- 9b. teacher access is not self-service ----------
    sneaky = "mt-e2e-sneaky+%s@movetalk.test" % ts
    st, d = req("POST", "/auth/v1/signup",
                {"email": sneaky, "password": pw,
                 "data": {"role": "teacher", "full_name": name + " Sneaky"}})
    stok = d.get("access_token") or (d.get("session") or {}).get("access_token") if isinstance(d, dict) else None
    suid = (d.get("user") or {}).get("id") if isinstance(d, dict) else None
    if stok and suid:
        st2, rows = rest("profiles?select=role&id=eq." + suid, token=stok)
        t("claiming to be a teacher with no proof is refused",
          st2 == 200 and rows and rows[0]["role"] == "student", rows)
        st2, d2 = rpc("reject_student", {"p_student": suid}, tt)
        t("the teacher can turn that account down",
          st2 == 200 and d2 and d2.get("status") == "rejected", (st2, d2))
        st2, rows = rest("profiles?select=status&id=eq." + suid, token=tt)
        t("... and it shows as not accepted",
          st2 == 200 and rows and rows[0]["status"] == "rejected", rows)
    else:
        t("claiming to be a teacher with no proof is refused", False, d)

    st, code = rpc("make_teacher_invite", {"p_note": "live test"}, tt)
    t("a teacher can mint an invite code",
      st == 200 and isinstance(code, str) and code.startswith("MT-T-"), (st, code))

    st, d = rpc("make_teacher_invite", {"p_note": "nope"}, s1)
    t("a student cannot mint an invite code", st >= 400, (st, d))

    invited = "mt-e2e-invited+%s@movetalk.test" % ts
    st, d = req("POST", "/auth/v1/signup",
                {"email": invited, "password": pw,
                 "data": {"role": "teacher", "full_name": name + " Invited",
                          "invite_code": code}})
    itok = d.get("access_token") or (d.get("session") or {}).get("access_token") if isinstance(d, dict) else None
    iuid = (d.get("user") or {}).get("id") if isinstance(d, dict) else None
    if itok and iuid:
        st2, rows = rest("profiles?select=role&id=eq." + iuid, token=itok)
        t("a valid invite code does create a teacher",
          st2 == 200 and rows and rows[0]["role"] == "teacher", rows)
    else:
        t("a valid invite code does create a teacher", False, d)

    st, d = req("POST", "/auth/v1/signup",
                {"email": "mt-e2e-late+%s@movetalk.test" % ts, "password": pw,
                 "data": {"role": "teacher", "full_name": name + " Late",
                          "invite_code": code}})
    lu = (d.get("user") or {}).get("id") if isinstance(d, dict) else None
    lt = d.get("access_token") or (d.get("session") or {}).get("access_token") if isinstance(d, dict) else None
    if lu and lt:
        st2, rows = rest("profiles?select=role&id=eq." + lu, token=lt)
        t("an invite code cannot be used twice",
          st2 == 200 and rows and rows[0]["role"] == "student", rows)
    else:
        t("an invite code cannot be used twice", False, d)

    st, d = insert("teacher_allowlist", [{"email": "mt-e2e-head+%s@school.test" % ts,
                                          "added_by": tid}], tt)
    t("a teacher can allowlist an email by hand", st in (200, 201), (st, d))
    st, d = insert("teacher_allowlist", [{"email": "nope@school.test"}], s1)
    t("a student cannot touch the allowlist", st >= 400, (st, d))

    # ---------- 9c. lesson progress ----------
    st, d = insert("lesson_progress",
                   [{"student_id": s1id, "track": "a1", "lesson_no": 3, "part": "vocab"}], s1)
    t("a student can record their own lesson progress", st in (200, 201), (st, d))

    st, d = req("POST", "/rest/v1/lesson_progress",
                [{"student_id": s1id, "track": "a1", "lesson_no": 3, "part": "finalTask"}],
                s1, {"Prefer": "return=representation,resolution=merge-duplicates"})
    t("recording another part of the same lesson works", st in (200, 201), (st, d))

    st, d = insert("lesson_progress",
                   [{"student_id": s1id, "track": "a1", "lesson_no": 1, "part": "vocab"}], s2)
    t("a student cannot record progress for somebody else", st >= 400, (st, d))

    st, rows = rest("lesson_progress?select=student_id,part,track,lesson_no", token=tt)
    t("the teacher can see their own students' progress", st == 200 and rows, rows)

    st, rows = rest("lesson_progress?select=student_id", token=s2)
    t("student 2 cannot see student 1's progress",
      st == 200 and not rows, (st, rows))

    # ---------- 9d. passwords ----------
    # The reset *endpoint* is reachable and validates the address. Actually
    # delivering the email needs a real mailbox and custom SMTP: Supabase's
    # built-in mailer only sends to the project team's own addresses.
    st, d = req("POST", "/auth/v1/recover", {"email": s1_email})
    t("the password reset endpoint is reachable and validates the address",
      st in (200, 400, 429), (st, d))

    st, d = req("PUT", "/auth/v1/user", {"password": pw + "Z"}, token=s2)
    t("a signed-in user can change their own password", st == 200, (st, d))
    st, d = req("PUT", "/auth/v1/user", {"password": pw}, token=s2)
    t("... and change it back", st == 200, (st, d))

    # ---------- 10. what is left behind ----------
    print()
    print("== test data created in the project ==")
    for table, ident, label in LEFTOVER:
        print("   %-14s %s  (%s)" % (table, ident, label))
    print()
    print("   Nothing was simulated: every request above used the public")
    print("   anon key through the same RLS policies a browser hits.")
    print()
    print("%d passed, %d failed" % (PASS, FAIL))
    print()
    print("Auth users created this run (delete via Authentication > Users):")
    print("   " + teacher_email)
    print("   " + s1_email)
    print("   " + s2_email)
    print()
    print("To remove the SQL rows, run in the SQL editor:")
    print("   delete from public.submission_answers where submission_id = '%s';" % LEFTOVER[-1][1] if LEFTOVER else "")
    print("   delete from public.submissions        where assignment_id  = '%s';" % aid)
    print("   delete from public.question_keys      where question_id in ('%s','%s');" % (q1, q2))
    print("   delete from public.assignment_questions where assignment_id = '%s';" % aid)
    print("   delete from public.assignment_recipients where assignment_id = '%s';" % aid)
    print("   delete from public.assignments        where id = '%s';" % aid)
    print("   delete from public.class_members      where class_id = '%s';" % cid)
    print("   delete from public.classes            where id = '%s';" % cid)
    print("   delete from public.profiles           where email like 'mt-e2e-%';")

    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
