#!/usr/bin/env python3
"""Turn one review handout into quiz items the app can run.

The handouts hold the exercise, then the teacher's answer key further down. This pairs them so
nothing is guessed: every answer comes from the "ĐÁP ÁN" block. Distractors are drawn from the
sibling answers in the same exercise, which is what makes them plausible.

Usage: python3 tools/build_review.py L01
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUM = re.compile(r"^(\d{1,2})[.)]\s*(.+)$")

# Section titles are chrome, so they read in English even though the handout is Vietnamese.
SECTION_EN = {
    "quick choice": "Quick choice",
    "việt → anh: nói trước, viết sau": "Vietnamese to English",
    "việt → anh": "Vietnamese to English",
    "recall chunks": "Chunks",
    "real talk": "Real talk",
    "homework": "Homework",
}


def section_label(head):
    key = re.sub(r"^\d+\s*[·.]?\s*", "", head).strip().lower()
    return SECTION_EN.get(key, re.sub(r"^\d+\s*[·.]?\s*", "", head).strip())
KEYLINE = re.compile(r"^([A-Za-z][^:]{2,40}):\s*(.+)$")


def read_blocks(label):
    path = os.path.join(ROOT, "data", "a1", "review", f"{label}.json")
    return json.load(open(path, encoding="utf-8"))["blocks"]


def split_sections(blocks):
    """[(heading, [text lines])] — tables are skipped, exercises live in paragraphs."""
    sections, cur = [], ("", [])
    for b in blocks:
        if b["t"] == "heading":
            if cur[0]:
                sections.append(cur)
            cur = (b["text"], [])
        elif b["t"] == "p":
            cur[1].append(b["text"])
    if cur[0]:
        sections.append(cur)
    return sections


def numbered(lines):
    out = []
    for line in lines:
        m = NUM.match(line.strip())
        if m:
            out.append((int(m.group(1)), m.group(2).strip()))
    return out


def answer_key(lines):
    """'Quick choice: 1 Do · 2 Are' plus numbered answer lists, keyed by lower-case label."""
    key, numbered_answers = {}, {}
    for line in lines:
        m = KEYLINE.match(line)
        if m and "·" in m.group(2):
            pairs = dict(re.findall(r"(\d{1,2})\s*([^·]+)", m.group(2)))
            key[m.group(1).strip().lower()] = {int(k): v.strip() for k, v in pairs.items()}
        m2 = NUM.match(line.strip())
        if m2:
            numbered_answers[int(m2.group(1))] = m2.group(2).strip().rstrip("_ ").strip()
    return key, numbered_answers


def build(label):
    blocks = read_blocks(label)
    sections = split_sections(blocks)
    key_sections = [s for s in sections if "ĐÁP ÁN" in s[0].upper()]
    key, numbered_answers = answer_key([l for _, lines in key_sections for l in lines])

    items = []
    for head, lines in sections:
        if "ĐÁP ÁN" in head.upper():
            continue
        title = head.upper()
        rows = numbered(lines)

        if "QUICK CHOICE" in title or "CHỌN" in title:
            answers = next((v for k, v in key.items() if "choice" in k or "chọn" in k), {})
            blanks = [r for r in rows if "___" in r[1]]
            pool = sorted({a for a in answers.values()}) or ["Do", "Are"]
            family = pool + [w for w in ("Do", "Are", "Does", "Is", "Am") if w not in pool]
            for num, text in blanks:
                correct = answers.get(num)
                if not correct:
                    continue
                options = [correct] + [w for w in family if w != correct][:3]
                items.append({
                    "kind": "choice",
                    "section": section_label(head),
                    "prompt": text,
                    "answer": correct,
                    "options": options,
                })

        elif "VIỆT" in title and "ANH" in title:
            for num, text in rows:
                answer = numbered_answers.get(num)
                if answer:
                    items.append({"kind": "translate", "section": section_label(head), "prompt": text.rstrip("_ "), "answer": answer})

        elif "RECALL" in title or "GỌI LẠI" in title:
            hints = next((v for k, v in key.items() if "recall" in k), {})
            if hints:
                for num, text in rows:
                    if num in hints:
                        items.append({"kind": "chunks", "section": section_label(head), "prompt": text.split(":")[0].strip(), "answer": hints[num]})

    out = {"n": int(label[1:]), "level": "A1", "items": items}
    dest = os.path.join(ROOT, "app", "src", "content", "a1", f"{label}-quiz.json")
    json.dump(out, open(dest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    counts = {}
    for it in items:
        counts[it["kind"]] = counts.get(it["kind"], 0) + 1
    print(f"{label}: {len(items)} items {counts}")
    for it in items[:4]:
        print(f"   [{it['kind']}] {it['prompt'][:52]} -> {it['answer'][:40]}")
    return len(items)


if __name__ == "__main__":
    labels = sys.argv[1:] or ["L01"]
    for lab in labels:
        build(lab)
