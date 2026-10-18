
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9947, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-dump2','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const logs=[];
  w.on('message',m=>{const o=JSON.parse(m);
    if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Runtime.exceptionThrown')logs.push('EXC '+((o.params.exceptionDetails.exception||{}).description||o.params.exceptionDetails.text).slice(0,300));
    if(o.method==='Log.entryAdded')logs.push('LOG '+o.params.entry.text.slice(0,200));
    if(o.method==='Network.loadingFailed')logs.push('NETFAIL '+o.params.errorText+' '+(o.params.blockedReason||''));
  });
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');await cmd('Network.enable');
  await cmd('Page.navigate',{url:URL_});await sleep(9000);
  console.log('title:', await ev('document.title'));
  console.log('text:', (await ev('document.body.innerText')||'').replace(/\s+/g,' ').slice(0,400));
  console.log('logs:'); logs.slice(0,14).forEach(l=>console.log(' -',l));
  proc.kill();process.exit(0);
})();
