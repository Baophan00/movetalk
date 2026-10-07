// Live-browser check: open every part of every lesson and assert it renders.
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ROOT = path.join(__dirname, '..');
const URL = process.env.MT_URL || 'http://127.0.0.1:8080/';
const CDP = process.env.MT_CDP || 'http://127.0.0.1:9333';

let pass = 0, fail = 0;
const t = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL | ' + n + (x ? ' | ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await (await fetch(CDP + '/json/list')).json();
  let page = list.find(p => p.type === 'page');
  if (!page) {
    const ver = await (await fetch(CDP + '/json/version')).json();
    page = { webSocketDebuggerUrl: ver.webSocketDebuggerUrl };
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

  let id = 0;
  const pending = new Map();
  ws.on('message', m => {
    const d = JSON.parse(m);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  });
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: URL });
  await sleep(1800);

  // collect console errors
  const errs = [];
  ws.on('message', m => {
    const d = JSON.parse(m);
    if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.text);
  });

  const lessons = await evalJs('Object.keys(LESSON_DATA)');
  t('LESSON_DATA loaded in browser', Array.isArray(lessons) && lessons.length === 3, JSON.stringify(lessons));

  const partIds = await evalJs('TRACK_PARTS.map(p=>p.id)');
  t('10 part ids', partIds.length === 10);

  let rendered = 0, total = 0;
  for (const num of lessons) {
    await evalJs(`go('e2'); trackGo('e2',${num});`);
    await sleep(200);
    for (const pid of partIds) {
      await evalJs(`trackPart('e2','${pid}')`);
      await sleep(90);
      const len = await evalJs(`(document.getElementById('e2-body')||{innerHTML:''}).innerHTML.length`);
      total++;
      if (len > 40) rendered++;
      else console.log(`FAIL | L${num}.${pid} empty | len=${len}`);
      const undef = await evalJs(`(document.getElementById('e2-body')||{innerHTML:''}).innerHTML.includes('undefined')`);
      if (undef) { fail++; console.log(`FAIL | L${num}.${pid} has undefined`); }
    }
  }
  t(`all ${total} part panels render content`, rendered === total, `${rendered}/${total}`);

  // audio buttons wired
  await evalJs(`go('e2'); trackGo('e2',3); trackPart('e2','conversations')`);
  await sleep(250);
  const orig = await evalJs(`document.querySelectorAll('#e2-body .e2-say.primary').length`);
  t('L3 conversations has 2 original-audio buttons', orig === 2, 'got ' + orig);
  const playAll = await evalJs(`[...document.querySelectorAll('#e2-body button')].filter(b=>b.textContent.includes('Play all')).length`);
  t('L3 conversations has 2 Play all buttons', playAll === 2, 'got ' + playAll);

  // clicking a quiz option marks it
  await evalJs(`go('e2'); trackGo('e2',1); trackPart('e2','exercises')`);
  await sleep(250);
  await evalJs(`document.querySelector('#e2-body .blk-quiz-opt').click()`);
  await sleep(150);
  const marked = await evalJs(`document.querySelectorAll('#e2-body .blk-quiz-opt.ok, #e2-body .blk-quiz-opt.no').length`);
  t('quiz option responds to click', marked >= 1, 'marked=' + marked);

  // the original recording actually loads
  await evalJs(`go('e2'); trackGo('e2',3); trackPart('e2','conversations')`);
  await sleep(250);
  const audioOk = await evalJs(`(async()=>{const r=await fetch('audio/ref-audio/weekend-plan.mp3',{method:'HEAD'});return r.status})()`);
  t('weekend-plan.mp3 serves 200', audioOk === 200, 'status=' + audioOk);
  const audioOk2 = await evalJs(`(async()=>{const r=await fetch('audio/ref-audio/shared-apartment.mp3',{method:'HEAD'});return r.status})()`);
  t('shared-apartment.mp3 serves 200', audioOk2 === 200, 'status=' + audioOk2);

  t('no uncaught exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

  ws.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
