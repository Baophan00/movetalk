#!/usr/bin/env python3
"""Extract a review/handout .docx into ordered blocks: heading, paragraph, table.

Word stores tables as siblings of paragraphs, so the body is walked in document order —
a review sheet is mostly tables and the comparison only makes sense in place.
Usage: python3 tools/extract_docx.py <file.docx> <out.json>
"""
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def text_of(node) -> str:
    raw = "".join(n.text or "" for n in node.iter(W + "t"))
    return re.sub(r"\s+", " ", raw).strip()


def style_of(p) -> str:
    st = p.find(f"{W}pPr/{W}pStyle")
    return st.get(f"{W}val") if st is not None else ""


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: extract_docx.py file.docx out.json")
    src, dest = sys.argv[1], sys.argv[2]
    with zipfile.ZipFile(src) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{W}body")
    if body is None:
        raise SystemExit("no w:body in " + src)

    blocks: list[dict] = []
    for child in body:
        tag = child.tag
        if tag == f"{W}p":
            txt = text_of(child)
            if not txt:
                continue
            st = style_of(child)
            kind = "heading" if st.lower().startswith("heading") or st.lower() == "title" else "p"
            blocks.append({"t": kind, "text": txt, "style": st})
        elif tag == f"{W}tbl":
            rows = []
            for tr in child.findall(f"{W}tr"):
                cells = [text_of(td) for td in tr.findall(f"{W}tc")]
                if any(cells):
                    rows.append(cells)
            if rows:
                blocks.append({"t": "table", "rows": rows})

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump({"source": os.path.basename(src), "blocks": blocks}, fh, ensure_ascii=False, indent=1)

    tables = sum(1 for b in blocks if b["t"] == "table")
    heads = [b["text"] for b in blocks if b["t"] == "heading"]
    print(f"{os.path.basename(dest)}: {len(blocks)} blocks, {tables} tables, {len(heads)} headings")
    for h in heads[:12]:
        print("  §", h[:90])


if __name__ == "__main__":
    main()
