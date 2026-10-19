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
  js+'\nreturn {TRACKS,TRACK_PARTS,renderTrack,trackGo,trackPart,trackBody,trackBack,go,speak,renderDashboard,' +
     'VOCAB,vocabIndex,vocabSaved,vocabToggleSave,vocabFiltered,vocabDisplay,vocabCard,vocabSearch,trackGrid,trackProgress,trackNextLesson,' +
     'dashCourseGroups,dashCourseCard,homeCourseCard,renderHome,' +
     'openCourse,renderCourse,courseTab,courseInfo,courseDM,COURSE,' +
     'TC,tcSessionsInRange,tcSessionState,tcSessionEnd,tcOverdueRows,tcRenderDash,tcDashRange,tcDashDayLabel};');
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
for(const v of ['home','f1','f2','a1','a2','e1','e2','dashboard','course']){
  let err=null; try{ api.go(v); }catch(e){ err=e.message; }
  check("go('"+v+"')", !err, err||'');
}
// ---- course page: a programme as a page, modelled on the Kiaalap layout ----
api.openCourse('a1');
let ch=global.document.getElementById('course-body').innerHTML;
check('course page opens on the programme', ch.includes('Map &amp; Diagnose')||ch.includes('Map & Diagnose'));
check('course page has four tabs', (ch.match(/class="course-tab[" ]/g)||[]).length===4, 'tabs='+(ch.match(/class="course-tab[" ]/g)||[]).length);
check('the hero counts the lessons and the parts that ship', ch.includes('10 bài') && ch.includes('100 phần'));
check('opening a course writes its own route', /#?course\/a1$/.test(global.location.hash), global.location.hash);
api.courseTab('lessons');
ch=global.document.getElementById('course-body').innerHTML;
check('the lessons tab lists every lesson', (ch.match(/class="lesson-item[" ]/g)||[]).length===10, 'items='+(ch.match(/class="lesson-item[" ]/g)||[]).length);
api.courseTab('sessions');
ch=global.document.getElementById('course-body').innerHTML;
check('a programme with no session says so in words', ch.includes('chưa xếp buổi nào'));
api.courseTab('work');
ch=global.document.getElementById('course-body').innerHTML;
check('a programme with no assignment says so in words', ch.includes('Chưa có bài tập nào'));
check('a deadline is written dd/mm', api.courseDM('2026-10-12')==='12/10', api.courseDM('2026-10-12'));
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

// ---- teaching studio ----
check('the teaching studio exists', /function studioEnter\(/.test(js) && /studio-mode/.test(js));
check('the studio reuses the one lesson render path',
  /function renderTrack\(tk\)\{\s*renderTrackInner\(tk\);/.test(js) && /function renderTrackInner\(/.test(js));
check('the studio is for the teacher account only',
  /function studioCanTeach\(\)\{return typeof USER!=='undefined'&&USER&&USER\.role==='teacher'\}/.test(js));
check('the studio keyboard map covers parts, lessons, audio and exit',
  /ArrowRight/.test(js) && /ArrowLeft/.test(js) && /ArrowUp/.test(js) && /Escape/.test(js) && /studioPlay\(\)/.test(js));
check('the studio is not a second way to render a lesson',
  (js.match(/function renderTrackInner\(/g)||[]).length===1 &&
  (js.match(/function trackBody\(/g)||[]).length===1 &&
  (js.match(/innerHTML=trackBody\(/g)||[]).length===1);

// ---- dashboard blocks ----
check('the dashboard shows the programmes as self-study rows, the landing as the same cards',
  /function dashRenderSelfStudy\(/.test(js) && /id="dash-selfstudy"/.test(src) && /function dashCourseGroups\(/.test(js) && /id="home-courses"/.test(src));
check('the programmes are a filter that really filters, not decoration',
  /function dashSetPg\(/.test(js) && /DASH_PG!==g\.name|DASH_PG !== g\.name/.test(js) && /id="dash-pills"/.test(src));
check('Level shows the placement result the student really has, or says it is not done',
  /function dashRenderLevel\(/.test(js) && /load\('selectedLevel'/.test(js) && /Chưa làm bài kiểm tra xếp trình độ/.test(js));
check('Activity is counted from the student record, never estimated',
  /function dashRenderActivity\(/.test(js) && /phần đã mở/.test(js) && /TRACK_PROG/.test(js));
check('the student dashboard does not promise a timetable the product no longer syncs',
  !/id="dash-sessions"/.test(src) && !/id="dash-today"/.test(src) && /id="dash-next-card"/.test(src));
check('the dashboard keeps saved words and real homework rows side by side',
  /id="dash-vocab"/.test(src) && /id="dash-hw"/.test(src) && /HW\.assignments\.slice/.test(js));
check('a programme with no content yet says so instead of showing a progress bar',
  /if\(!total\)\{/.test(js) && /course-card dim/.test(js) && /Nội dung đang được cập nhật/.test(js));
check('a course card counts lessons the student actually opened',
  /Object\.keys\(b\.opened\|\|\{\}\)\.length/.test(js) && /byTrack/.test(js));
check('the dashboard is a grid, not one long column',
  /xl:grid-cols-3/.test(src) && /xl:grid-cols-2/.test(src) && /\.course-cards\{display:grid/.test(src));
check('the self-study rows are compact rows with a real bar, not six stacked cards',
  /\.ss-row\{display:flex/.test(src) && /class="ss-row dim"/.test(js) && /opened \+ '\/' \+ total/.test(js));

// ---- vocabulary hub ----
const vIx = api.vocabIndex();
check('the hub indexes the words the lessons already carry', vIx.length > 50, 'got ' + vIx.length);
const coll = vIx.filter(e => e.w === 'colleague')[0];
check('a word carries the IPA, the meaning and the definition the lesson has',
  !!coll && coll.ipa === '/ˈkɒliːɡ/' && coll.vi === 'đồng nghiệp' && !!coll.def, JSON.stringify(coll));
check('... and its real examples, with the lesson it came from',
  !!coll && coll.ex.length > 0 && coll.src.length > 0 && coll.src[0].tk === 'a1', JSON.stringify(coll && coll.src));
check('an entry only holds what the lessons had: no IPA is filled in from nowhere',
  vIx.every(e => typeof e.ipa === 'string' && typeof e.vi === 'string' && typeof e.def === 'string' && Array.isArray(e.ex)),
  'entry shape');
check('saving a word keeps it, and shows the spelling the lesson uses',
  (() => { api.vocabToggleSave('colleague'); return api.vocabSaved().indexOf('colleague') >= 0 && api.vocabDisplay('colleague') === 'colleague'; })());
check('saving again takes it back out',
  (() => { api.vocabToggleSave('colleague'); return api.vocabSaved().indexOf('colleague') < 0; })());
check('the saved filter shows only saved words',
  (() => {
    api.vocabToggleSave('colleague');
    api.VOCAB.filter = 'saved';
    const r = api.vocabFiltered();
    api.VOCAB.filter = 'all';
    api.vocabToggleSave('colleague');
    return r.length === 1 && r[0].w === 'colleague';
  })());
check('search finds a word by its Vietnamese meaning',
  (() => { api.vocabSearch('đồng nghiệp'); const r = api.vocabFiltered(); api.vocabSearch(''); return r.some(e => e.w === 'colleague'); })());
check('a card shows the star state and never invents a meaning',
  /vocab-star/.test(api.vocabCard({ w: 'x', ipa: '', vi: '', def: '', ex: [], src: [] })) &&
  !/vocab-vi/.test(api.vocabCard({ w: 'x', ipa: '', vi: '', def: '', ex: [], src: [] })));

// ---- lesson rail: modules and states ----
const rail = (() => { api.trackGo('a1', 1); return els['a1-grid'].innerHTML; })();
check('the lesson list is grouped into modules, not one wall of numbers',
  (rail.match(/e2-module-head/g) || []).length === 10, String((rail.match(/e2-module-head/g) || []).length));
check('... and each lesson cell says what it is', /e2-num (live|locked|active|done|opened)/.test(rail));
check('the rail explains its own colours', /e2-legend/.test(rail) && /Đã học xong/.test(rail));
check('the rail offers a continue action for the lesson that is next',
  /e2-side-cta/.test(rail) && /Continue lesson 1|Start lesson 1/.test(rail));
check('a track with no content does not claim progress',
  (() => { api.trackGo('f1', 1); const r = els['f1-grid'].innerHTML; return !/e2-side-cta/.test(r) && /đang cập nhật/.test(r); })());

// ---- landing: the same course cards ----
check('the landing shows the programmes with the same course cards as the dashboard',
  /function homeCourseCard/.test(js) && /id="home-courses"/.test(src) && /dashCourseGroups\(\)/.test(js));
check('a programme with lessons offers exactly one action: open lesson 1',
  (() => { const c = api.homeCourseCard('a1'); return /Mở bài 1/.test(c) && (c.match(/<button/g) || []).length === 1 && /10<\/b>/.test(c); })());
check('a programme with no lessons is honest on the landing too',
  (() => { const c = api.homeCourseCard('f1'); return /cập nhật/.test(c) && !/Mở bài 1/.test(c) && !/progress-fill-bar/.test(c); })());
check('a saved word on the dashboard opens the word, it does not just toggle it',
  /vocabShow/.test(js) && !/go\('vocab'\);vocabOpen/.test(js));

// ---- teacher dashboard: today, week, overdue ----
(() => {
  const d = new Date();
  const at = (off, h, m) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off); x.setHours(h, m, 0, 0); return x.toISOString(); };
  api.TC.sessions = [
    { id: 'later', starts_at: at(0, 23, 30), duration_min: 60, status: 'scheduled' },
    { id: 'yesterday', starts_at: at(-1, 10, 0), duration_min: 60, status: 'scheduled' },
    { id: 'tomorrow', starts_at: at(1, 10, 0), duration_min: 60, status: 'scheduled' },
    { id: 'off', starts_at: at(0, 9, 0), duration_min: 60, status: 'cancelled' }
  ];
  check('the day view carries today only, the week view adds the next six days',
    api.tcSessionsInRange('today').map(s => s.id).join(',') === 'off,later' &&
    api.tcSessionsInRange('week').map(s => s.id).join(',') === 'off,later,tomorrow');
  check('a cancelled session is never called upcoming',
    api.tcSessionState({ starts_at: at(0, 23, 30), duration_min: 60, status: 'cancelled' }).k === 'off');
  check('a session that has not started is upcoming',
    api.tcSessionState({ starts_at: at(1, 10, 0), duration_min: 60, status: 'scheduled' }).k === 'soon');
  check('a session inside its window is live',
    api.tcSessionState({ starts_at: new Date(Date.now() - 10 * 60000).toISOString(), duration_min: 90, status: 'scheduled' }).k === 'live');
  check('a finished session reads as past, never as taught',
    api.tcSessionState({ starts_at: at(-2, 10, 0), duration_min: 60, status: 'scheduled' }).k === 'past');

  api.TC.students = [{ id: 'st1', status: 'active' }, { id: 'st2', status: 'active' }];
  api.TC.recipients = [{ assignment_id: 'as1', student_id: 'st1' }, { assignment_id: 'as1', student_id: 'st2' }];
  api.TC.submissions = [{ assignment_id: 'as1', student_id: 'st1', status: 'graded' }];
  api.TC.assignments = [
    { id: 'as1', status: 'published', due_at: at(-3, 0, 0) },
    { id: 'as2', status: 'published', due_at: at(2, 0, 0) },
    { id: 'as3', status: 'draft', due_at: at(-3, 0, 0) }
  ];
  check('an overdue assignment counts only the students who have not handed it in',
    api.tcOverdueRows().length === 1 && api.tcOverdueRows()[0].missing === 1);
  check('a draft or a future deadline is never overdue',
    api.tcOverdueRows().every(r => r.a.id === 'as1'));
  api.tcRenderDash();
  check('the dashboard shows five counters, all from rows',
    (global.document.getElementById('tc-stats').innerHTML.match(/class="stat"/g) || []).length === 5);
})();

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
