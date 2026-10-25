#!/usr/bin/env python3
"""Extract slide text from the A1 source decks into data/a1/src/.

The decks are the authoring source (PowerPoint, one deck per lesson). The app needs the
text, not the shapes, so every slide becomes {n, title, lines[]} — enough to rebuild the
lesson and to diff against data/a1/L0x.json later.
Usage: python3 tools/extract_deck.py <deck.pptx> <L01>
"""
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def slide_lines(xml: bytes) -> list[str]:
    tree = ET.fromstring(xml)
    out: list[str] = []
    for p in tree.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}p"):
        chunk = "".join(t.text or "" for t in p.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t"))
        chunk = re.sub(r"\s+", " ", chunk).strip()
        if chunk:
            out.append(chunk)
    return out


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: extract_deck.py deck.pptx L01")
    deck, label = sys.argv[1], sys.argv[2]
    slides: list[dict] = []
    with zipfile.ZipFile(deck) as z:
        names = [n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
        names.sort(key=lambda n: int(re.search(r"(\d+)", n).group(1)))
        for i, name in enumerate(names, 1):
            lines = slide_lines(z.read(name))
            slides.append({"n": i, "title": lines[0] if lines else "", "lines": lines})

    dest = os.path.join(ROOT, "data", "a1", "src")
    os.makedirs(dest, exist_ok=True)
    path = os.path.join(dest, f"{label}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"deck": os.path.basename(deck), "slides": slides}, fh, ensure_ascii=False, indent=1)

    chars = sum(len(" ".join(s["lines"])) for s in slides)
    print(f"{label}: {len(slides)} slides, {chars} chars -> {os.path.relpath(path, ROOT)}")
    for s in slides[:6]:
        print(f"  {s['n']:>2}. {s['title'][:70]}")


if __name__ == "__main__":
    main()
