
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9955, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--window-size=1440,1000','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evrow','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  await ev(`go("vocab")`);await sleep(1500);
  console.log(await ev(`(()=>{const rows=[].slice.call(document.querySelectorAll('.wrow')).slice(0,3);
    return JSON.stringify(rows.map(r=>{
      const cell=(sel)=>{const e=r.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();const cs=getComputedStyle(e);
        return {x:Math.round(b.x),w:Math.round(b.width),h:Math.round(b.height),pos:cs.position,disp:cs.display,ws:cs.whiteSpace,ov:cs.overflow,flex:cs.flex};};
      return {text:(r.innerText||'').replace(/\\s+/g,' ').slice(0,60), wm:cell('.wm'), wdef:cell('.wdef'), wn:cell('.wn'), wi:cell('.wi'), rowW:Math.round(r.getBoundingClientRect().width)};
    }),null,1)})()`));
  console.log('row css:', await ev(`(()=>{const r=document.querySelector('.wrow');const cs=getComputedStyle(r);return JSON.stringify({display:cs.display,gap:cs.gap,wrap:cs.flexWrap,cols:cs.gridTemplateColumns})})()`));
  proc.kill();process.exit(0);
})();
