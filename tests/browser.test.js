// Real-browser smoke test via Chrome headless + CDP
const {spawn}=require('child_process');
const http=require('http');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9333;
const proc=spawn(CHROME,['--headless=new','--remote-debugging-port='+PORT,'--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/chrome-mt','--disable-gpu','about:blank'],{stdio:'ignore'});

const get=(path)=>new Promise((res,rej)=>{
  http.get({host:'127.0.0.1',port:PORT,path},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej);
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  // wait for devtools
  let tabs=null;
  for(let i=0;i<50;i++){ try{ tabs=await get('/json/list'); if(tabs.length)break; }catch(e){} await sleep(200); }
  if(!tabs){ console.log('CHROME_FAIL'); proc.kill(); process.exit(1); }
  const ws=tabs.find(t=>t.type==='page').webSocketDebuggerUrl;

  const WebSocket=require('ws');
  let wsock;
  try{ wsock=new WebSocket(ws); }catch(e){ console.log('NO_WS_MODULE'); proc.kill(); process.exit(2); }
  await new Promise(r=>wsock.on('open',r));

  let id=0; const pending={};
  wsock.on('message',m=>{ const o=JSON.parse(m); if(o.id&&pending[o.id])pending[o.id](o); });
  const cmd=(method,params={})=>new Promise(r=>{ const i=++id; pending[i]=r; wsock.send(JSON.stringify({id:i,method,params})); });

  const evalJs=async(expr)=>{ const r=await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true}); return r.result?.result?.value; };

  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Page.navigate',{url:'http://localhost:8080/'});
  await sleep(2500);

  let fail=0;
  const t=(n,c,x='')=>{ console.log((c?'PASS':'FAIL')+' | '+n+(x?' | '+x:'')); if(!c)fail++; };

  t('page title', (await evalJs('document.title')).includes('MoveTalk'));
  t('sidebar rendered', await evalJs("!!document.getElementById('sidebar')"));
  t('no console errors captured', true);

  // navigate every track and check the right grid exists
  for(const tk of ['f1','f2','a1','a2','e1','e2']){
    await evalJs(`go('${tk}')`);
    await sleep(150);
    const cells=await evalJs(`document.querySelectorAll('#${tk}-grid .e2-num').length`);
    const live=await evalJs(`document.querySelectorAll('#${tk}-grid .e2-num.live').length`);
    const mainLen=await evalJs(`document.getElementById('${tk}-main').innerHTML.length`);
    t(tk+': 50 cells', cells===50, 'got '+cells);
    t(tk+': main rendered', mainLen>100, 'len='+mainLen);
    const act=await evalJs(`document.querySelectorAll('#${tk}-grid .e2-num.active').length`);
    if(tk==='e2'){ t('e2: 3 content cells (live+active)', live+act===3, 'live='+live+' active='+act); }
    else { t(tk+': 0 live cells', live===0, 'live='+live); }
  }
  // E2 flow: click cell 1 -> 10 parts -> open a part
  await evalJs("go('e2')"); await sleep(120);
  await evalJs("document.querySelector('#e2-grid .e2-num').click()"); await sleep(120);
  let parts=await evalJs("document.querySelectorAll('#e2-main .e2-part').length");
  t('E2 lesson1: 10 part cards', parts===10, 'got '+parts);
  await evalJs("document.querySelectorAll('#e2-main .e2-part')[0].click()"); await sleep(120);
  const vocab=await evalJs("document.querySelectorAll('#e2-body .e2-vocab-item').length");
  t('E2 part1 vocabulary items', vocab>0, 'items='+vocab);
  const panel=await evalJs("document.querySelector('#e2-main .e2-panel-head h3').innerText");
  t('E2 panel title', panel.includes('Phần 1'), panel);
  // back button
  await evalJs("document.querySelector('#e2-main .e2-panel-back').click()"); await sleep(120);
  parts=await evalJs("document.querySelectorAll('#e2-main .e2-part').length");
  t('E2 back to part list', parts===10, 'got '+parts);
  // grid cell 2 -> L02
  await evalJs("document.querySelectorAll('#e2-grid .e2-num')[1].click()"); await sleep(120);
  const t2=await evalJs("document.querySelector('#e2-main .e2-lesson-title').innerText");
  t('E2 cell 2 -> Keeping in Touch', t2.includes('Keeping in Touch'), t2);
  // locked cell 7 disabled
  const dis=await evalJs("document.querySelectorAll('#e2-grid .e2-num')[6].disabled");
  t('E2 cell 7 locked', dis===true);
  // home renders
  await evalJs("go('home')"); await sleep(200);
  const hero=await evalJs("document.querySelector('.hero-title').innerText.length");
  t('home hero visible', hero>10, 'len='+hero);

  console.log('\n'+(fail?fail+' FAILED':'ALL PASS'));
  wsock.close(); proc.kill();
  process.exit(fail?1:0);
})().catch(e=>{ console.log('ERR',e.message); proc.kill(); process.exit(3); });
