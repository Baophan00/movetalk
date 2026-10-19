
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9963, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-qprobe','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'').split('\n')[0];
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(4500);
  await ev("quickStart(3)");await sleep(900);
  console.log('QUICK_OPEN', await ev("QUICK_OPEN"), '| view', await ev("view"), '| lSub', await ev("lSub"));
  console.log('h1.w:', await ev("JSON.stringify([].slice.call(document.querySelectorAll('h1.w')).map(h=>h.textContent))"));
  console.log('rows:', await ev("JSON.stringify([].slice.call(document.querySelectorAll('.row')).map(r=>r.innerHTML.slice(0,120)))"));
  console.log('buttons:', await ev("JSON.stringify([].slice.call(document.querySelectorAll('#app button')).map(b=>b.className+' :: '+b.textContent.trim().slice(0,20)))"));
  proc.kill();process.exit(0);
})();
