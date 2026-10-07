#!/usr/bin/env python3
"""Embed data/L0*.json into index.html as LESSON_DATA.

Keeps the app a single deployable file with no build step at runtime.
Run after editing anything in data/:
    python3 tools/build_data.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
DATA = os.path.join(ROOT, "data")

BEGIN = "/* LESSON_DATA:BEGIN */"
END = "/* LESSON_DATA:END */"


def main():
    lessons = {}
    for name in sorted(os.listdir(DATA)):
        m = re.fullmatch(r"L(\d+)\.json", name)
        if not m:
            continue
        num = int(m.group(1))
        with open(os.path.join(DATA, name), encoding="utf-8") as fh:
            lessons[num] = json.load(fh)

    if not lessons:
        sys.exit("no L*.json files found in data/")

    body = json.dumps(lessons, ensure_ascii=False, separators=(",", ":"))
    block = f"{BEGIN}\nconst LESSON_DATA={body};\n{END}"

    src = open(INDEX, encoding="utf-8").read()
    if BEGIN in src:
        src = re.sub(re.escape(BEGIN) + r"[\s\S]*?" + re.escape(END), lambda _: block, src, count=1)
    else:
        anchor = "const TRACKS={"
        if anchor not in src:
            sys.exit("cannot find TRACKS to anchor LESSON_DATA")
        src = src.replace(anchor, block + "\n" + anchor, 1)

    open(INDEX, "w", encoding="utf-8").write(src)

    parts = sum(len(L.get("parts", {})) for L in lessons.values())
    blocks = sum(
        len(v) for L in lessons.values() for v in L.get("parts", {}).values()
    )
    print(f"embedded {len(lessons)} lessons: {parts} part-sets, {blocks} blocks")
    for num in sorted(lessons):
        L = lessons[num]
        counts = ", ".join(f"{k}:{len(v)}" for k, v in L["parts"].items())
        print(f"  L{num:02d} {L['title']} — {counts}")


if __name__ == "__main__":
    main()
