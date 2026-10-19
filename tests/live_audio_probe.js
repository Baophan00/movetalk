
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9967, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-aprobe','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+(((r.result.exceptionDetails.exception||{}).description)||'');
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(4500);
  console.log('CONTEXT loaded:', await ev("typeof window.CONTEXT"), '| keys:', await ev("window.CONTEXT?Object.keys(window.CONTEXT).length:0"));
  console.log('ctx pause:', await ev("JSON.stringify(wordContext({w:'postpone',m:'hoãn',e:'x'}))"));
  console.log('audioStart type:', await ev("typeof audioStart"), '| renderAudioBar:', await ev("typeof renderAudioBar"));
  console.log('call:', await ev("(()=>{try{ audioStart([{w:V[0].w},{w:V[1].w}]); return 'ok AUDIO.on='+AUDIO.on+' bar='+!!document.getElementById('audiobar'); }catch(e){ return 'ERR '+e.message+' | '+e.stack.split('\\n')[1]; }})()"));
  await sleep(1500);
  console.log('after 1.5s: on=', await ev("AUDIO.on"), 'idx=', await ev("AUDIO.idx"), 'bar=', await ev("!!document.getElementById('audiobar')"), 'bodyClass=', await ev("document.body.className"));
  console.log('speech support:', await ev("'speechSynthesis' in window"), '| voices:', await ev("(speechSynthesis.getVoices()||[]).length"));
  proc.kill();process.exit(0);
})();
