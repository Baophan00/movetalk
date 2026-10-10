#!/usr/bin/env python3
"""Embed src/homework.js into index.html between the HOMEWORK markers.

Keeps the app a single deployable HTML file with no runtime build step,
same idea as tools/build_data.py for the lesson data.

Run after editing src/homework.js:
    python3 tools/build_homework.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
SRC = os.path.join(ROOT, "src", "homework.js")

BEGIN = "/* HOMEWORK:BEGIN */"
END = "/* HOMEWORK:END */"


def main():
    with open(SRC, encoding="utf-8") as f:
        js = f.read().rstrip("\n")

    with open(INDEX, encoding="utf-8") as f:
        html = f.read()

    if BEGIN not in html or END not in html:
        sys.exit("markers not found in index.html: expected %s / %s" % (BEGIN, END))

    pattern = re.compile(
        re.escape(BEGIN) + r".*?" + re.escape(END), re.DOTALL
    )
    replacement = BEGIN + "\n" + js + "\n" + END
    new_html, n = pattern.subn(lambda _m: replacement, html, count=1)
    if n != 1:
        sys.exit("expected exactly one homework block, found %d" % n)

    if new_html == html:
        print("index.html already up to date (%d bytes of JS)" % len(js))
        return

    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(new_html)
    print("embedded src/homework.js (%d bytes) into index.html" % len(js))


if __name__ == "__main__":
    main()
