// Landing audit: what the public page actually renders, section by section.
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9939, BASE=process.argv[2]||'https://movetalk.surge.sh', W=Number(process.argv[3]||1440);
const OUT=process.argv[4]||'/tmp/mt-landing';
fs.mkdirSync(OUT,{recursive:true});
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtland','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs=null;for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.result&&r.result.exceptionDetails)return 'THROW '+((r.result.exceptionDetails.exception||{}).description||'');
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:1000,deviceScaleFactor:1,mobile:W<600});
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(3500);
  console.log('hash:', await ev('location.hash||"(none)"'), '| landing visible:', await ev(`(()=>{const l=document.getElementById('public-landing');return l?getComputedStyle(l).display:'no #landing'})()`));
  console.log(await ev(`(()=>{
    const l=document.getElementById('public-landing');
    if(!l) return 'no landing element';
    const secs=[].slice.call(l.querySelectorAll('section,header,footer')).map(s=>{
      const r=s.getBoundingClientRect();
      return {cls:(s.className||'').toString().slice(0,50),id:s.id||'',h:Math.round(r.height),
        h1:(s.querySelector('h1,h2')||{}).textContent?'':(s.querySelector('h1,h2')||{}).textContent};
    });
    const imgs=[].slice.call(l.querySelectorAll('img')).map(i=>({src:i.getAttribute('src'),alt:i.alt,ok:i.complete&&i.naturalWidth>0}));
    const btns=[].slice.call(l.querySelectorAll('button,a')).map(b=>({t:(b.textContent||'').trim().slice(0,40),h:b.getAttribute('href')||'',on:b.getAttribute('onclick')||''}));
    const svg=l.querySelectorAll('svg').length;
    return JSON.stringify({title:document.title,sections:secs,imgs:imgs,btns:btns.slice(0,20),svgCount:svg,
      textLen:(l.innerText||'').length, bg:getComputedStyle(l).backgroundColor, bodyH:document.body.scrollHeight},null,1);
  })()`));
  // full page shot
  const metrics=await cmd('Page.getLayoutMetrics');
  const h=Math.min(Math.ceil(metrics.result.cssContentSize.height),6000);
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:h,deviceScaleFactor:1,mobile:W<600});
  await sleep(800);
  const r=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  const f=OUT+'/landing-full-'+W+'.png';
  fs.writeFileSync(f,Buffer.from(r.result.data,'base64'));
  console.log('shot:',f);
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
