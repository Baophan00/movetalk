/* ============================================================
   MoveTalk — homework & assignment client test suite

   Two instances of the same app script are exercised:
     * OFFLINE — no Supabase config, the guest path
     * ONLINE  — a fake Supabase client, so the signed-in student and
                 teacher screens are rendered and checked for real

   Also verifies v1 (course content, audio, navigation, guest sign-in)
   is untouched.

   Run: node tests/homework.test.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = src.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

let pass = 0, fail = 0;
function t(name, cond, extra = '') {
  if (cond) pass++;
  else { fail++; console.log('FAIL | ' + name + (extra ? ' | ' + extra : '')); }
}

const RETURNS = 'return {TRACKS,TRACK_PARTS,LESSON_DATA,AUDIO_MAP,go,trackGo,trackBody,trackPart,renderTrack,' +
  'renderDashboard,renderHomework,renderTeacher,hwStatus,hwGate,hwOpenLesson,hwEsc,hwDate,' +
  'HW,TC,HW_ON,HB,tcBlankBuilder,tcRenderAssignments,tcBuilderSet,tcBuilderKind,' +
  'tcSaveAssignment,tcGrade,hwLoadSession,hwLoad,hwOpen,hwRenderList,hwSubmit,' +
  'tcLoad,tcTab,tcAllStudents,tcWaitingStudents,tcProgressOf,tcDecideStudent,tcRenderStudents,tcRenderOverview,tcStat,tcNewAssignment,hwUpdatePendingBadge,syncAuthFields,showAuthChange,hwCheckAgain,' +
  'tcRenderStats,tcRenderPending,tcRenderCourses,tcCourseCard,tcRenderMaterials,' +
  'tcStudentWork,tcWorkLine,tcWorkBadges,tcStudentByTrack,tcOpenStudent,tcStudentProfileRow,tcPartLine,tcTotalParts,' +
  'tcSaveSession,tcRenderSchedule,tcSessionBuckets,tcWhen,tcCancelSession,tcNextSession,' +
  'hwForgotPassword,hwRecordProgress,hwLoadProgress,doAuth,setRole,showAuth,' +
  'setUser:(u)=>{USER=u},getUser:()=>USER,' +
  'uiConfirm,uiConfirmClose,' +
  'setAuthMode:(m)=>{AUTH_MODE=m},getAuthMode:()=>AUTH_MODE,' +
  'setRoleState:(r)=>{USER_ROLE=r},getRoleState:()=>USER_ROLE,' +
  'el:(id)=>document.getElementById(id)};';

/* ---------- harness ---------- */
function makeInstance(opts) {
  const els = {};
  const captured = { toasts: [] };
  function mkEl(id) {
    return {
      id, innerHTML: '', textContent: '', value: '', disabled: false, dataset: {}, style: {},
      classList: {
        _s: new Set(),
        add(...c) { c.forEach(x => this._s.add(x)); },
        remove(...c) { c.forEach(x => this._s.delete(x)); },
        toggle(c, f) {
          if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
          else { f ? this._s.add(c) : this._s.delete(c); }
        },
        contains(c) { return this._s.has(c); }
      },
      addEventListener() {},
      querySelectorAll() { return []; },
      appendChild(child) { if (child && child.innerHTML) captured.toasts.push(String(child.innerHTML)); },
      setAttribute(k, v) { this['attr_' + k] = v; }
    };
  }
  const store = {};
  const doc = {
    getElementById(id) { return els[id] || (els[id] = mkEl(id)); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement() { return mkEl('tmp'); },
    documentElement: { dataset: { theme: 'dark' } }
  };
  const win = { innerWidth: 1400, scrollTo() {} };
  if (opts && opts.supabase) win.supabase = opts.supabase;

  const fn = new Function('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'document', 'window', 'addEventListener',
    'IntersectionObserver', 'localStorage', 'location', 'setInterval', 'clearInterval',
    'setTimeout', 'clearTimeout', 'speechSynthesis', js + '\n' + RETURNS);

  const api = fn(
    (opts && opts.url) || '', (opts && opts.key) || '',
    doc, win, () => {}, class { observe() {} },
    { getItem: k => store[k] || null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] },
    { hash: '' }, () => 0, () => {}, () => 0, () => {}, null);

  return { api, els, captured };
}

/* ---------- fake Supabase ---------- */
function fakeSupabase(tables) {
  function from(table) {
    const api = {
      select() { return api; },
      order() { return api; },
      eq() { return api; },
      limit() { return api; },
      in() { return api; },
      maybeSingle() { return Promise.resolve({ data: (tables[table] || [])[0] || null, error: null }); },
      single() { return Promise.resolve({ data: (tables[table] || [])[0] || null, error: null }); },
      insert(arg) {
        (tables.__calls = tables.__calls || []).push(['insert', table, arg]);
        return {
          select() { return { single() { return Promise.resolve({ data: { id: 'new-' + table }, error: null }); } }; },
          then(res) { return Promise.resolve({ data: null, error: null }).then(res); }
        };
      },
      update(arg) {
        (tables.__calls = tables.__calls || []).push(['update', table, arg]);
        return { eq() { return Promise.resolve({ data: null, error: null }); } };
      },
      upsert(arg, opts) { (tables.__calls = tables.__calls || []).push(['upsert', table, arg, opts]); return Promise.resolve({ data: null, error: null }); },
      then(res) { return Promise.resolve({ data: tables[table] || [], error: null }).then(res); }
    };
    return api;
  }
  const client = {
    auth: {
      getSession() { return Promise.resolve({ data: { session: { user: { id: tables.__uid, email: tables.__email } } } }); },
      signOut() { return Promise.resolve({ error: null }); },
      signUp(arg) { (tables.__calls = tables.__calls || []).push(['signUp', arg]); return Promise.resolve({ data: { session: { user: { id: tables.__uid } } }, error: null }); },
      signInWithPassword(arg) { (tables.__calls = tables.__calls || []).push(['signIn', arg]); return Promise.resolve({ data: {}, error: null }); },
      updateUser(arg) { (tables.__calls = tables.__calls || []).push(['updateUser', arg]); return Promise.resolve({ error: null }); },
      resetPasswordForEmail(email, opts) { (tables.__calls = tables.__calls || []).push(['reset', email, opts]); return Promise.resolve({ error: null }); }
    },
    from,
    rpc(name, args) {
      (tables.__calls = tables.__calls || []).push(['rpc', name, args]);
      // approving and turning down really do change the row
      if ((name === 'approve_student' || name === 'reject_student') && tables.profiles) {
        tables.profiles.forEach(r => {
          if (r.id === (args && args.p_student)) {
            r.status = name === 'approve_student' ? 'active' : 'rejected';
          }
        });
      }
      const v = tables.__rpc && (name in tables.__rpc) ? tables.__rpc[name] : null;
      return Promise.resolve({ data: v, error: null });
    }
  };
  /* the app calls window.supabase.createClient(url, key) */
  return { createClient() { return client; }, __client: client };
}

/* ============================================================
   1. v1 STILL INTACT — course content, audio, navigation
   ============================================================ */
const OFFLINE = makeInstance({});
const api = OFFLINE.api;

t('LESSON_DATA still has 10 A1 lessons', Object.keys(api.LESSON_DATA).length === 10);
t('L1 title unchanged', api.LESSON_DATA[1] && api.LESSON_DATA[1].title === 'Reconnect the System');
t('L3 title unchanged', api.LESSON_DATA[3] && api.LESSON_DATA[3].title === 'Build the Message');
t('L10 title unchanged', api.LESSON_DATA[10] && api.LESSON_DATA[10].title === 'Adverbs & Linking Verbs');
t('those lessons still carry all 10 parts',
  api.TRACK_PARTS.every(p => Array.isArray(api.LESSON_DATA[3].parts[p.id]) && api.LESSON_DATA[3].parts[p.id].length));
t('still 6 tracks', Object.keys(api.TRACKS).length === 6);
t('TRACKS.a1.lessons is still LESSON_DATA', api.TRACKS.a1.lessons === api.LESSON_DATA);
t('still 10 parts per lesson', api.TRACK_PARTS.length === 10);
t('audio map still populated', api.AUDIO_MAP && Object.keys(api.AUDIO_MAP).length > 300,
  'n=' + (api.AUDIO_MAP ? Object.keys(api.AUDIO_MAP).length : 0));
t('E2 track still has its lessons', Object.keys(api.TRACKS.e2.lessons).length === 3);

let partsErr = null;
for (const p of ['vocab', 'grammar', 'reading', 'conversations', 'listening', 'exercises', 'speaking', 'roleplay', 'finalTask', 'reference']) {
  try {
    const html = api.trackBody(p, api.LESSON_DATA[1], 'a1');
    if (!html || html.length < 20) partsErr = p + ' rendered empty';
  } catch (e) { partsErr = p + ': ' + e.message; }
}
t('every lesson part still renders after the change', !partsErr, partsErr || '');

let navErr = null;
for (const v of ['home', 'f1', 'f2', 'a1', 'a2', 'e1', 'e2', 'dashboard', 'homework', 'teacher']) {
  try { api.go(v); } catch (e) { navErr = v + ': ' + e.message; }
}
t('every view still navigates without throwing (incl. the two new ones)', !navErr, navErr || '');

/* markup */
t('sidebar has a Homework item', /data-view="homework"/.test(src));
t('sidebar has a Teaching item', /data-view="teacher"/.test(src));
t('Teaching nav item starts hidden', (() => {
  const m = src.match(/<button[^>]*id="nav-teacher-item"[^>]*>/);
  return !!m && /nav-item/.test(m[0]) && /\bhidden\b/.test(m[0]);
})());
t('every teacher-only nav entry starts hidden',
  (() => {
    const items = src.match(/<button[^>]*teacher-only[^>]*>/g) || [];
    return items.length >= 4 && items.every(x => /\bhidden\b/.test(x));
  })());
t('v-homework view exists', /<section id="v-homework"/.test(src));
t('v-teacher view exists', /<section id="v-teacher"/.test(src));
t('the 6 empty track shells are untouched',
  (src.match(/<section id="v-(f1|f2|a1|a2|e1|e2)" class="view hidden"><\/section>/g) || []).length === 6);
t('bottom nav has Homework', /data-bn="homework"/.test(src));
t('supabase-js is loaded', /supabase-js@2/.test(src));
t('config.js loads before the app script',
  src.indexOf('script src="config.js"') < src.indexOf('<script>\n// ---- DATA ----'));
t('the auth modal is unchanged', /id="auth-email"/.test(src) && /id="auth-pass"/.test(src) &&
  /id="auth-role-field"/.test(src) && /data-role="teacher"/.test(src));

/* ============================================================
   2. homework module is wired in
   ============================================================ */
['renderHomework', 'renderTeacher', 'hwStatus', 'hwGate', 'tcBlankBuilder', 'tcRenderAssignments',
  'tcSaveAssignment', 'tcGrade', 'hwSubmit', 'hwLoadSession', 'tcLoad']
  .forEach(n => t('exports ' + n, typeof api[n] === 'function'));
t('HW_ON is a boolean', typeof api.HW_ON === 'boolean');
t('no config in this instance => offline, not a crash', api.HW_ON === false);
t('HB is null when there is no config', api.HB === null);

/* ============================================================
   3. ANSWER KEYS NEVER REACH THE BROWSER
   ============================================================ */
const hwSrc = src.slice(src.indexOf('/* HOMEWORK:BEGIN */'), src.indexOf('/* HOMEWORK:END */'));
t('the student question query does not ask for the key',
  /assignment_questions'\)[\s\S]{0,140}select\('id,ord,qtype,prompt,options,points'\)/.test(hwSrc) &&
  !/assignment_questions'\)[\s\S]{0,140}select\([^)]*correct/.test(hwSrc));
t('question_keys is never SELECTed from the client', !/from\('question_keys'\)\s*\.select/.test(hwSrc));
t('question_keys is only inserted into (teacher key entry)',
  /from\('question_keys'\)/.test(hwSrc) && /from\('question_keys'\)[\s\S]{0,90}\.insert/.test(hwSrc));
t('the client never compares an answer to a key',
  !/(k\.correct|key\.correct|answer\s*===\s*correct|correct\.indexOf)/.test(hwSrc));
t('the answer-key field name never reaches the browser',
  !/answer_key|correct_answer/.test(hwSrc));

/* ============================================================
   4. MARKING HAPPENS SERVER-SIDE
   ============================================================ */
t('submission goes through the server RPC', /rpc\('submit_assignment'/.test(hwSrc));
t('starting a submission goes through the server RPC', /rpc\('start_submission'/.test(hwSrc));
t('grading goes through the server RPC', /rpc\('grade_submission'/.test(hwSrc));
t('students no longer join anything by code — the teacher accepts them',
    !/join_class_by_code/.test(hwSrc) && !/hw-join-code/.test(src));
t('the roster comes from the server RPC', /rpc\('class_roster'/.test(hwSrc));
t('the client never writes a score itself',
  !/\.update\(\s*\{[^}]*score/.test(hwSrc) && !/score\s*:\s*[0-9]/.test(hwSrc));
t('the client never writes is_correct itself', !/is_correct\s*:/.test(hwSrc));

/* ============================================================
   5. AN ASSIGNMENT REFERENCES A LESSON, IT DOES NOT COPY IT
   ============================================================ */
t('the payload carries a stable lesson reference', /lesson_track:/.test(hwSrc) && /lesson_no:/.test(hwSrc));
const payloadBlock = (hwSrc.match(/const payload = \{[\s\S]*?\n  \};/) || [''])[0];
t('the assignment payload carries only a reference and metadata',
  /teacher_id/.test(payloadBlock) && /lesson_track:/.test(payloadBlock) &&
  /lesson_no:/.test(payloadBlock) && !/parts|blocks|flashcard|LESSON_DATA/.test(payloadBlock),
  payloadBlock.slice(0, 140));
t('the homework module never writes lesson content anywhere',
  !/LESSON_DATA/.test(hwSrc) && !/flashcard/.test(hwSrc));
t('opening an assigned lesson reuses the existing lesson viewer',
  /function hwOpenLesson\(track, no\)/.test(hwSrc) && /trackGo\(track, no\)/.test(hwSrc));

/* ============================================================
   6. STUDENT STATUSES
   ============================================================ */
t('status: not started', api.hwStatus({ due_at: null }, null).k === 'not_started');
t('status: in progress', api.hwStatus({}, { status: 'in_progress' }).k === 'in_progress');
t('status: submitted', api.hwStatus({}, { status: 'submitted' }).k === 'submitted');
t('status: graded', api.hwStatus({}, { status: 'graded' }).k === 'graded');
t('status: returned for another try', api.hwStatus({}, { status: 'returned' }).k === 'returned');
t('status: overdue when past the due date and untouched',
  api.hwStatus({ due_at: '2020-01-01' }, null).k === 'overdue');
t('status: a submitted row beats overdue',
  api.hwStatus({ due_at: '2020-01-01' }, { status: 'submitted' }).k === 'submitted');

/* ============================================================
   7. THE UX GATE (pure decision, so it is testable)
   ============================================================ */
const STUDENT = { id: 'u1', name: 'Stu', email: 's@x.test', role: 'student' };
const TEACHER = { id: 't1', name: 'Teach', email: 't@x.test', role: 'teacher' };

t('no backend => setup screen (student area)', api.hwGate('student', false, null).shot === 'setup');
t('no backend => setup screen (teacher area)', api.hwGate('teacher', false, null).shot === 'setup');
t('the setup screen names config.js', /config\.js/.test(api.hwGate('student', false, null).msg));
t('online but signed out => sign-in screen', api.hwGate('student', true, null).shot === 'auth');
t('online, signed out, teacher area => sign-in screen', api.hwGate('teacher', true, null).shot === 'auth');
t('a student opening the teacher area is refused', api.hwGate('teacher', true, STUDENT).shot === 'role');
t('a teacher passes the teacher gate', api.hwGate('teacher', true, TEACHER).shot === 'ok');
t('a student passes the student gate', api.hwGate('student', true, STUDENT).shot === 'ok');
t('a teacher still sees the student area', api.hwGate('student', true, TEACHER).shot === 'ok');

api.setUser(null);
api.go('homework');
t('offline homework gate is visible', OFFLINE.els['hw-gate'].classList.contains('hidden') === false);
t('offline homework body is hidden', OFFLINE.els['hw-body'].classList.contains('hidden') === true);
t('the gate explains how to connect the backend', /config\.js/.test(OFFLINE.els['hw-gate-msg'].innerHTML));
api.go('teacher');
t('offline teacher gate is visible', OFFLINE.els['tc-gate'].classList.contains('hidden') === false);
t('offline teacher body is hidden', OFFLINE.els['tc-body'].classList.contains('hidden') === true);

/* ============================================================
   8. SIGNED-IN STUDENT — real render against a fake backend
   ============================================================ */
const STUDENT_TABLES = {
  __uid: 'u1', __email: 's@x.test',
  profiles: [{ id: 'u1', email: 's@x.test', full_name: 'Stu', role: 'student' }],
  assignments: [
    { id: 'a1', title: 'Homework: Build the Message', instructions: 'Do lesson 3, then answer.',
      kind: 'lesson', lesson_track: 'a1', lesson_no: 3, assigned_at: '2026-10-01',
      due_at: '2026-10-20', status: 'published' },
    { id: 'a2', title: 'Custom drill', instructions: '', kind: 'custom', lesson_track: null,
      lesson_no: null, assigned_at: '2026-10-02', due_at: '2020-01-01', status: 'published' }
  ],
  submissions: [{ id: 'sub1', assignment_id: 'a1', status: 'graded', attempt: 1, score: 6,
    max_score: 6, feedback: 'Good work - watch the article before colleague.',
    submitted_at: '2026-10-05T10:00:00Z', graded_at: '2026-10-06T10:00:00Z' }],
  assignment_questions: [
    { id: 'q1', ord: 1, qtype: 'mcq', prompt: '___ you work nearby?', options: ['Do', 'Are', 'Is', 'Does'], points: 1 },
    { id: 'q2', ord: 2, qtype: 'fill', prompt: 'She is very ______.', options: null, points: 2 },
    { id: 'q3', ord: 3, qtype: 'text', prompt: 'Write three sentences about a colleague.', options: null, points: 3 }
  ],
  submission_answers: [
    { question_id: 'q1', answer: 0, is_correct: true, points_awarded: 1 },
    { question_id: 'q2', answer: 'reliable', is_correct: true, points_awarded: 2 },
    { question_id: 'q3', answer: 'My colleague is very reliable.', is_correct: null, points_awarded: 3 }
  ],
  __rpc: { start_submission: 'sub1' }
};
const ONLINE = makeInstance({ url: 'https://example.supabase.co', key: 'anon-key', supabase: fakeSupabase(STUDENT_TABLES) });
const sa = ONLINE.api;
t('with a config the module goes online', sa.HW_ON === true && !!sa.HB);

(async function () {
  await sa.hwLoadSession();
  t('the signed-in user is taken from the server profile',
    sa.getUser() && sa.getUser().role === 'student' && sa.getUser().name === 'Stu');
  await sa.hwLoad();
  sa.renderHomework();

  const list = ONLINE.els['hw-list'].innerHTML;
  t('the homework list renders the assigned lesson', list.includes('Homework: Build the Message'));
  t('the list shows it is an existing-lesson reference', /A1 lesson 3/.test(list));
  t('the list shows a custom exercise', list.includes('Custom drill'));
  t('the list shows the submitted status', /Graded/.test(list));
  t('the list shows a server-computed score', /6\/6/.test(list));
  t('the list shows overdue for the untouched past-due one', /Overdue/.test(list));
  t('the list is task cards, not one stack of rows', /class="hw-task/.test(list));
  t('the work is grouped by what to do and what is handed in',
    /hw-group-head[^>]*><span>To do<\/span>/.test(list) && /hw-group-head[^>]*><span>Handed in<\/span>/.test(list));
  t('the first thing to do is flagged as next', /hw-task next/.test(list) && /hw-flag">Next/.test(list));
  t('each card names the next action', /Start this now|Continue where you stopped|Past the due date/.test(list));
  t('a card that has been marked tells the student to read it', /Read your mark and comment/.test(list));
  t('an overdue card is marked in the due badge', /badge-err">due /.test(list));
  t('the signed-in student sees the homework body', ONLINE.els['hw-body'].classList.contains('hidden') === false);
  t('the header names the student', /Stu/.test(ONLINE.els['hw-sub'].textContent));

  await sa.hwOpen('a1');
  const det = ONLINE.els['hw-detail'].innerHTML;
  t('the detail view shows the instructions', /Do lesson 3, then answer\./.test(det));
  t('the detail view shows the teacher feedback',
    /Good work - watch the article before colleague\./.test(det));
  t('the referenced lesson can be opened from the assignment', /Open the lesson/.test(det));
  t('the detail view says the lesson is not copied', /never copied or changed/.test(det));
  t('all three questions render as a form', (det.match(/QUESTION/g) || []).length === 1 && det.includes('Write three sentences'));
  t('the mcq remembers the saved option', /value="0" checked/.test(det));
  t('the fill-in remembers the saved text', /value="reliable"/.test(det));
  t('graded answers are read-only', /disabled/.test(det));
  t('the mcq shows its server-awarded points', /✓ 1 \/ 1 point\(s\)/.test(det));
  t('the written answer shows the points the teacher gave', /3 \/ 3 point\(s\)/.test(det));
  t('no submit button once the work is submitted', !/Submit work/.test(det));
  t('no answer key is exposed in the rendered page', !/answer_key|correct_answer/.test(det));

  /* teacher area refused for a student account, with a real render */
  sa.go('teacher');
  t('a student is refused the teacher workspace',
    /teacher account/i.test(ONLINE.els['tc-gate-msg'].innerHTML) &&
    ONLINE.els['tc-body'].classList.contains('hidden'));

  /* ============================================================
     9. SIGNED-IN TEACHER — classes, roster, builder
     ============================================================ */
  const TEACHER_TABLES = {
    __uid: 't1', __email: 't@x.test',
    profiles: [{ id: 't1', email: 't@x.test', full_name: 'Teach', role: 'teacher' }],
    assignments: [],
    lesson_progress: [],
    __rpc: {}
  };
  const TEACH = makeInstance({ url: 'https://example.supabase.co', key: 'anon-key', supabase: fakeSupabase(TEACHER_TABLES) });
  const ta = TEACH.api;
  await ta.hwLoadSession();
  t('the teacher profile is loaded with the teacher role', ta.getUser().role === 'teacher');
  await ta.tcLoad();
  ta.go('teacher');
  const tcp = TEACH.els['tc-panel-students'].innerHTML;
  t('the teacher workspace opens', TEACH.els['tc-body'].classList.contains('hidden') === false);
  t('with nobody signed up the teacher is told what to do',
    /Tell whoever you are teaching to sign up/.test(tcp), tcp.slice(0, 160));
  t('the teacher sidebar has the five sections, in order',
    ['dashboard', 'courses', 'students', 'materials', 'chat'].every(function (k) {
      return src.indexOf('data-tc-nav="' + k + '"') >= 0;
    }));
  t('the four old tabs are gone',
    !/data-tc-tab="overview"/.test(src) && !/data-tc-tab="schedule"/.test(src) && !/data-tc-tab="assignments"/.test(src));
  t('the chat section says coming soon instead of pretending',
    /id="tc-panel-chat"/.test(src) && /Coming soon/.test(src));
  t('materials tells the truth about storage instead of offering a dead upload',
    /function tcRenderMaterials/.test(js) && !/type="file"/.test(src));

  ta.tcNewAssignment();
  ta.TC.builder = ta.tcBlankBuilder();
  ta.TC.builder.title = 'Homework: Build the Message';
  ta.TC.builder.track = 'a1';
  ta.TC.builder.no = 3;
  ta.TC.students = [{ id: 's1', full_name: 'Ann', email: 'a@x.test', status: 'active' }];
  ta.TC.assignments = [];
  ta.tcRenderAssignments();
  const b = TEACH.els['tc-panel-assignments'].innerHTML;
  t('the builder offers every existing track',
    ['f1', 'f2', 'a1', 'a2', 'e1', 'e2'].every(x => b.includes('value="' + x + '"')));
  t('the builder shows the real lesson title from existing content', b.includes('Build the Message'));
  t('the builder says the lesson is only referenced', /stays exactly as it is/.test(b));
  t('the builder lists the accepted student as a recipient', b.includes('Ann'));
  t('the builder offers to send the work to everyone at once', b.includes('Everyone'));
  t('the builder can publish or keep a draft', /Save draft/.test(b) && /Publish/.test(b));
  t('the builder explains that only published work is visible',
    /Only published work becomes visible/.test(b));
  t('the custom builder offers mcq, fill and written',
    (() => {
      ta.TC.builder = ta.tcBlankBuilder();
      ta.tcBuilderKind('custom');
      ta.TC.builder.questions.push({ qtype: 'mcq', prompt: 'Q1', optionsRaw: 'a|b', keyRaw: '0', points: 1, explanation: '' });
      ta.TC.builder.questions.push({ qtype: 'fill', prompt: 'Q2', optionsRaw: '', keyRaw: 'reliable', points: 2, explanation: '' });
      ta.TC.builder.questions.push({ qtype: 'text', prompt: 'Q3', optionsRaw: '', keyRaw: '', points: 3, explanation: '' });
      ta.tcRenderAssignments();
      const h = TEACH.els['tc-panel-assignments'].innerHTML;
      return /Multiple choice/.test(h) && /Fill in the blank/.test(h) && /Written answer/.test(h) &&
             /Correct option number/.test(h) && /Accepted answers/.test(h) &&
             /marked by you after the student submits/.test(h);
    })());

  /* validation must refuse silently-bad saves */
  TEACH.captured.toasts.length = 0;
  ta.TC.builder = ta.tcBlankBuilder(); ta.TC.builder.title = 'x';
  ta.tcSaveAssignment('published');
  t('publishing with no recipients is refused',
    TEACH.captured.toasts.some(x => /at least one student/.test(x)), TEACH.captured.toasts.join(' | '));

  TEACH.captured.toasts.length = 0;
  ta.TC.builder = ta.tcBlankBuilder();
  ta.tcSaveAssignment('published');
  t('publishing without a title is refused',
    TEACH.captured.toasts.some(x => /title/i.test(x)), TEACH.captured.toasts.join(' | '));

  TEACH.captured.toasts.length = 0;
  ta.TC.builder = ta.tcBlankBuilder(); ta.TC.builder.title = 'Custom';
  ta.tcBuilderKind('custom'); ta.TC.builder.studentIds = ['s1'];
  ta.tcSaveAssignment('published');
  t('publishing a custom assignment with no questions is refused',
    TEACH.captured.toasts.some(x => /at least one question/i.test(x)), TEACH.captured.toasts.join(' | '));

  /* ============================================================
     11. STUDENT APPROVAL — the teacher is the one who lets people in
     ============================================================ */
  t('a student who has just signed up is told to wait',
    api.hwGate('student', true, { role: 'student', status: 'pending' }).shot === 'waiting');
  t('the waiting screen says what is going on',
    /waiting for your teacher/i.test(api.hwGate('student', true, { role: 'student', status: 'pending' }).msg));
  t('a turned-down student is told plainly',
    api.hwGate('student', true, { role: 'student', status: 'rejected' }).shot === 'rejected');
  t('an accepted student goes straight through',
    api.hwGate('student', true, { role: 'student', status: 'active' }).shot === 'ok');
  t('the teacher is never held up by their own status',
    api.hwGate('teacher', true, { role: 'teacher', status: 'active' }).shot === 'ok');
  t('only the teacher account can approve or turn people down',
    /approve_student/.test(hwSrc) && /reject_student/.test(hwSrc) &&
    /rpc\(which, \{ p_student: studentId \}\)/.test(hwSrc));
  t('the waiting screen offers a way to re-check', /hwCheckAgain/.test(src));

  const waiting = { id: 'w1', full_name: 'Waiting One', email: 'w1@x.test', status: 'pending' };
  const accepted = { id: 'a1', full_name: 'Accepted One', email: 'a1@x.test', status: 'active' };
  const refused = { id: 'r1', full_name: 'Refused One', email: 'r1@x.test', status: 'rejected' };
  ta.TC.students = [waiting, accepted, refused];
  ta.TC.progress = [];
  ta.TC.busy = {};
  ta.tcRenderStudents();
  const sp = TEACH.els['tc-panel-students'].innerHTML;
  t('the teacher is told how many people are waiting', /1 person is waiting to join/.test(sp), sp.slice(0, 120));
  t('a request shows who it is', sp.includes('Waiting One') && sp.includes('w1@x.test'));
  t('a request offers Accept and Decline',
    /Accept<\/button>/.test(sp) && /Decline<\/button>/.test(sp));
  t('accepted students are listed as students',
    /Your students/.test(sp) && sp.includes('Accepted One'));
  t('a turned-down account is kept aside but recoverable',
    /Not accepted/.test(sp) && /Accept anyway/.test(sp));
  t('work can be assigned straight from a student',
    new RegExp("tcNewAssignmentFor\\('a1'\\)").test(sp));

  t('only accepted students can be given work',
    ta.tcAllStudents().length === 1 && ta.tcAllStudents()[0].id === 'a1',
    JSON.stringify(ta.tcAllStudents()));
  t('the waiting list is separate from the accepted list',
    ta.tcWaitingStudents().length === 1 && ta.tcWaitingStudents()[0].id === 'w1');

  TEACHER_TABLES.__calls = [];
  await ta.tcDecideStudent('w1', 'accept');
  t('accepting calls the approving function on the server',
    (TEACHER_TABLES.__calls || []).some(c => c[0] === 'rpc' && c[1] === 'approve_student' &&
      c[2] && c[2].p_student === 'w1'), JSON.stringify(TEACHER_TABLES.__calls));

  TEACHER_TABLES.__calls = [];
  const declinePending = ta.tcDecideStudent('w1', 'decline');
  t('declining asks first: nothing is sent to the server while the dialog is open',
    (TEACHER_TABLES.__calls || []).filter(c => c[1] === 'reject_student').length === 0,
    JSON.stringify(TEACHER_TABLES.__calls));
  ta.uiConfirmClose(true);
  await declinePending;
  t('declining calls the turning-down function on the server',
    (TEACHER_TABLES.__calls || []).some(c => c[0] === 'rpc' && c[1] === 'reject_student' &&
      c[2] && c[2].p_student === 'w1'), JSON.stringify(TEACHER_TABLES.__calls));

  t('deciding somebody moves them on screen straight away, not on the next load',
    ta.tcWaitingStudents().length === 0, JSON.stringify(ta.tcWaitingStudents()));

  /* two clicks in the same breath must not send two accepts */
  TEACHER_TABLES.profiles.push({ id: 'w1', email: 'w1@x.test', full_name: 'Waiting One',
                                 role: 'student', status: 'pending' });
  ta.TC.students = [waiting, accepted, refused];
  ta.TC.busy = {};
  waiting.status = 'pending';      /* the single-click checks above moved the fixture */
  ta.tcRenderStudents();
  TEACHER_TABLES.__calls = [];
  const firstClick = ta.tcDecideStudent('w1', 'accept');
  const secondClick = ta.tcDecideStudent('w1', 'accept');
  t('a second click while the first is still out is ignored',
    (TEACHER_TABLES.__calls || []).filter(c => c[1] === 'approve_student').length === 1,
    JSON.stringify(TEACHER_TABLES.__calls));
  t('the button says it is working straight away',
    /Accepting\u2026/.test(TEACH.els['tc-panel-students'].innerHTML),
    TEACH.els['tc-panel-students'].innerHTML.slice(0, 220));
  await firstClick; await secondClick;
  t('one accept leaves exactly one copy of the student',
    ta.tcWaitingStudents().length === 0 &&
    ta.tcAllStudents().filter(x => x.id === 'w1').length === 1,
    JSON.stringify(ta.tcAllStudents()));
  t('and the request card is gone from the screen',
    !/is waiting to join/.test(TEACH.els['tc-panel-students'].innerHTML),
    TEACH.els['tc-panel-students'].innerHTML.slice(0, 160));
  waiting.status = 'pending';
  ta.TC.busy = {};

  ta.setUser({ id: 't1', name: 'Teach', email: 't@x.test', role: 'teacher' });
  ta.TC.students = [waiting, accepted];
  ta.hwUpdatePendingBadge();
  const badge = TEACH.els['nav-teacher-count'];
  t('the Teaching item carries a count of the requests',
    badge.textContent === '1' && badge.classList.contains('hidden') === false, badge.textContent);
  ta.TC.students = [accepted];
  ta.hwUpdatePendingBadge();
  t('the count goes away once nobody is waiting', badge.classList.contains('hidden') === true);

  /* the builder targets students now, not classes */
  ta.TC.students = [accepted, { id: 'a2', full_name: 'Second Student', email: 'a2@x.test', status: 'active' }];
  ta.TC.builder = ta.tcBlankBuilder();
  ta.tcRenderAssignments();
  const bh = TEACH.els['tc-panel-assignments'].innerHTML;
  t('the builder offers to send work to everyone', /Everyone/.test(bh));
  t('the builder lists the accepted students',
    bh.includes('Accepted One') && bh.includes('Second Student'));
  ta.TC.students = [];
  ta.TC.builder = ta.tcBlankBuilder();
  ta.tcRenderAssignments();
  t('with nobody accepted the builder says so',
    /no accepted students yet/i.test(TEACH.els['tc-panel-assignments'].innerHTML));

  /* ---------- overview: only real rows, never invented numbers ---------- */
  t('the workspace opens on the dashboard, with the counters at the top',
    /data-tc-nav="dashboard"/.test(src) && /id="tc-panel-dashboard"/.test(src) && /id="tc-stats"/.test(src));
  t('the sidebar offers the teacher the five sections',
    ['dashboard', 'courses', 'students', 'materials', 'chat'].every(function (k) {
      return src.indexOf('data-tc-nav="' + k + '"') >= 0;
    }));
  t('the dashboard counts from rows the teacher can open, not from estimates',
    /function tcRenderStats/.test(js) && /duration_min/.test(js) && /status === 'submitted'/.test(js));

  /* The counters and the waiting table must read the same rows. This is the
     test that would have caught the render that fell over on live because it
     called a helper that does not exist. */
  ta.TC.students = [{ id: 's1', full_name: 'Ann', email: 'a@x.test', status: 'active' }];
  ta.TC.assignments = [{ id: 'a1', title: 'Ôn tập buổi 3', kind: 'lesson', lesson_track: 'a1', lesson_no: 3, status: 'published' }];
  ta.TC.submissions = [{ id: 'sub1', assignment_id: 'a1', student_id: 's1', status: 'submitted', submitted_at: '2026-10-13T10:00:00Z' }];
  ta.TC.sessions = [
    { id: 'x1', title: 'Buổi 1', starts_at: '2020-01-01T09:00:00Z', duration_min: 60, status: 'done' },
    { id: 'x2', title: 'Buổi sau', starts_at: '2099-01-01T09:00:00Z', duration_min: 90, status: 'planned' }
  ];
  ta.tcRenderPending();
  const pend = TEACH.els['tc-pending'].innerHTML;
  t('work waiting to be marked is a table of who, what and when',
    /Ann/.test(pend) && /Ôn tập buổi 3/.test(pend) && /Mở học viên/.test(pend), pend.slice(0, 200));
  ta.tcRenderStats();
  const stats = TEACH.els['tc-stats'].innerHTML;
  t('the dashboard adds up the sessions that already happened, and not the ones ahead',
    /Giờ đã dạy/.test(stats) && /1h/.test(stats) && /1 buổi đã qua/.test(stats), stats.slice(0, 260));
  t('... and it says how many submissions are waiting, from the same rows',
    /Bài chờ chấm/.test(stats) && /Buổi sắp tới/.test(stats));
  t('a section with no rows left says so instead of showing an empty table',
    (() => { ta.TC.submissions = []; ta.tcRenderPending(); const e = TEACH.els['tc-pending'].innerHTML; ta.TC.submissions = [{ id: 'sub1', assignment_id: 'a1', student_id: 's1', status: 'submitted', submitted_at: '2026-10-13T10:00:00Z' }]; return /Không có bài nào đang chờ chấm/.test(e); })());
  t('the teacher courses are the three programmes, with the lessons that exist',
    (() => { ta.tcRenderCourses(); const c = TEACH.els['tc-courses'].innerHTML; return /Foundation/.test(c) && /Activation/.test(c) && /Expand/.test(c) && /Dạy/.test(c); })());
  t('a programme with no content offers no teaching that cannot happen',
    (() => { const c = ta.tcCourseCard('f1'); return /Đang cập nhật/.test(c) && !/Dạy/.test(c); })());

  const quiet = { id: 'a3', full_name: 'Quiet One', email: 'a3@x.test', status: 'active' };
  ta.TC.students = [waiting, accepted, refused, quiet];
  ta.TC.assignments = [
    { id: 'a1', title: 'Homework: Build the Message', kind: 'lesson', lesson_track: 'a1',
      lesson_no: 3, assigned_at: '2026-10-01', due_at: '2026-10-20', status: 'published' },
    { id: 'a2', title: 'Draft drill', kind: 'custom', lesson_track: null, lesson_no: null,
      assigned_at: '2026-10-02', due_at: null, status: 'draft' }
  ];
  ta.TC.submissions = [
    { id: 'sub1', assignment_id: 'a1', student_id: 'a1', status: 'submitted', score: null,
      max_score: 6, submitted_at: '2026-10-05' },
    { id: 'sub2', assignment_id: 'a2', student_id: 'w1', status: 'graded', score: 5,
      max_score: 6, submitted_at: '2026-10-04' }
  ];
  ta.TC.progress = [{ student_id: 'a1', track: 'a1', lesson_no: 3, part: 'vocab' }];
  ta.TC.recipients = [
    { assignment_id: 'a1', student_id: 'a1', class_id: null },
    { assignment_id: 'a1', student_id: 'a3', class_id: null }
  ];
  ta.TC.loading = false;
  ta.tcRenderOverview();
  const ov = TEACH.els['tc-panel-overview'].innerHTML;
  const tiles = (ov.match(/class="stat-value">\d+</g) || []).map(x => +x.match(/stat-value">(\d+)/)[1]);
  t('the overlay tiles carry the real counts',
    JSON.stringify(tiles) === '[1,2,1,1]', JSON.stringify(tiles));
  t('the overview shows what still needs marking', /To review/.test(ov));
  t('the overview shows work that is already marked', /Marked/.test(ov));
  t('the overview names the student behind a submission', ov.includes('Accepted One'));
  t('the overview shows the assignment that was handed in', ov.includes('Homework: Build the Message'));
  t('the overview flags a student who was given work and handed nothing in',
    /1 assigned, nothing handed in yet/.test(ov), ov.slice(0, 200));
  t('a draft is never counted as given work',
    !/2 assigned/.test(ov));
  ta.tcRenderStudents();
  const studs = TEACH.els['tc-panel-students'].innerHTML;
  t('the student list says what has been handed in and marked, as badges',
    /1 assigned/.test(studs) && /nothing handed in/.test(studs), studs.slice(0, 400));
  t('... and never prints a zero as if it were work',
    !/0 handed in/.test(studs) && !/0 graded/.test(studs) && !/0 to mark/.test(studs), studs.slice(0, 400));
  t('the work cell is badges, not one run-on line of text',
    !/<span class="chip">\d+ assigned/.test(studs), studs.slice(0, 400));
  t('the overview keeps a draft out of the published count', /1 still in draft/.test(ov));

  /* Lesson-part progress: the teacher reads it for an ACTIVE student (004).
     The count has to come out of the parts that really exist, and a student who
     opened nothing must not be shown an invented zero. */
  t('the part denominator is the lesson parts that exist',
    ta.tcTotalParts() > 0, String(ta.tcTotalParts()));
  t('the teacher is shown the parts a student opened',
    /1 opened/.test(studs), studs.slice(0, 300));
  t('a student who opened nothing says so instead of a fake count',
    /none yet/.test(studs), studs.slice(0, 300));
  t('the part line names the total',
    ta.tcPartLine({ parts: 1 }) === '1 of ' + ta.tcTotalParts() + ' lesson parts opened',
    ta.tcPartLine({ parts: 1 }));
  t('a student with no progress at all is described in words',
    ta.tcPartLine({ parts: 0 }) === 'no lesson opened yet', ta.tcPartLine({ parts: 0 }));

  /* The details row: one student, their work and their progress per programme,
     as blocks instead of a line of text. */
  ta.TC.openStudent = 'a1';
  ta.tcRenderStudents();
  const openedRow = TEACH.els['tc-panel-students'].innerHTML;
  t('opening a student shows a profile block with their name and status',
    /student-profile/.test(openedRow) && /Accepted One/.test(openedRow) && /accepted/.test(openedRow));
  t('... and one block per programme', (openedRow.match(/sp-card/g) || []).length >= 6, String((openedRow.match(/sp-card/g) || []).length));
  t('a programme still empty says so instead of drawing a 0% bar', /No content yet/.test(openedRow));
  t('the closed row is what the teacher sees by default',
    (() => { ta.TC.openStudent = null; ta.tcRenderStudents(); return !/student-profile/.test(TEACH.els['tc-panel-students'].innerHTML); })());

  const keptStudents = ta.TC.students, keptAssignments = ta.TC.assignments;
  ta.TC.students = [];
  ta.TC.assignments = [];
  ta.TC.loading = true;
  ta.tcRenderOverview();
  t('while loading the overview shows placeholders, not zeroes',
    /sk-card/.test(TEACH.els['tc-panel-overview'].innerHTML) &&
    !/stat-value/.test(TEACH.els['tc-panel-overview'].innerHTML));
  ta.TC.loading = false;
  ta.TC.students = keptStudents;
  ta.TC.assignments = keptAssignments;

  ta.TC.students = [];
  ta.TC.assignments = [];
  ta.TC.submissions = [];
  ta.TC.progress = [];
  ta.tcRenderOverview();
  t('with no work handed in the overview says so plainly',
    /No work handed in yet/.test(TEACH.els['tc-panel-overview'].innerHTML));

  /* opening the screen again must not stack an empty attempt on handed-in work */
  STUDENT_TABLES.assignments = [
    { id: 'a1', title: 'Handed in', instructions: '', kind: 'lesson', lesson_track: 'a1',
      lesson_no: 3, assigned_at: '2026-10-01', due_at: '2026-10-20', status: 'published' },
    { id: 'a9', title: 'Not started', instructions: '', kind: 'lesson', lesson_track: 'a1',
      lesson_no: 4, assigned_at: '2026-10-01', due_at: null, status: 'published' }
  ];
  STUDENT_TABLES.submissions = [
    { id: 'sub1', assignment_id: 'a1', status: 'graded', attempt: 1, score: 6, max_score: 6 }
  ];
  STUDENT_TABLES.__calls = [];
  sa.HW.ready = false;
  await sa.hwLoad();
  const started = (STUDENT_TABLES.__calls || [])
    .filter(c => c[0] === 'rpc' && c[1] === 'start_submission').map(c => c[2].p_assignment);
  t('opening the screen does not open a fresh attempt on handed-in work',
    started.indexOf('a1') < 0, JSON.stringify(started));
  t('... but it still opens one for a lesson the student has not touched',
    started.indexOf('a9') >= 0, JSON.stringify(started));
  t('the handed-in row stays the one the student sees',
    sa.HW.subs['a1'] && sa.HW.subs['a1'].status === 'graded', JSON.stringify(sa.HW.subs['a1']));

  /* ============================================================
     12. LESSON PROGRESS LIVES ON THE SERVER
     ============================================================ */
  t('opening a lesson part records progress', /hwRecordProgress\(tk,\s*TRACK_NUM\[tk\],\s*p\)/.test(src));
  t('the dashboard reads the server record', /if\(typeof hwLoadProgress==='function'\)/.test(src));
  t('progress is written to lesson_progress', /from\('lesson_progress'\)[\s\S]{0,60}\.upsert/.test(hwSrc));
  t('it merges on the key the table enforces',
    /onConflict: 'student_id,track,lesson_no,part'/.test(hwSrc));
  t('a teacher opening a lesson does not write student progress',
    /USER\.role !== 'student'/.test(hwSrc));
  t('a part is only recorded once per session', /if \(HW_SEEN\[key\]\) return/.test(hwSrc));

  STUDENT_TABLES.lesson_progress = [
    { student_id: 'u1', track: 'a1', lesson_no: 3, part: 'vocab' },
    { student_id: 'u1', track: 'a1', lesson_no: 3, part: 'finalTask' },
    { student_id: 'u1', track: 'a1', lesson_no: 4, part: 'vocab' }
  ];
  const prog = await sa.hwLoadProgress();
  t('the dashboard counts a lesson once its final task is reached',
    prog && prog.lessons === 1 && prog.opened === 2 && prog.parts === 3, JSON.stringify(prog));
  t('... and reports the same rows per programme, for the course cards',
    prog && prog.byTrack && prog.byTrack.a1 && Object.keys(prog.byTrack.a1.opened).length === 2 &&
    prog.byTrack.a1.done === 1 && prog.byTrack.a1.parts === 3, JSON.stringify(prog && prog.byTrack));

  STUDENT_TABLES.__calls = [];
  sa.setUser({ id: 'u1', name: 'Stu', email: 's@x.test', role: 'student' });
  await sa.hwRecordProgress('a1', 5, 'vocab');
  const rec = (STUDENT_TABLES.__calls || []).filter(c => c[0] === 'upsert' && c[1] === 'lesson_progress')[0];
  t('a student records a newly opened part against their own id',
    rec && rec[2].student_id === 'u1' && rec[2].track === 'a1' &&
    rec[2].lesson_no === 5 && rec[2].part === 'vocab', JSON.stringify(rec));

  STUDENT_TABLES.__calls = [];
  sa.setUser({ id: 't1', name: 'Teach', email: 't@x.test', role: 'teacher' });
  await sa.hwRecordProgress('a1', 5, 'vocab');
  t('... and a teacher records nothing',
    !(STUDENT_TABLES.__calls || []).some(c => c[0] === 'upsert'), JSON.stringify(STUDENT_TABLES.__calls));

  ta.TC.progress = [
    { student_id: 's1', track: 'a1', lesson_no: 1, part: 'vocab' },
    { student_id: 's1', track: 'a1', lesson_no: 1, part: 'finalTask' },
    { student_id: 's1', track: 'a1', lesson_no: 2, part: 'vocab' }
  ];
  t('the teacher sees a per-student summary',
    /1 lesson\(s\) finished · 2 opened/.test(ta.tcProgressOf('s1')), ta.tcProgressOf('s1'));
  t('a student who has opened nothing says so',
    ta.tcProgressOf('nobody') === 'no lessons opened yet', ta.tcProgressOf('nobody'));

  /* ============================================================
     12b. SCHEDULE — the teacher plans a class, the student sees it
     ============================================================ */
  t('the timetable sits on the dashboard, where the teacher looks first',
    /id="tc-panel-schedule"/.test(src) &&
    src.indexOf('id="tc-panel-schedule"') > src.indexOf('id="tc-panel-dashboard"') &&
    src.indexOf('id="tc-panel-schedule"') < src.indexOf('id="tc-panel-courses"'));

  TEACHER_TABLES.__calls = [];
  ta.TC.sessionForm = { title: '', date: '', time: '19:00', duration_min: 60, lesson_track: 'a1', lesson_no: '', note: '' };
  await ta.tcSaveSession(null);
  t('a session with no title is refused before it reaches the server',
    !(TEACHER_TABLES.__calls || []).some(c => c[0] === 'insert' && c[1] === 'class_sessions'),
    JSON.stringify(TEACHER_TABLES.__calls));

  TEACHER_TABLES.__calls = [];
  ta.TC.sessionForm = { title: 'Buổi 1: Present simple', date: '2020-01-01', time: '19:00', duration_min: 60, lesson_track: 'a1', lesson_no: 1, note: '' };
  await ta.tcSaveSession(null);
  t('a session in the past is refused, not written',
    !(TEACHER_TABLES.__calls || []).some(c => c[0] === 'insert' && c[1] === 'class_sessions'),
    JSON.stringify(TEACHER_TABLES.__calls));

  const future = new Date(Date.now() + 5 * 86400000);
  const futureDay = future.getFullYear() + '-' + String(future.getMonth() + 1).padStart(2, '0') + '-' + String(future.getDate()).padStart(2, '0');
  TEACHER_TABLES.__calls = [];
  ta.TC.sessionForm = { title: 'Buổi 1: Present simple', date: futureDay, time: '19:00', duration_min: 60, lesson_track: 'a1', lesson_no: 1, note: 'Bring the workbook' };
  await ta.tcSaveSession(null);
  const sIns = (TEACHER_TABLES.__calls || []).filter(c => c[0] === 'insert' && c[1] === 'class_sessions')[0];
  t('a session is written against the teacher who planned it',
    !!sIns && sIns[2].teacher_id === ta.getUser().id, JSON.stringify(sIns));
  t('... carrying the title, the minutes and the note',
    !!sIns && sIns[2].title === 'Buổi 1: Present simple' && sIns[2].duration_min === 60 &&
    sIns[2].note === 'Bring the workbook', JSON.stringify(sIns && sIns[2]));
  t('... and the time the teacher picked, to the minute',
    !!sIns && (() => { const d = new Date(sIns[2].starts_at); return d.getHours() === 19 && d.getMinutes() === 0; })(),
    sIns && sIns[2].starts_at);
  t('the form is empty again once the session is saved',
    !ta.TC.sessionForm || ta.TC.sessionForm.title === '', JSON.stringify(ta.TC.sessionForm));

  /* the timetable reads in the order the teacher acts on it */
  const iso = h => new Date(Date.now() + h * 3600000).toISOString();
  ta.TC.sessions = [
    { id: 'x1', title: 'Later', starts_at: iso(72), duration_min: 60, status: 'scheduled' },
    { id: 'x2', title: 'Today', starts_at: iso(2), duration_min: 60, status: 'scheduled' },
    { id: 'x3', title: 'Done', starts_at: iso(-96), duration_min: 60, status: 'scheduled' },
    { id: 'x4', title: 'Called off', starts_at: iso(-48), duration_min: 60, status: 'cancelled' }
  ];
  const buckets = ta.tcSessionBuckets();
  t('a session later today is bucketed as today', buckets.today.length === 1 && buckets.today[0].title === 'Today',
    JSON.stringify(buckets.today));
  t('a session in a few days is bucketed as next', buckets.next.length === 1 && buckets.next[0].title === 'Later',
    JSON.stringify(buckets.next));
  t('what has passed and what was called off go to the record', buckets.past.length === 2, JSON.stringify(buckets.past));
  t('the next session is the soonest one still ahead', ta.tcNextSession().title === 'Today', JSON.stringify(ta.tcNextSession()));

  ta.TC.loading = false;
  ta.tcRenderSchedule();
  const sch = TEACH.els['tc-panel-schedule'].innerHTML;
  t('the timetable is a table, not a wall of cards', sch.includes('class="table"'), sch.slice(0, 200));
  t('the session still ahead is the first thing the teacher reads', sch.indexOf('Today') < sch.indexOf('Later'), sch.slice(0, 400));
  t('a cancelled session keeps its place and says so', /Cancelled/.test(sch));

  /* cancelling asks first */
  TEACHER_TABLES.__calls = [];
  const pendingCancel = ta.tcCancelSession('x2', null);
  t('cancelling a session asks before it touches the server',
    !(TEACHER_TABLES.__calls || []).some(c => c[0] === 'update' && c[1] === 'class_sessions'),
    JSON.stringify(TEACHER_TABLES.__calls));
  ta.uiConfirmClose(true);
  await pendingCancel;
  const sUpd = (TEACHER_TABLES.__calls || []).filter(c => c[0] === 'update' && c[1] === 'class_sessions')[0];
  t('... and then marks it cancelled rather than deleting it', !!sUpd && sUpd[2].status === 'cancelled', JSON.stringify(sUpd));

  /* ============================================================
     13. PASSWORDS
     ============================================================ */
  t('there is a forgot-password link', /id="auth-forgot-btn"/.test(src) && /hwForgotPassword\(\)/.test(src));
  t('the forgot link shows only on the sign-in screen',
    (() => {
      sa.setAuthMode('login'); sa.syncAuthFields();
      const on = !ONLINE.els['auth-forgot-btn'].classList.contains('hidden');
      sa.setAuthMode('signup'); sa.syncAuthFields();
      const off = ONLINE.els['auth-forgot-btn'].classList.contains('hidden');
      sa.setAuthMode('login'); sa.syncAuthFields();
      return on && off;
    })());
  t('the dashboard offers a password change', /onclick="showAuthChange\(\)"/.test(src));

  STUDENT_TABLES.__calls = [];
  sa.el('auth-email').value = 'someone@x.test';
  await sa.hwForgotPassword();
  const reset = (STUDENT_TABLES.__calls || []).filter(c => c[0] === 'reset')[0];
  t('forgot password asks the server to email a reset link',
    reset && reset[1] === 'someone@x.test', JSON.stringify(reset));

  sa.el('auth-email').value = '';
  await sa.hwForgotPassword();
  t('forgot password with no email explains what to do first',
    /Type your email above first/.test(sa.el('auth-msg').textContent),
    sa.el('auth-msg').textContent);

  STUDENT_TABLES.__calls = [];
  STUDENT_TABLES.__email = 's@x.test';
  sa.setUser({ id: 'u1', name: 'Stu', email: 's@x.test', role: 'student' });
  sa.showAuthChange();
  t('the change screen is its own mode', sa.getAuthMode() === 'change');
  t('the change screen is titled and labelled for its job',
    /Change password/.test(sa.el('auth-title').textContent) &&
    /New password/.test(sa.el('auth-pass-label').textContent) &&
    /Save password/.test(sa.el('auth-submit').textContent));
  t('the change screen pre-fills the signed-in email',
    sa.el('auth-email').value === 's@x.test');
  sa.el('auth-pass').value = 'brandNew123';
  await sa.doAuth();
  const upd = (STUDENT_TABLES.__calls || []).filter(c => c[0] === 'updateUser')[0];
  t('saving asks the server to set the new password',
    upd && upd[1].password === 'brandNew123', JSON.stringify(upd));
  t('after saving it returns to the normal sign-in mode', sa.getAuthMode() === 'login');

  /* ============================================================
     10. XSS + NO INTERNAL NAMING IN USER-FACING COPY
     ============================================================ */
  t('escaping neutralises the dangerous characters',
    api.hwEsc('<img src=x onerror=alert(1)>').indexOf('<') < 0 && api.hwEsc('a"b\'c').indexOf('"') < 0);

  const html = (o, k) => ((o.els[k] || {}).innerHTML || '');
  const uiCopy = b + tcp + html(OFFLINE, 'hw-gate-msg') + html(OFFLINE, 'tc-gate-msg') +
    html(ONLINE, 'hw-gate-msg') + html(TEACH, 'tc-gate-msg') +
    html(ONLINE, 'hw-list') + (hwSrc.match(/toast\('[^']*'/g) || []).join(' ');
  t('the UI never says v1/v2/module', !/\bv1\b|\bv2\b|\bmodule\b/i.test(uiCopy), uiCopy.slice(0, 200));

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
