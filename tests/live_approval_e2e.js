// End-to-end check of the student-approval flow against the LIVE site.
// Signs in as the waiting student, then as the teacher, and accepts.
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9555, SITE=(process.env.MT_URL||'https://movetalk.surge.sh')+'/?v='+Date.now();
const T_EMAIL=process.env.MT_EMAIL, T_PASS=process.env.MT_PASS;
const S_EMAIL=process.env.MT_STUDENT||'demo.waiting@movetalk.test';
if(!T_EMAIL||!T_PASS){console.log('set MT_EMAIL and MT_PASS to a teacher account');process.exit(2)}
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtlive2','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;
  for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  if(!tabs){console.log('CHROME_FAIL');proc.kill();process.exit(1)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'EXC '+(r.result.exceptionDetails.exception||{}).description;
    return r.result&&r.result.result?r.result.result.value:undefined};
  const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''))};

  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:SITE}); await sleep(3500);
  t('the live site loads', (await ev('document.title')).includes('MoveTalk'));

  // ---- student who has not been accepted yet ----
  const signIn=async(email,pass)=>{
    await ev('localStorage.clear()');
    await cmd('Page.navigate',{url:SITE}); await sleep(3000);
    await ev('showAuth()'); await sleep(300);
    await ev(`document.getElementById('auth-email').value=${JSON.stringify(email)};`+
             `document.getElementById('auth-pass').value=${JSON.stringify(pass)};doAuth();`);
    await sleep(5000);
    await ev("go('homework')"); await sleep(1200);
  };
  await signIn(S_EMAIL,'MoveTalk123!');
  const gateShown=await ev("!document.getElementById('hw-gate').classList.contains('hidden')");
  const gateMsg=await ev("document.getElementById('hw-gate-msg').innerText");
  const gateTitle=await ev("document.getElementById('hw-gate-title').innerText");
  t('an unaccepted student is stopped by the gate', gateShown===true, String(gateShown));
  t('the gate says they are waiting for the teacher', /waiting for your teacher/i.test(String(gateMsg)), String(gateMsg));
  t('the heading tells them it is not their fault', /waiting/i.test(String(gateTitle)), String(gateTitle));
  const bodyHidden=await ev("document.getElementById('hw-body').classList.contains('hidden')");
  t('no homework is shown to them', bodyHidden===true, String(bodyHidden));
  const checkBtn=await ev("!!document.getElementById('hw-gate-btn')");
  t('there is a button to re-check', checkBtn===true);

  // ---- the teacher sees the request and accepts ----
  await signIn(T_EMAIL,T_PASS);
  await ev("go('teacher')"); await sleep(4000);
  const panel=await ev("document.getElementById('tc-panel-students').innerText");
  const badge=await ev("document.getElementById('nav-teacher-count').innerText");
  t('the teacher sees how many people are waiting', /1 person is waiting/i.test(String(panel)), String(panel).slice(0,90));
  t('the request shows the student', /Demo Waiting|demo\\.waiting/i.test(String(panel)), String(panel).slice(0,120));
  t('the Teaching item carries the count', String(badge)==='1', 'badge='+badge);
  const hasAccept=await ev("!!Array.from(document.querySelectorAll('#tc-panel-students button')).find(b=>b.innerText.trim()==='Accept')");
  t('there is an Accept button on the request', hasAccept===true);

  await ev("Array.from(document.querySelectorAll('#tc-panel-students button')).find(b=>b.innerText.trim()==='Accept').click()");
  await sleep(6000);
  const after=await ev("document.getElementById('tc-panel-students').innerText");
  const badgeAfter=await ev("document.getElementById('nav-teacher-count').innerText");
  t('after accepting, nobody is waiting', !/is waiting to join/i.test(String(after)), String(after).slice(0,80));
  t('the student appears among the teacher\'s students', /Demo Waiting/i.test(String(after)));
  t('the count on the Teaching item clears', String(badgeAfter)==='' , 'badge='+JSON.stringify(badgeAfter));
  const toast=await ev("document.body.innerText.includes('Accepted')");
  t('the teacher is told it worked', toast===true);

  const errs=(await ev("window.__errs||0"));
  proc.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
