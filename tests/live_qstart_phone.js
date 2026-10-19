
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9965, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-qphone','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:2,mobile:true});
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5000);
  console.log('quick card visible:', await ev("!!document.querySelector('.qstart')"));
  console.log('buttons stack:', await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.qstart .btn')).map(b=>{const r=b.getBoundingClientRect();return {w:Math.round(r.width),y:Math.round(r.top)}}))`));
  console.log('docW/winW:', await ev(`document.documentElement.scrollWidth+'/'+window.innerWidth`));
  await ev(`document.querySelector('.qstart').scrollIntoView({block:'center'})`);await sleep(600);
  const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-quick/qstart-390.png',Buffer.from(r.result.data,'base64'));
  console.log('shot /tmp/ev-quick/qstart-390.png');
  proc.kill();process.exit(0);
})();
