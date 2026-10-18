// The five additions on the public page, checked on the live site.
//   node tests/live_landing_gaps.js [baseUrl] [width]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9943, BASE=process.argv[2]||'https://movetalk.surge.sh', W=Number(process.argv[3]||1440);
const OUT='/tmp/mt-landing';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtgap','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let PASS=0,FAIL=0;
const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''));c?PASS++:FAIL++};
(async()=>{
  let tabs=null;for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+((r.result.exceptionDetails.exception||{}).description||'');
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:1000,deviceScaleFactor:1,mobile:W<600});
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(3500);

  t('the page says a new account waits for approval',
    (await ev("(document.querySelector('.lp-note')||{}).textContent||''")).indexOf('giáo viên duyệt')>=0,
    await ev("((document.querySelector('.lp-note')||{}).textContent||'').slice(0,70)"));

  t('there is a level-check section', (await ev("!!document.getElementById('lp-level')"))===true);
  t('the level check renders five real questions',
    (await ev("document.querySelectorAll('#lp-quiz .quiz-q').length"))===5,
    'n='+await ev("document.querySelectorAll('#lp-quiz .quiz-q').length"));
  t('the level check is in the page navigation', (await ev("[].slice.call(document.querySelectorAll('.lp-links a')).map(a=>a.textContent).join('|')")).indexOf('Trình độ')>=0,
    String(await ev("[].slice.call(document.querySelectorAll('.lp-links a')).map(a=>a.textContent).join('|')")));

  // answer it: five options, then the result must be a real recommendation
  const answered=await ev(`(async()=>{
    for(let q=1;q<=5;q++){
      const opt=document.querySelectorAll('#lp-quiz .quiz-q')[q-1].querySelectorAll('.quiz-opt')[0];
      opt.click(); await new Promise(r=>setTimeout(r,120));
    }
    const res=document.querySelector('#lp-quiz .quiz-result');
    return JSON.stringify({result:!!res,text:(res?res.textContent:'').replace(/\\s+/g,' ').slice(0,120),
      homeMount:document.querySelectorAll('#placement-quiz .quiz-q').length,
      homeResult:document.querySelectorAll('#placement-quiz .quiz-result').length});
  })()`);
  let a={}; try{a=JSON.parse(answered)}catch(e){}
  t('answering all five produces a recommendation', a.result===true, answered);
  t('the app mount already holds the same result (one answer state)', a.homeResult===1, 'home result blocks='+a.homeResult);
  t('the result button asks a visitor to sign in (no silent dead end)',
    (await ev("(document.querySelector('#lp-quiz .quiz-result-btn')||{}).getAttribute('onclick')||''")).indexOf('placementStart')>=0,
    String(await ev("(document.querySelector('#lp-quiz .quiz-result-btn')||{}).getAttribute('onclick')")));

  t('there is a FAQ section with four answers',
    (await ev("document.querySelectorAll('#lp-faq .lp-q').length"))===4,
    'n='+await ev("document.querySelectorAll('#lp-faq .lp-q').length"));
  t('a FAQ question opens and shows its answer',
    (await ev(`(()=>{const d=document.querySelectorAll('#lp-faq .lp-q')[1];d.open=true;return d.querySelector('p').textContent.length>40})()`))===true);
  const mail=await ev("(document.querySelector('#lp-faq .lp-support a')||{}).getAttribute('href')||''");
  t('the support address is a working mailto', String(mail).indexOf('mailto:')===0, String(mail));
  t('the footer carries the same support address',
    (await ev("[].slice.call(document.querySelectorAll('.lp-foot a')).map(a=>a.getAttribute('href')).join('|')")).indexOf('mailto:')>=0);

  // sign-up mode states the approval rule inside the modal
  await ev("showAuth();toggleAuthMode();"); await sleep(500);
  t('the sign-up modal says the account waits for approval',
    (await ev(`(()=>{const n=document.getElementById('auth-pending-note');return n?!n.classList.contains('hidden'):false})()`))===true);
  t('the note is hidden when the modal is a sign-in', (await ev(`(()=>{toggleAuthMode();const n=document.getElementById('auth-pending-note');return n&&n.classList.contains('hidden')})()`))===true);

  // rhythm: the page now has a tinted band, not only white cards
  t('one section breaks the white rhythm with a tinted band',
    (await ev("getComputedStyle(document.querySelector('.lp-band')).backgroundColor"))!==(await ev("getComputedStyle(document.body).backgroundColor")),
    'band='+await ev("getComputedStyle(document.querySelector('.lp-band')).backgroundColor"));

  // full-page shot for the record
  const metrics=await cmd('Page.getLayoutMetrics');
  const h=Math.min(Math.ceil(metrics.result.cssContentSize.height),7000);
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:h,deviceScaleFactor:1,mobile:W<600});
  await sleep(700);
  const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  const f=OUT+'/landing-gaps-'+W+'.png'; fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(f,Buffer.from(r.result.data,'base64'));
  console.log('shot:',f);

  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
