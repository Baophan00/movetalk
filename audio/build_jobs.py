#!/usr/bin/env python3
"""Build the render job list for every lesson in MoveTalk.

Reads LESSON_DATA (block schema) straight out of index.html, assigns a
voice per string, and prints a JSON job array on stdout.

Voice assignment
----------------
* dialog lines -> the line's speaker (male names -> alex, else mia)
* everything else -> DEFAULT_VOICE (mia)

Output paths are content-hashed so editing one sentence only re-renders that
one file, and identical sentences are rendered once.
"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
AUDIO = os.path.join(ROOT, "audio")
CLIPS = os.path.join(AUDIO, "clips")

MALE = {"alex", "ben", "daniel", "liam", "dan", "tom", "david", "john", "mark"}
DEFAULT_VOICE = "mia"


def load_lesson_data():
    """Evaluate LESSON_DATA out of index.html without a browser."""
    import subprocess
    import tempfile

    js = re.search(r"<script>([\s\S]*?)</script>\s*</body>", open(INDEX, encoding="utf-8").read()).group(1)
    stub = (
        "({getElementById:()=>({innerHTML:'',classList:{add(){},remove(){},toggle(){}},"
        "textContent:'',dataset:{},addEventListener(){},querySelectorAll:()=>[]}),"
        "querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({classList:{add(){},remove(){}},"
        "style:{},appendChild(){}}),documentElement:{dataset:{}}})"
    )
    driver = "\n".join([
        f"globalThis.document = {stub};",
        "globalThis.window = {innerWidth:1400, scrollTo(){}};",
        "globalThis.addEventListener = () => {};",
        "globalThis.IntersectionObserver = class { observe(){} unobserve(){} };",
        "globalThis.localStorage = {getItem:()=>null, setItem(){}, removeItem(){}};",
        "globalThis.location = {hash:''};",
        "globalThis.setInterval = () => 0;",
        "globalThis.clearInterval = () => {};",
        "globalThis.setTimeout = () => {};",
        js,
        "console.log(JSON.stringify(LESSON_DATA));",
    ])
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
        fh.write(driver)
        path = fh.name
    try:
        out = subprocess.run(["node", path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if out.returncode:
        sys.exit("failed to evaluate LESSON_DATA:\n" + out.stderr)
    return json.loads(out.stdout)


def slug(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def voice_for(speaker):
    return "alex" if (speaker or "").strip().lower() in MALE else DEFAULT_VOICE


def is_english(text):
    """False for Vietnamese labels/answers — the cloned voices are English only."""
    t = text.strip()
    if not t:
        return False
    # Vietnamese diacritics are decisive
    if re.search(r"[àáảãạăâđêôơưèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]", t.lower()):
        return False
    # a string with no latin letters at all is not worth speaking
    if not re.search(r"[a-zA-Z]", t):
        return False
    # Vietnamese function words that carry no diacritics
    vi_words = r"\b(cau|nao|hay|chon|dien|dung|sai|bai|tu|ngu|nghia|tra loi|vi du)\b"
    if re.search(vi_words, t.lower()):
        return False
    return True


def add(seen, order, text, voice):
    text = (text or "").strip()
    if not text:
        return
    if not is_english(text):
        return
    key = text.lower()
    if key in seen:
        return
    seen[key] = True
    order.append((text, voice))


def collect(lessons):
    """-> list of (text, voice) in a stable order, deduped."""
    seen = {}
    order = []
    for num in sorted(lessons, key=lambda n: int(n)):
        L = lessons[num]
        parts = L.get("parts") or {}
        for part_id in sorted(parts):
            blocks = parts[part_id] or []
            for b in blocks:
                t = b.get("t")
                if t == "words":
                    for item in b.get("items", []):
                        if isinstance(item, dict):
                            add(seen, order, item.get("en"), DEFAULT_VOICE)
                        else:
                            add(seen, order, item, DEFAULT_VOICE)
                elif t == "bank":
                    for item in b.get("items", []):
                        if isinstance(item, dict):
                            add(seen, order, item.get("en"), DEFAULT_VOICE)
                        else:
                            add(seen, order, item, DEFAULT_VOICE)
                elif t == "quiz":
                    for item in b.get("items", []):
                        add(seen, order, item.get("q"), DEFAULT_VOICE)
                        for opt in item.get("options", item.get("opts", [])):
                            add(seen, order, opt, DEFAULT_VOICE)
                elif t == "dialog":
                    for line in b.get("lines", []):
                        add(seen, order, line.get("text"), voice_for(line.get("speaker")))
                elif t == "fill":
                    for item in b.get("items", []):
                        add(seen, order, item.get("before"), DEFAULT_VOICE)
                        add(seen, order, item.get("after"), DEFAULT_VOICE)
                elif t == "p":
                    add(seen, order, b.get("text"), DEFAULT_VOICE)
                elif t == "ex":
                    for item in b.get("items", []):
                        add(seen, order, item.get("en"), DEFAULT_VOICE)
    return order


def main():
    lessons = load_lesson_data()
    items = collect(lessons)
    jobs = [
        {
            "text": text,
            "voice": voice,
            "out": os.path.join(CLIPS, f"{slug(text)}.wav"),
        }
        for text, voice in items
    ]
    json.dump(jobs, sys.stdout, ensure_ascii=False, indent=1)
    print(file=sys.stderr)
    n_mia = sum(1 for j in jobs if j["voice"] == "mia")
    print(
        f"{len(jobs)} unique strings ({n_mia} mia / {len(jobs)-n_mia} alex), "
        f"{sum(len(j['text']) for j in jobs)} chars",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
