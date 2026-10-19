
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9969, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mlist','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:2,mobile:true});
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(4500);
  await ev(`(()=>{ V.slice(0,10).forEach((x,i)=>{ srs[x.w]={d:0,i:0,e:2.5,n:1,r:0};
      srsMeta[x.w]={step:i%5,good:1,bad:0,state:i%5===0?'learning':(i%5>=4?'mastered':'reviewing'),due:i<4?Date.now()-86400000:Date.now()+86400000*2,last:Date.now()};});
    persistSrs(); save(); lSub='list'; go('learn'); return 1; })()`);
  await sleep(900);
  console.log('docW/winW:', await ev(`document.documentElement.scrollWidth+'/'+window.innerWidth`));
  console.log('chips:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.lchip')).map(c=>c.textContent.trim()))`));
  console.log('row overflow:', await ev(`(()=>{const r=document.querySelector('.list .li');if(!r)return 'none';return JSON.stringify({w:Math.round(r.getBoundingClientRect().width),scroll:r.scrollWidth,pills:r.querySelectorAll('.pill').length})})()`));
  await shot('list-v2-390');
  proc.kill();process.exit(0);
})();
