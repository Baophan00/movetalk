// Inventory of the public page and the signed-in chrome, from the live site.
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9942, BASE=process.argv[2]||'https://movetalk.surge.sh';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtinv','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
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
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(3200);
  console.log('LANDING SECTIONS:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('#public-landing .lp-sec, #public-landing .lp-final, #public-landing .lp-hero')).map(s=>({
    id:s.id||'', h2:((s.querySelector('h2,h1')||{}).textContent||'').trim().slice(0,70),
    cards:s.querySelectorAll('.lp-step,.lp-course,.lp-card,.card').length})))`));
  console.log('FOOTER COLS:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('#public-landing .lp-foot > *')).map(c=>(c.textContent||'').replace(/\\s+/g,' ').trim().slice(0,60)))`));

  // sign in as the demo student and inventory the chrome
  await ev("document.getElementById('lp-auth-btn').click()");await sleep(600);
  await ev("document.getElementById('auth-email').value='demo.student@movetalk.test';document.getElementById('auth-pass').value='MoveTalk123!';doAuth();");
  await sleep(8000);
  console.log('SIDEBAR (student):', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('#sidebar .nav-item, #sidebar .nav-section-toggle')).filter(e=>getComputedStyle(e).display!=='none'&&!e.classList.contains('hidden')&&e.offsetParent!==null).map(e=>(e.textContent||'').replace(/\\s+/g,' ').trim()))`));
  console.log('BOTTOM NAV:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.bottom-nav button')).filter(e=>e.offsetParent!==null).map(e=>(e.textContent||'').replace(/\\s+/g,' ').trim()))`));
  console.log('STUDENT VIEWS:', await ev(`JSON.stringify(Object.keys(TRACKS).concat(['home','dashboard','homework','vocab','teacher']))`));
  console.log('TEACHER AREAS (markup):', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('[data-tc-nav]')).map(e=>({area:e.dataset.tcNav,label:(e.textContent||'').replace(/\\s+/g,' ').trim()})))`));
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
