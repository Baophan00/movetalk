// A1 conversations from MOVE Activate 1 PPTX: 3 dialogs per lesson, Play all only.
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

const expectTitle = {
  1: ['New friend · at a café', 'Morning together', 'Work update with the boss'],
  2: ['New coworker', 'Family photo', 'Busy team'],
  3: ['New client · introduce a colleague', 'Foreign partner · a close friend', 'Team update · recommend someone'],
};

for (let n = 1; n <= 7; n++) {
  const L = api.LESSON_DATA[String(n)];
  t('L' + n + ' exists', !!L);
  const dialogs = ((L && L.parts && L.parts.conversations) || []).filter(b => b.t === 'dialog');
  t('L' + n + ' has 3 conversations', dialogs.length === 3, 'got ' + dialogs.length);
  for (const d of dialogs) {
    t(n + '/' + d.title + ': lines', (d.lines || []).length >= 4);
    const speakers = new Set((d.lines || []).map(l => l.speaker));
    t(n + '/' + d.title + ': two speakers', speakers.size === 2, [...speakers].join('/'));
    t(n + '/' + d.title + ': checks', Array.isArray(d.check) && d.check.length >= 2);
    t(n + '/' + d.title + ': answers', typeof d.answers === 'string' && d.answers.length > 8);
  }
  if (expectTitle[n]) {
    for (const title of expectTitle[n]) {
      t('L' + n + ' has ' + title, dialogs.some(d => d.title === title));
    }
  }
  const html = api.trackBody('conversations', L, 'a1');
  t('L' + n + ' Play all x3', (html.match(/Play all/g) || []).length === 3);
  t('L' + n + ' no Nghe bản gốc', !html.includes('Nghe bản gốc'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
