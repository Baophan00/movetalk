#!/usr/bin/env python3
"""Build the render job list for every lesson in MoveTalk.

Reads TRACKS data straight out of index.html (the <script> block), assigns a
voice per string, and prints a JSON job array on stdout.

Voice assignment
----------------
* conversations -> the line's speaker (male names -> alex, else mia)
* everything else -> the lesson's default voice (DEFAULT_VOICE)

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

# Which TRACKS keys hold spoken strings, and how to read them.
SPOKEN_FIELDS = ("vocab", "conversations", "listening", "speaking")


def load_tracks():
    """Evaluate the TRACKS object out of index.html without a browser."""
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
        "console.log(JSON.stringify(TRACKS));",
    ])
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
        fh.write(driver)
        path = fh.name
    try:
        out = subprocess.run(["node", path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if out.returncode:
        sys.exit("failed to evaluate TRACKS:\n" + out.stderr)
    return json.loads(out.stdout)


def slug(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def voice_for(speaker):
    return "alex" if (speaker or "").strip().lower() in MALE else DEFAULT_VOICE


def collect(tracks):
    """-> list of (text, voice) in a stable order, deduped."""
    seen = {}
    order = []
    for tk in sorted(tracks):
        lessons = tracks[tk].get("lessons") or {}
        for num in sorted(lessons, key=lambda n: int(n)):
            L = lessons[num]
            for field in SPOKEN_FIELDS:
                val = L.get(field)
                if not val:
                    continue
                if field == "vocab":
                    for v in val:
                        add(seen, order, v["en"], DEFAULT_VOICE)
                elif field == "conversations":
                    for conv in val:
                        for line in conv.get("lines", []):
                            add(seen, order, line["text"], voice_for(line.get("speaker")))
                else:
                    for s in val:
                        add(seen, order, s, DEFAULT_VOICE)
    return order


def add(seen, order, text, voice):
    text = (text or "").strip()
    if not text:
        return
    key = text.lower()
    if key in seen:
        return
    seen[key] = True
    order.append((text, voice))


def main():
    tracks = load_tracks()
    items = collect(tracks)
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
