// Focused measure of the dashboard blocks at a given width.
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9937, BASE=process.argv[2]||'https://movetalk.surge.sh', W=Number(process.argv[3]||390);
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtprobe2','--disable-gpu','about:blank'],{stdio:'ignore'});
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
    const css=el=>{const s=getComputedStyle(el);return {op:s.opacity,color:s.color,bg:s.backgroundColor,fs:s.fontSize,disp:s.display,anim:s.animationName};};
    const stat=document.querySelector('#dash-body .stat');
    const ss=document.getElementById('dash-selfstudy');
    function chain(el){const out=[];let e=el;while(e&&e!==document.body){const s=getComputedStyle(e);if(Number(s.opacity)<1||s.filter!=='none')out.push((e.id||e.className||e.tagName)+' op='+s.opacity+' f='+s.filter);e=e.parentElement;}return out;}
    return JSON.stringify({
      stat: stat?{cls:stat.className,style:css(stat),label:css(stat.querySelector('.stat-label')||stat),value:css(stat.querySelector('.stat-value')||stat),chain:chain(stat),opacityInherited:chain(stat).length}:null,
      ssExists: !!ss,
      ssHtml: ss?ss.innerHTML.slice(0,900):null,
      ssChildren: ss?[].slice.call(ss.children).map(c=>({tag:c.tagName,cls:c.className,style:css(c),kids:[].slice.call(c.children).map(k=>k.tagName+'.'+k.className)})):null
    },null,1);})()`));
  // scroll to the selfstudy area and shoot it
  await ev("(document.getElementById('dash-selfstudy')||{scrollIntoView:()=>{}}).scrollIntoView({block:'center'})"); await sleep(600);
  const r=await cmd('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync('/tmp/mt-responsive/probe-ss-'+W+'.png',Buffer.from(r.result.data,'base64'));
  console.log('shot: /tmp/mt-responsive/probe-ss-'+W+'.png');
  proc.kill();process.exit(0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
