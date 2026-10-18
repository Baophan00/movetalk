// Dump a JS-rendered page: full text + screenshot, with a wait for the asset gate.
//   node tests/live_dump_page.js <url> <outTxt> <outPng> [width]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9948, URL_=process.argv[2], OUT_T=process.argv[3]||'/tmp/page.txt', OUT_P=process.argv[4]||'/tmp/page.png', W=Number(process.argv[5]||1440);
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-dumppage','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW';
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');
  await cmd('Page.navigate',{url:URL_});
  let txt='';
  for(let i=0;i<45;i++){
    await sleep(1000);
    txt=await ev('(document.body&&document.body.innerText)||""')||'';
    if(txt.length>200 && txt.indexOf('Loading assets')<0 && txt.indexOf('Application error')<0) break;
  }
  fs.writeFileSync(OUT_T, txt);
  console.log('title:', await ev('document.title'));
  console.log('text chars:', txt.length);
  console.log(txt.slice(0,1200).replace(/\n{2,}/g,'\n'));
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:1000,deviceScaleFactor:1,mobile:W<600});
  await sleep(1500);
  const m=await cmd('Page.getLayoutMetrics');
  const h=Math.min(Math.ceil(m.result.cssContentSize.height),9000);
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:h,deviceScaleFactor:1,mobile:W<600});
  await sleep(1500);
  const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  fs.writeFileSync(OUT_P,Buffer.from(r.result.data,'base64'));
  console.log('shot:',OUT_P,'h',h);
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
