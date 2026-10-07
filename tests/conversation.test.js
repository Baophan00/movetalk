// E2 lesson 3 must carry both reference recordings from the teacher,
// with text matching what is actually spoken (12 alternating turns each).
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
  js + '\nreturn {LESSON_DATA,trackBody};');
const api = fn(stub, { innerWidth: 1400, scrollTo() {} }, () => {}, class { observe() {} },
  { getItem: () => null, setItem() {} }, { hash: '' }, () => 0, () => {}, () => {});

const L3 = api.LESSON_DATA['3'];
t('lesson 3 exists', !!L3);

const dialogs = (L3.parts.conversations || []).filter(b => b.t === 'dialog');
t('lesson 3 has 2 recorded conversations', dialogs.length === 2, 'got ' + dialogs.length);

const weekend = dialogs.find(d => d.title === 'A weekend plan');
const shared = dialogs.find(d => d.title === 'A shared apartment');
t('A weekend plan present', !!weekend);
t('A shared apartment present', !!shared);

for (const [name, d] of [['weekend plan', weekend], ['shared apartment', shared]]) {
  if (!d) continue;
  t(name + ': has audio path', typeof d.audio === 'string' && d.audio.length > 0, String(d.audio));
  t(name + ': audio file exists', !!d.audio && fs.existsSync(path.join(ROOT, d.audio)), d.audio);
  t(name + ': audio is mp3 under audio/ref-audio', !!d.audio && d.audio.startsWith('audio/ref-audio/') && d.audio.endsWith('.mp3'), d.audio);
  t(name + ': 12 lines', (d.lines || []).length === 12, 'got ' + (d.lines || []).length);
  const speakers = new Set((d.lines || []).map(l => l.speaker));
  t(name + ': two speakers', speakers.size === 2, [...speakers].join('/'));
  const alt = (d.lines || []).every((l, i, a) => i === 0 || l.speaker !== a[i - 1].speaker);
  t(name + ': speakers strictly alternate', alt);
  t(name + ': every line has text', (d.lines || []).every(l => l.text && l.text.trim().length > 3));
  t(name + ': has a key question', typeof d.question === 'string' && d.question.length > 10);
  t(name + ': has comprehension checks', Array.isArray(d.check) && d.check.length >= 5, 'n=' + (d.check || []).length);
  t(name + ': has answers', typeof d.answers === 'string' && d.answers.length > 20);
}

const html = api.trackBody('conversations', L3, 'e2');
t('panel renders both cards', (html.match(/e2-conv-card/g) || []).length === 2, 'cards=' + (html.match(/e2-conv-card/g) || []).length);
t('panel has 2 Nghe bản gốc buttons', (html.match(/Nghe bản gốc/g) || []).length === 2);
t('panel wires weekend-plan', html.includes("playOriginal('audio/ref-audio/weekend-plan.mp3'"));
t('panel wires shared-apartment', html.includes("playOriginal('audio/ref-audio/shared-apartment.mp3'"));
t('panel has Play all buttons', (html.match(/Play all/g) || []).length === 2);
t('panel reveals answers', (html.match(/Xem đáp án/g) || []).length === 2);
t('no undefined leaked into panel', !html.includes('undefined'));
t('playOriginal defined', js.includes('function playOriginal'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
