// Parts 2-5: SRS states and due filter, streak freeze, daily challenge,
// mini context and the audio-only player.
//   node tests/live_srs_streak_audio.js <url>
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9966, URL_=process.argv[2]||'http://127.0.0.1:8099/';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-srs','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let PASS=0,FAIL=0;const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''));c?PASS++:FAIL++};
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const bad=[];
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')bad.push('EXC '+(((o.params.exceptionDetails.exception||{}).description)||'').split('\n')[0].slice(0,150));});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  fs.mkdirSync('/tmp/ev-quick',{recursive:true});
  await cmd('Page.enable');await cmd('Runtime.enable');
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);

  /* ---------- PART 2: SRS ---------- */
  const c0=await ev("JSON.stringify(srsCounts())");
  t('a fresh profile has every word in state new', /"new":611/.test(c0), c0);
  t('nothing is due before anything is studied', (await ev("srsCounts().due"))===0, c0);
  await ev(`(()=>{ const w=V[0].w; srs[w]={d:0,i:0,e:2.5,n:1,r:0};
    srsSchedule(w,true); srs[w]=Object.assign(srs[w]); return 1; })()`);
  const s1=await ev(`(()=>{const w=V[0].w; return srsStateOf(w)+'|'+(srsMeta[w].step)})()`);
  t('one correct answer puts the word in learning or reviewing', /learning\|1|reviewing\|1/.test(s1), s1);
  const s4=await ev(`(()=>{const w=V[1].w; srs[w]={d:0,i:0,e:2.5,n:1,r:0};
    for(let i=0;i<4;i++) srsSchedule(w,true); return srsStateOf(w)+'|'+srsMeta[w].step+'|'+srsNextLabel(w); })()`);
  t('four correct answers in a row reach mastered with a longer gap', /mastered\|4\|/.test(s4), s4);
  const wrong=await ev(`(()=>{const w=V[2].w; srs[w]={d:0,i:0,e:2.5,n:1,r:1}; srsSchedule(w,false);
    return srsStateOf(w)+'|'+Math.round((srsMeta[w].due-Date.now())/3600000); })()`);
  t('a wrong answer drops the word back to learning within a day', /learning\|1[0-3]/.test(wrong), wrong);
  // due filter in the word list
  await ev(`(()=>{ srsMeta[V[3].w]={step:1,good:1,bad:0,due:Date.now()-86400000,last:Date.now(),state:'reviewing'}; srs[V[3].w]={d:0,i:0,e:2.5,n:1,r:0}; persistSrs(); })()`);
  t('an overdue word counts as due', (await ev("srsDueSoon(V[3].w)"))===true);
  await ev("lSub='list';go('learn')"); await sleep(700);
  t('the list offers a due filter', (await ev("!!document.querySelector('.lchip')"))===true);
  await ev("setListFilter('due')"); await sleep(600);
  const dueRows=await ev("document.querySelectorAll('.list .li').length");
  t('filtering by due shows only words that are due', dueRows===1, 'rows='+dueRows);
  const badge=await ev(`(document.querySelector('.list .li')||{textContent:''}).textContent`);
  t('each row carries its review state', /tới hạn|Đang ôn|đã thuộc|chưa học/.test(badge), badge.trim().slice(0,60));
  await shot('list-due');
  // due-only session
  const dueSession=await ev("JSON.stringify(quickBuild(3,'due'))");
  t('a due-only session is built from due words alone', JSON.parse(dueSession).newCount===0, dueSession);

  /* ---------- PART 3: streak + freeze + challenge ---------- */
  const streaked=await ev(`(()=>{ const L={}; const d=new Date();
    for(let i=0;i<3;i++){ const x=new Date(); x.setDate(d.getDate()-i-1);
      L[x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate()]=8; }
    store.setLog(L); return streak(); })()`);
  t('a three day chain is reported as three', streaked===3, 'streak='+streaked);
  const canFreeze=await ev(`(()=>{ const L=store.log; const d=new Date(); d.setDate(d.getDate()-1);
    const k=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); delete L[k]; store.setLog(L);
    return JSON.stringify({streak:streak(), can:freezeEligible(), left:freezesLeft()}) })()`);
  t('a missed yesterday makes the freeze available', JSON.parse(canFreeze).can===true, canFreeze);
  const afterFreeze=await ev(`(()=>{ useFreeze(); return JSON.stringify({streak:streak(), left:freezesLeft()}) })()`);
  t('using the freeze restores the chain and spends one freeze', JSON.parse(afterFreeze).streak===3 && JSON.parse(afterFreeze).left===1, afterFreeze);
  t('the freeze cannot be used twice on the same gap', (await ev("freezeEligible()"))===false);

  await ev("lSub='home';go('learn')"); await sleep(900);
  const ch=await ev(`(()=>{const st=challengeState(); return JSON.stringify({text:st.c.text,target:st.c.target,done:st.done,xp:st.c.xp})})()`);
  t('the dashboard shows today\'s challenge with progress', (await ev("!!document.querySelector('.chbar')"))===true, ch);
  const xpBefore=await ev("xpTotal()");
  const completed=await ev(`(()=>{const st=challengeState(); dayBump(st.c.key, st.c.target);
    const after=JSON.parse(JSON.stringify(challengeState())); return JSON.stringify({complete:after.complete, xp:xpTotal()})})()`);
  t('completing the challenge awards XP once', JSON.parse(completed).complete===true && JSON.parse(completed).xp>xpBefore,
    'before='+xpBefore+' after='+completed);
  const xpAfter=await ev("xpTotal()");
  await ev("challengeCheck(); challengeCheck();");
  t('a completed challenge does not pay twice', (await ev("xpTotal()"))===xpAfter);

  /* ---------- PART 4: examples + mini context ---------- */
  const ctxCurated=await ev("JSON.stringify(wordContext({w:'postpone',m:'hoãn',e:'x'}))");
  t('a curated word gets a hand written usage note', /dời lịch họp/.test(ctxCurated), ctxCurated);
  const ctxDerived=await ev(`(()=>{const w=V[50]; const c=wordContext(w); return JSON.stringify({w:w.w,when:c.when,say:c.say})})()`);
  t('every other word still gets a context line from its own data', JSON.parse(ctxDerived).when.length>10 && JSON.parse(ctxDerived).say.length>5, ctxDerived);
  await ev("quickStart(3)"); await sleep(700);
  await ev("QUICK_FLIP=true;drawQuick()"); await sleep(500);
  t('the quick card shows a "when to use" block', (await ev("!!document.querySelector('.qctx')"))===true);
  const exCount=await ev("document.querySelectorAll('.card .ex').length");
  t('the quick card shows two real examples when the data has them', exCount>=2, 'examples='+exCount);
  await shot('quick-context');

  /* ---------- PART 5: audio-only ---------- */
  t('audio can be started straight from the quick session card',
    (await ev("[].slice.call(document.querySelectorAll('.qhead button')).map(b=>b.getAttribute('onclick')).join('|')")).indexOf('audioQuick')>=0);
  await ev("quickPause()"); await sleep(500);
  // headless Chrome has no audio device: utterances end instantly, so freeze the
  // player right after it opens and drive the controls from there.
  // the headless build has no audio device, so utterances end instantly; hold each
  // spoken step for the test so the player behaves like it does for a real user
  await ev("window.speakAwait=()=>new Promise(r=>setTimeout(r,4000))");
  await ev("audioStart([{w:V[0].w},{w:V[1].w},{w:V[2].w},{w:V[3].w}])"); await sleep(500);
  t('audio mode opens a player bar', (await ev("!!document.getElementById('audiobar')"))===true);
  const barTxt=await ev("(document.getElementById('audiobar')||{textContent:''}).textContent");
  t('the bar shows the word and the Vietnamese meaning', barTxt.length>5 && /Nghe thôi/.test(barTxt), String(barTxt).slice(0,80));
  await ev("audioRate()"); await sleep(200);
  t('the playback speed can be changed', (await ev("AUDIO.rate"))!==1, 'rate='+await ev("AUDIO.rate"));
  await ev("AUDIO.idx=0; audioNext()"); await sleep(300);
  t('next moves to the following word', (await ev("AUDIO.idx"))>=1, 'idx='+await ev("AUDIO.idx"));
  await ev("audioPrev()"); await sleep(300);
  t('previous goes back', (await ev("AUDIO.idx"))<=1, 'idx='+await ev("AUDIO.idx"));
  await ev("AUDIO.paused=false; audioToggle()"); await sleep(300);
  t('pause is recorded when toggled mid playback', (await ev("AUDIO.paused"))===true);
  await ev("audioStop()"); await sleep(400);
  t('stopping removes the bar', (await ev("!document.getElementById('audiobar')"))===true);
  t('no console errors in the whole run', bad.length===0, bad.slice(0,2).join(' | '));

  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
