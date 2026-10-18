// The level check must leave a trace the dashboard can read.
//   node tests/live_level_saves.js [baseUrl]
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9945, BASE=process.argv[2]||'https://movetalk.surge.sh';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtlevel','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  await cmd('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(3200);
  t('the dashboard level starts empty', (await ev("load('selectedLevel','')"))==='',
    String(await ev("load('selectedLevel','')")));
  t('the quiz is two columns on a wide screen',
    (await ev("(getComputedStyle(document.querySelector('.lp-quiz')).gridTemplateColumns||'').split(' ').length"))===2,
    await ev("getComputedStyle(document.querySelector('.lp-quiz')).gridTemplateColumns"));
  const out=await ev(`(async()=>{
    for(let q=1;q<=5;q++){
      document.querySelectorAll('#lp-quiz .quiz-q')[q-1].querySelectorAll('.quiz-opt')[0].click();
      await new Promise(r=>setTimeout(r,120));
    }
    await new Promise(r=>setTimeout(r,400));
    return JSON.stringify({saved:load('selectedLevel',''),
      result:(document.querySelector('#lp-quiz .quiz-result-name')||{}).textContent||''});
  })()`);
  let o={}; try{o=JSON.parse(out)}catch(e){}
  t('finishing the check records the level', !!o.saved, out);
  t('the recorded level matches the recommendation shown', o.saved===o.result, 'saved='+o.saved+' shown='+o.result);
  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
