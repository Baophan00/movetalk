#!/usr/bin/env python3
"""One-shot migration: swap the hand-written E2_LESSONS block for the
block-schema LESSON_DATA, and replace trackBody() with a block renderer.

Safe to run once. Aborts if it cannot find the expected anchors.
"""
import re
import sys

PATH = "/Users/baophan/movetalk/index.html"
src = open(PATH, encoding="utf-8").read()


def sub_once(pattern, repl, label):
    global src
    new, n = re.subn(pattern, lambda m: repl, src, count=1)
    if n != 1:
        sys.exit(f"anchor not found (or not unique): {label}")
    src = new
    print(f"ok: {label}")


# ---- 1. drop the old hand-written lesson data, point TRACKS.e2 at LESSON_DATA
sub_once(
    r"const E2_LESSONS=\{[\s\S]*?\n\};\nTRACKS\.e2\.lessons=E2_LESSONS;",
    "TRACKS.e2.lessons=LESSON_DATA;",
    "replace E2_LESSONS with LESSON_DATA",
)

# ---- 2. lesson header gains the 'today' chips
sub_once(
    r"    <div class=\"e2-lesson-goal\">\$\{L\?\(L\.vi\?L\.vi\+' · ':''\)\+\(L\.goal\|\|''\):\(T\.sub\+' — nội dung bài này sẽ được cập nhật sau\.'\)\}</div>`;",
    """    <div class="e2-lesson-goal">${L?(L.vi?L.vi+' · ':'')+(L.goal||''):(T.sub+' — nội dung bài này sẽ được cập nhật sau.')}</div>
    ${L&&L.today?`<div class="e2-today">${L.today.map(t=>`<span class="e2-today-chip">${t}</span>`).join('')}</div>`:''}`;""",
    "add today chips to lesson header",
)

# ---- 3. part cards show how much content each part holds
sub_once(
    r"    main\.innerHTML=head\+`<div class=\"e2-part-grid\">\$\{TRACK_PARTS\.map\(p=>`<button class=\"e2-part\" onclick=\"trackPart\('\$\{tk\}','\$\{p\.id\}'\)\"><span class=\"e2-part-ico\">\$\{p\.ico\}</span><span class=\"e2-part-name\">\$\{p\.name\}</span><span class=\"e2-part-sub\">\$\{p\.sub\}</span></button>`\)\.join\(''\)\}</div>`;",
    """    main.innerHTML=head+`<div class="e2-part-grid">${TRACK_PARTS.map(p=>{
      const blocks=(L.parts&&L.parts[p.id])||[];
      const n=blocks.length;
      return `<button class="e2-part${n?'':' empty'}" ${n?`onclick="trackPart('${tk}','${p.id}')"`:'disabled'}><span class="e2-part-ico">${p.ico}</span><span class="e2-part-name">${p.name}</span><span class="e2-part-sub">${p.sub}${n?' · '+n+' mục':''}</span></button>`;
    }).join('')}</div>`;""",
    "part cards with block counts",
)

# ---- 4. replace trackBody() with the block renderer
old_body_start = src.index("function trackBody(part,L,tk){")
old_body_end = src.index("function trackAnswer(btn,ok){")
new_body = r'''function trackBody(part,L,tk){
  const blocks=(L.parts&&L.parts[part])||[];
  if(!blocks.length){
    const p=TRACK_PARTS.find(x=>x.id===part);
    return `<div class="e2-task-card"><div class="e2-task-label">Đang cập nhật</div><div class="e2-task-text">Phần <b>${p?p.name:part}</b> của bài này sẽ được bổ sung sau.</div></div>`;
  }
  return blocks.map(b=>renderBlock(b)).join('');
}

function renderBlock(b){
  if(!b||!b.t)return '';
  switch(b.t){
    case 'h':return `<h4 class="blk-h">${b.text}</h4>`;
    case 'p':return `<p class="blk-p">${b.text}</p>`;
    case 'label':return `<div class="blk-label">${b.text}</div>`;
    case 'ex':return `<div class="blk-ex">${b.text}</div>`;
    case 'note':return `<div class="blk-note"><span class="blk-note-ico">💡</span><span>${b.text}</span></div>`;
    case 'chips':return `<div class="blk-chips">${b.items.map(c=>`<span class="blk-chip">${c}</span>`).join('')}</div>`;
    case 'list':return `<ul class="blk-list">${b.items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
    case 'say':return `<div class="blk-say">${b.items.map(s=>`<div class="blk-say-row"><span>${s}</span>${sayBtn(s)}</div>`).join('')}</div>`;
    case 'bank':return `<div class="blk-bank"><span class="blk-bank-label">WORD BANK</span>${b.items.map(w=>`<span class="blk-bank-item">${w}</span>`).join('')}</div>`;
    case 'words':return `<div class="blk-words">${b.items.map(w=>`<div class="blk-word"><div class="blk-word-en">${w.en} ${sayBtn(w.en)}</div>${w.vi?`<div class="blk-word-vi">${w.vi}</div>`:''}${w.def?`<div class="blk-word-def">${w.def}</div>`:''}</div>`).join('')}</div>`;
    case 'table':return `<div class="blk-table-wrap"><table class="blk-table"><thead><tr>${b.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'frames':return b.groups.map(g=>`<div class="blk-frame-group"><div class="blk-frame-name">${g.group}</div><div class="blk-frame-items">${g.items.map(i=>`<div class="blk-frame-item"><span>${i}</span>${sayBtn(i)}</div>`).join('')}</div></div>`).join('');
    case 'layers':return `<div class="blk-layers">${b.items.map((l,i)=>`<div class="blk-layer"><div class="blk-layer-head"><span class="blk-layer-num">${i+1}</span><span class="blk-layer-label">${l.label}</span></div><div class="blk-layer-text">${l.text} ${sayBtn(l.text)}</div></div>`).join('')}</div>`;
    case 'quiz':return `<div class="blk-quiz">${b.items.map((e,i)=>`<div class="blk-quiz-item"><div class="blk-quiz-q">${i+1}. ${e.q}</div><div class="blk-quiz-opts">${e.options.map((o,j)=>`<button class="blk-quiz-opt" onclick="blockAnswer(this,${j===e.answer})">${o}</button>`).join('')}</div></div>`).join('')}</div>`;
    case 'fill':return `<div class="blk-fill">${b.items.map(l=>`<div class="blk-fill-line"><span class="blk-fill-speaker">${l.speaker}</span><span class="blk-fill-text">${l.text}</span>${sayBtn(l.text)}</div>`).join('')}</div>`;
    case 'dialog':{
      const lines=(b.lines||[]).map(l=>`<div class="blk-fill-line"><span class="blk-fill-speaker">${l.speaker}</span><span class="blk-fill-text">${l.text}</span>${sayBtn(l.text)}</div>`).join('');
      const meta=[b.target?`<span class="blk-meta-tag">🎯 ${b.target}</span>`:'',b.lift?`<span class="blk-meta-tag">⬆️ ${b.lift}</span>`:''].join('');
      const acts=[b.audio?`<button class="e2-say primary" onclick="playOriginal('${esc(b.audio)}',this)">🎧 Nghe bản gốc</button>`:'',`<button class="e2-say" onclick="playBlockDialog('${tk}','${TRACK_PART[tk]||''}',${b.__i||0})">▶ Play all</button>`].join('');
      return `<div class="e2-conv-card"><div class="e2-conv-title"><span>${b.title}</span><span class="e2-conv-actions">${acts}</span></div>${meta?`<div class="blk-meta">${meta}</div>`:''}${b.question?`<div class="blk-dialog-q">❓ ${b.question}</div>`:''}${lines}${b.check?`<div class="blk-check"><div class="blk-check-label">Conversation check</div><ol class="blk-check-list">${b.check.map(c=>`<li>${c}</li>`).join('')}</ol></div>`:''}${b.answers?`<details class="blk-answers"><summary>Xem đáp án</summary><div>${b.answers}</div></details>`:''}${b.note?`<div class="blk-note"><span class="blk-note-ico">💡</span><span>${b.note}</span></div>`:''}</div>`;
    }
    case 'steps':return `<div class="e2-roleplay-card"><div class="e2-roleplay-title">${b.title}</div>${b.context?`<div class="blk-context">${b.context}</div>`:''}<ol class="blk-steps">${b.steps.map(s=>`<li>${s}</li>`).join('')}</ol>${b.useful?`<div class="blk-useful"><b>Useful language:</b> ${b.useful}</div>`:''}</div>`;
    case 'retrieval':return `<div class="blk-retrieval">${b.items.map(r=>`<div class="blk-ret-item"><span class="blk-ret-vi">${r.vi}</span><span class="blk-ret-arrow">→</span><span class="blk-ret-en">${r.en}</span>${sayBtn(r.en)}</div>`).join('')}</div>`;
    default:return '';
  }
}

function blockAnswer(btn,ok){
  btn.classList.remove('ok','no');
  btn.classList.add(ok?'ok':'no');
  toast(ok?'Correct!':'Wrong answer',ok?'ok':'err');
}

function playBlockDialog(tk,part,ci){
  stopConversation();
  const L=TRACKS[tk]&&TRACKS[tk].lessons[TRACK_NUM[tk]];
  const blocks=(L&&L.parts&&L.parts[part])||[];
  const dialogs=blocks.filter(b=>b.t==='dialog');
  const d=dialogs[ci];
  if(!d||!d.lines||!d.lines.length)return;
  CONV_QUEUE=d.lines.map(l=>l.text);
  CONV_IDX=0;
  toast('Playing conversation…','ok');
  playNextLine();
}

'''
src = src[:old_body_start] + new_body + src[old_body_end:]
print("ok: replace trackBody with block renderer")

# ---- 5. index dialogs so Play all can find them
src = src.replace(
    "  return blocks.map(b=>renderBlock(b)).join('');",
    "  let di=0;\n  return blocks.map(b=>{if(b.t==='dialog'){b.__i=di++}return renderBlock(b)}).join('');",
)

open(PATH, "w", encoding="utf-8").write(src)
print("\nmigration complete")
