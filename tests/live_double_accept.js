// Double-click on Accept against the LIVE site: how many accept calls really
// leave the browser, and whether the student ever shows up twice on screen.
// Run with:  node tests/live_double_accept.js
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9777, SITE='https://movetalk.surge.sh/?v='+Date.now();
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtdbl3','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let PASS=0, FAIL=0;
const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''));c?PASS++:FAIL++};

(async()=>{
  let tabs=null;
  for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};let rpc=[];
  w.on('message',m=>{const o=JSON.parse(m);
    if(o.id&&pend[o.id]){pend[o.id](o);return}
    if(o.method==='Network.requestWillBeSent'){
      const r0=o.params.request||{};const u=r0.url||'';
      if(u.indexOf('/rpc/')>=0) rpc.push(r0.method+' '+u.split('/rpc/')[1]);
    }});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    return r.result&&r.result.result?r.result.result.value:undefined};

  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable');
  await cmd('Page.navigate',{url:SITE}); await sleep(3500);
  await ev('showAuth()'); await sleep(300);
  await ev(`document.getElementById('auth-email').value='demo.teacher@movetalk.test';`+
           `document.getElementById('auth-pass').value='MoveTalk123!';doAuth();`);
  await sleep(6000);
  await ev("go('teacher')"); await sleep(1200);

  let ready=false;
  for(let i=0;i<40;i++){
    ready = await ev("!!Array.from(document.querySelectorAll('#tc-panel-students button')).find(b=>b.innerText.trim()==='Accept')");
    if(ready===true) break;
    await sleep(500);
  }
  t('a request is waiting on screen', ready===true);
  if(!ready){ proc.kill(); process.exit(1); }

  // an impatient double click, in the same breath
  rpc=[];
  const rightAfter = await ev(`(()=>{const b=Array.from(document.querySelectorAll('#tc-panel-students button')).find(x=>x.innerText.trim()==='Accept');
     b.click();
     const state=Array.from(document.querySelectorAll('#tc-panel-students button')).map(x=>x.innerText.trim()+(x.disabled?' (disabled)':'')).join(' / ');
     b.click(); b.click();
     return state;})()`);
  t('the button shows it is working and locks itself', /Accepting… \(disabled\)/.test(String(rightAfter)), String(rightAfter));
  const samples=[];
  for(let i=0;i<20;i++){
    await sleep(400);
    samples.push(await ev(`(()=>{const t=document.getElementById('tc-panel-students').innerText;
      return JSON.stringify({copies:(t.match(/demo\\.waiting@movetalk\\.test/g)||[]).length,
        waiting:/waiting to join/.test(t),
        toasts:(document.body.innerText.match(/Accepted — they can see/g)||[]).length});})()`));
  }
  const worst=Math.max(...samples.map(x=>JSON.parse(x).copies));
  const maxToasts=Math.max(...samples.map(x=>JSON.parse(x).toasts));
  const posts=rpc.filter(x=>x.indexOf('POST')===0);
  t('two clicks send exactly one accept', posts.filter(x=>/approve_student$/.test(x)).length===1, JSON.stringify(rpc));
  t('the student is never on screen twice', worst===1, 'max copies='+worst);
  const flags = samples.map(x=>JSON.parse(x).waiting);
  const goneAt = flags.indexOf(false);
  t('the request card goes away and never comes back',
    goneAt >= 0 && !flags.slice(goneAt).some(v => v === true), flags.join(','));
  t('only one "Accepted" message appears', maxToasts<=1, 'max='+maxToasts);
  const finalState=await ev("document.getElementById('tc-panel-students').innerText.replace(/\\n+/g,' / ').slice(0,140)");
  console.log('   final panel:', finalState);
  const badge=await ev("document.getElementById('nav-teacher-count').innerText");
  t('the count clears', badge==='', JSON.stringify(badge));
  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill(); process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
