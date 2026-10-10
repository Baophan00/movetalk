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
  ready: false, loading: false, tab: 'classes',
  classes: [], rosters: {}, assignments: [], rosterOf: {},
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
function hwCode() {
  return 'MT-' + String(Math.floor(1000 + Math.random() * 9000));
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
      ? 'Sign in with a teacher account to manage classes and assignments.'
      : 'Sign in to see the work your teacher assigned.' };
  }
  if (isTeacherArea && user.role !== 'teacher') {
    return { shot: 'role', msg: 'This area is for teacher accounts. Your account is a student account — ask an admin to switch it if that is wrong.' };
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
    const p = await HB.from('profiles').select('id,email,full_name,role').eq('id', u.id).maybeSingle();
    const prof = p && p.data ? p.data : null;
    USER = {
      id: u.id,
      email: u.email,
      name: (prof && prof.full_name) || (u.email || '').split('@')[0],
      role: (prof && prof.role) || 'student'
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
      else { b.textContent = 'Sign In'; b.setAttribute('onclick', 'showAuth()'); }
    }
    gate.classList.remove('hidden'); body.classList.add('hidden');
    return;
  }

  gate.classList.add('hidden'); body.classList.remove('hidden');
  hwShow('hw-join', USER.role === 'student');
  const sub = document.getElementById('hw-sub');
  if (sub) {
    sub.textContent = USER.role === 'teacher'
      ? 'You are signed in as a teacher. Homework assigned to you personally appears here.'
      : 'Signed in as ' + USER.name;
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

async function hwRefresh() {
  HW.ready = false; HW.detailId = null; HW.questions = []; HW.answers = {};
  await hwLoad();
  if (TC.tab) { TC.ready = false; }
}

function hwRenderList() {
  const el = document.getElementById('hw-list');
  if (!el) return;
  if (HW.loading && !HW.assignments.length) {
    el.innerHTML = '<div class="card p-8 faint text-sm">Loading your homework…</div>';
    return;
  }
  if (!HW.assignments.length) {
    el.innerHTML = '<div class="card p-8 text-center"><p class="font-semibold mb-1">Nothing assigned yet</p>' +
      '<p class="faint text-sm">When a teacher assigns a lesson or an exercise, it shows up here.</p></div>';
    return;
  }
  el.innerHTML = HW.assignments.map(function (a) {
    const st = hwStatus(a, HW.subs[a.id]);
    const ref = a.kind === 'lesson'
      ? 'Lesson · ' + hwEsc(String(a.lesson_track || '').toUpperCase()) + ' ' + hwEsc(a.lesson_no)
      : 'Custom exercise';
    const score = HW.subs[a.id] && HW.subs[a.id].score != null
      ? ' · ' + HW.subs[a.id].score + '/' + HW.subs[a.id].max_score
      : '';
    return '<button class="card p-6 w-full text-left hw-row" onclick="hwOpen(\'' + a.id + '\')">' +
      '<div class="flex items-start justify-between gap-4">' +
      '<div><p class="font-semibold">' + hwEsc(a.title) + '</p>' +
      '<p class="faint text-xs mt-1">' + ref + ' · due ' + hwEsc(hwDate(a.due_at)) + hwEsc(score) + '</p></div>' +
      hwPill(st.k, st.label) +
      '</div></button>';
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

async function hwJoinClass() {
  if (!HW_ON || !USER) return;
  const el = document.getElementById('hw-join-code');
  const code = el && el.value ? el.value.trim() : '';
  if (!code) { toast('Enter the class code first', 'err'); return; }
  const r = await HB.rpc('join_class_by_code', { p_code: code });
  if (r.error) { hwErr(r.error, 'Could not join that class'); return; }
  if (el) el.value = '';
  toast('Joined ' + (r.data && r.data.name ? r.data.name : 'class'), 'ok');
  HW.ready = false; await hwLoad();
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
    TC.ready = true;
  } catch (e) {
    hwErr(e, 'Could not load your classes');
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
  TC.tab = name || 'classes';
  document.querySelectorAll('[data-tc-tab]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.tcTab === TC.tab);
  });
  hwShow('tc-panel-classes', TC.tab === 'classes');
  hwShow('tc-panel-assignments', TC.tab === 'assignments');
  if (!silent) tcRender();
}

function tcAllStudents() {
  const seen = {}, out = [];
  TC.classes.forEach(function (c) {
    (TC.rosters[c.id] || []).forEach(function (s) {
      if (s && s.student_id && !seen[s.student_id]) {
        seen[s.student_id] = true;
        out.push({ id: s.student_id, name: s.full_name || s.email || 'Student' });
      }
    });
  });
  return out;
}

function tcRender() {
  tcRenderClasses();
  tcRenderAssignments();
}

function tcRenderClasses() {
  const el = document.getElementById('tc-panel-classes');
  if (!el) return;
  if (TC.loading && !TC.classes.length) { el.innerHTML = '<div class="card p-8 faint text-sm">Loading…</div>'; return; }

  let html = '<div class="card p-6 space-y-3">' +
    '<p class="font-semibold">New class</p>' +
    '<div class="flex gap-3 flex-wrap">' +
    '<input class="input flex-1" id="tc-new-class" placeholder="Class name, e.g. Monday 7pm">' +
    '<button class="btn-primary" onclick="tcCreateClass()">Create class</button></div>' +
    '<p class="faint text-xs">Students join with the class code shown on each class below.</p></div>';

  if (!TC.classes.length) {
    html += '<div class="card p-8 text-center faint text-sm">No classes yet. Create one to start assigning work.</div>';
  }
  TC.classes.forEach(function (c) {
    const roster = TC.rosters[c.id] || [];
    html += '<div class="card p-6 space-y-4">' +
      '<div class="flex items-start justify-between gap-4 flex-wrap">' +
      '<div><p class="font-semibold">' + hwEsc(c.name) + '</p>' +
      '<p class="faint text-xs mt-1">Class code <b>' + hwEsc(c.join_code) + '</b> · ' +
      roster.length + ' student(s)</p></div>' +
      '<button class="btn-secondary" onclick="tcNewAssignmentFor(\'' + c.id + '\')">Assign work</button>' +
      '</div>';
    if (roster.length) {
      html += '<div class="space-y-2">' + roster.map(function (s) {
        return '<div class="flex items-center gap-3 text-sm p-3 rounded-xl" style="background:var(--surface2)">' +
          '<span class="w-7 h-7 rounded-full text-xs flex items-center justify-center" style="background:var(--badge-bg)">' +
          hwEsc((s.full_name || 'S').charAt(0).toUpperCase()) + '</span>' +
          '<span>' + hwEsc(s.full_name || 'Student') + '</span>' +
          '<span class="faint text-xs ml-auto">' + hwEsc(s.email || '') + '</span></div>';
      }).join('') + '</div>';
    } else {
      html += '<p class="faint text-xs">Nobody has joined yet. Share the code ' + hwEsc(c.join_code) + '.</p>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

async function tcCreateClass() {
  const el = document.getElementById('tc-new-class');
  const name = el && el.value ? el.value.trim() : '';
  if (!name) { toast('Give the class a name', 'err'); return; }
  if (!HW_ON || !USER) return;
  let r = await HB.from('classes').insert({ teacher_id: USER.id, name: name, join_code: hwCode() }).select().single();
  if (r.error && String(r.error.message || '').indexOf('duplicate') >= 0) {
    r = await HB.from('classes').insert({ teacher_id: USER.id, name: name, join_code: hwCode() }).select().single();
  }
  if (r.error) { hwErr(r.error, 'Could not create the class'); return; }
  if (el) el.value = '';
  toast('Class created', 'ok');
  TC.ready = false; await tcLoad();
}

/* ---------- assignment builder ---------- */
function tcNewAssignmentFor(classId) {
  TC.builder = tcBlankBuilder();
  TC.builder.classIds = [classId];
  TC.tab = 'assignments';
  document.querySelectorAll('[data-tc-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tcTab === 'assignments'); });
  hwShow('tc-panel-classes', false);
  hwShow('tc-panel-assignments', true);
  tcRenderAssignments();
  const el = document.getElementById('tc-b-title');
  if (el && el.focus) el.focus();
}

function tcBlankBuilder() {
  return {
    id: null, title: '', instructions: '', kind: 'lesson',
    track: 'a1', no: 1, due: '',
    classIds: [], studentIds: [],
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

  let html = '<div class="card p-6 space-y-5">' +
    '<p class="font-semibold">' + (b.id ? 'Edit assignment' : 'New assignment') + '</p>' +
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
    html += '<div class="p-5 rounded-2xl space-y-3" style="background:var(--surface2)">' +
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
    html += '<div class="p-5 rounded-2xl space-y-3" style="background:var(--surface2)">';
    if (!b.questions.length) html += '<p class="faint text-xs">No questions yet.</p>';
    b.questions.forEach(function (q, i) {
      html += '<div class="p-4 rounded-xl space-y-2" style="background:var(--surface)">' +
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
      html += '</div>';
    });
    html += '<button class="btn-secondary" onclick="tcQAdd()">+ Add question</button></div>';
  }

  html += '<div><label class="label">Who gets it?</label>';
  if (!TC.classes.length) {
    html += '<p class="faint text-xs">Create a class first, or assign to a student below.</p>';
  } else {
    html += '<div class="space-y-2">' + TC.classes.map(function (c) {
      const on = b.classIds.indexOf(c.id) >= 0;
      return '<label class="flex items-center gap-3 text-sm p-3 rounded-xl" style="background:var(--surface2)">' +
        '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="tcBuilderToggleClass(\'' + c.id + '\')"> ' +
        hwEsc(c.name) + ' <span class="faint text-xs ml-auto">' + (TC.rosters[c.id] || []).length + ' student(s)</span></label>';
    }).join('') + '</div>';
  }
  const students = tcAllStudents();
  if (students.length) {
    html += '<p class="text-xs faint mt-3 mb-1">Or individual students</p><div class="space-y-2">' + students.map(function (s) {
      const on = b.studentIds.indexOf(s.id) >= 0;
      return '<label class="flex items-center gap-3 text-sm p-3 rounded-xl" style="background:var(--surface2)">' +
        '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="tcBuilderToggleStudent(\'' + s.id + '\')"> ' +
        hwEsc(s.name) + '</label>';
    }).join('') + '</div>';
  }
  html += '</div>';

  html += '<div class="flex items-center gap-3 flex-wrap">' +
    '<button class="btn-secondary" onclick="tcSaveAssignment(\'draft\')">Save draft</button>' +
    '<button class="btn-primary" onclick="tcSaveAssignment(\'published\')">Publish</button>' +
    '<button class="btn-secondary" onclick="tcResetBuilder()">Clear</button>' +
    '<span class="faint text-xs">Only published work becomes visible to students.</span></div>';
  html += '</div>';

  /* existing assignments */
  html += '<p class="font-semibold mt-6">Your assignments</p>';
  if (!TC.assignments.length) {
    html += '<div class="card p-8 text-center faint text-sm">Nothing created yet.</div>';
  }
  TC.assignments.forEach(function (a) {
    const ref = a.kind === 'lesson'
      ? 'Lesson · ' + hwEsc(String(a.lesson_track || '').toUpperCase()) + ' ' + hwEsc(a.lesson_no)
      : 'Custom questions';
    const st = a.status === 'published' ? hwPill('submitted', 'Published')
      : a.status === 'closed' ? hwPill('not_started', 'Closed') : hwPill('in_progress', 'Draft');
    html += '<div class="card p-6 space-y-3">' +
      '<div class="flex items-start justify-between gap-4 flex-wrap"><div>' +
      '<p class="font-semibold">' + hwEsc(a.title) + '</p>' +
      '<p class="faint text-xs mt-1">' + ref + ' · assigned ' + hwEsc(hwDate(a.assigned_at)) + ' · due ' + hwEsc(hwDate(a.due_at)) + '</p>' +
      '</div>' + st + '</div>' +
      '<div class="flex gap-2 flex-wrap">' +
      (a.status === 'draft' ? '<button class="btn-primary" onclick="tcSetStatus(\'' + a.id + '\',\'published\')">Publish</button>' : '') +
      (a.status === 'published' ? '<button class="btn-secondary" onclick="tcSetStatus(\'' + a.id + '\',\'closed\')">Close</button>' : '') +
      '<button class="btn-secondary" onclick="tcOpenSubmissions(\'' + a.id + '\')">Submissions</button>' +
      '</div></div>';
  });

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
function tcBuilderToggleClass(id) {
  const b = TC.builder;
  const i = b.classIds.indexOf(id);
  if (i >= 0) b.classIds.splice(i, 1); else b.classIds.push(id);
}
function tcBuilderToggleStudent(id) {
  const b = TC.builder;
  const i = b.studentIds.indexOf(id);
  if (i >= 0) b.studentIds.splice(i, 1); else b.studentIds.push(id);
}
function tcResetBuilder() { TC.builder = tcBlankBuilder(); tcRenderAssignments(); }

async function tcSaveAssignment(publish) {
  const b = TC.builder;
  if (!HW_ON || !USER) return;
  if (!b.title.trim()) { toast('Give the assignment a title', 'err'); return; }
  if (!b.classIds.length && !b.studentIds.length) { toast('Choose at least one class or student', 'err'); return; }
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

    for (var k2 = 0; k2 < b.classIds.length; k2++) {
      const r = await HB.from('assignment_recipients')
        .insert({ assignment_id: id, class_id: b.classIds[k2] });
      if (r.error && String(r.error.message || '').indexOf('duplicate') < 0) throw r.error;
    }
    for (var k3 = 0; k3 < b.studentIds.length; k3++) {
      const r2 = await HB.from('assignment_recipients')
        .insert({ assignment_id: id, student_id: b.studentIds[k3] });
      if (r2.error && String(r2.error.message || '').indexOf('duplicate') < 0) throw r2.error;
    }

    toast(publish === 'published' ? 'Published' : 'Draft saved', 'ok');
    TC.builder = tcBlankBuilder();
    TC.ready = false;
    await tcLoad();
  } catch (e) {
    hwErr(e, 'Could not save the assignment');
  }
}

async function tcSetStatus(id, status) {
  const r = await HB.from('assignments').update({ status: status }).eq('id', id);
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
        '<button class="btn-primary" onclick="tcGrade(\'' + s.id + '\',\'graded\')">Save grade</button>' +
        '<button class="btn-secondary" onclick="tcGrade(\'' + s.id + '\',\'returned\')">Ask for another try</button>' +
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

async function tcGrade(submissionId, status) {
  const qs = document.querySelectorAll('[id^="g_' + submissionId + '_"]');
  const answers = {};
  qs.forEach(function (el) {
    const qid = el.id.slice(String('g_' + submissionId + '_').length);
    if (el.value !== '' && el.value != null) answers[qid] = Number(el.value);
  });
  const fb = document.getElementById('fb_' + submissionId);
  const r = await HB.rpc('grade_submission', {
    p_submission: submissionId,
    p_answers: answers,
    p_feedback: fb && fb.value ? fb.value : null,
    p_status: status
  });
  if (r.error) { hwErr(r.error, 'Could not save the grade'); return; }
  toast(status === 'graded' ? 'Grade saved' : 'Sent back for another try', 'ok');
  if (TC.openSubs) await tcOpenSubmissions(TC.openSubs);
}

/* ---------- setup hint ---------- */
function showV2Setup() {
  toast('Add SUPABASE_URL and SUPABASE_ANON_KEY to config.js, then reload.', 'ok');
}
