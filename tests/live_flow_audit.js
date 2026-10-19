// READ-ONLY flow check for a SPA that exposes its own router: calls the app's
// view functions one by one, reports console errors and what each rendered.
//   node tests/live_flow_audit.js <url> <outDir>
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9952, URL_=process.argv[2], OUT=process.argv[3]||'/tmp/ev-audit';
fs.mkdirSync(OUT,{recursive:true});
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evflow2','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};let bad=[];
  w.on('message',m=>{const o=JSON.parse(m);
    if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')bad.push('EXC '+(((o.params.exceptionDetails.exception||{}).description)||o.params.exceptionDetails.text).split('\n')[0].slice(0,180));
    if(o.method==='Log.entryAdded'&&o.params.entry.level==='error')bad.push('LOG '+o.params.entry.text.slice(0,160));
    if(o.method==='Network.responseReceived'&&o.params.response.status>=400)bad.push('HTTP '+o.params.response.status+' '+o.params.response.url.slice(0,120));
  });
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${OUT}/${n}.png`,Buffer.from(r.result.data,'base64'))};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');await cmd('Network.enable');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);

  console.log('state:', await ev(`JSON.stringify({words:(typeof V!=='undefined'?V.length:'n/a'),
    tiers:(typeof V!=='undefined'?[...new Set(V.map(x=>x.t))]:[]),
    srsKeys:(typeof srs==='object'?Object.keys(srs).length:'n/a'),
    storageKeys:Object.keys(localStorage)})`));
  console.log('auth:', await ev(`JSON.stringify({authLoaded:typeof onAuthChange==='function',cfg:typeof SUPABASE_URL!=='undefined'?!!SUPABASE_URL:null})`));

  const flows=[
    ['tong-quan','()=>{lSub="home";go("learn");}'],
    ['hoc-tu-moi','()=>{lSub="learn";go("learn");}'],
    ['on-nhanh','()=>{lSub="daily";go("learn");}'],
    ['trac-nghiem','()=>{lSub="quiz";go("learn");}'],
    ['thong-ke','()=>{lSub="stats";go("learn");}'],
    ['danh-sach-tu','()=>{lSub="list";go("learn");}'],
    ['vocabulary','()=>{go("vocab");}'],
  ];
  for(const [name,fn] of flows){
    bad=[];
    const r=await ev(`(async()=>{try{(${fn})();await new Promise(r=>setTimeout(r,900));return "ok"}catch(e){return "ERR "+e.message}})()`);
    const info=await ev(`JSON.stringify({len:(document.body.innerText||'').length,
      head:(document.body.innerText||'').replace(/\\s+/g,' ').slice(60,200),
      buttons:document.querySelectorAll('button').length,
      audio:[].slice.call(document.querySelectorAll('[onclick*="speak"],[onclick*="play"],[onclick*="Audio"]')).length})`);
    console.log(`\n== ${name} -> ${r}`);
    console.log('   ', String(info).slice(0,360));
    console.log('    errors:', bad.length?[...new Set(bad)].slice(0,4).join(' | '):'none');
    await shot('flow-'+name);
  }

  // flashcard: flip + the UK/US audio buttons
  bad=[];
  await ev(`lSub="learn";go("learn")`); await sleep(800);
  const card=await ev(`(()=>{const h=document.querySelector('h1.w');const cardEl=h&&h.closest('.card');
    const before=(cardEl?cardEl.innerText:'').replace(/\\s+/g,' ').slice(0,90);
    if(cardEl)cardEl.click();
    return JSON.stringify({before,clicked:!!cardEl})})()`);
  await sleep(900);
  const after=await ev(`(document.querySelector('h1.w')?document.querySelector('h1.w').closest('.card').innerText:'').replace(/\\s+/g,' ').slice(0,90)`);
  console.log('\n== flashcard flip');
  console.log('    before/after:', card, '|', after);
  console.log('    errors:', bad.length?[...new Set(bad)].slice(0,3).join(' | '):'none');
  await shot('flow-flashcard');

  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
