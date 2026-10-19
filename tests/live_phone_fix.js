
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9960, URL_=process.argv[2];
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-evmob4','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<80;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};const bad=[];
  w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o);
    if(o.method==='Network.responseReceived'&&o.params.response.status>=400)bad.push('HTTP '+o.params.response.status+' '+o.params.response.url.slice(-40));});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:undefined};
  const shot=async n=>{const r=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/ev-fix/'+n+'.png',Buffer.from(r.result.data,'base64'))};
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await cmd('Page.navigate',{url:URL_+'?r='+Date.now()});await sleep(5500);
  console.log('acct:', await ev(`(()=>{const b=document.getElementById('acct');const cs=getComputedStyle(b);return JSON.stringify({text:b.textContent.trim(),w:Math.round(b.getBoundingClientRect().width),clipped:b.scrollWidth>b.clientWidth+1,maxW:cs.maxWidth})})()`));
  console.log('lnav:', await ev(`(()=>{const n=document.querySelector('.lnav');if(!n)return 'none';const cs=getComputedStyle(n);const items=[].slice.call(n.children).map(b=>{const r=b.getBoundingClientRect();return {t:b.textContent.trim().slice(0,12),w:Math.round(r.width),vis:r.right<=window.innerWidth+1&&r.width>0}});
    return JSON.stringify({display:cs.display,cols:cs.gridTemplateColumns,scrollW:n.scrollWidth,clientW:n.clientWidth,items})})()`));
  console.log('favicon status:', bad.length?bad.join(','):'no 4xx');
  await shot('mobile-home-fixed');
  await cmd('Emulation.clearDeviceMetricsOverride');await sleep(800);
  await shot('desktop-home-fixed');
  proc.kill();process.exit(0);
})();
