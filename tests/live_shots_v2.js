
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9968, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1200','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-shots','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  fs.mkdirSync('/tmp/ev-quick',{recursive:true});
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(4500);
  // realistic state: studied 24 words, 5 overdue, streak 4 with one freeze
  await ev(`(()=>{ const d=new Date(); const L={};
    for(let i=1;i<=4;i++){ const x=new Date(); x.setDate(d.getDate()-i); L[x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate()]=8; }
    store.setLog(L);
    V.slice(0,24).forEach((x,i)=>{ srs[x.w]={d:0,i:0,e:2.5,n:1,r:0};
      const m={step:(i%4)+1,good:2,bad:0,state:i%4===3?'mastered':'reviewing',
        due: i<5 ? Date.now()-86400000 : Date.now()+ (i%5+1)*86400000, last:Date.now()-86400000};
      srsMeta[x.w]=m; });
    persistSrs(); save(); home(); return 1; })()`);
  await sleep(900); await shot('dash-v2');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:1400,deviceScaleFactor:2,mobile:true});await sleep(1200); await shot('dash-v2-390');
  await cmd('Emulation.clearDeviceMetricsOverride');await sleep(600);
  await ev("lSub='list';go('learn')"); await sleep(800); await shot('list-v2');
  await ev("quickStart(3)"); await sleep(700); await ev("QUICK_FLIP=true;drawQuick()"); await sleep(600); await shot('quick-context-v2');
  await ev("quickPause()"); await sleep(500);
  await ev("window.speakAwait=()=>new Promise(r=>setTimeout(r,9000))");
  await ev("audioStart([{w:V[0].w},{w:V[1].w}])"); await sleep(900); await shot('audio-bar');
  proc.kill();process.exit(0);
})();
