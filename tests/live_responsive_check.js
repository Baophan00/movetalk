// Responsive sweep on the live site: 360 / 390 / 768 / 1280 / 1440.
// Reports horizontal overflow per screen and writes a screenshot per pair.
//   node tests/live_responsive_check.js [baseUrl] [outDir]
const {spawn}=require('child_process');const http=require('http');const fs=require('fs');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9935, BASE=process.argv[2]||'https://movetalk.surge.sh';
const OUT=process.argv[3]||'/tmp/mt-responsive';
const S_EMAIL=process.env.MT_STUDENT||'demo.student@movetalk.test';
const S_PASS=process.env.MT_STUDENT_PASS||'MoveTalk123!';
const WIDTHS=[360,390,768,1280,1440];
fs.mkdirSync(OUT,{recursive:true});
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run',
  '--no-default-browser-check','--user-data-dir=/tmp/chrome-mtresp','--disable-gpu','about:blank'],{stdio:'ignore'});
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let PASS=0,FAIL=0;
const t=(n,c,x='')=>{console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:''));c?PASS++:FAIL++};
(async()=>{
  let tabs=null;for(let i=0;i<60;i++){try{tabs=await get('/json/list');if(tabs.length)break}catch(e){}await sleep(250)}
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;
  const WebSocket=require('ws');const w=new WebSocket(ws);await new Promise(r=>w.on('open',r));
  let id=0;const pend={};w.on('message',m=>{const o=JSON.parse(m);if(o.id&&pend[o.id])pend[o.id](o)});
  const cmd=(m,p={})=>new Promise(r=>{const i=++id;pend[i]=r;w.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await cmd('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    return r.result&&r.result.result?r.result.result.value:undefined};
  await cmd('Page.enable'); await cmd('Runtime.enable');

  const overflow=`(()=>{const d=document.documentElement;
    const wide=[].slice.call(document.querySelectorAll('body *')).filter(el=>{
      const r=el.getBoundingClientRect(); if(!r.width) return false;
      return r.right>window.innerWidth+1.5;}).slice(0,4).map(el=>(el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\\s+/).join('.'):'')+':'+Math.round(el.getBoundingClientRect().right)));
    return JSON.stringify({docW:d.scrollWidth,winW:window.innerWidth,wide:wide});})()`;

  const shot=async(name)=>{
    const r=await cmd('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(OUT+'/'+name+'.png',Buffer.from(r.result.data,'base64'));
  };

  for(const W of WIDTHS){
    await cmd('Emulation.setDeviceMetricsOverride',{width:W,height:900,deviceScaleFactor:1,mobile:W<600});
    await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()}); await sleep(2600);
    const land=JSON.parse(await ev(overflow)||'{}');
    t(`landing @${W}: no horizontal scroll`, land.docW<=land.winW+1, JSON.stringify(land));
    await shot(`landing-${W}`);

    // signed-in student: dashboard + homework
    await ev(`showAuth()`); await sleep(400);
    await ev(`document.getElementById('auth-email').value=${JSON.stringify(S_EMAIL)};document.getElementById('auth-pass').value=${JSON.stringify(S_PASS)};doAuth();`);
    await sleep(6500);
    for(const v of ['dashboard','homework']){
      await ev(`go('${v}')`); await sleep(2200);
      const o=JSON.parse(await ev(overflow)||'{}');
      t(`${v} @${W}: no horizontal scroll`, o.docW<=o.winW+1, JSON.stringify(o));
      await shot(`${v}-${W}`);
    }
    // a lesson screen
    await ev(`go('a1')`); await sleep(1800);
    await ev(`(typeof trackGo==='function')&&trackGo('a1',1)`); await sleep(2000);
    const lo=JSON.parse(await ev(overflow)||'{}');
    t(`lesson @${W}: no horizontal scroll`, lo.docW<=lo.winW+1, JSON.stringify(lo));
    await shot(`lesson-${W}`);
    // a long text label must not clip: check the sidebar toggle + phone bar stay reachable
    if(W<600){
      const bar=await ev(`(()=>{const b=document.querySelectorAll('.nav-btn');return b.length?JSON.stringify({n:b.length,firstRight:Math.round(b[0].getBoundingClientRect().right),win:window.innerWidth}):'none'})()`);
      t(`phone bar @${W}: inside the viewport`, bar==='none'||JSON.parse(bar).firstRight<=JSON.parse(bar).win+1, bar);
    }
    await ev('localStorage.clear()');
  }
  console.log('\n'+PASS+' passed, '+FAIL+' failed · shots in '+OUT);
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
