#!/usr/bin/env python3
"""Create a small, clearly-labelled demo dataset so the homework system can
be tried straight away on the live site.

    python3 tests/sql/seed_demo.py

Idempotent: run it twice and it reuses what already exists.
Remove it again with sql/998_cleanup_test_data.sql after editing the
email pattern to 'demo.%@movetalk.test'.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PASSWORD = "MoveTalk123!"                      # the two demo students
TEACHER = os.environ.get("MT_TEACHER")
TEACHER_PW = os.environ.get("MT_TEACHER_PW", PASSWORD)
STUDENT = "demo.student@movetalk.test"
WAITING = "demo.waiting@movetalk.test"
A1_TITLE = "Demo · Lesson A1-3: Build the Message"
A2_TITLE = "Demo · Custom drill: DO / ARE"


def read_config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    url = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", src)
    key = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']*)'", src)
    return url.group(1), key.group(1)


if not TEACHER:
    sys.exit("Set MT_TEACHER=<the teacher email> (and MT_TEACHER_PW=<its password>) first.\n"
             "The seeder signs in as that existing teacher; it never creates one.")

URL, KEY = read_config()
if not URL or not KEY:
    sys.exit("config.js has no SUPABASE_URL / SUPABASE_ANON_KEY yet.")


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
            t = resp.read().decode()
            return resp.status, (json.loads(t) if t.strip() else None)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try:
            return e.code, json.loads(t)
        except Exception:
            return e.code, t


def rest(path, token=None):
    return req("GET", "/rest/v1/" + path, token=token)


def insert(table, rows, token):
    return req("POST", "/rest/v1/" + table, rows, token,
               {"Prefer": "return=representation"})


def rpc(name, args, token):
    return req("POST", "/rest/v1/rpc/" + name, args, token)


def session_for(email, role, name, password=PASSWORD):
    """Sign up, or sign in if the account already exists."""
    st, d = req("POST", "/auth/v1/signup",
                {"email": email, "password": password,
                 "data": {"role": role, "full_name": name}})
    tok = None
    if isinstance(d, dict):
        tok = d.get("access_token") or (d.get("session") or {}).get("access_token")
    if not tok:
        st, d = req("POST", "/auth/v1/token?grant_type=password",
                    {"email": email, "password": password})
        if isinstance(d, dict):
            tok = d.get("access_token")
    if not tok:
        sys.exit("could not get a session for %s: %s" % (email, d))
    return tok


def main():
    print("== signing in as the demo teacher and student ==")
    tt = session_for(TEACHER, "teacher", "Demo Teacher", TEACHER_PW)
    s1 = session_for(STUDENT, "student", "Demo Student")

    st, rows = rest("profiles?select=id,role,full_name&email=eq." + TEACHER, token=tt)
    tid = rows[0]["id"]
    st, rows = rest("profiles?select=id,role,full_name&email=eq." + STUDENT, token=s1)
    sid = rows[0]["id"]
    print("   teacher %s (%s)" % (tid, TEACHER))
    print("   student %s (%s)" % (sid, STUDENT))

    # ---- the teacher accepts the student, the way the site does it ----
    st, d = rpc("approve_student", {"p_student": sid}, tt)
    print("   teacher accepted the demo student: %s" % ("ok" if st == 200 else d))

    # ---- a second student, deliberately left waiting, so signing in as the
    #      teacher shows a request to accept ----
    w1 = session_for(WAITING, "student", "Demo Waiting")
    st, rows = rest("profiles?select=id,status&email=eq." + WAITING, token=w1)
    wid, wstatus = (rows[0]["id"], rows[0]["status"]) if rows else (None, "?")
    print("   waiting student %s -> status %s" % (WAITING, wstatus))

    def ensure_assignment(title, payload, questions):
        st, rows = rest("assignments?select=id,title", token=tt)
        match = [r for r in (rows or []) if r["title"] == title]
        if match:
            print("== assignment already there: %s ==" % title)
            return match[0]["id"], False
        st, rows = insert("assignments", [dict(payload, teacher_id=tid, title=title, status="draft")], tt)
        if st not in (200, 201) or not rows:
            sys.exit("could not create the assignment: %s %s" % (st, rows))
        aid = rows[0]["id"]
        # only real columns may go into the insert — the _correct/_explanation
        # helpers belong to the key table, not to the question table.
        rows_to_insert = []
        for i, q in enumerate(questions):
            rows_to_insert.append({
                "assignment_id": aid, "ord": i + 1, "qtype": q["qtype"],
                "prompt": q["prompt"], "options": q.get("options"),
                "points": q["points"]})
        st, qs = insert("assignment_questions", rows_to_insert, tt)
        if st not in (200, 201):
            sys.exit("could not add the questions: %s %s" % (st, qs))
        by_key = {q["prompt"]: q["id"] for q in qs}
        keys = []
        for q in questions:
            if q.get("_correct") is not None:
                keys.append({"question_id": by_key[q["prompt"]],
                             "correct": q["_correct"],
                             "explanation": q.get("_explanation")})
        if keys:
            insert("question_keys", keys, tt)
        insert("assignment_recipients", [{"assignment_id": aid, "student_id": sid}], tt)
        req("PATCH", "/rest/v1/assignments?id=eq." + aid, {"status": "published"}, tt,
            {"Prefer": "return=representation"})
        print("== created and published: %s ==" % title)
        return aid, True

    due = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 7 * 86400))

    a1, made1 = ensure_assignment(A1_TITLE, {
        "instructions": "Open the lesson, work through it, then answer the questions below.",
        "kind": "lesson", "lesson_track": "a1", "lesson_no": 3, "due_at": due},
        [{"qtype": "text", "prompt": "What is one thing you learned in A1 lesson 3?",
          "options": None, "points": 2, "_correct": None, "_explanation": None}])

    a2, made2 = ensure_assignment(A2_TITLE, {
        "instructions": "Answer all three questions.",
        "kind": "custom", "lesson_track": None, "lesson_no": None, "due_at": due},
        [{"qtype": "mcq", "prompt": "___ you work nearby?",
          "options": ["Do", "Are", "Is", "Does"], "points": 1,
          "_correct": [0], "_explanation": "an action verb takes DO"},
         {"qtype": "fill", "prompt": "Mai keeps her promises. She is very ______.",
          "options": None, "points": 2,
          "_correct": ["reliable", "very reliable"], "_explanation": "reliable = dependable"},
         {"qtype": "text", "prompt": "Write two sentences describing your manager.",
          "options": None, "points": 3, "_correct": None, "_explanation": None}])

    # ---- the student does the work, so the teacher view has something in it ----
    for aid, title in ((a1, A1_TITLE), (a2, A2_TITLE)):
        st, sid_sub = rpc("start_submission", {"p_assignment": aid}, s1)
        if st != 200:
            print("   submission for %s: %s" % (title, sid_sub))
            continue
        st, qs = rest("assignment_questions?select=id,qtype&order=ord&assignment_id=eq." + aid, token=s1)
        for q in qs or []:
            if q["qtype"] == "mcq":
                ans = 0
            elif q["qtype"] == "fill":
                ans = "Very Reliable"
            else:
                ans = "I lead a small team and my manager checks in every morning."
            insert("submission_answers",
                   [{"submission_id": sid_sub, "question_id": q["id"], "answer": ans}], s1)
        st, d = rpc("submit_assignment", {"p_assignment": aid}, s1)
        print("   student submitted %s -> %s" % (title, d))

    # ---- the teacher marks the written answers on the custom drill ----
    st, subs = rest("submissions?select=id,assignment_id,status&assignment_id=eq." + a2, token=tt)
    if subs:
        st, qs = rest("assignment_questions?select=id,qtype&assignment_id=eq." + a2, token=tt)
        textq = [q["id"] for q in (qs or []) if q["qtype"] == "text"]
        st, d = rpc("grade_submission",
                    {"p_submission": subs[0]["id"], "p_answers": {textq[0]: 3} if textq else {},
                     "p_feedback": "Nice work — watch the article before 'manager'.",
                     "p_status": "graded"}, tt)
        print("   teacher graded the custom drill -> %s" % d)

    # ---- a little lesson progress, so the teacher's roster has something to show ----
    prog = [{"student_id": sid, "track": "a1", "lesson_no": 3, "part": p}
            for p in ("vocab", "grammar", "reading", "conversations", "listening",
                      "exercises", "speaking", "roleplay", "finalTask")]
    prog.append({"student_id": sid, "track": "e2", "lesson_no": 1, "part": "vocab"})
    st, d = req("POST", "/rest/v1/lesson_progress", prog, s1,
                {"Prefer": "return=representation,resolution=merge-duplicates"})
    print("   student lesson progress recorded: %s" % ("ok" if st in (200, 201) else d))

    print()
    print("=========================================")
    print(" Demo accounts (live site: https://movetalk.surge.sh)")
    print("=========================================")
    print(" Teacher  %s   (your own account)" % TEACHER)
    print(" Student  %s   (already accepted)" % STUDENT)
    print(" Waiting  %s   (signed up, not accepted yet)" % WAITING)
    print(" Password %s   (the two demo students)" % PASSWORD)
    print()
    print(" Sign in as the student to see the homework list, open the lesson")
    print(" assignment, read the marked answers and the feedback.")
    print(" Sign in as the teacher to see the students waiting to be accepted,")
    print(" assignments and the submissions with per-question marking.")
    print(" You can switch roles by signing out and back in.")


if __name__ == "__main__":
    main()
