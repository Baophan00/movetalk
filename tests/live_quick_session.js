// Part 1 check: quick sessions (3/5 min) and one-tap continue.
//   node tests/live_quick_session.js <url>
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9962, URL_=process.argv[2]||'http://127.0.0.1:8099/';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-quick','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let PASS=0,FAIL=0;const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''));c?PASS++:FAIL++};
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const bad=[];
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')bad.push('EXC '+(((o.params.exceptionDetails.exception||{}).description)||o.params.exceptionDetails.text).split('\n')[0].slice(0,160));});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  fs.mkdirSync('/tmp/ev-quick',{recursive:true});
  await cmd('Page.enable');await cmd('Runtime.enable');
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);

  // 1. dashboard buttons
  t('dashboard shows the quick card', (await ev("!!document.querySelector('.qstart')"))===true);
  const btns=await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.qstart .btn')).map(b=>b.textContent.trim()))`);
  t('it offers 3-minute and 5-minute sessions', /3 phút/.test(btns)&&/5 phút/.test(btns), btns);
  t('no resume banner before a session starts', (await ev("!document.querySelector('.qresume')"))===true);
  await shot('dash');

  // 2. start a 3-minute session
  await ev("quickStart(3)"); await sleep(800);
  t('3-minute session holds 8 cards', (await ev("QUICK.total"))===8, 'total='+await ev("QUICK.total"));
  t('the first card is a word with a reveal button',
    (await ev("(document.querySelector('h1.w')||{}).textContent||''")).length>0 &&
    (await ev("!!document.querySelector('.row .btn.p')"))===true);
  await shot('card-front');

  // 3. reveal + mark remembered
  await ev("QUICK_FLIP=true;drawQuick()"); await sleep(400);
  t('revealing shows the Vietnamese meaning', (await ev("(document.querySelector('.mn')||{}).textContent||''")).length>0);
  await shot('card-back');
  await ev("quickMark(1)"); await sleep(500);
  t('marking remembered advances to card 2', (await ev("QUICK.idx"))===1, 'idx='+await ev("QUICK.idx"));
  t('the in-progress session is saved', (await ev("!!JSON.parse(localStorage.getItem('ev_quick')||'null')"))===true);
  t('a due date is written for the answered word', Object.keys(JSON.parse((await ev("localStorage.getItem('ev_srs')"))||'{}')).length===1,
    await ev("localStorage.getItem('ev_srs')"));

  // 4. reload -> resume banner keeps the position
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()}); await sleep(5000);
  const banner=await ev(`(()=>{const b=document.querySelector('.qresume');return b?b.textContent.replace(/\\s+/g,' ').trim():''})()`);
  t('after a reload the dashboard offers one-tap continue', banner.indexOf('Tiếp tục phiên học dở')>=0, banner);
  t('the banner reports the real position', banner.indexOf('1/8')>=0, banner);
  await shot('resume-banner');

  // 5. resume lands on the same card
  await ev("document.querySelector('.qresume').click()"); await sleep(800);
  t('resuming reopens the session at the saved card', (await ev("QUICK.idx"))===1 && (await ev("QUICK_OPEN"))===true,
    'idx='+await ev("QUICK.idx"));

  // 6. finish the session
  for(let i=0;i<10;i++){
    const done=await ev("!!(QUICK&&QUICK.done)");
    if(done) break;
    await ev("QUICK_FLIP=true;drawQuick();quickMark("+(i%3===0?0:1)+")");
    await sleep(350);
  }
  const finished=await ev("!!(QUICK&&QUICK.done)");
  t('the session reaches its summary', finished===true);
  const doneTxt=await ev(`(document.querySelector('.qdone')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim().slice(0,140)`);
  t('the summary says how long it took', /Xong trong \d+ phút/.test(doneTxt), doneTxt);
  t('the summary counts the cards and the mix', /thẻ đã học/.test(doneTxt)&&/từ mới/.test(doneTxt)&&/từ ôn lại/.test(doneTxt), doneTxt);
  t('a finished session leaves no resume banner behind',
    (await ev("localStorage.getItem('ev_quick')"))===null);
  await shot('done');

  // 7. 5-minute session size
  await ev("quickDoneClose()"); await sleep(600);
  await ev("quickStart(5)"); await sleep(600);
  t('5-minute session holds 12 cards', (await ev("QUICK.total"))===12, 'total='+await ev("QUICK.total"));
  t('no console errors during the whole run', bad.length===0, bad.slice(0,2).join(' | '));

  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
