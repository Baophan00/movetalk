
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9954, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=390,900','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evmob','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);
  const check=async label=>{
    const o=await ev(`JSON.stringify({docW:document.documentElement.scrollWidth,winW:window.innerWidth,
      wide:[].slice.call(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>window.innerWidth+1.5}).slice(0,5).map(el=>el.tagName.toLowerCase()+'.'+String(el.className||'').slice(0,30)+':'+Math.round(el.getBoundingClientRect().right))})`);
    console.log(label, o);
  };
  await check('home@390');
  await ev(`lSub="learn";go("learn")`);await sleep(900); await check('learn@390');
  await ev(`lSub="list";go("learn")`);await sleep(1200); await check('list@390');
  await ev(`go("vocab")`);await sleep(1200); await check('vocab@390');
  console.log('acct btn:', await ev(`(()=>{const b=[].slice.call(document.querySelectorAll('button')).filter(x=>/Đăng|Tài khoản|👤/.test(x.textContent))[0];if(!b)return 'none';
    const r=b.getBoundingClientRect();return JSON.stringify({text:b.textContent.trim(),w:Math.round(r.width),right:Math.round(r.right),overflow:b.scrollWidth>b.clientWidth})})()`));
  console.log('sidebar scroll:', await ev(`(()=>{const n=document.querySelector('nav, .side, aside');if(!n)return 'none';return JSON.stringify({w:Math.round(n.getBoundingClientRect().width),scrollW:n.scrollWidth,overflow:getComputedStyle(n).overflowX})})()`));
  proc.kill();process.exit(0);
})();
