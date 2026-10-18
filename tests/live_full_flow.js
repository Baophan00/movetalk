// End-to-end: the teacher publishes real work, the student receives it, answers,
// submits, the teacher marks it, and the student reads the mark back.
// Everything runs through the live site and the real Supabase project.
//   MT_EMAIL=<teacher> MT_PASS=<pw> node tests/live_full_flow.js [baseUrl]
// Credentials come from the environment and are never written to disk.
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9934, BASE=process.argv[2]||'https://movetalk.surge.sh';
const T_EMAIL=process.env.MT_EMAIL, T_PASS=process.env.MT_PASS;
const S_EMAIL=process.env.MT_STUDENT||'demo.student@movetalk.test';
const S_PASS=process.env.MT_STUDENT_PASS||'MoveTalk123!';
if(!T_EMAIL||!T_PASS){console.log('set MT_EMAIL and MT_PASS to the teacher account');process.exit(2)}
const TITLE='E2E flow '+Date.now();
const FEEDBACK='Good sentence. Watch the verb form.';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtflow','--disable-gpu','about:blank'],{stdio:'ignore'});
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
    if(r.result&&r.result.exceptionDetails)return 'THROW: '+(r.result.exceptionDetails.exception&&r.result.exceptionDetails.exception.description||r.result.exceptionDetails.text);
    return r.result&&r.result.result?r.result.result.value:undefined};
  let AID=null, SUBID=null, TEXTQID=null;

  const signIn=async(email,pw)=>{
    await ev('localStorage.clear()');
    await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()}); await sleep(3200);
    await ev('showAuth()'); await sleep(500);
    await ev(`document.getElementById('auth-email').value=${JSON.stringify(email)};document.getElementById('auth-pass').value=${JSON.stringify(pw)};doAuth();`);
    await sleep(7000);
    return await ev('USER&&USER.email');
  };
  const waitFor=async(expr,ms=25000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(expr))return true;await sleep(700)}return false};

  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:BASE}); await sleep(3200);

  /* ---------- 1. teacher publishes ---------- */
  const who1=await signIn(T_EMAIL,T_PASS);
  t('teacher signs in', who1===T_EMAIL, String(who1));
  t('teacher gate opens for the owner account', (await ev('typeof teacherAllowed==="function"&&teacherAllowed()'))===true);
  await ev("go('teacher')"); await sleep(1200);
  await ev('tcTab("students",true)');
  t('teacher workspace loads its data', await waitFor('typeof TC!=="undefined"&&TC.ready===true'), 'loadErrors='+JSON.stringify(await ev('TC.loadErrors')));
  const target=await ev('JSON.stringify((TC.students||[]).filter(s=>s.status==="active").map(s=>({id:s.id,email:s.email})))');
  const active=JSON.parse(target||'[]');
  const demo=active.filter(s=>String(s.email||'').indexOf('demo.student')===0)[0]||active[0];
  t('there is an accepted student to give work to', !!demo, target);
  const built=await ev(`(async()=>{
    const s=${JSON.stringify(demo&&demo.id)};
    tcNewAssignment(); tcBuilderKind('custom');
    tcBuilderSet('title',${JSON.stringify(TITLE)});
    tcBuilderSet('instructions','Answer both questions. Write in full sentences.');
    tcBuilderSet('due','2099-01-31');
    tcBuilderToggleStudent(s);
    tcQAdd(); tcQSet(0,'qtype','mcq'); tcQSet(0,'prompt','She ___ a teacher.');
    tcQSet(0,'optionsRaw','is|are|am'); tcQSet(0,'keyRaw','0'); tcQSet(0,'points',1);
    tcQAdd(); tcQSet(1,'qtype','text'); tcQSet(1,'prompt','Write one sentence about your family.'); tcQSet(1,'points',2);
    await tcSaveAssignment(true);
    await new Promise(r=>setTimeout(r,1500));
    const a=(TC.assignments||[]).filter(x=>x.title===${JSON.stringify(TITLE)})[0];
    return JSON.stringify({assignment:a||null,recipients:(TC.recipients||[]).filter(r=>a&&r.assignment_id===a.id).length,
      questions:(TC.assignments||[]).length});
  })()`);
  let b={}; try{b=JSON.parse(built)}catch(e){}
  t('the assignment is saved and published', b.assignment&&b.assignment.status==='published', built);
  t('the chosen student is a recipient', b.recipients===1, 'recipients='+b.recipients);
  AID=b.assignment&&b.assignment.id;

  /* ---------- 2. student receives, answers, submits ---------- */
  const who2=await signIn(S_EMAIL,S_PASS);
  t('student signs in', who2===S_EMAIL, String(who2));
  await ev("go('homework')");
  t('homework list loads', await waitFor('typeof HW!=="undefined"&&HW.ready===true'), '');
  const seen=await ev(`JSON.stringify((HW.assignments||[]).filter(a=>a.title===${JSON.stringify(TITLE)}).map(a=>a.id))`);
  t('the published assignment reaches the student', JSON.parse(seen||'[]').length===1, seen);
  const answered=await ev(`(async()=>{
    const a=(HW.assignments||[]).filter(x=>x.title===${JSON.stringify(TITLE)})[0];
    if(!a) return JSON.stringify({err:'no assignment'});
    await hwOpen(a.id);
    const qs=HW.questions||[];
    if(qs.length<2) return JSON.stringify({err:'questions',n:qs.length});
    hwSetAnswer(qs[0].id,0,'mcq');
    hwSetAnswer(qs[1].id,'My family has four people.','text');
    await new Promise(r=>setTimeout(r,2000));
    await hwSubmit();
    await new Promise(r=>setTimeout(r,1500));
    const sub=HW.subs[a.id]||null;
    return JSON.stringify({qids:qs.map(q=>q.id),qtypes:qs.map(q=>q.qtype),sub:sub});
  })()`);
  let ans={}; try{ans=JSON.parse(answered)}catch(e){}
  t('the student opens a two-question assignment', (ans.qids||[]).length===2, answered);
  t('submitting moves the work to submitted', ans.sub&&ans.sub.status==='submitted', JSON.stringify(ans.sub));
  t('the multiple choice is auto-marked', ans.sub&&Number(ans.sub.score)===1, 'score='+(ans.sub&&ans.sub.score)+' max='+(ans.sub&&ans.sub.max_score));
  SUBID=ans.sub&&ans.sub.id;
  TEXTQID=(ans.qtypes||[]).indexOf('text')>=0?(ans.qids[ans.qtypes.indexOf('text')]):null;

  /* ---------- 3. teacher marks it ---------- */
  const who3=await signIn(T_EMAIL,T_PASS);
  t('teacher signs back in', who3===T_EMAIL, String(who3));
  await ev("go('teacher')"); await sleep(1200);
  await ev('tcTab("students",true)');
  await waitFor('TC.ready===true');
  const graded=await ev(`(async()=>{
    await tcOpenSubmissions(${JSON.stringify(AID)});
    await new Promise(r=>setTimeout(r,800));
    const inp=document.getElementById('g_'+${JSON.stringify(SUBID)}+'_'+${JSON.stringify(TEXTQID)});
    const fb=document.getElementById('fb_'+${JSON.stringify(SUBID)});
    if(!inp||!fb) return JSON.stringify({err:'grade inputs missing',found:!!inp,fb:!!fb,html:(TC.resultsHtml||'').slice(0,200)});
    inp.value='2'; fb.value=${JSON.stringify(FEEDBACK)};
    await tcGrade(${JSON.stringify(SUBID)},'graded',null);
    await new Promise(r=>setTimeout(r,1500));
    const row=(TC.submissions||[]).filter(s=>s.id===${JSON.stringify(SUBID)})[0];
    return JSON.stringify({row:row||null,panel:(document.getElementById('tc-panel-assignments').textContent||'').replace(/\\s+/g,' ').slice(0,300)});
  })()`);
  let g={}; try{g=JSON.parse(graded)}catch(e){}
  t('the teacher can open the submissions for it', !g.err, graded);
  t('the teacher marks the written answer', !!(g.row&&g.row.status==='graded'), JSON.stringify(g.row));
  t('the mark totals the auto-marked and the hand-marked points', !!(g.row&&Number(g.row.score)===3), 'score='+(g.row&&g.row.score));
  t('the submissions panel shows the graded state', /Graded/.test(g.panel||''), (g.panel||'').slice(0,120));

  /* ---------- 4. the student reads the mark back ---------- */
  const who4=await signIn(S_EMAIL,S_PASS);
  t('student signs back in', who4===S_EMAIL, String(who4));
  await ev("go('homework')");
  await waitFor('typeof HW!=="undefined"&&HW.ready===true');
  const readback=await ev(`(async()=>{
    const a=(HW.assignments||[]).filter(x=>x.title===${JSON.stringify(TITLE)})[0];
    if(!a) return JSON.stringify({err:'assignment gone'});
    await hwOpen(a.id);
    await new Promise(r=>setTimeout(r,900));
    const txt=((document.getElementById('hw-detail')||{}).textContent||'').replace(/\\s+/g,' ');
    const list=((document.getElementById('hw-list')||{}).textContent||'').replace(/\\s+/g,' ').slice(0,400);
    return JSON.stringify({status:(HW.subs[a.id]||{}).status,score:(HW.subs[a.id]||{}).score,
      feedbackShown:txt.indexOf(${JSON.stringify(FEEDBACK)})>=0, txt:txt.slice(0,400),list:list});
  })()`);
  let r={}; try{r=JSON.parse(readback)}catch(e){}
  t('the student sees the work as graded', r.status==='graded', readback);
  t('the teacher feedback is shown to the student', r.feedbackShown===true, r.txt);
  t('the list shows the mark, not "in progress"', /3\s*\/\s*3|3\/3|Graded/.test(r.list||''), r.list);

  console.log('\n'+PASS+' passed, '+FAIL+' failed  ·  assignment '+AID+' ('+TITLE+')');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
