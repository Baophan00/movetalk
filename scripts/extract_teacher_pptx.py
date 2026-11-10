#!/usr/bin/env python3
"""Extract the 10 teacher PPTX decks (Desktop/new MM) into MoveTalk teacher data.

Outputs:
  app/src/data/teacherLessons/l01.ts ... l10.ts   (slides + sections + dialogue)
  app/public/teach/l0N/media/*                    (images extracted from deck)
  /tmp/teach_scenes.json                          (dialogue scenes for audio step)
"""
import zipfile, re, html, os, json, sys, shutil
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser("~/Desktop/new MM")
DATA_DIR = os.path.join(ROOT, "app", "src", "data", "teacherLessons")
PUB_DIR = os.path.join(ROOT, "app", "public", "teach")

SECTIONS = [
    "REVIEW MAP", "RECONNECTION", "RECONNECT", "VOCABULARY", "GRAMMAR",
    "LISTENING", "PRONUNCIATION", "ACTIVATION", "REAL TALK",
    "REFLECTION & RETRY", "DAILY MISSION", "EXTENSION BANK", "EXTENSION",
    "SPEAKING", "NOUN PHRASE CHALLENGE", "NOUN PHRASES", "OPTIONAL SCENES",
    "REFERENCE",
]
SECTION_ALIAS = {
    "RECONNECT": "RECONNECTION",
    "EXTENSION BANK": "EXTENSION",
    "OPTIONAL SCENES": "EXTENSION",
    "NOUN PHRASES": "NOUN PHRASE CHALLENGE",
}
SECTION_LABEL = {
    "OVERVIEW": "Overview",
    "REVIEW MAP": "Review map",
    "RECONNECTION": "Reconnection",
    "VOCABULARY": "Vocabulary",
    "GRAMMAR": "Grammar",
    "LISTENING": "Listening",
    "PRONUNCIATION": "Pronunciation",
    "ACTIVATION": "Activation",
    "REAL TALK": "Real Talk",
    "REFLECTION & RETRY": "Reflection & Retry",
    "DAILY MISSION": "Daily Mission",
    "EXTENSION": "Extension",
    "SPEAKING": "Speaking",
    "NOUN PHRASE CHALLENGE": "Noun Phrase Challenge",
    "REFERENCE": "Reference",
}
SECTION_ICON = {
    "OVERVIEW": "🧭",
    "REVIEW MAP": "🗺️", "RECONNECTION": "🔄", "VOCABULARY": "📖",
    "GRAMMAR": "📐", "LISTENING": "🎧", "PRONUNCIATION": "🗣️",
    "ACTIVATION": "⚡", "REAL TALK": "💬", "REFLECTION & RETRY": "🔁",
    "DAILY MISSION": "🎯", "EXTENSION": "🧩", "SPEAKING": "🎙️",
    "NOUN PHRASE CHALLENGE": "🧱", "REFERENCE": "📌",
}

JUNK = re.compile(r'^(MOVE\.?|MOVE ·|MOVE English|FOUNDATION 1|MOVEAPP|English you can use)$', re.I)
JUNK_SPEAKERS = {"NOTICE", "DO", "DOES", "CHECK", "MODEL", "NOTE", "KEY", "ANSWER", "ANSWERS", "RECALL", "CHUNK"}

def norm_section(name: str) -> str:
    n = re.sub(r'\s*\d+\s*$', '', name.strip())  # LISTENING 1 -> LISTENING
    n = re.sub(r'\s+', ' ', n)
    if n.upper() in SECTION_ALIAS: return SECTION_ALIAS[n.upper()]
    up = {s.upper(): s for s in SECTIONS}
    key = up.get(n.upper(), n)
    return SECTION_ALIAS.get(key.upper(), key)

def clean(line: str) -> str:
    line = line.replace('\u00a0', ' ').strip()
    line = re.sub(r'\s+', ' ', line)
    return line


A_NS = '{http://schemas.openxmlformats.org/drawingml/2006/main}'

def slide_paragraphs(xml):
    """One PPT text paragraph = one line. Runs inside a paragraph are joined,
    so sentences don't arrive chopped into 'Do' / 'you work nearby?'."""
    try:
        root = ET.fromstring(xml)
    except Exception:
        return []
    out = []
    for para in root.iter(A_NS + 'p'):
        chunks = []
        for node in para.iter():
            if node.tag == A_NS + 't':
                chunks.append(node.text or '')
            elif node.tag == A_NS + 'br':
                chunks.append('\n')
        text = html.unescape(''.join(chunks))
        for line in text.split('\n'):
            line = clean(line)
            if line:
                out.append(line)
    return out

SPEAKER_STOP = {
    'WHAT', 'WHERE', 'WHEN', 'WHY', 'WHO', 'WHICH', 'HOW', 'HOW LONG', 'HOW OFTEN',
    'TALK', 'TALK FIRST', 'FIRST', 'NEXT', 'LISTEN', 'LISTENING', 'LISTENING MISSION',
    'MISSION', 'SPEAK', 'SPEAKING', 'READ', 'READING', 'WRITE', 'WRITING',
    'ADD', 'ASK', 'ASK BACK', 'ANSWER', 'QUESTION', 'QUESTIONS', 'NOTICE', 'NOTE',
    'REVIEW', 'EXTENSION', 'MODEL', 'PART', 'PRACTICE', 'DRILL', 'CHECK',
    'READY', 'READY.', 'FRIENDLY', 'FRIENDLY.', 'KIND', 'KIND.', 'ARE', 'IS', 'DO', 'DOES',
    'BEEN', 'THOSE', 'THESE', 'ARTICLES', 'DEMONSTRATIVES', 'POSSESSIVES', 'QUANTIFIERS',
    'NOUN', 'NOUN TYPE', 'GROUP', 'GROUP REFERENCE', 'REFERENCE', 'MEANING', 'SPEECH',
    'PAST', 'PAST SIMPLE', 'PRESENT', 'PRESENT PERFECT', 'PURCHASE', 'A PURCHASE',
    'PROBLEM', 'A PROBLEM', 'PLACE', 'A PLACE', 'PERSON', 'A PERSON', 'TASK', 'A TASK',
    'RECENT', 'A RECENT TASK', 'SMALL PROBLEM', 'A SMALL PROBLEM',
}

def valid_speaker(sp):
    s = sp.strip().rstrip('.')
    if not s or len(s) > 14 or len(s.split()) > 3:
        return False
    if s.upper() in SPEAKER_STOP:
        return False
    return bool(re.fullmatch(r"[A-Z][A-Z .&'’-]*", s))

def merge_stray(lines):
    """PowerPoint leaves punctuation on its own line. Glue it back so the web shows sentences."""
    out = []
    for raw in lines:
        line = clean(raw)
        if not line:
            continue
        if out and re.fullmatch(r'[.,!?;:]+', line):
            out[-1] += line
            continue
        if out and (line.startswith(',') or line.startswith('.') or line.startswith('?')):
            out[-1] += line
            continue
        if out and line == '/':
            out[-1] += ' /'
            continue
        out.append(line)
    return out

def speaker_turns(lines):
    """Parse speaker: text pairs; join continuation lines into the same turn."""
    def is_speaker_line(l):
        m = re.match(r"^([A-Z][A-Za-z'’ .]{1,20}):", l)
        if m:
            return valid_speaker(m.group(1))
        if re.fullmatch(r"[A-Z][A-Z .&'’-]{1,14}", l) and l == l.upper():
            return valid_speaker(l)
        return False

    turns = []
    i = 0
    while i < len(lines):
        l = lines[i]
        m = re.match(r"^([A-Z][A-Za-z'’ .]{1,20}):\s*(.+)$", l)
        if m and valid_speaker(m.group(1)):
            sp = m.group(1).strip()
            buf = [m.group(2).strip()]
            i += 1
        elif re.fullmatch(r"[A-Z][A-Z .&'’-]{1,14}", l) and l == l.upper() and valid_speaker(l):
            sp = l
            buf = []
            i += 1
        else:
            i += 1
            continue
        while i < len(lines) and not is_speaker_line(lines[i]):
            if lines[i].strip():
                buf.append(lines[i].strip())
            i += 1
        text = ' '.join(buf).strip()
        if sp.upper() in JUNK_SPEAKERS:
            continue
        if not re.search(r'[A-Za-z0-9]', text):
            continue
        if text:
            turns.append((sp, text))
    if len(turns) < 4:
        return []
    counts = {}
    for sp, _ in turns:
        counts[sp] = counts.get(sp, 0) + 1
    if len(counts) < 2:
        return []
    if any(n < 2 for n in counts.values()):
        return []
    if len(counts) > 6:
        return []
    if sum(len(tx) for _, tx in turns) / len(turns) < 12:
        return []
    return turns

def ts_escape(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

def process_deck(path, lesson_no, tag):
    z = zipfile.ZipFile(path)
    names = z.namelist()
    slide_xmls = sorted(
        [n for n in names if re.match(r'ppt/slides/slide\d+\.xml$', n)],
        key=lambda x: int(re.search(r'slide(\d+)', x).group(1)))
    slides = []
    scenes = []
    media_copied = {}
    IMG_MAP = json.load(open('/tmp/images.json', encoding='utf-8')) if os.path.exists('/tmp/images.json') else {}
    sec_order = []
    sec_blurb = {}
    cur_section = None

    for sx in slide_xmls:
        num = int(re.search(r'slide(\d+)', sx).group(1))
        xml = z.read(sx).decode('utf-8', 'ignore')
        raw = slide_paragraphs(xml)
        lines = []
        prev = None
        for t in raw:
            if not t or JUNK.match(t) or t == prev:
                continue
            if '©' in t or 'Internal Teaching Material' in t:
                continue
            if re.match(r'^MOVE\s*[·|]\s*FOUNDATION', t, re.I):
                continue
            # skip slide-number-only runs
            if re.fullmatch(r'\d{1,2}', t):
                continue
            lines.append(t)
            prev = t

        # speaker notes
        notes = ''
        ns = f'ppt/notesSlides/notesSlide{num}.xml'
        if ns in names:
            nxml = z.read(ns).decode('utf-8', 'ignore')
            nlines = [clean(html.unescape(t)) for t in re.findall(r'<a:t>(.*?)</a:t>', nxml)]
            notes = ' '.join(t for t in nlines if t)
            # Authoring boilerplate repeats on every slide and is noise for teachers.
            notes = re.split(r' ?Source: user-uploaded', notes)[0].strip()

        # images
        images = []
        if IMG_MAP:
            images = [str(x) for x in IMG_MAP.get(str(lesson_no), {}).get(str(num), [])]
        rels = f'ppt/slides/_rels/slide{num}.xml.rels'
        if not images and rels in names:
            rxml = z.read(rels).decode('utf-8', 'ignore')
            for m in re.finditer(r'Target="\.\./media/([^"]+)"', rxml):
                media_name = m.group(1)
                src = f'ppt/media/{media_name}'
                if src not in names:
                    continue
                dst_dir = os.path.join(PUB_DIR, f'l{lesson_no:02d}', 'media')
                os.makedirs(dst_dir, exist_ok=True)
                dst = os.path.join(dst_dir, media_name)
                if not os.path.exists(dst):
                    with open(dst, 'wb') as fo:
                        fo.write(z.read(src))
                images.append(f'/teach/l{lesson_no:02d}/media/{media_name}')
                media_copied.setdefault(lesson_no, []).append(media_name)

        if not lines:
            continue

        # ── classification ──
        if num == 1:
            continue  # title slide
        first = lines[0]
        rest = lines[1:]

        sec = None
        kind = ''
        title, instruction, content = '', '', []

        # 1) divider slide: "FOUNDATION 1 | SECTION | blurb" (one line or multi-line, usually hidden 1001+)
        m = re.match(r'^FOUNDATION\s*1\s*[|·]\s*(.+)$', first, re.I)
        if m:
            toks = [x.strip() for x in re.split(r'[|·]', m.group(1), maxsplit=1)]
            sec = norm_section(toks[0])
            blurb = toks[1] if len(toks) > 1 else ''
            if sec not in sec_order: sec_order.append(sec)
            if blurb: sec_blurb.setdefault(sec, blurb)
            cur_section = sec
            continue
        if first.upper() == 'FOUNDATION 1' and len(lines) >= 2:
            sec = norm_section(lines[1])
            if sec not in sec_order: sec_order.append(sec)
            if len(lines) >= 3: sec_blurb.setdefault(sec, lines[2])
            cur_section = sec
            continue

        # 2) bare section divider: "VOCABULARY" (+ short blurb) — no content
        if first in SECTIONS and len(lines) <= 2:
            sec = first
            if sec not in sec_order: sec_order.append(sec)
            if len(lines) == 2: sec_blurb.setdefault(sec, lines[1])
            cur_section = sec
            continue

        known = {norm_section(s) for s in SECTIONS}

        # 3) overview slide
        if first.upper() == 'LESSON OVERVIEW':
            sec = 'OVERVIEW'
            if sec not in sec_order: sec_order.append(sec)
            cur_section = sec
            title = 'Lesson overview'
            instruction = rest[0] if rest else ''
            content = rest[1:]
        else:
            # 4) "SECTION · KIND" — kind is a sub-type
            mD = re.match(r'^([A-Z][A-Z &0-9\-]+?)\s*·\s*(.+)$', first)
            mP = re.match(r'^([A-Z][A-Z &0-9\-]+?)\s*\|\s*(.+)$', first)
            if mD and norm_section(mD.group(1)) in known:
                sec = norm_section(mD.group(1))
                kind = clean(mD.group(2))
                title = rest[0] if rest else ''
                instruction = rest[1] if len(rest) > 1 else ''
                content = rest[2:]
            elif mP and norm_section(mP.group(1)) in known:
                # L01-style "SECTION | Title"
                sec = norm_section(mP.group(1))
                title = clean(mP.group(2))
                instruction = rest[0] if rest else ''
                content = rest[1:]
            elif first in SECTIONS:
                sec = first
                title = rest[0] if rest else ''
                instruction = rest[1] if len(rest) > 1 else ''
                content = rest[2:]
            else:
                sec = cur_section or 'OVERVIEW'
                title = first
                instruction = rest[0] if rest else ''
                content = rest[1:]
        if sec and sec not in sec_order:
            sec_order.append(sec)
        cur_section = sec

        if not sec:
            continue

        dialogue = None
        turns = speaker_turns(content)
        if len(turns) >= 3:
            sp = []
            for s, _ in turns:
                if s not in sp: sp.append(s)
            dialogue = {'speakers': sp, 'lines': [{'s': s, 't': t} for s, t in turns]}

        content = merge_stray(content)

        slides.append({
            'num': num, 'section': sec, 'kind': kind, 'title': title,
            'instruction': instruction, 'lines': content,
            'dialogue': dialogue, 'notes': notes,
            'images': images,
        })

        # scene detection for audio step
        is_scene = bool(dialogue) and (
            re.search(r'(DIALOGUE|TRANSCRIPT|MODEL CONVERSATION|CONVERSATION|READ & RECORD)', kind, re.I)
            or re.search(r'·\s*[A-Z][a-z]+(?:\s*&\s*[A-Z][a-z]+)+', title)
        )
        if is_scene:
            scenes.append({
                'lesson': lesson_no, 'slide': num, 'title': title, 'kind': kind,
                'image': images[0] if images else '',
                'speakers': dialogue['speakers'],
                'lines': dialogue['lines'],
            })

    # deck title from slide 1
    z1 = z.read('ppt/slides/slide1.xml').decode('utf-8', 'ignore')
    t1 = [clean(html.unescape(t)) for t in re.findall(r'<a:t>(.*?)</a:t>', z1)]
    t1 = [t for t in t1 if t]
    deck_title = ''
    for t in t1:
        m = re.match(r'^L(\d{2})\s*[·|]\s*(.+)$', t, re.I)
        if m:
            deck_title = clean(m.group(2)); break
    if not deck_title and len(t1) >= 3:
        deck_title = clean(t1[2])

    return {'slides': slides, 'scenes': scenes, 'order': sec_order,
            'blurb': sec_blurb, 'title': deck_title, 'images': media_copied.get(lesson_no, [])}

def emit_ts(lesson_no, deck, tag):
    order = deck['order']
    # make sure every section used by slides is in order
    for s in deck['slides']:
        if s['section'] not in order:
            order.append(s['section'])
    secs = []
    for k in order:
        if not any(s['section'] == k for s in deck['slides']):
            continue
        secs.append({'key': k, 'label': SECTION_LABEL.get(k, k),
                     'icon': SECTION_ICON.get(k, '📄'),
                     'blurb': deck['blurb'].get(k, '')})
    parts = []
    parts.append('export type TeachTurn = { s: string; t: string }')
    parts.append('export type TeachSlide = {')
    parts.append('  num: number; section: string; kind: string; title: string; instruction: string')
    parts.append('  lines: string[]; dialogue?: { speakers: string[]; lines: TeachTurn[] } | null')
    parts.append('  notes: string; images: string[]')
    parts.append('}')
    parts.append('export type TeachSection = { key: string; label: string; icon: string; blurb: string }')
    parts.append(f'export const TEACH_L{lesson_no:02d} = {{')
    parts.append(f"  lesson: {lesson_no}, tag: '{tag}', title: '{ts_escape(deck['title'])}',")
    parts.append('  sections: [')
    for s in secs:
        parts.append(f"    {{ key: '{s['key']}', label: '{ts_escape(s['label'])}', icon: '{s['icon']}', blurb: '{ts_escape(s['blurb'])}' }},")
    parts.append('  ] as TeachSection[],')
    parts.append('  slides: [')
    for s in deck['slides']:
        d = s['dialogue']
        spk_ts = ', '.join("'" + ts_escape(x) + "'" for x in d['speakers']) if d else ''
        if d:
            turn_ts = ', '.join("{ s: '" + ts_escape(t['s']) + "', t: '" + ts_escape(t['t']) + "' }" for t in d['lines'])
            dial = '{ speakers: [' + spk_ts + '], lines: [' + turn_ts + '] }'
        else:
            dial = 'null'
        imgs = ', '.join(f"'{ts_escape(i)}'" for i in s['images'])
        parts.append('    {')
        parts.append(f"      num: {s['num']}, section: '{ts_escape(s['section'])}', kind: '{ts_escape(s['kind'])}',")
        parts.append(f"      title: '{ts_escape(s['title'])}', instruction: '{ts_escape(s['instruction'])}',")
        lines_ts = ', '.join("'" + ts_escape(l) + "'" for l in s['lines'])
        parts.append(f"      lines: [{lines_ts}],")
        parts.append(f'      dialogue: {dial},')
        parts.append(f"      notes: '{ts_escape(s['notes'])}',")
        parts.append(f'      images: [{imgs}],')
        parts.append('    },')
    parts.append('  ] as TeachSlide[],')
    parts.append('}')
    os.makedirs(DATA_DIR, exist_ok=True)
    out = os.path.join(DATA_DIR, f'l{lesson_no:02d}.ts')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* auto-generated by scripts/extract_teacher_pptx.py — source: Desktop/new MM */\n')
        f.write('\n'.join(parts) + '\n')
    return out

def main():
    files = sorted(f for f in os.listdir(SRC)
                   if f.lower().endswith('.pptx') and not f.startswith('~$'))
    all_scenes = []
    for f in files:
        m = re.search(r'_1_L(\d{2})[_\s]', f) or re.search(r'L(\d{2})[_\s]', f)
        if not m:
            print('SKIP (no lesson number):', f); continue
        no = int(m.group(1))
        deck = process_deck(os.path.join(SRC, f), no, f)
        out = emit_ts(no, deck, f)
        all_scenes.extend(deck['scenes'])
        nsec = len(deck['order'])
        ndia = sum(1 for s in deck['slides'] if s['dialogue'])
        nimg = len(deck['images'])
        print(f"L{no:02d}: slides={len(deck['slides']):3d} sections={nsec:2d} dialogues={ndia:2d} scenes={len(deck['scenes']):2d} images={nimg} notes={sum(1 for s in deck['slides'] if s['notes'])} -> {out}")
    with open('/tmp/teach_scenes.json', 'w', encoding='utf-8') as f:
        json.dump(all_scenes, f, ensure_ascii=False, indent=1)
    print(f'TOTAL scenes for audio: {len(all_scenes)}')

if __name__ == '__main__':
    main()
