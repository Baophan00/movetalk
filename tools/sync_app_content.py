#!/usr/bin/env python3
"""Copy app content out of the single-file build into the React app.

index.html keeps the canonical AUDIO_MAP (text -> clip) because the mp3 files are named by a
content hash; the React app cannot recreate that mapping, so it is lifted verbatim once here
and refreshed with `npm run sync` whenever the audio build changes.
"""
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
CONTENT = os.path.join(APP, "src", "content")
PUBLIC = os.path.join(APP, "public")


def lessons():
    out = []
    data = os.path.join(ROOT, "data")
    for name in sorted(os.listdir(data)):
        m = re.fullmatch(r"L(\d+)\.json", name)
        if not m:
            continue
        with open(os.path.join(data, name), encoding="utf-8") as fh:
            body = json.load(fh)
        body["n"] = int(m.group(1))
        out.append(body)
    return out


def audio_map():
    src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    m = re.search(r"const AUDIO_MAP=(\{.*?\});\n", src, re.S)
    if not m:
        raise SystemExit("AUDIO_MAP not found in index.html")
    return json.loads(m.group(1))


def main():
    os.makedirs(CONTENT, exist_ok=True)
    with open(os.path.join(CONTENT, "lessons.json"), "w", encoding="utf-8") as fh:
        json.dump(lessons(), fh, ensure_ascii=False)
    amap = audio_map()
    with open(os.path.join(CONTENT, "audio-map.json"), "w", encoding="utf-8") as fh:
        json.dump(amap, fh, ensure_ascii=False)

    clips = os.path.join(PUBLIC, "audio", "clips")
    os.makedirs(clips, exist_ok=True)
    copied = 0
    for rel in amap.values():
        name = os.path.basename(rel)
        dst = os.path.join(clips, name)
        src = os.path.join(ROOT, rel)
        if not os.path.exists(dst) and os.path.exists(src):
            shutil.copy2(src, dst)
            copied += 1
    print(f"lessons {len(lessons())} · audio keys {len(amap)} · clips copied {copied}")


if __name__ == "__main__":
    main()
