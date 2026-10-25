#!/usr/bin/env python3
"""Second reader for the review handouts: L06–L10.

These handouts keep the exercise in one section and the answers in another, often glued onto one
line ("1 a little; 2 Almost all; 3 much"). Every question is paired to the teacher's answer by
its number; anything that cannot be paired is dropped rather than guessed.

Three question shapes come out of it:
  choice  — the handout offers options in brackets, or the answer is a closed function word
  typed   — write the sentence (translate / repair)
  reveal  — a frame answer ("Have you ever + V3…?"), self-marked after the prompt is read aloud

Usage: python3 tools/build_review2.py L06 L07 …
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LABEL = re.compile(r"^\(?(\d{1,2})\)?(?:\s*[.)]\s*|\s+)")
PAREN_OPTS = re.compile(r"\(([^()]*?/[^()]*?)\)")
STEP_LETTER = re.compile(r"\s[A-Z]\.\s")
EXERCISE_HEAD = re.compile(r"KIỂM TRA|CHỌN VÀ NÓI|BẬT KHUNG|TỰ KIỂM|NÓI ĐÁP ÁN|GHÉP", re.I)
SECTION_EN = {
    "bật khung và tự kiểm tra": "Build the frame",
    "bật khung rồi nói câu của bạn": "Frame, then say it",
    "tự kiểm tra và luyện nói": "Check yourself",
    "tự kiểm tra rồi dùng trong câu thật": "Check, then use it",
    "chọn và nói thành câu": "Choose and say it",
    "tự kiểm tra": "Check yourself",
}

CLOSED = {"is", "are", "do", "does", "am", "another", "other", "the other", "my", "this", "those",
          "these", "our", "much", "many", "some", "any", "a little", "a few", "almost", "almost all",
          "most", "neither", "none", "fewer", "less", "has", "have"}


def blocks_of(label):
    path = os.path.join(ROOT, "data", "a1", "review", f"{label}.json")
    return json.load(open(path, encoding="utf-8"))["blocks"]


def sections(blocks):
    out, cur = [], None
    for b in blocks:
        if b["t"] == "heading":
            cur = {"head": b["text"], "lines": []}
            out.append(cur)
        elif b["t"] == "p" and cur is not None:
            cur["lines"].append(b["text"])
    return out


def tokenise(text):
    """Split '1 a little; 2 Almost all' or '1. We have …' into {1: 'a little', 2: 'Almost all'}.

    A number only starts an item when it opens the text or follows the end of a previous item,
    which keeps '3 giây' out of the way.
    """
    marks = list(re.finditer(r"(?:^|(?<=[;.?!…:—)]))\s*\(?(\d{1,2})\)?\s*[.)]?\s*", text))
    marks = [m for m in marks if m.group(1)]
    out = {}
    for k, m in enumerate(marks):
        stop = marks[k + 1].start() if k + 1 < len(marks) else len(text)
        chunk = text[m.end():stop].strip(" ;.·…")
        num = int(m.group(1))
        if chunk and num not in out:
            out[num] = chunk
    return out


def classify(prompt, answer, family):
    if "+" in answer:
        return {"kind": "reveal"}
    m = PAREN_OPTS.search(prompt)
    if m:
        if prompt.rstrip().endswith(")") and m.end() == len(prompt.rstrip()):
            cleaned = prompt[: m.start()].strip()          # options at the end: drop them
        else:
            cleaned = PAREN_OPTS.sub("___", prompt).strip()  # options inline: keep the gap
        cleaned = re.sub(r"(?:_{2,}\s*){2,}", "___ ", cleaned).strip()
        return {"kind": "choice", "options": [o.strip() for o in m.group(1).split("/")], "prompt": cleaned}
    if "___" in prompt and answer.lower() in CLOSED:
        others = [w for w in family if w.lower() != answer.lower()][:3]
        if len(others) == 3:
            return {"kind": "choice", "options": [answer] + others}
    return {"kind": "typed"}


def build(label):
    secs = sections(blocks_of(label))
    answer_text = " ".join(l for s in secs if "ĐÁP ÁN" in s["head"].upper() for l in s["lines"])
    answers = tokenise(answer_text)
    family = sorted({a for a in answers.values() if a.lower() in CLOSED})

    items = []
    for s in secs:
        if "ĐÁP ÁN" in s["head"].upper() or not s["lines"]:
            continue
        if not EXERCISE_HEAD.search(s["head"]):
            continue
        for num, prompt in tokenise(" ".join(s["lines"])).items():
            answer = answers.get(num)
            if not answer or len(prompt) < 6:
                continue
            cut = STEP_LETTER.search(prompt)
            if cut:
                prompt = prompt[: cut.start()]
            prompt = prompt.strip(" ;.·")
            shape = classify(prompt, answer, family)
            items.append({
                "kind": shape["kind"],
                "section": SECTION_EN.get(re.sub(r"^\d+\s*[·.]?\s*", "", s["head"]).strip().lower(),
                                       re.sub(r"^\d+\s*[·.]?\s*", "", s["head"]).strip())[:44],
                "prompt": shape.get("prompt", prompt),
                "answer": answer,
                **({"options": shape["options"]} if shape.get("options") else {}),
            })

    dest = os.path.join(ROOT, "app", "src", "content", "a1", f"{label}-quiz.json")
    json.dump({"n": int(label[1:]), "level": "A1", "items": items}, open(dest, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    kinds = {}
    for it in items:
        kinds[it["kind"]] = kinds.get(it["kind"], 0) + 1
    print(f"{label}: {len(items)} items {kinds}")
    for it in items[:4]:
        print(f"   [{it['kind']}] {it['prompt'][:58]} -> {it['answer'][:40]}")
    return len(items)


if __name__ == "__main__":
    for lab in sys.argv[1:] or ["L06"]:
        build(lab)
