// Audio integration checks: manifest wiring, clip files, playback plumbing.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = src.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

let pass = 0, fail = 0;
const t = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL | ' + n + (x ? ' | ' + x : '')); } };

// 1. manifest block present and parseable
t('AUDIO_MAP block present', js.includes('/* AUDIO_MAP:BEGIN */'));
const m = js.match(/const AUDIO_MAP=(\{[\s\S]*?\});\s*\/\* AUDIO_MAP:END \*\//);
t('AUDIO_MAP parses as JSON', !!m);
let map = {};
if (m) { try { map = JSON.parse(m[1]); } catch (e) { t('AUDIO_MAP valid JSON', false, e.message); } }
const keys = Object.keys(map);
t('AUDIO_MAP has entries', keys.length > 0, 'entries=' + keys.length);

// 2. every mapped path exists on disk
const missing = keys.filter(k => !fs.existsSync(path.join(ROOT, map[k])));
t('every mapped clip exists on disk', missing.length === 0, missing.slice(0, 3).join(', '));

// 3. paths point at mp3 under audio/clips
const badPath = keys.filter(k => !map[k].startsWith('audio/clips/') || !map[k].endsWith('.mp3'));
t('all paths are audio/clips/*.mp3', badPath.length === 0, badPath.slice(0, 3).join(', '));

// 4. playback plumbing
t('speak() prefers AUDIO_MAP', js.includes("AUDIO_MAP[text]") && js.includes('new Audio(src)'));
t('speak() has browser fallback', js.includes('function fallbackSpeak'));
t('playConversation defined', js.includes('function playConversation'));
t('playNextLine chains clips', js.includes('onended') && js.includes('playNextLine'));
t('stopConversation clears player', js.includes('function stopConversation'));
t('conv cards expose Play all', js.includes('playConversation(') && js.includes('Play all'));

// 5. conversation-line audio coverage is incremental: clips are rendered in
//    batches and speak() falls back to the browser voice for anything missing.
const fn = new Function('document', 'window', 'addEventListener', 'IntersectionObserver',
  'localStorage', 'location', 'setInterval', 'clearInterval', 'setTimeout', js + '\nreturn TRACKS;');
const stub = {
  getElementById: () => ({ innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, textContent: '', dataset: {}, addEventListener() {}, querySelectorAll: () => [] }),
  querySelectorAll: () => [], querySelector: () => null,
  createElement: () => ({ classList: { add() {}, remove() {} }, style: {}, appendChild() {} }),
  documentElement: { dataset: {} },
};
const TRACKS = fn(stub, { innerWidth: 1400, scrollTo() {} }, () => {}, class { observe() {} }, { getItem: () => null, setItem() {} }, { hash: '' }, () => 0, () => {}, () => {});

let convLines = 0, covered = 0;
const LD = fn(stub, { innerWidth: 1400, scrollTo() {} }, () => {}, class { observe() {} }, { getItem: () => null, setItem() {} }, { hash: '' }, () => 0, () => {}, () => {}).LESSON_DATA || {};
for (const num of Object.keys(LD)) {
  for (const b of ((LD[num].parts || {}).conversations || [])) {
    if (b.t !== 'dialog') continue;
    for (const l of (b.lines || [])) { convLines++; if (map[l.text]) covered++; }
  }
}
console.log(`INFO | cloned-voice coverage: ${covered}/${convLines} conversation lines`);
t('manifest covers at least one conversation line', covered > 0, `${covered}/${convLines}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
