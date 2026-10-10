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

const RETURNS = 'return {TRACKS,TRACK_PARTS,LESSON_DATA,AUDIO_MAP,go,trackGo,trackBody,renderTrack,' +
  'renderDashboard,renderHomework,renderTeacher,hwStatus,hwGate,hwOpenLesson,hwEsc,hwDate,' +
  'HW,TC,HW_ON,HB,tcBlankBuilder,tcRenderAssignments,tcBuilderSet,tcBuilderKind,' +
  'tcSaveAssignment,tcGrade,hwLoadSession,hwLoad,hwOpen,hwRenderList,hwSubmit,hwJoinClass,' +
  'tcLoad,tcTab,tcAllStudents,' +
  'setUser:(u)=>{USER=u},getUser:()=>USER};';

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
      insert() {
        return {
          select() { return { single() { return Promise.resolve({ data: { id: 'new-' + table }, error: null }); } }; },
          then(res) { return Promise.resolve({ data: null, error: null }).then(res); }
        };
      },
      update() { return { eq() { return Promise.resolve({ data: null, error: null }); } }; },
      upsert() { return Promise.resolve({ data: null, error: null }); },
      then(res) { return Promise.resolve({ data: tables[table] || [], error: null }).then(res); }
    };
    return api;
  }
  const client = {
    auth: {
      getSession() { return Promise.resolve({ data: { session: { user: { id: tables.__uid, email: tables.__email } } } }); },
      signOut() { return Promise.resolve({ error: null }); },
      signUp() { return Promise.resolve({ data: { session: null }, error: null }); },
      signInWithPassword() { return Promise.resolve({ data: {}, error: null }); }
    },
    from,
    rpc(name) {
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
t('Teaching nav item starts hidden', /id="nav-teacher-item"[^>]*class="nav-item hidden"|class="nav-item hidden"[^>]*id="nav-teacher-item"/.test(src));
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
  'tcSaveAssignment', 'tcGrade', 'hwSubmit', 'hwJoinClass', 'hwLoadSession', 'tcLoad']
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
t('joining a class goes through the server RPC', /rpc\('join_class_by_code'/.test(hwSrc));
t('the roster comes from the server RPC', /rpc\('class_roster'/.test(hwSrc));
t('the client never writes a score itself',
  !/\.update\(\s*\{[^}]*score/.test(hwSrc) && !/score\s*:\s*[0-9]/.test(hwSrc));
t('the client never writes is_correct itself', !/is_correct\s*:/.test(hwSrc));

/* ============================================================
   5. AN ASSIGNMENT REFERENCES A LESSON, IT DOES NOT COPY IT
   ============================================================ */
t('the payload carries a stable lesson reference', /lesson_track:/.test(hwSrc) && /lesson_no:/.test(hwSrc));
t('the payload never carries lesson content',
  !/parts\s*:/.test(hwSrc) && !/LESSON_DATA/.test(hwSrc) && !/flashcard/.test(hwSrc));
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
  t('the list shows it is an existing-lesson reference', /Lesson · A1 3/.test(list));
  t('the list shows a custom exercise', list.includes('Custom drill'));
  t('the list shows the submitted status', /Graded/.test(list));
  t('the list shows a server-computed score', /6\/6/.test(list));
  t('the list shows overdue for the untouched past-due one', /Overdue/.test(list));
  t('the signed-in student sees the homework body', ONLINE.els['hw-body'].classList.contains('hidden') === false);
  t('the join-a-class card is offered to a student', ONLINE.els['hw-join'].classList.contains('hidden') === false);
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
    classes: [{ id: 'c1', name: 'Class One', join_code: 'MT-1111', created_at: 'x' }],
    assignments: [],
    __rpc: { class_roster: [{ student_id: 's1', full_name: 'Ann', email: 'a@x.test' }] }
  };
  const TEACH = makeInstance({ url: 'https://example.supabase.co', key: 'anon-key', supabase: fakeSupabase(TEACHER_TABLES) });
  const ta = TEACH.api;
  await ta.hwLoadSession();
  t('the teacher profile is loaded with the teacher role', ta.getUser().role === 'teacher');
  await ta.tcLoad();
  ta.go('teacher');
  const tcp = TEACH.els['tc-panel-classes'].innerHTML;
  t('the teacher workspace opens', TEACH.els['tc-body'].classList.contains('hidden') === false);
  t('the class is listed', tcp.includes('Class One'));
  t('the join code is shown so students can enrol', tcp.includes('MT-1111'));
  t('the roster is shown', tcp.includes('Ann'));
  t('a teacher can create a class', /Create class/.test(tcp));
  t('a teacher can assign work straight from a class', /Assign work/.test(tcp));

  ta.tcTab('assignments');
  ta.TC.builder = ta.tcBlankBuilder();
  ta.TC.builder.title = 'Homework: Build the Message';
  ta.TC.builder.track = 'a1';
  ta.TC.builder.no = 3;
  ta.TC.classes = [{ id: 'c1', name: 'Class One', join_code: 'MT-1111' }];
  ta.TC.rosters = { c1: [{ student_id: 's1', full_name: 'Ann', email: 'a@x.test' }] };
  ta.TC.assignments = [];
  ta.tcRenderAssignments();
  const b = TEACH.els['tc-panel-assignments'].innerHTML;
  t('the builder offers every existing track',
    ['f1', 'f2', 'a1', 'a2', 'e1', 'e2'].every(x => b.includes('value="' + x + '"')));
  t('the builder shows the real lesson title from existing content', b.includes('Build the Message'));
  t('the builder says the lesson is only referenced', /stays exactly as it is/.test(b));
  t('the builder lists the class as a recipient', b.includes('Class One'));
  t('the builder offers individual students too', b.includes('Ann'));
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
    TEACH.captured.toasts.some(x => /at least one class or student/.test(x)), TEACH.captured.toasts.join(' | '));

  TEACH.captured.toasts.length = 0;
  ta.TC.builder = ta.tcBlankBuilder();
  ta.tcSaveAssignment('published');
  t('publishing without a title is refused',
    TEACH.captured.toasts.some(x => /title/i.test(x)), TEACH.captured.toasts.join(' | '));

  TEACH.captured.toasts.length = 0;
  ta.TC.builder = ta.tcBlankBuilder(); ta.TC.builder.title = 'Custom';
  ta.tcBuilderKind('custom'); ta.TC.builder.classIds = ['c1'];
  ta.tcSaveAssignment('published');
  t('publishing a custom assignment with no questions is refused',
    TEACH.captured.toasts.some(x => /at least one question/i.test(x)), TEACH.captured.toasts.join(' | '));

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
