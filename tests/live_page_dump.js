// Render a JS page with headless Chrome and dump text + a screenshot.
//   node tests/live_page_dump.js <url> <outPng> [width]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9946, URL_=process.argv[2], OUT=process.argv[3]||'/tmp/page.png', W=Number(process.argv[4]||1440);
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-dump','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+((r.result.exceptionDetails.exception||{}).description||'');
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:URL_});
  await sleep(4000);
  // wait for the real render: some apps boot behind an asset gate
  for(let i=0;i<40;i++){
    const t=await ev('(document.body&&document.body.innerText)||""');
    if(t && t.length>200 && t.indexOf('Loading assets')<0 && t.indexOf('Application error')<0) break;
    await sleep(1000);
  }
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:1000,deviceScaleFactor:1,mobile:W<600});
  await sleep(1500);
  console.log('title:', await ev('document.title'));
  console.log('nav:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('header a, nav a, header button')).map(a=>(a.textContent||'').replace(/\\s+/g,' ').trim()).filter(Boolean))`));
  console.log('h:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('h1,h2,h3')).map(h=>(h.textContent||'').replace(/\\s+/g,' ').trim()).slice(0,30))`));
  console.log('body:', (await ev('document.body.innerText')||'').replace(/\n{2,}/g,'\n').slice(0,4000));
  const m=await cmd('Page.getLayoutMetrics');
  const h=Math.min(Math.ceil(m.result.cssContentSize.height),8000);
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:h,deviceScaleFactor:1,mobile:W<600});
  await sleep(1200);
  const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  fs.writeFileSync(OUT,Buffer.from(r.result.data,'base64'));
  console.log('shot:',OUT,'height',h);
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
