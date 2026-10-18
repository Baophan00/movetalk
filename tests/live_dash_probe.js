// Inspect a settled signed-in screen on the live site: block classes, sizes, text.
//   node tests/live_dash_probe.js [baseUrl] [width] [view]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9936, BASE=process.argv[2]||'https://movetalk.surge.sh', W=Number(process.argv[3]||390);
const VIEW=process.argv[4]||'dashboard', TARGET=process.argv[5]||'v-dashboard';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtprobe','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:900,deviceScaleFactor:1,mobile:W<600});
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(2800);
  for(let attempt=0;attempt<3;attempt++){
    await ev('showAuth()');await sleep(400);
    await ev("document.getElementById('auth-email').value='demo.student@movetalk.test';document.getElementById('auth-pass').value='MoveTalk123!';doAuth();");
    await sleep(6000);
    if(await ev('!!USER')) break;
  }
  console.log('USER:', await ev('JSON.stringify(USER&&{email:USER.email,role:USER.role})'));
  await ev(`go(${JSON.stringify(VIEW)})`); await sleep(5000);
  console.log(await ev(`(()=>{const v=document.getElementById(${JSON.stringify(TARGET)});
    if(!v) return 'no element ${TARGET}';
    const walk=(el,depth)=>[].slice.call(el.children).filter(c=>c.tagName!=='SCRIPT').map(c=>{
      const cs=getComputedStyle(c), r=c.getBoundingClientRect();
      const tag=c.tagName.toLowerCase();
      return {d:depth,tag,id:c.id||'',cls:(c.className||'').toString().slice(0,50),
        op:cs.opacity,disp:cs.display,w:Math.round(r.width),h:Math.round(r.height),
        t:(c.textContent||'').replace(/\\s+/g,' ').slice(0,80),
        kids: depth<2 ? walk(c,depth+1) : undefined};
    });
    return JSON.stringify(walk(v,0),null,1).slice(0,7000);})()`));
  const r=await cmd('Page.captureScreenshot',{format:'png'});
  const out='/tmp/mt-responsive/probe-'+VIEW+'-'+W+'.png';
  fs.writeFileSync(out,Buffer.from(r.result.data,'base64'));
  console.log('shot:',out);
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
