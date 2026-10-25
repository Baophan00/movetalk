#!/usr/bin/env python3
"""Turn one lesson deck into the app's lesson JSON.

The decks are teaching slides, not data: the same eight words appear twice (front then recall),
answers sit on the slide after the question, and every slide carries a footer. This reads the
slide text and rebuilds the ten parts the app renders.

Usage: python3 tools/build_lesson.py L01
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ("©", "MOVE · ACTIVATE", "MOVE ACTIVATE")
IPA = re.compile(r"^/.+/$")
VI_RE = re.compile(r"[àáảãạăằắẳẵặâầấẩẫậêềếểễệôồốổỗộơờớởỡợưừứửữựđ]", re.I)


def clean(lines):
    return [l for l in lines if not any(s in l for s in SKIP)]


def pairs(lines, pred):
    """Collect (line, next line) pairs where `pred` matches the first of the two."""
    out, i = [], 0
    while i < len(lines) - 1:
        if pred(lines[i]):
            out.append((lines[i], lines[i + 1]))
            i += 2
        else:
            i += 1
    return out


def parse_vocab(slides):
    """Vocabulary comes as FRONT/BACK pairs. L01 names the pair MEANING/RECALL, later decks name
    it after the topic (PEOPLE, TRAVEL & TIME…), so match the FRONT/BACK marker instead."""
    front, back = [], []
    for s in slides:
        lines = clean(s["lines"])
        marker = " ".join(lines[:3]).upper()
        if "FRONT" in marker or "MEANING" in s["title"].upper():
            i = 0
            while i < len(lines) - 3:
                if IPA.match(lines[i + 1].strip()):
                    third = lines[i + 2]
                    # L01 front gives an English definition; later decks give the Vietnamese gloss.
                    vi = third if VI_RE.search(third) else ""
                    front.append({
                        "head": lines[i],
                        "ipa": lines[i + 1].strip(),
                        "def": "" if vi else third,
                        "vi_front": vi,
                        "example": lines[i + 3],
                    })
                    i += 4
                else:
                    i += 1
        elif "BACK" in marker or "RECALL" in s["title"].upper():
            i = 0
            while i < len(lines) - 2:
                if IPA.match(lines[i + 1].strip()):
                    back.append({"vi": lines[i], "ipa": lines[i + 1].strip(), "cloze": lines[i + 2]})
                    i += 3
                else:
                    i += 1
    items = []
    for k, f in enumerate(front):
        word, _, pos = f["head"].partition(" · ")
        b = back[k] if k < len(back) else {}
        items.append({
            "word": word.strip(), "pos": pos.strip(), "ipa": f["ipa"], "def": f["def"],
            "example": f["example"], "vi": b.get("vi") or f.get("vi_front", ""), "cloze": b.get("cloze", ""),
        })
    return items


def parse_choose(slides):
    out = []
    for s in slides:
        if "CHOOSE" not in s["title"].upper():
            continue
        lines = clean(s["lines"])
        for a, b in pairs(lines, lambda l: l.strip().startswith("___") or "____" in l):
            out.append({"prompt": a, "vi": b})
    return out


def parse_dialogue(slides):
    for s in slides:
        if "DIALOGUE" in s["title"].upper():
            lines = clean(s["lines"])
            turns, i = [], 0
            while i < len(lines) - 1:
                who = lines[i]
                if who.isupper() and len(who) < 20 and not who.startswith("LISTEN"):
                    turns.append({"who": who.title(), "line": lines[i + 1]})
                    i += 2
                else:
                    i += 1
            if turns:
                return turns
    return []


def parse_check(slides):
    out = []
    for s in slides:
        if "CHECK" in s["title"].upper():
            lines = clean(s["lines"])
            numbered = [l for l in lines if re.match(r"^\d{2} ·", l)]
            for k, q in enumerate(numbered):
                nxt = lines[lines.index(q) + 1] if lines.index(q) + 1 < len(lines) else ""
                out.append({"q": q.split("·", 1)[1].strip(), "a": nxt})
    return out



GRAMMAR_TAGS = ("GRAMMAR IN USE",)

# Everything the deck is made of, in teaching order. Structured parts (vocabulary, grammar,
# dialogue, check) are built above; the rest is kept slide by slide so nothing on the deck is lost.
FLOW_ORDER = ["Overview", "Before you listen", "Pronunciation", "Activate", "Real talk", "Reflect", "Mission", "Point & say"]
FLOW_OF = [
    ("MOVE.", "Overview"),
    ("RECALL & CONNECT", "Warm-up"),
    ("BEFORE LISTENING", "Before you listen"),
    ("PRONUNCIATION", "Pronunciation"),
    ("ACTIVATE", "Activate"),
    ("REAL TALK", "Real talk"),
    ("REFLECT", "Reflect"),
    ("DAILY MISSION", "Mission"),
    ("POINT & SAY", "Point & say"),
]
FLOW_SKIP = ("LANGUAGE BANK", "GRAMMAR IN USE", "DIALOGUE", "· CHECK")
FLOW_EXTRA = {"EVERYDAY SCENES": "Everyday scenes", "SPEAKING": "Speaking", "REVIEW MISSION": "Mission",
              "POINT & SAY": "Point & say", "RECONNECT": "Overview", "NOUN PHRASES": "Grammar"}
VI_MARK = re.compile(r"[àáảãạăâêôơưđ]|\?\s*$")
GLUED = re.compile(r"(?<=[?.!])(?=[A-Z])")


def split_glued(line):
    """PowerPoint glues shapes together, so one line can hold three sentences: 'Do I …?Do we …?'."""
    parts = [p.strip() for p in GLUED.split(line) if p.strip()]
    return [p for p in parts if p not in {"?", ".", "…", "·"}]


def flow_of(title):
    upper = title.upper()
    for tag, group in FLOW_OF:
        if upper.startswith(tag) or tag in upper:
            return group
    for tag, group in FLOW_EXTRA.items():
        if tag in upper:
            return group
    # A deck with its own section names (L07 uses EVERYDAY SCENES): keep the name, title-cased.
    head = upper.split("·")[0].strip()
    head = re.sub(r"\s+\d+$", "", head)          # LISTENING 1 / 2 / 3 are one group
    if not head:
        return "Notes"
    if len(head) > 26 or VI_MARK.search(title):
        return "Notes"                            # a Vietnamese sentence used as a slide title
    return head.capitalize()


def parse_flow(slides):
    groups = {}
    for s in slides:
        title = s["title"].upper()
        if any(skip in title for skip in FLOW_SKIP):
            continue
        # 'ACTIVATE 1' alone is a section divider pointing at the next block, not a slide to teach.
        if re.fullmatch(r"ACTIVATE \d", s["title"].strip(), re.I):
            continue
        lines = clean(s["lines"])
        if not lines:
            continue
        group = flow_of(s["title"])
        head = re.sub(r"^(ACTIVATE 1|MOVE\.)\s*", "", s["title"]).strip()
        groups.setdefault(group, []).append({"title": head or s["title"], "lines": lines})
    order = [g for g in FLOW_ORDER if g in groups] + [g for g in groups if g not in FLOW_ORDER]
    return [{"group": g, "slides": groups[g]} for g in order]


def parse_grammar(slides):
    """Grammar slides differ in layout, so keep them as titled blocks of their own lines.

    Nothing is reordered or rewritten: the app renders section + subtitle + lines, which is what
    the slide shows. That avoids inventing tables the teacher never wrote.
    """
    out = []
    for s in slides:
        title = s["title"].upper()
        if not any(t in title for t in GRAMMAR_TAGS):
            continue
        lines = clean(s["lines"])
        if not lines:
            continue
        head = lines[0]
        sub = lines[1] if len(lines) > 1 and not IPA.match(lines[1].strip()) else ""
        body = lines[2:] if sub else lines[1:]
        body = [part for line in body for part in split_glued(line)]
        out.append({"section": head, "sub": sub, "lines": body})
    return out


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "L01"
    src = json.load(open(os.path.join(ROOT, "data", "a1", "src", f"{label}.json")))
    slides = src["slides"]

    vocab = parse_vocab(slides)
    choose = parse_choose(slides)
    grammar = parse_grammar(slides)
    flow = parse_flow(slides)
    dialogue = parse_dialogue(slides)
    check = parse_check(slides)

    lesson = {
        "n": int(label[1:]),
        "level": "A1",
        "deck": src["deck"],
        "parts": {
            "vocab": vocab,
            "grammarChoose": choose,
            "grammar": grammar,
            "flow": flow,
            "dialogue": dialogue,
            "listenCheck": check,
        },
        "slides": len(slides),
    }

    dest = os.path.join(ROOT, "app", "src", "content", "a1")
    os.makedirs(dest, exist_ok=True)
    path = os.path.join(dest, f"{label}.json")
    json.dump(lesson, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"{label}: vocab {len(vocab)} · grammar {len(grammar)} · dialogue {len(dialogue)} · check {len(check)} · flow {[(f['group'], len(f['slides'])) for f in flow]}")
    for v in vocab[:3]:
        print(f"   {v['word']:8} {v['ipa']:14} {v['vi']:10} {v['cloze'][:40]}")


if __name__ == "__main__":
    main()
