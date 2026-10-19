
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9958, URL_=process.argv[2], OUT='/tmp/ev-fix';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=390,900','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evmob2','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);
  await ev(`go("vocab")`);await sleep(1500);
  console.log('viewport:', await ev(`window.innerWidth+'x'+window.innerHeight`), '| docW', await ev(`document.documentElement.scrollWidth`));
  console.log('row boxes:', await ev(`(()=>{const r=document.querySelector('.wrow');const b=[].slice.call(r.children).filter(c=>getComputedStyle(c).display!=='none').map(c=>{const q=c.getBoundingClientRect();return c.className+':'+Math.round(q.left)+'→'+Math.round(q.right)+' h'+Math.round(q.height)});return JSON.stringify({rowH:Math.round(r.getBoundingClientRect().height),cells:b})})()`));
  const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/vocab-390-v2.png',Buffer.from(r.result.data,'base64'));
  console.log('shot', OUT+'/vocab-390-v2.png');
  proc.kill();process.exit(0);
})();
