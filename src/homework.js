/* ============================================================
   MoveTalk — Homework & Assignments (client)

   This module is the ONLY place that talks to the school backend.
   Everything that matters for security lives in Postgres:
     * role-based rules        -> Row Level Security
     * answer keys             -> separate table, students denied
     * mcq/fill marking        -> public.submit_assignment()
     * teacher grading         -> public.grade_submission()
   The browser never receives a correct answer, and never computes a
   score. See sql/001_homework.sql.

   Built into index.html by tools/build_homework.py.
   ============================================================ */

const HW_CFG = (function () {
  if (typeof SUPABASE_URL === 'undefined' || !SUPABASE_URL) return null;
  if (typeof SUPABASE_ANON_KEY === 'undefined' || !SUPABASE_ANON_KEY) return null;
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
})();

const HB = (function () {
  if (!HW_CFG) return null;
  if (typeof window === 'undefined' || typeof window.supabase === 'undefined') return null;
  try { return window.supabase.createClient(HW_CFG.url, HW_CFG.key); } catch (e) { return null; }
})();

const HW_ON = !!HB;

/* ---------- state ---------- */
const HW = {
  ready: false, loading: false,
  assignments: [], subs: {}, classes: [], rosters: {},
  detailId: null, questions: [], answers: {}, keyErr: false
};
const TC = {
  ready: false, loading: false, loadSeq: 0, tab: 'overview',
  classes: [], rosters: {}, assignments: [], rosterOf: {},
  students: [], progress: [], submissions: [], recipients: [], busy: {},
  builder: null, openSubs: null, results: []
};

/* ---------- small helpers ---------- */
function hwEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function hwErr(e, fallback) {
  const m = e && (e.message || e.error_description || e.details || e.hint);
  toast(m || fallback || 'Something went wrong', 'err');
  return m || fallback;
}
/* Field-level validation: say which box is wrong, on the box itself, and put the
   cursor there. A toast alone disappears before you have found the field.
   Guarded, because the test harness runs this module against a stub DOM. */
function hwFieldError(id, msg) {
  const el = document.getElementById(id);
  const holder = (el && el.parentElement && el.parentElement.querySelector) ? el.parentElement : null;
  if (!el || !el.classList || !holder || !el.setAttribute) { toast(msg, 'err'); return; }
  el.classList.add('invalid');
  el.setAttribute('aria-invalid', 'true');
  let err = holder.querySelector('.field-error');
  if (!err) { err = document.createElement('p'); err.className = 'field-error'; holder.appendChild(err); }
  err.textContent = msg;
  if (el.focus) el.focus();
}
function hwClearFieldError(id) {
  const el = document.getElementById(id);
  if (!el || !el.classList) return;
  el.classList.remove('invalid');
  if (el.removeAttribute) el.removeAttribute('aria-invalid');
  const holder = (el.parentElement && el.parentElement.querySelector) ? el.parentElement : null;
  const err = holder ? holder.querySelector('.field-error') : null;
  if (err) err.remove();
}
/* Busy state for a button that is waiting on the network, so a slow save never
   looks like a dead click. The label is restored from the element itself. */
function hwBusy(btn, on) {
  if (!btn || !btn.classList) return;
  if (on) {
    if (btn.dataset) btn.dataset.label = btn.textContent;
    btn.classList.add('is-loading');
    btn.disabled = true;
    if (btn.setAttribute) btn.setAttribute('aria-busy', 'true');
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
    if (btn.removeAttribute) btn.removeAttribute('aria-busy');
    if (btn.dataset && btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}
function hwShow(id, on) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', !on);
}
function hwSet(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function hwPill(kind, text) {
  return '<span class="hw-chip hw-chip-' + kind + '">' + hwEsc(text) + '</span>';
}
function hwDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(); } catch (e) { return d; }
}
function hwIsOverdue(a) {
  if (!a.due_at) return false;
  return new Date(a.due_at + 'T23:59:59').getTime() < Date.now();
}

/* Status the student sees. "Not started" / "Overdue" are derived, the
   rest come from their own submission row. */
function hwStatus(a, sub) {
  if (sub) {
    if (sub.status === 'graded') return { k: 'graded', label: 'Graded' };
    if (sub.status === 'submitted') return { k: 'submitted', label: 'Submitted' };
    if (sub.status === 'returned') return { k: 'returned', label: 'Try again' };
    return { k: 'in_progress', label: 'In progress' };
  }
  if (hwIsOverdue(a)) return { k: 'overdue', label: 'Overdue' };
  return { k: 'not_started', label: 'Not started' };
}

/* Which screen a workspace should show. Pure decision so it can be tested
   with no backend and no network. This is the UX gate only — the real
   authorization for every read and write lives in Postgres (RLS). */
function hwGate(kind, online, user) {
  const isTeacherArea = (kind === 'teacher');
  if (!online) {
    return { shot: 'setup', msg: 'Add your Supabase project URL and key to <b>config.js</b>, then reload.' };
  }
  if (!user) {
    return { shot: 'auth', msg: isTeacherArea
      ? 'Sign in with the teacher account to manage students and assignments.'
      : 'Sign in to see the work your teacher assigned.' };
  }
  if (isTeacherArea && user.role !== 'teacher') {
    return { shot: 'role', msg: 'This area is for the teacher account. Yours is a student account.' };
  }
  if (!isTeacherArea && user.role === 'student') {
    if (user.status === 'rejected') {
      return { shot: 'rejected', msg: 'Your teacher did not accept this account.' };
    }
    if (user.status && user.status !== 'active') {
      return { shot: 'waiting',
               msg: 'Your account is waiting for your teacher to accept it. ' +
                    'You can look around the lessons in the meantime.' };
    }
  }
  return { shot: 'ok', msg: '' };
}

/* ---------- session ---------- */
async function hwLoadSession() {
  if (!HW_ON) return null;
  try {
    const s = await HB.auth.getSession();
    const u = s && s.data && s.data.session ? s.data.session.user : null;
    if (!u) { USER = null; return null; }
    const p = await HB.from('profiles').select('id,email,full_name,role,status').eq('id', u.id).maybeSingle();
    const prof = p && p.data ? p.data : null;
    USER = {
      id: u.id,
      email: u.email,
      name: (prof && prof.full_name) || (u.email || '').split('@')[0],
      role: (prof && prof.role) || 'student',
      status: (prof && prof.status) || 'active'
    };
    return USER;
  } catch (e) { return null; }
}

/* ============================================================
   STUDENT WORKSPACE
   ============================================================ */
function renderHomework() {
  const gate = document.getElementById('hw-gate');
  const body = document.getElementById('hw-body');
  if (!gate || !body) return;

  const g = hwGate('student', HW_ON, USER);
  if (g.shot !== 'ok') {
    hwSet('hw-gate-msg', g.msg);
    const b = document.getElementById('hw-gate-btn');
    if (b) {
      if (g.shot === 'setup') { b.textContent = 'How to connect'; b.setAttribute('onclick', 'showV2Setup()'); }
      else if (g.shot === 'role') { b.textContent = 'Back to Homework'; b.setAttribute('onclick', "go('homework')"); }
      else if (g.shot === 'waiting') { b.textContent = 'Check again'; b.setAttribute('onclick', 'hwCheckAgain()'); }
      else if (g.shot === 'rejected') { b.textContent = 'Sign out'; b.setAttribute('onclick', 'logout()'); }
      else { b.textContent = 'Sign In'; b.setAttribute('onclick', 'showAuth()'); }
    }
    gate.classList.remove('hidden'); body.classList.add('hidden');
    if (g.shot === 'waiting' || g.shot === 'rejected') {
      const t = document.getElementById('hw-gate-title');
      if (t) t.textContent = g.shot === 'waiting' ? 'Waiting for your teacher' : 'Not accepted';
    }
    return;
  }
  const t2 = document.getElementById('hw-gate-title');
  if (t2) t2.textContent = 'Homework';

  gate.classList.add('hidden'); body.classList.remove('hidden');
  const sub = document.getElementById('hw-sub');
  if (sub) {
    sub.textContent = 'Signed in as ' + USER.name;
  }
  hwRenderList();
  hwRenderDetail();
  if (!HW.ready && !HW.loading) hwLoad();
}

async function hwLoad() {
  if (!HW_ON || !USER || HW.loading) return;
  HW.loading = true;
  hwRenderList();
  try {
    const a = await HB.from('assignments')
      .select('id,title,instructions,kind,lesson_track,lesson_no,assigned_at,due_at,status')
      .order('due_at', { ascending: true, nullsFirst: false });
    if (a.error) throw a.error;
    HW.assignments = a.data || [];

    const s = await HB.from('submissions')
      .select('id,assignment_id,status,attempt,score,max_score,feedback,submitted_at,graded_at');
    if (s.error) throw s.error;
    HW.subs = {};
    (s.data || []).forEach(function (r) { HW.subs[r.assignment_id] = r; });

    for (var i = 0; i < HW.assignments.length; i++) {
      if (HW.assignments[i].kind === 'custom') continue;
      if (HW.assignments[i].status === 'closed') continue;
      /* Only open a submission when there is nothing on the go. Opening the
         screen again must not spawn a second, empty attempt on top of work
         the student has already handed in — that would change what they see. */
      const mine = HW.subs[HW.assignments[i].id];
      if (mine && mine.status !== 'in_progress') continue;
      try { await HB.rpc('start_submission', { p_assignment: HW.assignments[i].id }); } catch (e) {}
    }
    HW.ready = true;
  } catch (e) {
    hwErr(e, 'Could not load your homework');
  } finally {
    HW.loading = false;
    hwRenderList();
    hwRenderDetail();
  }
}

async function hwCheckAgain() {
  const before = USER && USER.status;
  await hwLoadSession();
  renderHomework();
  if (USER && USER.status && USER.status !== 'active') {
    toast('Still waiting — your teacher has not accepted you yet', 'ok');
  } else if (before && before !== 'active') {
    toast('You are in. Your homework is below.', 'ok');
  }
}

async function hwRefresh() {
  HW.ready = false; HW.detailId = null; HW.questions = []; HW.answers = {};
  await hwLoad();
  if (TC.tab) { TC.ready = false; }
}

function hwRenderList() {
  const el = document.getElementById('hw-list');
  if (!el) return;
  if (HW.loading && !HW.assignments.length) {
    el.innerHTML = '<div class="sk sk-card"></div><div class="sk sk-card"></div>';
    return;
  }
  if (!HW.assignments.length) {
    el.innerHTML = '<div class="empty">' +
      '<div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div>' +
      '<div class="empty-title">Nothing assigned yet</div>' +
      '<div class="empty-text">When a teacher assigns a lesson or an exercise, it shows up here. ' +
      'In the meantime you can open any lesson from the left.</div></div>';
    return;
  }
  el.innerHTML = HW.assignments.map(function (a) {
    const st = hwStatus(a, HW.subs[a.id]);
    const ref = a.kind === 'lesson'
      ? 'Lesson · ' + hwEsc(String(a.lesson_track || '').toUpperCase()) + ' ' + hwEsc(a.lesson_no)
      : 'Custom exercise';
    const sub = HW.subs[a.id];
    const score = sub && sub.score != null ? sub.score + '/' + sub.max_score : '';
    return '<button class="card card-pad w-full text-left hw-row" onclick="hwOpen(\'' + a.id + '\')">' +
      '<div class="flex items-start justify-between gap-4">' +
      '<div style="min-width:0"><p class="row-title">' + hwEsc(a.title) + '</p>' +
      '<p class="row-sub">' + ref + ' · due ' + hwEsc(hwDate(a.due_at)) + '</p></div>' +
      hwPill(st.k, st.label) +
      '</div>' +
      (score ? '<p class="row-sub" style="margin-top:10px">Your mark: <b>' + hwEsc(score) + '</b></p>' : '') +
      '</button>';
  }).join('');
}

async function hwOpen(id) {
  const a = HW.assignments.filter(function (x) { return x.id === id; })[0];
  if (!a) return;
  HW.detailId = id; HW.questions = []; HW.answers = {}; HW.keyErr = false;
  hwRenderDetail();
  try {
    const q = await HB.from('assignment_questions')
      .select('id,ord,qtype,prompt,options,points').eq('assignment_id', id).order('ord');
    if (q.error) throw q.error;
    HW.questions = q.data || [];
    const my = HW.subs[id];
    if (my && my.id) {
      const ans = await HB.from('submission_answers')
        .select('question_id,answer,is_correct,points_awarded').eq('submission_id', my.id);
      if (ans.error) throw ans.error;
      HW.answers = {};
      (ans.data || []).forEach(function (r) { HW.answers[r.question_id] = r; });
    }
  } catch (e) { hwErr(e, 'Could not open this assignment'); }
  hwRenderDetail();
}

function hwAnswerValue(qid) {
  const r = HW.answers[qid];
  if (!r || r.answer == null) return '';
  const v = r.answer;
  if (Array.isArray(v)) return v.length ? String(v[0]) : '';
  return String(v);
}

function hwRenderDetail() {
  const host = document.getElementById('hw-detail');
  if (!host) return;
  if (!HW.detailId) { host.classList.add('hidden'); host.innerHTML = ''; return; }
  host.classList.remove('hidden');

  const a = HW.assignments.filter(function (x) { return x.id === HW.detailId; })[0];
  if (!a) { host.innerHTML = ''; return; }
  const sub = HW.subs[a.id] || null;
  const st = hwStatus(a, sub);
  const locked = sub && (sub.status === 'submitted' || sub.status === 'graded');

  let html = '<div class="card p-8 space-y-5">';
  html += '<div class="flex items-start justify-between gap-4">' +
    '<div><p class="font-semibold text-lg">' + hwEsc(a.title) + '</p>' +
    '<p class="faint text-xs mt-1">Assigned ' + hwEsc(hwDate(a.assigned_at)) +
    ' · due ' + hwEsc(hwDate(a.due_at)) + '</p></div>' + hwPill(st.k, st.label) + '</div>';

  if (a.instructions) html += '<p class="text-sm" style="white-space:pre-wrap">' + hwEsc(a.instructions) + '</p>';
  if (a.status === 'closed') html += '<p class="faint text-xs">This assignment is closed. Your submitted work is still here to review.</p>';

  if (sub && sub.feedback) {
    html += '<div class="p-5 rounded-2xl" style="background:var(--surface2)">' +
      '<p class="text-xs font-medium faint mb-1">TEACHER FEEDBACK</p>' +
      '<p class="text-sm" style="white-space:pre-wrap">' + hwEsc(sub.feedback) + '</p></div>';
  }

  if (a.kind === 'lesson') {
    html += '<div class="flex items-center gap-3 flex-wrap">' +
      '<button class="btn-primary" onclick="hwOpenLesson(' + hwEsc(JSON.stringify(a.lesson_track)) + ',' + (parseInt(a.lesson_no, 10) || 1) + ')">Open the lesson</button>' +
      '<span class="faint text-xs">Opens the original lesson — the content itself is never copied or changed.</span></div>';
  }

  if (HW.questions.length) {
    html += '<div class="divider"></div><p class="text-xs font-medium faint">QUESTIONS</p>';
    HW.questions.forEach(function (q, i) {
      const r = HW.answers[q.id];
      const val = hwAnswerValue(q.id);
      html += '<div class="p-5 rounded-2xl space-y-3" style="background:var(--surface2)">';
      html += '<p class="text-sm font-medium">' + (i + 1) + '. ' + hwEsc(q.prompt) +
        ' <span class="faint text-xs">(' + q.points + (q.points === 1 ? ' point' : ' points') + ')</span></p>';

      if (q.qtype === 'mcq') {
        const opts = Array.isArray(q.options) ? q.options : [];
        html += '<div class="space-y-2">' + opts.map(function (o, oi) {
          const on = String(oi) === String(val);
          return '<label class="flex items-center gap-3 text-sm hw-opt' + (on ? ' on' : '') + '">' +
            '<input type="radio" name="q_' + q.id + '" value="' + oi + '"' + (on ? ' checked' : '') +
            (locked ? ' disabled' : '') + ' onchange="hwSetAnswer(\'' + q.id + '\', this.value, \'mcq\')"> ' +
            hwEsc(o) + '</label>';
        }).join('') + '</div>';
      } else if (q.qtype === 'fill') {
        html += '<input class="input" id="ans_' + q.id + '" value="' + hwEsc(val) + '"' +
          (locked ? ' disabled' : ' oninput="hwSetAnswer(\'' + q.id + '\', this.value, \'fill\')"') + '>';
      } else {
        html += '<textarea class="input" rows="3" id="ans_' + q.id + '"' + (locked ? ' disabled' : '') +
          ' oninput="hwSetAnswer(\'' + q.id + '\', this.value, \'text\')">' + hwEsc(val) + '</textarea>';
      }

      if (locked && r) {
        if (r.points_awarded != null) {
          const mark = r.is_correct === true ? '✓ ' : (r.is_correct === false ? '✕ ' : '');
          html += '<p class="text-xs ' + (r.is_correct === false ? 'hw-no' : 'hw-ok') + '">' +
            mark + hwEsc(r.points_awarded) + ' / ' + hwEsc(q.points) + ' point(s)</p>';
        } else {
          html += '<p class="faint text-xs">Waiting for your teacher to mark this one.</p>';
        }
      }
      html += '</div>';
    });

    if (!locked) {
      html += '<div class="flex items-center gap-3 flex-wrap">' +
        '<button class="btn-primary" id="hw-submit-btn" onclick="hwSubmit()">Submit work</button>' +
        '<span class="faint text-xs">Answers save as you type. Submitting sends them to your teacher.</span></div>';
    } else {
      html += '<p class="faint text-xs">Submitted ' + hwEsc(hwDate(sub && sub.submitted_at ? String(sub.submitted_at).slice(0, 10) : '')) + '</p>';
    }
  }

  html += '</div>';
  host.innerHTML = html;
}

function hwOpenLesson(track, no) {
  if (typeof go === 'function') go(track);
  if (typeof trackGo === 'function') trackGo(track, no);
}

async function hwEnsureSubmission(a) {
  if (HW.subs[a.id]) return HW.subs[a.id];
  const r = await HB.rpc('start_submission', { p_assignment: a.id });
  if (r.error) { hwErr(r.error, 'Could not open your answers'); return null; }
  const sub = { id: r.data, assignment_id: a.id, status: 'in_progress', attempt: 1 };
  HW.subs[a.id] = sub;
  return sub;
}

var HW_SAVE_T = null;
async function hwSetAnswer(qid, value, qtype) {
  if (!HW_ON || !USER || !HW.detailId) return;
  const a = HW.assignments.filter(function (x) { return x.id === HW.detailId; })[0];
  if (!a) return;
  let payload = value;
  if (qtype === 'mcq') payload = Number(value);
  HW.answers[qid] = { question_id: qid, answer: payload };

  clearTimeout(HW_SAVE_T);
  HW_SAVE_T = setTimeout(async function () {
    const sub = await hwEnsureSubmission(a);
    if (!sub) return;
    const r = await HB.from('submission_answers')
      .upsert({ submission_id: sub.id, question_id: qid, answer: payload },
              { onConflict: 'submission_id,question_id' });
    if (r.error) hwErr(r.error, 'Could not save that answer');
  }, 600);
}

async function hwSubmit() {
  if (!HW_ON || !USER || !HW.detailId) return;
  const a = HW.assignments.filter(function (x) { return x.id === HW.detailId; })[0];
  if (!a) return;
  const btn = document.getElementById('hw-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
  try {
    const sub = await hwEnsureSubmission(a);
    if (!sub) return;
    const r = await HB.rpc('submit_assignment', { p_assignment: a.id });
    if (r.error) throw r.error;
    const got = r.data || {};
    toast('Submitted · ' + (got.score != null ? got.score + '/' + got.max_score + ' auto-marked' : 'sent to your teacher'), 'ok');
    HW.ready = false;
    await hwLoad();
    await hwOpen(a.id);
  } catch (e) {
    hwErr(e, 'Could not submit');
    if (btn) { btn.disabled = false; btn.textContent = 'Submit work'; }
  }
}

/* ============================================================
   TEACHER WORKSPACE
   ============================================================ */
function renderTeacher() {
  const gate = document.getElementById('tc-gate');
  const body = document.getElementById('tc-body');
  if (!gate || !body) return;

  const g = hwGate('teacher', HW_ON, USER);
  if (g.shot !== 'ok') {
    hwSet('tc-gate-msg', g.msg);
    const b = document.getElementById('tc-gate-btn');
    if (b) {
      if (g.shot === 'setup') { b.textContent = 'How to connect'; b.setAttribute('onclick', 'showV2Setup()'); }
      else if (g.shot === 'role') { b.textContent = 'Back to Homework'; b.setAttribute('onclick', "go('homework')"); }
      else { b.textContent = 'Sign In'; b.setAttribute('onclick', 'showAuth()'); }
    }
    gate.classList.remove('hidden'); body.classList.add('hidden');
    return;
  }

  gate.classList.add('hidden'); body.classList.remove('hidden');
  const sub = document.getElementById('tc-sub');
  if (sub) sub.textContent = 'Signed in as ' + USER.name;
  tcTab(TC.tab, true);
  if (!TC.ready && !TC.loading) tcLoad();
}

async function tcLoad() {
  if (!HW_ON || !USER || USER.role !== 'teacher' || TC.loading) return;
  TC.loading = true;
  try {
    const c = await HB.from('classes').select('id,name,join_code,created_at').order('created_at', { ascending: true });
    if (c.error) throw c.error;
    TC.classes = c.data || [];
    TC.rosters = {};
    for (var i = 0; i < TC.classes.length; i++) {
      const r = await HB.rpc('class_roster', { p_class: TC.classes[i].id });
      TC.rosters[TC.classes[i].id] = (r && r.data) ? r.data : [];
    }
    const a = await HB.from('assignments')
      .select('id,title,instructions,kind,lesson_track,lesson_no,assigned_at,due_at,status,created_at')
      .order('created_at', { ascending: false });
    if (a.error) throw a.error;
    TC.assignments = a.data || [];
    const p = await HB.from('lesson_progress').select('student_id,track,lesson_no,part');
    TC.progress = (p && !p.error && p.data) ? p.data : [];
    const s = await HB.from('profiles')
      .select('id,full_name,email,status,created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: true });
    TC.students = (s && !s.error && s.data) ? s.data : [];
    const sb = await HB.from('submissions')
      .select('id,assignment_id,student_id,status,score,max_score,submitted_at,graded_at')
      .order('submitted_at', { ascending: false });
    TC.submissions = (sb && !sb.error && sb.data) ? sb.data : [];
    const rc = await HB.from('assignment_recipients').select('assignment_id,student_id,class_id');
    TC.recipients = (rc && !rc.error && rc.data) ? rc.data : [];
    TC.ready = true;
  } catch (e) {
    hwErr(e, 'Could not load your students');
  } finally {
    TC.loading = false;
    tcRender();
  }
}

async function tcRefresh() {
  TC.ready = false; TC.openSubs = null;
  await tcLoad();
}

function tcTab(name, silent) {
  TC.tab = name || 'overview';
  document.querySelectorAll('[data-tc-tab]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.tcTab === TC.tab);
  });
  document.querySelectorAll('[data-tc-nav]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tcNav === TC.tab);
  });
  hwShow('tc-panel-overview', TC.tab === 'overview');
  hwShow('tc-panel-students', TC.tab === 'students');
  hwShow('tc-panel-assignments', TC.tab === 'assignments');
  if (!silent) tcRender();
}

/* Everyone the teacher has accepted. Assignments can go to one of them or
   to all of them; a class is optional and no longer needed for that. */
function tcAllStudents() {
  return (TC.students || [])
    .filter(function (s) { return s.status === 'active'; })
    .map(function (s) { return { id: s.id, name: s.full_name || s.email || 'Student' }; });
}

function tcWaitingStudents() {
  return (TC.students || []).filter(function (s) { return s.status === 'pending'; });
}

function tcRender() {
  tcRenderOverview();
  tcRenderStudents();
  tcRenderAssignments();
  hwUpdatePendingBadge();
}

/* ---------- overview: everything real the teacher needs at a glance ---------- */
function tcStat(label, value, hint, tone, action) {
  const ico = {
    pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    mint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
    lav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
  };
  return '<div class="stat"' + (action ? ' style="cursor:pointer" onclick="' + action + '"' : '') + '>' +
    '<div class="stat-top"><span class="stat-label">' + hwEsc(label) + '</span>' +
    '<span class="stat-ico ' + hwEsc(tone) + '">' + (ico[tone] || ico.pending) + '</span></div>' +
    '<span class="stat-value">' + hwEsc(String(value)) + '</span>' +
    (hint ? '<span class="stat-hint">' + hwEsc(hint) + '</span>' : '') +
    '</div>';
}

function tcRenderOverview() {
  const el = document.getElementById('tc-panel-overview');
  if (!el) return;
  if (TC.loading && !TC.students.length && !TC.assignments.length) {
    el.innerHTML = '<div class="kpi-grid">' +
      '<div class="sk sk-card"></div><div class="sk sk-card"></div>' +
      '<div class="sk sk-card"></div><div class="sk sk-card"></div></div>';
    return;
  }

  const waiting = tcWaitingStudents();
  const accepted = (TC.students || []).filter(function (s) { return s.status === 'active'; });
  const published = (TC.assignments || []).filter(function (a) { return a.status === 'published'; });
  const drafts = (TC.assignments || []).filter(function (a) { return a.status === 'draft'; });
  const subs = TC.submissions || [];
  const toReview = subs.filter(function (x) { return x.status === 'submitted'; });
  const graded = subs.filter(function (x) { return x.status === 'graded'; });

  const nameOf = {}, titleOf = {}, progressOf = {};
  (TC.students || []).forEach(function (s) { nameOf[s.id] = s.full_name || s.email || 'Student'; });
  (TC.assignments || []).forEach(function (a) { titleOf[a.id] = a.title; });
  (TC.progress || []).forEach(function (x) {
    progressOf[x.student_id] = (progressOf[x.student_id] || 0) + 1;
  });
  const noProgress = accepted.filter(function (s) {
    const w = tcStudentWork(s.id);
    return w.handed === 0;
  });
  const upcoming = published
    .filter(function (a) { return a.due_at && !hwIsOverdue(a); })
    .sort(function (x, y) { return x.due_at < y.due_at ? -1 : 1; })
    .slice(0, 3);

  let html = '<div class="kpi-grid">' +
    tcStat('Waiting to join', waiting.length,
      waiting.length ? 'Signed up, needs your yes' : 'Nobody is waiting',
      'pending', waiting.length ? "tcTab('students')" : '') +
    tcStat('Students', accepted.length,
      accepted.length ? 'Accepted and learning' : 'Accept someone to begin',
      'mint', "tcTab('students')") +
    tcStat('To review', toReview.length,
      toReview.length ? 'Handed in, waiting on you' : 'Nothing waiting on you',
      'warn', "tcTab('assignments')") +
    tcStat('Published work', published.length,
      drafts.length ? drafts.length + ' still in draft' : (published.length ? 'All published' : 'Nothing published yet'),
      'lav', "tcTab('assignments')") +
    '</div>';

  if (waiting.length) {
    html += '<div class="card card-pad">' +
      '<div class="section-head" style="margin-bottom:10px"><h3>' +
      waiting.length + (waiting.length === 1 ? ' person is waiting to join' : ' people are waiting to join') +
      '</h3><button class="btn-primary btn-sm" onclick="tcTab(&quot;students&quot;)">Review requests</button></div>' +
      '<p class="faint" style="font-size:12.5px">They signed up themselves. Accept them and they can see the work you assign.</p>' +
      '</div>';
  }

  /* what to do next, from real rows only */
  if (toReview.length || noProgress.length || upcoming.length) {
    html += '<div class="card card-pad space-y-4"><div class="section-head" style="margin-bottom:0">' +
      '<h3>Needs attention</h3></div><div class="row-list">';
    toReview.slice(0, 3).forEach(function (x) {
      html += '<div class="row"><span class="row-ico">' + hwEsc((nameOf[x.student_id] || 'S').charAt(0).toUpperCase()) + '</span>' +
        '<span class="row-main"><span class="row-title">' + hwEsc(nameOf[x.student_id] || 'Student') + '</span>' +
        '<span class="row-sub">handed in ' + hwEsc(titleOf[x.assignment_id] || 'an assignment') + '</span></span>' +
        '<span class="row-actions"><span class="badge badge-warn"><span class="dot dot-warn"></span>To review</span>' +
        '<button class="btn-quiet btn-sm" onclick="tcTab(&quot;assignments&quot;)">Open</button></span></div>';
    });
    noProgress.slice(0, 3).forEach(function (s) {
      const w = tcStudentWork(s.id);
      const why = w.parts ? (tcPartLine(w) + ', nothing handed in yet')
        : (w.given ? (w.given + ' assigned, nothing handed in yet') : 'accepted, no work assigned yet');
      html += '<div class="row"><span class="row-ico">' + hwEsc((s.full_name || 'S').charAt(0).toUpperCase()) + '</span>' +
        '<span class="row-main"><span class="row-title">' + hwEsc(s.full_name || 'Student') + '</span>' +
        '<span class="row-sub">' + hwEsc(why) + '</span></span>' +
        '<span class="row-actions"><span class="badge badge-neutral">Getting started</span></span></div>';
    });
    upcoming.forEach(function (a) {
      html += '<div class="row"><span class="row-ico">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" style="width:16px;height:16px"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg></span>' +
        '<span class="row-main"><span class="row-title">' + hwEsc(a.title) + '</span>' +
        '<span class="row-sub">due ' + hwEsc(hwDate(a.due_at)) + '</span></span>' +
        '<span class="row-actions"><span class="badge badge-info">Upcoming</span></span></div>';
    });
    html += '</div></div>';
  }

  /* recent activity */
  html += '<div class="card card-pad space-y-4"><div class="section-head" style="margin-bottom:0">' +
    '<h3>Recent submissions</h3>' +
    (subs.length ? '<span class="faint">' + graded.length + ' marked · ' + toReview.length + ' waiting</span>' : '') +
    '</div>';
  if (!subs.length) {
    html += '<div class="empty"><div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div>' +
      '<div class="empty-title">No work handed in yet</div>' +
      '<div class="empty-text">Once a student submits an assignment it shows up here, with their score and what still needs marking.</div></div>';
  } else {
    html += '<div class="row-list">' + subs.slice(0, 5).map(function (x) {
      const done = x.status === 'graded';
      const sc = (x.score === null || x.score === undefined) ? '' :
        (done ? ' · ' + x.score + '/' + (x.max_score || 0) : '');
      return '<div class="row"><span class="row-ico">' + hwEsc((nameOf[x.student_id] || 'S').charAt(0).toUpperCase()) + '</span>' +
        '<span class="row-main"><span class="row-title">' + hwEsc(nameOf[x.student_id] || 'Student') + '</span>' +
        '<span class="row-sub">' + hwEsc(titleOf[x.assignment_id] || 'Assignment') + sc + '</span></span>' +
        '<span class="row-actions"><span class="badge ' + (done ? 'badge-ok' : 'badge-warn') + '"><span class="dot ' +
        (done ? 'dot-ok' : 'dot-warn') + '"></span>' + (done ? 'Marked' : 'To review') + '</span></span></div>';
    }).join('') + '</div>';
  }
  html += '</div>';

  /* students snapshot */
  if (accepted.length) {
    html += '<div class="card card-pad space-y-4"><div class="section-head" style="margin-bottom:0"><h3>Students</h3>' +
      '<button class="btn-ghost btn-sm" onclick="tcTab(&quot;students&quot;)">Manage</button></div><div class="row-list">' +
      accepted.slice(0, 5).map(function (s) {
        const w = tcStudentWork(s.id);
        return '<div class="row"><span class="row-ico">' + hwEsc((s.full_name || 'S').charAt(0).toUpperCase()) + '</span>' +
          '<span class="row-main"><span class="row-title">' + hwEsc(s.full_name || 'Student') + '</span>' +
          '<span class="row-sub">' + hwEsc(s.email || '') + '</span></span>' +
          '<span class="row-actions"><span class="chip">' + hwEsc(tcWorkLine(w)) + '</span></span></div>';
      }).join('') + '</div></div>';
  }

  el.innerHTML = html;
}

/* What a teacher may read about one student: the work given, the work handed
   in, the work marked, and — since 004 — the lesson parts that student has
   opened. Parts are zero for a student who has not been accepted yet: the
   rule is the student's profile, not a class. */
function tcStudentWork(studentId) {
  const mine = {};
  (TC.assignments || []).forEach(function (a) { if (a.status !== 'draft') mine[a.id] = true; });
  const given = (TC.recipients || []).filter(function (r) {
    return r.student_id === studentId && mine[r.assignment_id];
  }).length;
  const subs = (TC.submissions || []).filter(function (x) { return x.student_id === studentId; });
  const handed = subs.filter(function (x) { return x.status === 'submitted' || x.status === 'graded'; });
  const marked = subs.filter(function (x) { return x.status === 'graded'; });
  let last = null;
  handed.forEach(function (x) {
    if (x.submitted_at && (!last || x.submitted_at > last)) last = x.submitted_at;
  });
  const parts = (TC.progress || []).filter(function (x) { return x.student_id === studentId; }).length;
  return { given: given, handed: handed.length, marked: marked.length, last: last, parts: parts };
}

function tcWorkLine(w) {
  if (!w.given) return 'no work assigned yet';
  if (!w.handed) return w.given + ' assigned · nothing handed in';
  return w.handed + ' of ' + w.given + ' handed in · ' + w.marked + ' marked';
}

/* Every lesson part that exists today, so "opened" has a real denominator:
   the lesson parts of the tracks that actually carry lessons. */
function tcTotalParts() {
  const tracks = (typeof TRACKS !== 'undefined' && TRACKS) ? TRACKS : {};
  let lessons = 0;
  Object.keys(tracks).forEach(function (k) {
    lessons += Object.keys((tracks[k] || {}).lessons || {}).length;
  });
  return lessons * ((typeof TRACK_PARTS !== 'undefined' && TRACK_PARTS.length) || 10);
}

function tcPartLine(w) {
  const total = tcTotalParts();
  if (!w.parts) return 'no lesson opened yet';
  return w.parts + (total ? ' of ' + total : '') + ' lesson parts opened';
}

function tcProgressBar(pct, parts) {
  return '<span class="progress-row" style="width:100%"><span class="progress-track">' +
    '<span class="progress-fill-bar" style="width:' + pct + '%"></span></span>' +
    '<span class="progress-num">' + (parts ? parts + ' opened' : 'none yet') + '</span></span>';
}

function tcRenderStudents() {
  const el = document.getElementById('tc-panel-students');
  if (!el) return;
  if (TC.loading && !TC.students.length) {
    el.innerHTML = '<div class="sk sk-card"></div><div class="sk sk-card"></div>';
    return;
  }

  const waiting = tcWaitingStudents();
  const accepted = (TC.students || []).filter(function (s) { return s.status === 'active'; });
  const refused = (TC.students || []).filter(function (s) { return s.status === 'rejected'; });

  function avatar(s) {
    return '<span class="row-ico avatar-sm">' + hwEsc((s.full_name || 'S').charAt(0).toUpperCase()) + '</span>';
  }

  let html = '';

  /* requests first — this is what the teacher came here to do */
  if (waiting.length) {
    html += '<div class="card card-pad space-y-4" style="border-color:var(--card-hover-border)">' +
      '<div><p class="font-semibold">' + waiting.length +
      (waiting.length === 1 ? ' person is waiting to join' : ' people are waiting to join') + '</p>' +
      '<p class="faint" style="font-size:12.5px;margin-top:4px">They signed up themselves. ' +
      'Accept them and they can see the work you assign.</p></div>' +
      '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Student</th><th>Email</th><th style="text-align:right">Decision</th></tr></thead><tbody>' +
      waiting.map(function (s) {
        const busy = TC.busy[s.id];
        return '<tr>' +
          '<td data-label="Student"><span class="flex items-center gap-2">' + avatar(s) + hwEsc(s.full_name || 'Student') + '</span></td>' +
          '<td data-label="Email" class="faint">' + hwEsc(s.email || '') + '</td>' +
          '<td data-label="Decision"><div class="table-actions">' +
          '<button class="btn-primary btn-sm"' + (busy ? ' disabled' : '') +
          ' onclick="tcDecideStudent(\'' + s.id + '\',\'accept\')">' +
          (busy === 'accept' ? 'Accepting…' : 'Accept') + '</button>' +
          '<button class="btn-secondary btn-sm"' + (busy ? ' disabled' : '') +
          ' onclick="tcDecideStudent(\'' + s.id + '\',\'decline\')">' +
          (busy === 'decline' ? 'Declining…' : 'Decline') + '</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  html += '<div class="card card-pad space-y-4">' +
    '<div class="section-head" style="margin-bottom:0"><div>' +
    '<h3>Your students</h3>' +
    '<p class="faint" style="font-size:12.5px">' +
    (accepted.length ? accepted.length + ' accepted' : 'Nobody accepted yet') + '</p>' +
    '</div></div>';
  if (accepted.length) {
    html += '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Student</th><th>Lesson progress</th><th>Work</th><th style="text-align:right">Action</th></tr></thead><tbody>' +
      accepted.map(function (s) {
        const w = tcStudentWork(s.id);
        const when = w.last ? ' · last ' + hwDate(String(w.last).slice(0, 10)) : '';
        const total = tcTotalParts();
        const pct = total ? Math.min(100, Math.round(w.parts * 100 / total)) : 0;
        return '<tr>' +
          '<td data-label="Student"><span class="flex items-center gap-2">' + avatar(s) +
          '<span><span class="block" style="font-weight:500">' + hwEsc(s.full_name || 'Student') + '</span>' +
          '<span class="faint" style="font-size:12px">' + hwEsc(s.email || '') + '</span></span></span></td>' +
          '<td data-label="Lesson progress" style="min-width:170px">' + tcProgressBar(pct, w.parts) + '</td>' +
          '<td data-label="Work"><span class="chip">' + hwEsc(tcWorkLine(w)) + when + '</span></td>' +
          '<td data-label="Action"><div class="table-actions">' +
          '<button class="btn-quiet btn-sm" onclick="tcNewAssignmentFor(\'' + s.id + '\')">Assign work</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  } else {
    html += '<div class="empty">' +
      '<div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg></div>' +
      '<div class="empty-title">No students yet</div>' +
      '<div class="empty-text">Nobody yet. Tell whoever you are teaching to sign up on this site — ' +
      'their request will appear here for you to accept.</div></div>';
  }
  html += '</div>';

  if (refused.length) {
    html += '<div class="card card-pad space-y-3"><p class="font-semibold">Not accepted</p>' +
      '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Student</th><th>Email</th><th style="text-align:right">Decision</th></tr></thead><tbody>' +
      refused.map(function (s) {
        const busy = TC.busy[s.id];
        return '<tr>' +
          '<td data-label="Student"><span class="flex items-center gap-2">' + avatar(s) + hwEsc(s.full_name || 'Student') + '</span></td>' +
          '<td data-label="Email" class="faint">' + hwEsc(s.email || '') + '</td>' +
          '<td data-label="Decision"><div class="table-actions">' +
          '<button class="btn-quiet btn-sm"' + (busy ? ' disabled' : '') +
          ' onclick="tcDecideStudent(\'' + s.id + '\',\'accept\')">' +
          (busy === 'accept' ? 'Accepting…' : 'Accept anyway') + '</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  el.innerHTML = html;
}

async function tcDecideStudent(studentId, action) {
  if (!HW_ON || !USER) return;
  /* Declining hides every assignment from that student, so it asks first.
     Accepting does not: taking a request back is the safe direction. */
  if (action !== 'accept' && typeof uiConfirm === 'function') {
    var st = (TC.students || []).filter(function (x) { return x.id === studentId; })[0] || {};
    var okDecline = await uiConfirm({
      title: 'Decline this student?',
      text: (st.full_name || st.email || 'This student') + ' will not see any assignments, and will not be able to record progress. You can take them back at any time with Accept anyway.',
      ok: 'Decline', cancel: 'Cancel', danger: true
    });
    if (!okDecline) return;
  }
  /* The finger can get to the button before the network answers. Take the
     click once and ignore the rest until this one is settled, or the same
     student gets accepted twice over. */
  if (TC.busy[studentId]) return;
  TC.busy[studentId] = action;
  tcRenderStudents();                       /* the button shows it took the click */
  const which = action === 'accept' ? 'approve_student' : 'reject_student';
  const r = await HB.rpc(which, { p_student: studentId });
  delete TC.busy[studentId];
  if (r.error) { hwErr(r.error, 'Could not do that'); tcRenderStudents(); return; }
  /* Move them on screen right away: the request is gone before a second
     click could land on it again. tcLoad below is only for the truth. */
  (TC.students || []).forEach(function (s) {
    if (s.id === studentId) s.status = (action === 'accept' ? 'active' : 'rejected');
  });
  tcRenderStudents();
  hwUpdatePendingBadge();
  toast(action === 'accept' ? 'Accepted — they can see their work now' : 'Declined', 'ok');
  TC.ready = false;
  await tcLoad();
}

/* The count beside Teaching, so a request is not missed. */
function hwUpdatePendingBadge() {
  const badge = document.getElementById('nav-teacher-count');
  if (!badge) return;
  const n = (USER && USER.role === 'teacher') ? tcWaitingStudents().length : 0;
  badge.textContent = n ? String(n) : '';
  badge.classList.toggle('hidden', !n);
}

/* ---------- assignment builder ---------- */
function tcNewAssignment() {
  TC.builder = tcBlankBuilder();
  tcTab('assignments');
}

function tcNewAssignmentFor(studentId) {
  TC.builder = tcBlankBuilder();
  if (studentId) TC.builder.studentIds = [studentId];
  TC.tab = 'assignments';
  document.querySelectorAll('[data-tc-tab]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.tcTab === 'assignments');
  });
  hwShow('tc-panel-students', false);
  hwShow('tc-panel-assignments', true);
  tcRenderAssignments();
  const el = document.getElementById('tc-b-title');
  if (el && el.focus) el.focus();
}

function tcBlankBuilder() {
  return {
    id: null, title: '', instructions: '', kind: 'lesson',
    track: 'a1', no: 1, due: '',
    allStudents: false, studentIds: [],
    questions: [], status: 'draft'
  };
}

function tcRenderAssignments() {
  const el = document.getElementById('tc-panel-assignments');
  if (!el) return;
  if (!TC.builder) TC.builder = tcBlankBuilder();
  const b = TC.builder;
  const tracks = Object.keys(TRACKS || {});
  const lessonTitle = (TRACKS[b.track] && TRACKS[b.track].lessons && TRACKS[b.track].lessons[b.no])
    ? TRACKS[b.track].lessons[b.no].title : null;

  let html = '<div class="card card-pad space-y-5">' +
    '<div class="section-head" style="margin-bottom:0"><h3>' + (b.id ? 'Edit assignment' : 'New assignment') + '</h3>' +
    '<button class="btn-ghost btn-sm" onclick="tcResetBuilder()">Clear</button></div>' +
    '<div><label class="label">Title</label>' +
    '<input class="input" id="tc-b-title" value="' + hwEsc(b.title) + '" placeholder="Homework: Build the Message" oninput="tcBuilderSet(\'title\', this.value)"></div>' +
    '<div><label class="label">Instructions</label>' +
    '<textarea class="input" rows="3" placeholder="What should students do?" oninput="tcBuilderSet(\'instructions\', this.value)">' + hwEsc(b.instructions) + '</textarea></div>' +
    '<div><label class="label">Due date (optional)</label>' +
    '<input class="input" type="date" value="' + hwEsc(b.due) + '" oninput="tcBuilderSet(\'due\', this.value)"></div>';

  html += '<div><label class="label">What are you assigning?</label><div class="flex gap-2">' +
    '<button class="pill' + (b.kind === 'lesson' ? ' on' : '') + '" onclick="tcBuilderKind(\'lesson\')">An existing lesson</button>' +
    '<button class="pill' + (b.kind === 'custom' ? ' on' : '') + '" onclick="tcBuilderKind(\'custom\')">My own questions</button>' +
    '</div></div>';

  if (b.kind === 'lesson') {
    html += '<div class="card-soft card-pad space-y-3">' +
      '<div class="flex gap-3 flex-wrap">' +
      '<div class="flex-1"><label class="label">Track</label><select class="input" onchange="tcBuilderSet(\'track\', this.value)">' +
      tracks.map(function (t) {
        const n = TRACKS[t] && TRACKS[t].lessons ? Object.keys(TRACKS[t].lessons).length : 0;
        return '<option value="' + t + '"' + (t === b.track ? ' selected' : '') + '>' + t.toUpperCase() +
          (n ? ' · ' + n + ' lessons' : ' · no content yet') + '</option>';
      }).join('') + '</select></div>' +
      '<div style="width:150px"><label class="label">Lesson</label>' +
      '<input class="input" type="number" min="1" max="50" value="' + hwEsc(b.no) + '" oninput="tcBuilderSet(\'no\', this.value)"></div></div>' +
      '<p class="faint text-xs">' + (lessonTitle
        ? 'Students will open: <b>' + hwEsc(lessonTitle) + '</b>. The lesson content stays exactly as it is — this is only a reference.'
        : 'No content is loaded for this lesson yet, but you can still assign it.') + '</p></div>';
  } else {
    html += '<div class="card-soft card-pad space-y-3">';
    if (!b.questions.length) html += '<p class="faint text-xs">No questions yet.</p>';
    b.questions.forEach(function (q, i) {
      html += '<div class="card-soft" style="padding:16px 18px;background:var(--surface)">' +
        '<div class="space-y-2">' +
        '<div class="flex items-center gap-2 flex-wrap">' +
        '<span class="text-xs faint">Q' + (i + 1) + '</span>' +
        '<select class="input" style="width:auto" onchange="tcQSet(' + i + ',\'qtype\', this.value)">' +
        '<option value="mcq"' + (q.qtype === 'mcq' ? ' selected' : '') + '>Multiple choice</option>' +
        '<option value="fill"' + (q.qtype === 'fill' ? ' selected' : '') + '>Fill in the blank</option>' +
        '<option value="text"' + (q.qtype === 'text' ? ' selected' : '') + '>Written answer</option>' +
        '</select>' +
        '<input class="input" style="width:90px" type="number" min="0" value="' + hwEsc(q.points) + '" oninput="tcQSet(' + i + ',\'points\', this.value)">' +
        '<button class="btn-secondary" onclick="tcQRemove(' + i + ')">Remove</button></div>' +
        '<input class="input" placeholder="Question" value="' + hwEsc(q.prompt) + '" oninput="tcQSet(' + i + ',\'prompt\', this.value)">';
      if (q.qtype === 'mcq') {
        html += '<input class="input" placeholder="Options, separated by | e.g. Do|Are|Is|Does" value="' + hwEsc(q.optionsRaw) + '" oninput="tcQSet(' + i + ',\'optionsRaw\', this.value)">' +
          '<input class="input" placeholder="Correct option number, starting at 0" value="' + hwEsc(q.keyRaw) + '" oninput="tcQSet(' + i + ',\'keyRaw\', this.value)">';
      } else if (q.qtype === 'fill') {
        html += '<input class="input" placeholder="Accepted answers, separated by |" value="' + hwEsc(q.keyRaw) + '" oninput="tcQSet(' + i + ',\'keyRaw\', this.value)">';
      } else {
        html += '<p class="faint text-xs">Written answers are marked by you after the student submits.</p>';
      }
      html += '<input class="input" placeholder="Explanation shown after marking (optional)" value="' + hwEsc(q.explanation) + '" oninput="tcQSet(' + i + ',\'explanation\', this.value)">';
      html += '</div></div>';
    });
    html += '<button class="btn-quiet" onclick="tcQAdd()">+ Add question</button></div>';
  }

  html += '<div><label class="label">Who gets it?</label>';
  const students = tcAllStudents();
  if (!students.length) {
    html += '<p class="faint text-xs">You have no accepted students yet. ' +
      'Accept someone on the Students tab first.</p>';
  } else {
    html += '<label class="card-row" style="cursor:pointer">' +
      '<input type="checkbox"' + (b.allStudents ? ' checked' : '') +
      ' onchange="tcBuilderSet(\'allStudents\', this.checked)"> ' +
      '<b>Everyone</b><span class="faint text-xs ml-auto">' + students.length +
      ' student(s)</span></label>';
    if (!b.allStudents) {
      html += '<div class="space-y-2 mt-2">' + students.map(function (s) {
        const on = b.studentIds.indexOf(s.id) >= 0;
        return '<label class="card-row" style="cursor:pointer">' +
          '<input type="checkbox"' + (on ? ' checked' : '') +
          ' onchange="tcBuilderToggleStudent(\'' + s.id + '\')"> ' + hwEsc(s.name) + '</label>';
      }).join('') + '</div>';
    }
  }
  html += '</div>';

  html += '<div class="flex items-center gap-3 flex-wrap">' +
    '<button class="btn-secondary" onclick="tcSaveAssignment(\'draft\',this)">Save draft</button>' +
    '<button class="btn-primary" onclick="tcSaveAssignment(\'published\',this)">Publish</button>' +
    '<button class="btn-secondary" onclick="tcResetBuilder()">Clear</button>' +
    '<span class="faint text-xs">Only published work becomes visible to students.</span></div>';
  html += '</div>';

  /* existing assignments */
  html += '<div class="section-head" style="margin-top:8px"><h3>Your assignments</h3>' +
    '<span class="faint">' + TC.assignments.length + ' total</span></div>';
  if (!TC.assignments.length) {
    html += '<div class="empty"><div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>' +
      '<div class="empty-title">No assignments yet</div>' +
      '<div class="empty-text">Create one above, then publish it. Only published work becomes visible to students.</div></div>';
  }
  if (TC.assignments.length) {
    html += '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Assignment</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>';
  }
  TC.assignments.forEach(function (a) {
    const ref = a.kind === 'lesson'
      ? 'Lesson · ' + hwEsc(String(a.lesson_track || '').toUpperCase()) + ' ' + hwEsc(a.lesson_no)
      : 'Custom questions';
    const st = a.status === 'published' ? hwPill('submitted', 'Published')
      : a.status === 'closed' ? hwPill('not_started', 'Closed') : hwPill('in_progress', 'Draft');
    const actions = (a.status === 'draft' ? '<button class="btn-primary btn-sm" onclick="tcSetStatus(\'' + a.id + '\',\'published\',this)">Publish</button>' : '') +
      (a.status === 'published' ? '<button class="btn-quiet btn-sm" onclick="tcSetStatus(\'' + a.id + '\',\'closed\',this)">Close</button>' : '') +
      '<button class="btn-quiet btn-sm" onclick="tcOpenSubmissions(\'' + a.id + '\')">Submissions</button>';
    html += '<tr>' +
      '<td data-label="Assignment"><span class="block row-title">' + hwEsc(a.title) + '</span>' +
      '<span class="row-sub">' + ref + ' · assigned ' + hwEsc(hwDate(a.assigned_at)) + ' · due ' + hwEsc(hwDate(a.due_at)) + '</span></td>' +
      '<td data-label="Status">' + st + '</td>' +
      '<td data-label="Actions"><div class="table-actions">' + actions + '</div></td></tr>';
  });
  if (TC.assignments.length) html += '</tbody></table></div>';

  if (TC.openSubs) {
    html += '<div id="tc-subs" class="card p-6 space-y-4">' +
      '<div class="flex items-center justify-between gap-3"><p class="font-semibold">Submissions</p>' +
      '<button class="btn-secondary" onclick="tcCloseSubmissions()">Hide</button></div>' +
      TC.resultsHtml + '</div>';
  }

  el.innerHTML = html;
}

function tcBuilderSet(k, v) {
  TC.builder[k] = (k === 'no') ? (parseInt(v, 10) || 1) : v;
  if (k === 'title') hwClearFieldError('tc-b-title');   /* the error goes as soon as it is fixed */
  if (k === 'track' || k === 'no') tcRenderAssignments();
}
function tcBuilderKind(k) { TC.builder.kind = k; tcRenderAssignments(); }
function tcQAdd() {
  TC.builder.questions.push({ qtype: 'mcq', prompt: '', optionsRaw: '', keyRaw: '', points: 1, explanation: '' });
  tcRenderAssignments();
}
function tcQRemove(i) { TC.builder.questions.splice(i, 1); tcRenderAssignments(); }
function tcQSet(i, k, v) {
  const q = TC.builder.questions[i];
  if (!q) return;
  q[k] = (k === 'points') ? (parseInt(v, 10) || 0) : v;
}
function tcBuilderToggleStudent(id) {
  const b = TC.builder;
  const i = b.studentIds.indexOf(id);
  if (i >= 0) b.studentIds.splice(i, 1); else b.studentIds.push(id);
}
async function tcResetBuilder() {
  const b = TC.builder;
  const dirty = (b.title && b.title.trim()) || (b.questions && b.questions.length) || (b.studentIds && b.studentIds.length);
  if (dirty && typeof uiConfirm === 'function') {
    const okReset = await uiConfirm({
      title: 'Discard this draft?',
      text: 'The title, the questions and the students chosen in this draft will be lost. Assignments already saved are not affected.',
      ok: 'Discard', cancel: 'Keep editing', danger: true
    });
    if (!okReset) return;
  }
  TC.builder = tcBlankBuilder(); tcRenderAssignments();
}

async function tcSaveAssignment(publish, btn) {
  const b = TC.builder;
  if (!HW_ON || !USER) return;
  if (!b.title.trim()) { hwFieldError('tc-b-title', 'Give the assignment a title before saving it.'); return; }
  const targets = b.allStudents
    ? tcAllStudents().map(function (s) { return s.id; })
    : b.studentIds.slice();
  if (!targets.length) { toast('Choose at least one student', 'err'); return; }
  if (b.kind === 'custom' && !b.questions.length) { toast('Add at least one question', 'err'); return; }

  let questions = [];
  if (b.kind === 'custom') {
    for (var i = 0; i < b.questions.length; i++) {
      const q = b.questions[i];
      if (!q.prompt.trim()) { toast('Question ' + (i + 1) + ' needs text', 'err'); return; }
      let options = null, correct = null;
      if (q.qtype === 'mcq') {
        options = q.optionsRaw.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (options.length < 2) { toast('Question ' + (i + 1) + ' needs at least two options (separate with |)', 'err'); return; }
        const idx = parseInt(q.keyRaw, 10);
        if (!(idx >= 0 && idx < options.length)) { toast('Question ' + (i + 1) + ': correct option number must be 0–' + (options.length - 1), 'err'); return; }
        correct = [idx];
      } else if (q.qtype === 'fill') {
        const acc = q.keyRaw.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!acc.length) { toast('Question ' + (i + 1) + ' needs an accepted answer', 'err'); return; }
        correct = acc;
      }
      questions.push({ ord: i + 1, qtype: q.qtype, prompt: q.prompt.trim(), options: options, points: q.points, correct: correct, explanation: q.explanation || null });
    }
  }

  const payload = {
    teacher_id: USER.id,
    title: b.title.trim(),
    instructions: b.instructions || '',
    kind: b.kind,
    lesson_track: b.kind === 'lesson' ? b.track : null,
    lesson_no: b.kind === 'lesson' ? (parseInt(b.no, 10) || 1) : null,
    due_at: b.due || null,
    status: publish === 'published' ? 'published' : 'draft'
  };

  try {
    hwBusy(btn, true);
    let id = b.id;
    if (id) {
      const u = await HB.from('assignments').update(payload).eq('id', id);
      if (u.error) throw u.error;
    } else {
      const c = await HB.from('assignments').insert(payload).select().single();
      if (c.error) throw c.error;
      id = c.data.id;
    }

    if (b.kind === 'custom') {
      for (var j = 0; j < questions.length; j++) {
        const q = questions[j];
        const ins = await HB.from('assignment_questions')
          .insert({ assignment_id: id, ord: q.ord, qtype: q.qtype, prompt: q.prompt, options: q.options, points: q.points })
          .select().single();
        if (ins.error) throw ins.error;
        if (q.correct) {
          const k = await HB.from('question_keys')
            .insert({ question_id: ins.data.id, correct: q.correct, explanation: q.explanation });
          if (k.error) throw k.error;
        }
      }
    }

    for (var k2 = 0; k2 < targets.length; k2++) {
      const r = await HB.from('assignment_recipients')
        .insert({ assignment_id: id, student_id: targets[k2] });
      if (r.error && String(r.error.message || '').indexOf('duplicate') < 0) throw r.error;
    }

    toast(publish === 'published' ? 'Published' : 'Draft saved', 'ok');
    TC.builder = tcBlankBuilder();
    TC.ready = false;
    await tcLoad();
  } catch (e) {
    hwErr(e, 'Could not save the assignment');
  } finally {
    hwBusy(btn, false);
  }
}

async function tcSetStatus(id, status, btn) {
  if (status === 'closed' && typeof uiConfirm === 'function') {
    const okClose = await uiConfirm({
      title: 'Close this assignment?',
      text: 'Students can no longer submit. Work already handed in stays as it is, and you can still grade it.',
      ok: 'Close it', cancel: 'Cancel', danger: true
    });
    if (!okClose) return;
  }
  hwBusy(btn, true);
  const r = await HB.from('assignments').update({ status: status }).eq('id', id);
  hwBusy(btn, false);
  if (r.error) { hwErr(r.error, 'Could not update'); return; }
  toast(status === 'published' ? 'Published' : 'Closed', 'ok');
  TC.ready = false; await tcLoad();
}

async function tcOpenSubmissions(assignmentId) {
  TC.openSubs = assignmentId;
  try {
    const a = TC.assignments.filter(function (x) { return x.id === assignmentId; })[0];
    const subs = await HB.from('submissions')
      .select('id,student_id,status,attempt,score,max_score,feedback,submitted_at')
      .eq('assignment_id', assignmentId).order('submitted_at', { ascending: false });
    if (subs.error) throw subs.error;
    const qs = await HB.from('assignment_questions')
      .select('id,ord,qtype,prompt,points').eq('assignment_id', assignmentId).order('ord');
    if (qs.error) throw qs.error;
    const rows = subs.data || [];
    const questions = qs.data || [];

    if (!rows.length) { TC.resultsHtml = '<p class="faint text-sm">Nobody has started this yet.</p>'; tcRenderAssignments(); return; }

    let html = '';
    for (var i = 0; i < rows.length; i++) {
      const s = rows[i];
      const name = tcStudentName(s.student_id);
      let texts = [];
      if (s.status === 'submitted' || s.status === 'graded' || s.status === 'returned') {
        const an = await HB.from('submission_answers')
          .select('question_id,answer,is_correct,points_awarded').eq('submission_id', s.id);
        texts = an.data || [];
      }
      const byQ = {};
      texts.forEach(function (t) { byQ[t.question_id] = t; });
      const written = questions.filter(function (q) { return q.qtype === 'text'; });

      html += '<div class="p-4 rounded-xl space-y-3" style="background:var(--surface2)">' +
        '<div class="flex items-center gap-3 flex-wrap"><span class="text-sm font-medium">' + hwEsc(name) + '</span>' +
        hwPill(s.status === 'graded' ? 'graded' : s.status === 'submitted' ? 'submitted' : s.status === 'returned' ? 'returned' : 'in_progress',
               s.status === 'graded' ? 'Graded' : s.status === 'submitted' ? 'Submitted' : s.status === 'returned' ? 'Try again' : 'In progress') +
        '<span class="faint text-xs ml-auto mono">' +
        (s.score != null ? s.score + '/' + s.max_score : '—') + '</span></div>';

      if (!written.length && s.status !== 'in_progress') {
        html += '<p class="faint text-xs">All questions are auto-marked.</p>';
      }
      written.forEach(function (q) {
        const a2 = byQ[q.id] || {};
        const raw = a2.answer == null ? '' : (Array.isArray(a2.answer) ? a2.answer.join(' ') : String(a2.answer));
        html += '<div class="space-y-1"><p class="text-xs faint">' + hwEsc(q.prompt) + '</p>' +
          '<p class="text-sm" style="white-space:pre-wrap">' + hwEsc(raw || '(no answer)') + '</p>' +
          '<input class="input" type="number" min="0" max="' + q.points + '" placeholder="points 0–' + q.points + '" ' +
          'value="' + (a2.points_awarded != null ? a2.points_awarded : '') + '" id="g_' + s.id + '_' + q.id + '"></div>';
      });

      html += '<textarea class="input" rows="2" placeholder="Feedback for this student" id="fb_' + s.id + '">' + hwEsc(s.feedback || '') + '</textarea>';
      html += '<div class="flex gap-2 flex-wrap">' +
        '<button class="btn-primary" onclick="tcGrade(\'' + s.id + '\',\'graded\',this)">Save grade</button>' +
        '<button class="btn-secondary" onclick="tcGrade(\'' + s.id + '\',\'returned\',this)">Ask for another try</button>' +
        '</div></div>';
    }
    TC.resultsHtml = html;
  } catch (e) {
    hwErr(e, 'Could not load submissions');
    TC.resultsHtml = '<p class="faint text-sm">Could not load submissions.</p>';
  }
  tcRenderAssignments();
}

function tcStudentName(id) {
  const all = tcAllStudents();
  const hit = all.filter(function (s) { return s.id === id; })[0];
  return hit ? hit.name : 'Student ' + String(id).slice(0, 6);
}

function tcCloseSubmissions() { TC.openSubs = null; TC.resultsHtml = ''; tcRenderAssignments(); }

async function tcGrade(submissionId, status, btn) {
  const qs = document.querySelectorAll('[id^="g_' + submissionId + '_"]');
  const answers = {};
  qs.forEach(function (el) {
    const qid = el.id.slice(String('g_' + submissionId + '_').length);
    if (el.value !== '' && el.value != null) answers[qid] = Number(el.value);
  });
  const fb = document.getElementById('fb_' + submissionId);
  hwBusy(btn, true);
  const r = await HB.rpc('grade_submission', {
    p_submission: submissionId,
    p_answers: answers,
    p_feedback: fb && fb.value ? fb.value : null,
    p_status: status
  });
  hwBusy(btn, false);
  if (r.error) { hwErr(r.error, 'Could not save the grade'); return; }
  toast(status === 'graded' ? 'Grade saved' : 'Sent back for another try', 'ok');
  if (TC.openSubs) await tcOpenSubmissions(TC.openSubs);
}

/* ============================================================
   LESSON PROGRESS — recorded on the server, per student
   ============================================================ */
const HW_SEEN = {};
function tcProgressOf(studentId) {
  const rows = (TC.progress || []).filter(function (r) { return r.student_id === studentId; });
  if (!rows.length) return 'no lessons opened yet';
  const lessons = {};
  rows.forEach(function (r) { lessons[r.track + '-' + r.lesson_no] = true; });
  const done = {};
  rows.forEach(function (r) { if (r.part === 'finalTask') done[r.track + '-' + r.lesson_no] = true; });
  const touched = Object.keys(lessons).length;
  const finished = Object.keys(done).length;
  return finished
    ? finished + ' lesson(s) finished · ' + touched + ' opened'
    : touched + ' lesson(s) opened';
}

async function hwRecordProgress(track, no, part) {
  if (!HW_ON || !USER || USER.role !== 'student' || !track || !no || !part) return;
  const key = track + '/' + no + '/' + part;
  if (HW_SEEN[key]) return;
  HW_SEEN[key] = true;
  const r = await HB.from('lesson_progress')
    .upsert({ student_id: USER.id, track: track, lesson_no: Number(no), part: part },
            { onConflict: 'student_id,track,lesson_no,part' });
  if (r.error) delete HW_SEEN[key];
}

/* Reads this student's own record. Returns null when there is nothing to
   say, so the dashboard keeps its local numbers. */
async function hwLoadProgress() {
  if (!HW_ON || !USER) return null;
  try {
    const r = await HB.from('lesson_progress').select('track,lesson_no,part');
    if (r.error || !r.data) return null;
    const done = {};
    r.data.forEach(function (x) { if (x.part === 'finalTask') done[x.track + '-' + x.lesson_no] = true; });
    const touched = {};
    r.data.forEach(function (x) { touched[x.track + '-' + x.lesson_no] = true; });
    return { lessons: Object.keys(done).length,
             opened: Object.keys(touched).length,
             parts: r.data.length };
  } catch (e) { return null; }
}

/* ============================================================
   PASSWORDS
   ============================================================ */
async function hwForgotPassword() {
  const el = document.getElementById('auth-email');
  const email = el && el.value ? el.value.trim() : '';
  if (!email || email.indexOf('@') < 0) {
    authMsg('Type your email above first, then press "Forgot password?".', 'err');
    return;
  }
  if (!HW_ON) { authMsg('Password reset needs the school backend.', 'err'); return; }
  try {
    const r = await HB.auth.resetPasswordForEmail(email, { redirectTo: hwSiteUrl() });
    if (r.error) throw r.error;
    authMsg('If that email has an account, a reset link is on its way.', 'ok');
  } catch (e) {
    authMsg((e && e.message) || 'Could not send the reset email', 'err');
  }
}

function hwSiteUrl() {
  try { return location.origin + location.pathname; } catch (e) { return undefined; }
}

/* ---------- setup hint ---------- */
function showV2Setup() {
  toast('Add SUPABASE_URL and SUPABASE_ANON_KEY to config.js, then reload.', 'ok');
}
