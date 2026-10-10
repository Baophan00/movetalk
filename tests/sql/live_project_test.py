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


def main():
    ts = str(int(time.time()))
    pw = "MtTest!" + ts
    teacher_email = "mt-e2e-teacher+%s@example.com" % ts
    s1_email = "mt-e2e-s1+%s@example.com" % ts
    s2_email = "mt-e2e-s2+%s@example.com" % ts
    name = "TEST_" + ts

    print("== project: %s ==" % URL)
    print("== run id:  %s ==" % ts)
    print()

    # ---------- 0. the schema exists ----------
    st, _ = rest("assignments?select=id&limit=1")
    t("the homework tables exist in the project", st == 200,
      "GET /assignments -> %s (run sql/001_homework.sql first)" % st)
    if st != 200:
        print("\n%d passed, %d failed" % (PASS, FAIL))
        sys.exit(1)

    # ---------- 1. signups + server-side roles ----------
    tt, tid, tinfo = signup(teacher_email, pw, "teacher", name + " Teacher")
    t("teacher can sign up", bool(tt), tinfo)
    s1, s1id, s1info = signup(s1_email, pw, "student", name + " S1")
    t("student 1 can sign up", bool(s1), s1info)
    s2, s2id, s2info = signup(s2_email, pw, "student", name + " S2")
    t("student 2 can sign up", bool(s2), s2info)
    if not (tt and s1 and s2):
        sys.exit("cannot continue without sessions")

    st, rows = rest("profiles?select=id,role,full_name&id=eq." + tid, token=tt)
    t("the database assigned the role 'teacher' from the signup metadata",
      st == 200 and rows and rows[0]["role"] == "teacher", rows)
    st, rows = rest("profiles?select=role&id=eq." + s1id, token=s1)
    t("the database assigned the role 'student'", st == 200 and rows and rows[0]["role"] == "student", rows)

    # ---------- 2. a student cannot promote themselves ----------
    st, d = patch("profiles", "id=eq." + s1id, {"role": "teacher"}, s1)
    t("a student cannot make themselves a teacher",
      st >= 400 and "role_change_not_allowed" in json.dumps(d), (st, d))

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
        {"assignment_id": aid, "ord": 1, "qtype": "mcq",
         "prompt": "___ you work nearby?", "options": ["Do", "Are", "Is", "Does"], "points": 1},
        {"assignment_id": aid, "ord": 2, "qtype": "fill",
         "prompt": "Mai keeps her promises. She is very ______.", "points": 2},
        {"assignment_id": aid, "ord": 3, "qtype": "text",
         "prompt": "Write three sentences about a colleague.", "points": 3}], tt)
    t("teacher can add questions", st in (200, 201) and qs and len(qs) == 3, (st, qs))
    if not qs:
        sys.exit("question creation failed")
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

    st, rows = rest("profiles?select=id,email", token=s1)
    t("student 1 cannot read other people's profiles",
      st == 200 and all(r["id"] == s1id for r in rows), rows)

    st_anon, _ = req("GET", "/rest/v1/assignments?select=id")
    t("an anonymous caller cannot read assignments", st_anon in (401, 403), st_anon)

    st, d = patch("assignments", "id=eq." + aid, {"status": "draft"}, tt)
    t("a published assignment cannot be reverted to draft after submissions",
      st >= 400 and "assignment_locked" in json.dumps(d), (st, d))

    st, d = req("DELETE", "/rest/v1/assignments?id=eq." + aid, token=tt)
    t("an assignment with submissions cannot be deleted", st >= 400, (st, d))

    st, d = req("DELETE", "/rest/v1/assignments?id=eq." + aid, token=s1)
    st2, rows = rest("assignments?select=id&id=eq." + aid, token=tt)
    t("a student cannot delete an assignment, and it survives",
      rows and len(rows) == 1, (st, st2, rows))

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
    print("   delete from public.profiles           where email like 'mt-e2e-%%@example.com';")

    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
