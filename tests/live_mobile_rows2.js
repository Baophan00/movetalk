
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9959, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evmob3','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5500);
  await ev(`go("vocab")`);await sleep(1600);
  console.log('innerWidth', await ev('window.innerWidth'), 'docW', await ev('document.documentElement.scrollWidth'));
  console.log('rows:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.wrow')).slice(0,3).map(r=>({h:Math.round(r.getBoundingClientRect().height),txt:(r.innerText||'').replace(/\\s+/g,' ').slice(0,50)})))`));
  const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-fix/vocab-390-v3.png',Buffer.from(r.result.data,'base64'));
  console.log('shot /tmp/ev-fix/vocab-390-v3.png');
  proc.kill();process.exit(0);
})();
