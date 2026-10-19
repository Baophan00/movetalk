// READ-ONLY audit of a deployed single-page app: console errors, screens, 404s,
// and a screenshot at two widths. Nothing is signed in or written.
//   node tests/live_audit_page.js <url> <outDir> [widths...]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9950, URL_=process.argv[2], OUT=process.argv[3]||'/tmp/ev-audit';
const WIDTHS=(process.argv.slice(4).length?process.argv.slice(4):['1440','390']).map(Number);
fs.mkdirSync(OUT,{recursive:true});
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evaudit','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const bad=[];
  w.on('message',m=>{const o=JSON.parse(m);
    if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')bad.push('EXC '+(((o.params.exceptionDetails.exception||{}).description)||o.params.exceptionDetails.text).split('\n')[0].slice(0,200));
    if(o.method==='Log.entryAdded'&&o.params.entry.level==='error')bad.push('LOG '+o.params.entry.text.slice(0,200));
    if(o.method==='Network.responseReceived'&&o.params.response.status>=400)bad.push('HTTP '+o.params.response.status+' '+o.params.response.url.slice(0,140));
    if(o.method==='Network.loadingFailed'&&!o.params.errorText.includes('ERR_ABORTED'))bad.push('NETFAIL '+o.params.errorText+' '+(o.params.type||''));
  });
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');await cmd('Network.enable');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});
  await sleep(6000);

  console.log('title:', await ev('document.title'));
  console.log('views/elements:', await ev(`JSON.stringify({
    views:[].slice.call(document.querySelectorAll('[id^=view],[class*=view],section')).map(e=>e.id||e.className).slice(0,15),
    navs:[].slice.call(document.querySelectorAll('nav a, nav button, .nav-item, .tab')).map(e=>(e.textContent||'').trim().slice(0,24)).filter(Boolean).slice(0,20),
    words:(document.body.innerText||'').match(/\\b[a-zA-Z]{4,}\\b/g)?.length||0,
    bodyLen:(document.body.innerText||'').length
  },null,0).slice(0,1500)`));
  console.log('counts:', await ev(`JSON.stringify({
    cards:document.querySelectorAll('.word-card,.card,.vd-row,[data-word]').length,
    buttons:document.querySelectorAll('button').length,
    audioBtns:document.querySelectorAll('[onclick*="speak"],[onclick*="Speak"],[class*=audio],[class*=uk],[class*=us]').length
  })`));

  for(const W of WIDTHS){
    // window-size was set at launch; for the narrow pass use emulation AFTER load
    if(W!==1440) { await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:900,deviceScaleFactor:1,mobile:W<600}); await sleep(1500); }
    const r=await cmd('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(`${OUT}/home-${W}.png`,Buffer.from(r.result.data,'base64'));
    console.log('shot:',`${OUT}/home-${W}.png`);
    if(W!==1440) await cmd('Emulation.clearDeviceMetricsOverride');
  }

  console.log('errors ('+bad.length+'):');
  [...new Set(bad)].slice(0,20).forEach(b=>console.log(' -',b));
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
