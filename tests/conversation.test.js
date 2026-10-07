// Verifies the two reference conversations are wired into E2 lesson 3.
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
  'localStorage', 'location', 'setInterval', 'clearInterval', 'setTimeout', js + '\nreturn {TRACKS,trackBody};');
const api = fn(stub, { innerWidth: 1400, scrollTo() {} }, () => {}, class { observe() {} },
  { getItem: () => null, setItem() {} }, { hash: '' }, () => 0, () => {}, () => {});

const L3 = api.TRACKS.e2.lessons[3];
t('lesson 3 exists', !!L3);

const convs = L3.conversations || [];
t('lesson 3 has 2 conversations', convs.length === 2, 'got ' + convs.length);

const weekend = convs.find(c => c.title === 'A weekend plan');
const shared = convs.find(c => c.title === 'A shared apartment');
t('A weekend plan present', !!weekend);
t('A shared apartment present', !!shared);

// Both carry a reference recording path that exists on disk
for (const [name, c] of [['weekend plan', weekend], ['shared apartment', shared]]) {
  if (!c) continue;
  t(name + ': has audio path', typeof c.audio === 'string' && c.audio.length > 0, String(c.audio));
  t(name + ': audio file exists', !!c.audio && fs.existsSync(path.join(ROOT, c.audio)), c.audio);
  t(name + ': audio is mp3 under audio/ref-audio', !!c.audio && c.audio.startsWith('audio/ref-audio/') && c.audio.endsWith('.mp3'), c.audio);
  t(name + ': 12 lines', (c.lines || []).length === 12, 'got ' + (c.lines || []).length);
  const speakers = new Set((c.lines || []).map(l => l.speaker));
  t(name + ': two speakers alternate', speakers.size === 2, [...speakers].join('/'));
  const alt = (c.lines || []).every((l, i, a) => i === 0 || l.speaker !== a[i - 1].speaker);
  t(name + ': speakers strictly alternate', alt);
  t(name + ': every line has text', (c.lines || []).every(l => l.text && l.text.trim().length > 3));
}

// The rendered conversations panel exposes the original-audio button
const html = api.trackBody('conversations', L3, 'e2');
t('panel renders both cards', (html.match(/e2-conv-card/g) || []).length === 2, 'cards=' + (html.match(/e2-conv-card/g) || []).length);
t('panel has Nghe bản gốc buttons', (html.match(/Nghe bản gốc/g) || []).length === 2, 'btns=' + (html.match(/Nghe bản gốc/g) || []).length);
t('panel wires playOriginal to weekend-plan', html.includes('playOriginal(\'audio/ref-audio/weekend-plan.mp3\''));
t('panel wires playOriginal to shared-apartment', html.includes('playOriginal(\'audio/ref-audio/shared-apartment.mp3\''));
t('panel has Play all buttons', (html.match(/Play all/g) || []).length === 2);
t('no undefined leaked into panel', !html.includes('undefined'));
t('playOriginal defined in source', js.includes('function playOriginal'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
