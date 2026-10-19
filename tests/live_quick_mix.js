
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9964, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-qmix','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  fs.mkdirSync('/tmp/ev-quick',{recursive:true});
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(4500);
  // seed: 20 learned words, 12 of them overdue, 8 due in the future
  console.log('seed:', await ev(`(()=>{
    const first=V.slice(0,20);
    srs={}; srsMeta={};
    first.forEach((x,i)=>{ srs[x.w]={d:0,i:0,e:2.5,n:1,r:0};
      srsMeta[x.w]={step:i%3+1, good:1, bad:0, due: i<12 ? Date.now()-86400000 : Date.now()+7*86400000, last:Date.now()-86400000}; });
    persistSrs(); save(); return Object.keys(srsMeta).length;
  })()`));
  const built=await ev(`JSON.stringify(quickBuild(3))`);
  const o=JSON.parse(built);
  console.log('3-min build:', JSON.stringify({total:o.total, due:o.dueCount, fresh:o.newCount}));
  console.log('expected: 60% of 8 = 5 due, 3 new');
  const built5=JSON.parse(await ev(`JSON.stringify(quickBuild(5))`));
  console.log('5-min build:', JSON.stringify({total:built5.total, due:built5.dueCount, fresh:built5.newCount}));
  console.log('due pool available:', await ev(`quickDuePool().length`), '| new pool:', await ev(`quickNewPool().length`));
  await ev("quickStart(3)");await sleep(700); await shot('mix-card');
  await ev("quickPause()");await sleep(700); await shot('dash-with-banner');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await sleep(1200); await shot('dash-banner-390');
  await ev("quickResume()");await sleep(800); await shot('card-390');
  await ev("QUICK_FLIP=true;drawQuick()");await sleep(600); await shot('card-back-390');
  proc.kill();process.exit(0);
})();
