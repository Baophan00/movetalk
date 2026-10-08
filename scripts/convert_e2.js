const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Extract E2_LESSONS
const e2Start = html.indexOf('const E2_LESSONS=');
const e2End = html.indexOf('};', e2Start) + 2;
let e2Js = html.slice(e2Start, e2End);

// Fix unescaped single quotes in strings
// First, escape any already-escaped quotes to avoid double-escaping
e2Js = e2Js.replace(/\\'/g, '__ESCAPED_QUOTE__');

// Now escape unescaped quotes in contractions
const contractions = [
  'can\'t', 'don\'t', 'doesn\'t', 'didn\'t', 'isn\'t', 'aren\'t',
  'won\'t', 'wouldn\'t', 'couldn\'t', 'shouldn\'t', 'it\'s', 'that\'s',
  'there\'s', 'what\'s', 'let\'s', 'we\'re', 'they\'re', 'you\'re',
  'I\'m', 'I\'ve', 'I\'ll', 'I\'d', 'we\'ve', 'we\'ll', 'we\'d',
  'they\'ve', 'they\'ll', 'they\'d', 'you\'ve', 'you\'ll', 'you\'d',
  'he\'s', 'she\'s', 'he\'ll', 'she\'ll', 'he\'d', 'she\'d'
];

for (const c of contractions) {
  const escaped = c.replace(/'/g, "\\'");
  e2Js = e2Js.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), escaped);
}

// Restore already-escaped quotes
e2Js = e2Js.replace(/__ESCAPED_QUOTE__/g, "\\'");

// Evaluate to get object - strip trailing ; before wrapping in parens
const e2ObjStr = e2Js.replace('const E2_LESSONS=', '').replace(/;\s*$/, '');
const E2_LESSONS = eval('(' + e2ObjStr + ')');

// Convert to new format
function convertLesson(lesson) {
  const parts = {};
  if (lesson.vocab) parts.vocab = [{t:'h',text:'Vocabulary'},{t:'words',items:lesson.vocab}];
  if (lesson.grammar) parts.grammar = [{t:'h',text:'Grammar'},{t:'table',head:['Pattern','Example'],rows:lesson.grammar.map(g=>[g.key,g.ex])}];
  if (lesson.reading) parts.reading = [{t:'h',text:'Reading'},{t:'p',text:lesson.reading.text},{t:'note',text:lesson.reading.q}];
  if (lesson.conversations) parts.conversations = lesson.conversations.map(c=>({t:'dialog',title:c.title,lines:c.lines}));
  if (lesson.listening) parts.listening = [{t:'h',text:'Listening'},{t:'say',items:lesson.listening}];
  if (lesson.exercises) parts.exercises = [{t:'h',text:'Exercises'},{t:'quiz',items:lesson.exercises}];
  if (lesson.speaking) parts.speaking = [{t:'h',text:'Speaking'},{t:'say',items:lesson.speaking}];
  if (lesson.roleplay) parts.roleplay = lesson.roleplay.map(r=>({t:'steps',title:r.title,steps:r.steps}));
  if (lesson.finalTask) parts.finalTask = [{t:'label',text:'Final Task'},{t:'p',text:lesson.finalTask}];
  if (lesson.homePractice) parts.homePractice = [{t:'label',text:'Home Practice'},{t:'p',text:lesson.homePractice}];
  if (lesson.reference) parts.reference = [{t:'h',text:'Reference'},{t:'list',items:lesson.reference}];
  return {title:lesson.title,vi:lesson.vi,goal:lesson.goal,parts};
}

const converted = {};
for (const [k,v] of Object.entries(E2_LESSONS)) converted[k] = convertLesson(v);

const newE2Js = 'const E2_LESSONS=' + JSON.stringify(converted) + ';';
html = html.slice(0, e2Start) + newE2Js + html.slice(e2End);

fs.writeFileSync('index.html', html);
console.log('Converted ' + Object.keys(converted).length + ' E2 lessons');
console.log('New E2_LESSONS length: ' + newE2Js.length + ' chars');
