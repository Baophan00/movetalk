// Live check of the rebuilt home page.
const path = require('path');
const WebSocket = require('ws');

const URL = process.env.MT_URL || 'http://127.0.0.1:8080/';
const CDP = process.env.MT_CDP || 'http://127.0.0.1:9333';

let pass = 0, fail = 0;
const t = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL | ' + n + (x ? ' | ' + x : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await (await fetch(CDP + '/json/list')).json();
  const page = list.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

  let id = 0; const pending = new Map(); const errs = [];
  ws.on('message', m => {
    const d = JSON.parse(m);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: URL });
  await sleep(2000);

  t('home view is visible', await evalJs(`!document.getElementById('v-home').classList.contains('hidden')`));

  // hero
  const title = await evalJs(`document.querySelector('.hero-title').innerText`);
  t('hero title updated', title.includes('One system'), title.replace(/\n/g, ' '));
  t('hero flow has 3 steps', (await evalJs(`document.querySelectorAll('.hero-flow-step').length`)) === 3);
  t('hero has 3 orbs', (await evalJs(`document.querySelectorAll('.hero-orb').length`)) === 3);
  t('hero grid overlay present', await evalJs(`!!document.querySelector('.hero-grid')`));

  // sections from the roadmap PDF
  const sectionIds = ['roadmap'];
  for (const s of sectionIds) t(`#${s} section exists`, await evalJs(`!!document.getElementById('${s}')`));
  t('placement quiz renders', (await evalJs(`document.querySelectorAll('#placement-quiz .quiz-q').length`)) === 5);
  t('foundation has 6 stages', (await evalJs(`document.querySelectorAll('.roadmap .tl-item:not(.act)').length`)) === 6);
  t('activation has 5 stages', (await evalJs(`document.querySelectorAll('.roadmap .tl-item.act').length`)) === 5);
  t('flow has 4 cards', (await evalJs(`document.querySelectorAll('.flow-card').length`)) === 4);
  t('spiral has 2 columns', (await evalJs(`document.querySelectorAll('.spiral-col').length`)) === 2);
  t('8 topics', (await evalJs(`document.querySelectorAll('.topic-card').length`)) === 8);
  t('5 missions', (await evalJs(`document.querySelectorAll('.mission-step').length`)) === 5);
  t('3 progress cards', (await evalJs(`document.querySelectorAll('.prog-card').length`)) === 3);
  t('4 scale marks', (await evalJs(`document.querySelectorAll('.scale-item').length`)) === 4);
  t('destination block', await evalJs(`!!document.querySelector('.dest-final')`));

  // method
  t('4 method cards', (await evalJs(`document.querySelectorAll('.method-card').length`)) === 4);
  t('each method card has a colored badge', (await evalJs(`[...document.querySelectorAll('.method-badge')].every(b=>getComputedStyle(b).backgroundImage.includes('gradient'))`)));

  // tinted home blocks
  t('9 tinted home blocks', (await evalJs(`document.querySelectorAll('.home-block').length`)) === 9);

  // placement quiz interaction
  await evalJs(`PLACEMENT_ANSWERS=[0,0,0,0,0];renderPlacementQuiz()`);
  await sleep(300);
  t('quiz shows a result after 5 answers', await evalJs(`!!document.querySelector('.quiz-result')`));
  await evalJs(`PLACEMENT_ANSWERS=[null,null,null,null,null];renderPlacementQuiz()`);
  await sleep(200);
  t('quiz resets to questions', (await evalJs(`document.querySelectorAll('.quiz-q').length`)) === 5);

  // scroll animation classes
  await evalJs(`document.querySelector('.move-method').scrollIntoView()`);
  await sleep(800);
  const vis = await evalJs(`document.querySelectorAll('.scroll-section.visible').length`);
  t('scroll sections became visible', vis > 0, 'visible=' + vis);

  // scrollToId helper
  await evalJs(`scrollToId('roadmap')`);
  await sleep(700);
  const scrolled = await evalJs(`window.scrollY > 200`);
  t('scrollToId scrolls the page', scrolled);

  // lesson content still reachable
  await evalJs(`go('e2'); trackGo('e2',1)`);
  await sleep(300);
  const chips = await evalJs(`document.querySelectorAll('#e2-main .e2-today-chip').length`);
  t('lesson shows today chips', chips >= 3, 'chips=' + chips);
  const parts = await evalJs(`document.querySelectorAll('#e2-main .e2-part').length`);
  t('10 part cards', parts === 10, 'got ' + parts);
  const counts = await evalJs(`document.querySelector('#e2-main .e2-part .e2-part-sub').innerText`);
  t('part card shows block count', /\d+\s*mục/i.test(counts), counts);

  t('no uncaught exceptions', errs.length === 0, errs.slice(0, 2).join(' | '));

  ws.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
