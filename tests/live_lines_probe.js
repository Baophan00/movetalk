// Find which element renders the "Foundation · ..." lines and dump the block list.
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9938, BASE=process.argv[2]||'https://movetalk.surge.sh', W=Number(process.argv[3]||390);
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtprobe3','--disable-gpu','about:blank'],{stdio:'ignore'});
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
  for(let a=0;a<3;a++){
    await ev('showAuth()');await sleep(400);
    await ev("document.getElementById('auth-email').value='demo.student@movetalk.test';document.getElementById('auth-pass').value='MoveTalk123!';doAuth();");
    await sleep(6000); if(await ev('!!USER')) break;
  }
  await ev("go('dashboard')"); await sleep(5000);
  console.log(await ev(`(()=>{
    const hits=[].slice.call(document.querySelectorAll('#dash-body *')).filter(el=>
      el.children.length===0 && /Foundation|Activation|Expand/.test(el.textContent||'') && el.textContent.length<160);
    const blocks=[].slice.call(document.getElementById('dash-body').children).map(c=>({id:c.id,cls:(c.className||'').toString().slice(0,40),h:Math.round(c.getBoundingClientRect().height),t:(c.textContent||'').replace(/\\s+/g,' ').slice(0,60)}));
    return JSON.stringify({hits:hits.map(h=>({tag:h.tagName,cls:h.className,txt:(h.textContent||'').trim().slice(0,120),parent:h.parentElement.className,parentId:h.parentElement.id})),blocks},null,1);})()`));
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
