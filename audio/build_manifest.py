#!/usr/bin/env python3
"""Embed the rendered-clip map into index.html.

Takes jobs.json (text -> clip path), builds a JS object keyed by the exact
lesson text, and rewrites the AUDIO_MAP block inside index.html so the 🔊
buttons play the cloned-voice clips instead of the browser's default voice.

Run after render_voice.py:
  python3 build_manifest.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
JOBS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jobs.json")

BEGIN = "/* AUDIO_MAP:BEGIN */"
END = "/* AUDIO_MAP:END */"


def main():
    jobs = json.load(open(JOBS, encoding="utf-8"))
    mapping = {}
    missing = []
    for j in jobs:
        mp3 = os.path.splitext(j["out"])[0] + ".mp3"
        rel = os.path.relpath(mp3, ROOT)
        if os.path.exists(mp3):
            mapping[j["text"]] = rel
        else:
            missing.append(j["text"])

    body = json.dumps(mapping, ensure_ascii=False, indent=0).replace("\n", "")
    block = f"{BEGIN}\nconst AUDIO_MAP={body};\n{END}"

    src = open(INDEX, encoding="utf-8").read()
    if BEGIN not in src:
        # first run: inject before the speak() definition
        anchor = "function speak(text){"
        if anchor not in src:
            sys.exit("cannot find speak() to anchor the manifest")
        src = src.replace(anchor, block + "\n" + anchor)
    else:
        src = re.sub(re.escape(BEGIN) + r"[\s\S]*?" + re.escape(END), block, src, count=1)

    open(INDEX, "w", encoding="utf-8").write(src)
    print(f"embedded {len(mapping)} clips into index.html")
    if missing:
        print(f"{len(missing)} jobs not rendered yet, e.g.:", file=sys.stderr)
        for t in missing[:5]:
            print("  -", t, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
