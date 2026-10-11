// Does anything show up twice for a signed-in student?
//   node tests/live_student_list_dupes.js
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9888, SITE='https://movetalk.surge.sh/?v='+Date.now();
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtstu','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;
  for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:SITE}); await sleep(3500);
  await ev('showAuth()'); await sleep(300);
  await ev(`document.getElementById('auth-email').value='demo.student@movetalk.test';`+
           `document.getElementById('auth-pass').value='MoveTalk123!';doAuth();`);
  await sleep(6000);
  await ev("go('homework')"); await sleep(2500);
  const cards = await ev(`(()=>{const el=document.getElementById('hw-list');
     const titles=[...el.querySelectorAll('*')].map(x=>x.innerText).filter(Boolean);
     const out={html:el.innerHTML.length, items:[...el.children].length};
     const t=[...new Set([...el.querySelectorAll('h3,h4,.font-semibold,p')].map(x=>x.innerText.trim()).filter(x=>/Demo/.test(x)))];
     return JSON.stringify({cards:out.items, titles:t});})()`);
  console.log('student homework list:', cards);
  const dupes = await ev(`(()=>{const el=document.getElementById('hw-list');const txt=el.innerText;
     const names=[...new Set((txt.match(/Demo · [^\\n]+/g)||[]))];
     return JSON.stringify(names.map(n=>({name:n, times:(txt.split(n).length-1)})));})()`);
  console.log('title occurrences:', dupes);
  proc.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
