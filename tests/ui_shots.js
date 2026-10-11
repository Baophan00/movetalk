// UI pass: screenshots + overflow + console errors, at desktop / tablet / mobile.
//   node tests/ui_shots.js [http://127.0.0.1:8080] [outdir]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');const path=require('path');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9911;
const BASE=(process.argv[2]||'http://127.0.0.1:8080').replace(/\/$/,'');
const OUT=process.argv[3]||'/tmp/mt-ui';
fs.mkdirSync(OUT,{recursive:true});
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtui','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  let tabs=null;
  for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};let errors=[];
  w.on('message',m=>{const o=JSON.parse(m);
    if(o.id&&pend[o.id]){pend[o.id](o);return}
    if(o.method==='Runtime.exceptionThrown') errors.push('EXC '+((o.params.exceptionDetails.exception||{}).description||o.params.exceptionDetails.text));
    if(o.method==='Log.entryAdded'&&o.params.entry.level==='error') errors.push('LOG '+o.params.entry.text);
  });
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails) return 'EXC';
    return r.result&&r.result.result?r.result.result.value:undefined};
  const size=async(width,height)=>{
    await cmd('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<820});
  };
  const shot=async(name)=>{
    const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const f=path.join(OUT,name+'.png');
    fs.writeFileSync(f,Buffer.from(r.result.data,'base64'));
    const over=await ev("JSON.stringify({w:window.innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth})");
    const o=JSON.parse(over||'{}');
    const bad = o.scroll > o.w + 1;
    console.log((bad?'OVERFLOW ':'ok       ')+name+'  viewport='+o.w+' scrollWidth='+o.scroll+(bad?'  <-- '+o.scroll+'px wide':''));
    return f;
  };

  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable');
  await cmd('Page.navigate',{url:BASE}); await sleep(3500);

  await size(1440,900);
  await cmd('Page.navigate',{url:BASE}); await sleep(3000);
  await shot('01-home-desktop');
  await ev("go('e2')"); await sleep(1200); await shot('02-lessons-desktop');
  await ev("go('dashboard')"); await sleep(800); await shot('03-dashboard-gate-desktop');

  // sign in as the teacher, look at the portal
  await ev(`localStorage.clear()`);
  await cmd('Page.navigate',{url:BASE}); await sleep(2800);
  await ev('showAuth()'); await sleep(400);
  await ev(`document.getElementById('auth-email').value='demo.teacher@movetalk.test';`+
           `document.getElementById('auth-pass').value='MoveTalk123!';doAuth();`);
  await sleep(6000);
  await ev("go('teacher')"); await sleep(3000);
  await shot('04-teacher-overview-desktop');
  await ev("tcTab('students')"); await sleep(700); await shot('05-teacher-students-desktop');
  await ev("tcTab('assignments')"); await sleep(700); await shot('06-teacher-assignments-desktop');

  // the student side
  await size(1440,900);
  await ev("localStorage.clear()");
  await cmd('Page.navigate',{url:BASE}); await sleep(2600);
  await ev('showAuth()'); await sleep(400);
  await ev(`document.getElementById('auth-email').value='demo.student@movetalk.test';`+
           `document.getElementById('auth-pass').value='MoveTalk123!';doAuth();`);
  await sleep(6000);
  await ev("go('dashboard')"); await sleep(3500); await shot('11-student-dashboard-desktop');
  const leak = await ev(`JSON.stringify(Array.from(document.querySelectorAll('.teacher-only,#bn-teacher,#nav-teacher-item')).filter(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none').map(e=>e.id||(e.textContent||'').trim().slice(0,18)))`);
  console.log((String(leak)==='[]'?'ok       ':'AUTH-LEAK ')+'teacher-only entries visible to a student: '+leak);
  await ev("go('homework')"); await sleep(2500); await shot('12-student-homework-desktop');
  await ev("hwOpen(HW.assignments[1].id)"); await sleep(2500); await shot('13-student-assignment-desktop');

  // tablet
  await size(834,1112);
  await ev("tcTab('overview')"); await sleep(900);
  await shot('07-teacher-overview-tablet');

  // phone
  await size(390,844);
  await sleep(900);
  await shot('08-teacher-overview-phone');
  await ev("go('home')"); await sleep(900); await shot('09-home-phone');
  await ev("go('dashboard')"); await sleep(1200); await shot('10-dashboard-phone');

  console.log('\nconsole errors:', errors.length);
  errors.slice(0,8).forEach(e=>console.log('   '+e.slice(0,220)));
  proc.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
