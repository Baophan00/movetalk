const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const js=src.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

const store={},els={};
function mkEl(id){
  return {id,innerHTML:'',textContent:'',value:'',dataset:{},classList:{_s:new Set(),
    add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},
    toggle(c,f){f?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
    addEventListener(){},style:{},querySelectorAll(){return[]},appendChild(){}};
}
global.document={
  getElementById(id){return els[id]||(els[id]=mkEl(id))},
  querySelectorAll(){return[]},querySelector(){return null},
  createElement(){return mkEl('tmp')},
  documentElement:{dataset:{theme:'dark'}}
};
global.window={innerWidth:1400,scrollTo(){}};
global.addEventListener=()=>{};
global.IntersectionObserver=class{constructor(){}observe(){}unobserve(){}};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.location={hash:''};
global.setInterval=()=>0; global.clearInterval=()=>{};
global.setTimeout=()=>{};

const fn=new Function('document','window','addEventListener','IntersectionObserver','localStorage','location','setInterval','clearInterval','setTimeout','speechSynthesis',
  js+'\nreturn {TRACKS,TRACK_PARTS,renderTrack,trackGo,trackPart,trackBody,trackBack,go,speak,renderDashboard};');
const api=fn(global.document,global.window,global.addEventListener,global.IntersectionObserver,global.localStorage,global.location,global.setInterval,global.clearInterval,global.setTimeout,null);

let fail=0,pass=0;
function check(name,cond,extra=''){ if(cond){pass++}else{fail++;console.log('FAIL | '+name+(extra?' | '+extra:''))} }

const TKS=['f1','f2','a1','a2','e1','e2'];
check('6 tracks defined', Object.keys(api.TRACKS).length===6, Object.keys(api.TRACKS).join(','));
check('10 parts per track', api.TRACK_PARTS.length===10);

// every track: skeleton renders, grid = 50 cells
for(const tk of TKS){
  const T=api.TRACKS[tk];
  check(tk+' has badge/title/gridTitle', !!(T.badge&&T.title&&T.gridTitle));
  check(tk+' gridTotal 50', T.gridTotal===50);
  api.trackGo(tk,1);
  const grid=global.document.getElementById(tk+'-grid').innerHTML;
  const cells=(grid.match(/class="e2-num/g)||[]).length;
  check(tk+' grid has 50 cells', cells===50, 'got '+cells);
  const main=global.document.getElementById(tk+'-main').innerHTML;
  const hasContent=!!T.lessons[1];
  check(tk+' lesson1 renders '+(hasContent?'content':'placeholder'), hasContent?main.includes('e2-part'):main.includes('sẽ được cập nhật sau'));
  check(tk+' breadcrumb has badge', main.includes(T.badge));
}
// A1 has 10 live lessons, others 0
check('A1 has 10 lessons', Object.keys(api.TRACKS.a1.lessons).length===10);
for(const tk of ['f1','f2','a2','e1']){
  check(tk+' has 0 lessons (awaiting content)', Object.keys(api.TRACKS[tk].lessons).length===0);
}
check('E2 has 3 lessons', Object.keys(api.TRACKS.e2.lessons).length===3);
// A1 lesson 1: 10 part cards then each part body non-empty
api.trackGo('a1',1);
let main=global.document.getElementById('a1-main').innerHTML;
check('A1 L1 shows 10 part cards', (main.match(/class="e2-part"/g)||[]).length===10);
const L=api.TRACKS.a1.lessons[1];
check('A1 L1 has all 10 part sets', api.TRACK_PARTS.every(p=>Array.isArray(L.parts[p.id])), Object.keys(L.parts).join(','));
for(const p of api.TRACK_PARTS.map(x=>x.id)){
  const html=api.trackBody(p,L,'a1');
  check('A1 L1 body '+p, html.length>20 && !html.includes('undefined'), 'len='+html.length);
}
// navigate into a part
api.trackPart('a1','exercises');
main=global.document.getElementById('a1-main').innerHTML;
const body=global.document.getElementById('a1-body').innerHTML;
check('A1 exercises panel opens', main.includes('Phần 6: Bài tập') && (body.match(/blk-quiz-opt/g)||[]).length>=32, 'opts='+(body.match(/blk-quiz-opt/g)||[]).length);
// back
api.trackBack('a1');
main=global.document.getElementById('a1-main').innerHTML;
check('A1 back to part list', (main.match(/class="e2-part"/g)||[]).length===10);
// all views navigate without throwing
for(const v of ['home','f1','f2','a1','a2','e1','e2','dashboard']){
  let err=null; try{ api.go(v); }catch(e){ err=e.message; }
  check("go('"+v+"')", !err, err||'');
}
// sections in DOM are empty containers (skeleton injected at runtime)
const secCount=(src.match(/<section id="v-(f1|f2|a1|a2|e1|e2)" class="view hidden"><\/section>/g)||[]).length;
check('6 empty section containers in HTML', secCount===6, 'got '+secCount);
// speak() defined and callable
check('speak() defined', typeof api.speak==='function');
api.speak('hello world');
// no stale references
check('no renderE2 leftovers', !js.includes('renderE2'));
check('no dead data (LEVELS/FLASHCARDS/TESTS)', !js.includes('const LEVELS=') && !js.includes('const FLASHCARDS=') && !js.includes('const TESTS='));
check('v-lesson removed', !src.includes('id="v-lesson"'));
check('no renderCourses leftovers', !js.includes('renderCourses'));

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
