// Verifies the block-schema lesson data renders completely.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = src.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

let pass = 0, fail = 0;
const t = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL | ' + n + (x ? ' | ' + x : '')); } };

const stub = {
  getElementById: () => ({ innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, textContent: '', dataset: {}, addEventListener() {}, querySelectorAll: () => [] }),
  querySelectorAll: () => [], querySelector: () => null,
  createElement: () => ({ classList: { add() {}, remove() {} }, style: {}, appendChild() {} }),
  documentElement: { dataset: {} },
};
const fn = new Function('document', 'window', 'addEventListener', 'IntersectionObserver',
  'localStorage', 'location', 'setInterval', 'clearInterval', 'setTimeout',
  js + '\nreturn {LESSON_DATA,TRACKS,TRACK_PARTS,trackBody,renderBlock};');
const api = fn(stub, { innerWidth: 1400, scrollTo() {} }, () => {}, class { observe() {} },
  { getItem: () => null, setItem() {} }, { hash: '' }, () => 0, () => {}, () => {});

// ---- data shape
t('LESSON_DATA present', !!api.LESSON_DATA);
const lessons = api.LESSON_DATA || {};
t('10 lessons in A1', Object.keys(lessons).length === 10, 'got ' + Object.keys(lessons).length);

const EXPECT = {
  1: { title: 'Reconnect the System' },
  2: { title: 'Expand the Subject' },
  3: { title: 'Build the Message' },
  4: { title: 'Build the Noun Phrase' },
  5: { title: 'Point, Ask & Connect' },
  6: { title: 'What Is Around You?' },
  7: { title: 'Confusing Quantifiers & Determiners' },
  8: { title: 'Wh- Questions' },
  9: { title: 'Tenses & Time' },
  10: { title: 'Adverbs & Linking Verbs' },
};

for (const num of Object.keys(lessons)) {
  const L = lessons[num];
  t(`L${num} exists`, !!L);
  if (!L) continue;
  t(`L${num} title`, L.title === EXPECT[num].title, L.title);
  t(`L${num} has goal`, typeof L.goal === 'string' && L.goal.length > 20);
  t(`L${num} has vi`, typeof L.vi === 'string' && L.vi.length > 2);
  t(`L${num} has today chips`, Array.isArray(L.today) && L.today.length >= 3, 'n=' + (L.today || []).length);
  t(`L${num} has all 10 parts`, api.TRACK_PARTS.every(p => Array.isArray(L.parts[p.id])), Object.keys(L.parts).join(','));
  for (const p of api.TRACK_PARTS) {
    const n = (L.parts[p.id] || []).length;
    t(`L${num}.${p.id} has blocks`, n > 0, `got ${n}`);
  }
}

// ---- every block renders non-empty, no undefined leaks
const BAD_TYPES = new Set();
for (const num of Object.keys(lessons)) {
  for (const p of api.TRACK_PARTS) {
    const html = api.trackBody(p.id, lessons[num], 'a1');
    t(`L${num}.${p.id} renders`, html.length > 40, 'len=' + html.length);
    t(`L${num}.${p.id} no undefined`, !html.includes('undefined'));
    for (const b of lessons[num].parts[p.id]) {
      const one = api.renderBlock(b,'a1',p.id);
      if (!one && b.t !== 'h') BAD_TYPES.add(b.t);
    }
  }
}
t('no unrendered block types', BAD_TYPES.size === 0, [...BAD_TYPES].join(','));

// ---- audio buttons present where expected
const l3conv = api.trackBody('conversations', lessons['3'], 'a1');
t('L3 conversations has Play all', l3conv.includes('playBlockDialog'));
t('L3 conversations has answers reveal', l3conv.includes('Xem đáp án'));

// ---- quizzes are interactive
const l1ex = api.trackBody('exercises', lessons['1'], 'a1');
t('L1 exercises renders quiz options', l1ex.includes('blockAnswer'));
t('L1 exercises option count', (l1ex.match(/blk-quiz-opt/g) || []).length >= 30, 'opts=' + (l1ex.match(/blk-quiz-opt/g) || []).length);

// ---- TRACKS.e2 now points at the rich data
t('TRACKS.a1.lessons is LESSON_DATA', api.TRACKS.a1.lessons === api.LESSON_DATA);
t('playBlockDialog resolves a dialog', js.includes('blocks.filter(b=>b.t===\'dialog\')'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
