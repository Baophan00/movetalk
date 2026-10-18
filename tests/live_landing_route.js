// Proves the public page is reachable: at "/" for a visitor AND for a signed-in
// account, and that the app shell carries a way back to it.
//   node tests/live_landing_route.js [baseUrl]
const {spawn}=require('child_process');const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9940, BASE=process.argv[2]||'https://movetalk.surge.sh';
const S_EMAIL=process.env.MT_STUDENT||'demo.student@movetalk.test';
const S_PASS=process.env.MT_STUDENT_PASS||'MoveTalk123!';
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mtroute','--disable-gpu','about:blank'],{stdio:'ignore'});
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
    if(r.result&&r.result.exceptionDetails)return 'THROW '+((r.result.exceptionDetails.exception||{}).description||'');
    return r.result&&r.result.result?r.result.result.value:undefined};
  const lp=()=>ev(`(()=>{const l=document.getElementById('public-landing');return l?!l.classList.contains('hidden'):false})()`);
  // the session restore is a network round trip: wait for it instead of guessing a delay
  const waitUser=async(ms=12000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev("typeof USER!=='undefined'&&!!USER"))return true;await sleep(600)}return false};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

  await ev('localStorage.clear()');
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(3200);
  t('a visitor at "/" gets the landing', (await lp())===true);
  t('the landing counts lessons from the shipped data', Number(await ev("Number((document.getElementById('lp-stat-lessons')||{}).textContent)"))>0,
    'lessons='+await ev("(document.getElementById('lp-stat-lessons')||{}).textContent"));
  const btnText=await ev("(document.getElementById('lp-auth-btn')||{}).textContent");
  t('the sign-in button says Đăng nhập for a visitor', btnText==='Đăng nhập',
    JSON.stringify(btnText)+' · USER='+await ev('JSON.stringify(USER&&USER.email)'));

  // sign in from the landing
  await ev("document.getElementById('lp-auth-btn').click()"); await sleep(600);
  await ev(`document.getElementById('auth-email').value=${JSON.stringify(S_EMAIL)};document.getElementById('auth-pass').value=${JSON.stringify(S_PASS)};doAuth();`);
  await sleep(7000);
  t('signing in leaves the landing for the workspace', (await lp())===false, 'hash='+await ev('location.hash'));

  // back to "/" while signed in
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()});await sleep(2500); await waitUser();
  await sleep(800);
  t('a signed-in reload of "/" shows the landing, not the workspace', (await lp())===true, 'USER='+await ev("typeof USER!=='undefined'&&USER?USER.email:null"));
  t('the button reads Vào học for a signed-in visitor', (await ev("(document.getElementById('lp-auth-btn')||{}).textContent"))==='Vào học',
    String(await ev("(document.getElementById('lp-auth-btn')||{}).textContent")));
  await ev("document.getElementById('lp-auth-btn').click()"); await sleep(2500);
  t('that button returns the account to its workspace', (await lp())===false, 'hash='+await ev('location.hash'));

  // the app shell's own way back
  const brand=await ev(`(()=>{const h=document.querySelector('.sidebar-header');return h?h.getAttribute('onclick'):'none'})()`);
  t('the sidebar brand links to the landing', String(brand).indexOf('landing')>=0, String(brand));
  await ev("document.querySelector('.sidebar-header').click()"); await sleep(1500);
  t('clicking the brand opens the landing', (await lp())===true);

  // explicit deep links still work
  await cmd('Page.navigate',{url:BASE+'/?r='+Date.now()+'#dashboard'});await sleep(2500); await waitUser(); await sleep(1200);
  t('#dashboard still opens the dashboard directly', (await lp())===false &&
    (await ev("!document.getElementById('v-dashboard').classList.contains('hidden')"))===true, 'hash='+await ev('location.hash'));

  console.log('\n'+PASS+' passed, '+FAIL+' failed');
  proc.kill();process.exit(FAIL?1:0);
})().catch(e=>{console.log('ERR',e.message);try{proc.kill()}catch(_){}process.exit(3)});
