
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9953, URL_=process.argv[2], OUT='/tmp/ev-audit';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evint','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const bad=[];
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')bad.push('EXC '+(((o.params.exceptionDetails.exception||{}).description)||'').split('\n')[0].slice(0,150));
    if(o.method==='Log.entryAdded'&&o.params.entry.level==='error')bad.push('LOG '+o.params.entry.text.slice(0,150));});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);

  await ev(`lSub="learn";go("learn")`); await sleep(700);
  console.log('card html (trimmed):', await ev(`(document.querySelector('h1.w')?document.querySelector('h1.w').closest('.card').innerHTML:'').replace(/\\s+/g,' ').slice(0,700)`));
  console.log('audio button count in card:', await ev(`[].slice.call(document.querySelectorAll('[onclick*="playWord"],[onclick*="speak"],[onclick*="Audio"],button')).filter(b=>/UK|US|🔊/.test(b.textContent)).map(b=>b.textContent.trim()+" :: "+(b.getAttribute('onclick')||'')).join(" | ")`));
  // try the meaning button
  const meaning=await ev(`(()=>{const b=[].slice.call(document.querySelectorAll('button')).filter(x=>/Xem nghĩa/.test(x.textContent))[0];if(!b)return 'no button';
    const host=document.querySelector('h1.w').closest('.card'); const before=host.innerText.length; b.click();
    return JSON.stringify({clicked:true,beforeLen:before})})()`);
  await sleep(700);
  const afterMeaning=await ev(`(document.querySelector('h1.w')?document.querySelector('h1.w').closest('.card').innerText:'').replace(/\\s+/g,' ').slice(0,220)`);
  console.log('meaning click:', meaning, '\n after:', afterMeaning);
  console.log('errors:', bad.length?[...new Set(bad)].slice(0,3):'none');
  const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/flow-learn-meaning.png',Buffer.from(r.result.data,'base64'));
  console.log('shot:', OUT+'/flow-learn-meaning.png');
  // mobile
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true}); await sleep(1500);
  const m=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/mobile-learn.png',Buffer.from(m.result.data,'base64'));
  console.log('shot:', OUT+'/mobile-learn.png');
  await ev(`lSub="list";go("learn")`); await sleep(1200);
  const m2=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/mobile-list.png',Buffer.from(m2.result.data,'base64'));
  console.log('shot:', OUT+'/mobile-list.png');
  proc.kill();process.exit(0);
})();
