// Role separation in the chrome: a student must not see teacher entries, a
// teacher must. The real authorization is Postgres RLS; this checks the UI.
//   node tests/ui_role_check.js [baseUrl]
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9933, BASE=process.argv[2]||'https://movetalk.surge.sh';
const T_EMAIL=process.env.MT_EMAIL, T_PASS=process.env.MT_PASS;
if(!T_EMAIL||!T_PASS){console.log('set MT_EMAIL and MT_PASS to the teacher account');process.exit(2)}
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtrole','--disable-gpu','about:blank'],{stdio:'ignore'});
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
    return r.result&&r.result.result?r.result.result.value:undefined};
  const visible=()=>ev(`JSON.stringify(Array.from(document.querySelectorAll('.teacher-only,#bn-teacher,#nav-teacher-item')).filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id||(e.textContent||'').trim().slice(0,16)))`);
  const signIn=async(email)=>{
    await ev("localStorage.clear()");
    await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()}); await sleep(3000);
    await ev('showAuth()'); await sleep(400);
    const pw = email === T_EMAIL ? T_PASS : 'MoveTalk123!';
    await ev(`document.getElementById('auth-email').value='${email}';document.getElementById('auth-pass').value='${pw}';doAuth();`);
    await sleep(6000);
    await ev("go('home')"); await sleep(1200);
  };
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:BASE}); await sleep(3200);

  await signIn('demo.student@movetalk.test');
  const asStudent=JSON.parse(await visible());
  t('a student sees no teaching entry in the chrome', asStudent.length===0, JSON.stringify(asStudent));
  t('a student is not sent to the teacher screen', (await ev("document.getElementById('v-teacher')&&document.getElementById('v-teacher').classList.contains('hidden')"))===true);

  await signIn(T_EMAIL);
  const asTeacher=JSON.parse(await visible());
  t('a teacher sees the teaching entry in the sidebar', asTeacher.includes('nav-teacher-item'), JSON.stringify(asTeacher));
  const sections = asTeacher.filter(x => /Overview$|Students$|Assignments$/.test(x));
  t('a teacher sees all three teaching sections', sections.length === 3, JSON.stringify(asTeacher));
  t('a teacher gets the phone navigation as well',
    asTeacher.includes('bn-teacher') || (await ev("getComputedStyle(document.getElementById('bn-teacher')).display==='none'"))===true,
    JSON.stringify(asTeacher));

  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
