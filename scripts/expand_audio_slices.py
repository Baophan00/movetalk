#!/usr/bin/env python3
"""Second pass: when a recording maps to a single slide, keep the whole file
instead of a fuzzy-matched slice (readings were being cut short)."""
import json, os, re, subprocess, glob, unicodedata, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = "/tmp/audio_tx"
OUT = os.path.join(ROOT, "app", "public", "audio", "teach")
DATA = os.path.join(ROOT, "app", "src", "data", "teacherLessons")
REPORT = "/tmp/audio_map_report.json"


def norm(w):
    w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9']", "", w.lower())


def parse_slides(path):
    src = open(path, encoding="utf-8").read()
    out = {}
    for chunk in re.split(r"\n    \{\n      num: ", src)[1:]:
        num = int(chunk.split(",", 1)[0])
        kind = re.search(r"kind: '([^']*)'", chunk)
        lines = re.search(r"lines: \[(.*?)\],\s*\n\s*dialogue:", chunk, re.S)
        vals = [v.replace("\\'", "'") for v in re.findall(r"'((?:[^'\\]|\\.)*)'", lines.group(1))] if lines else []
        dial = None
        dm = re.search(r"dialogue: \{.*?lines: \[(.*?)\],\s*\n\s*\}", chunk, re.S)
        if dm:
            turns = [v.replace("\\'", "'") for v in re.findall(r"t: '((?:[^'\\]|\\.)*)'", dm.group(1))]
            if turns:
                dial = turns
        out[num] = {"kind": kind.group(1) if kind else "", "lines": vals, "turns": dial}
    return out


def align_lines(turns, words, offset):
    flat = [x for t in turns for x in t.split()]
    a = [norm(x) for x in flat]
    b = [norm(w["w"]) for w in words]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    times = [None] * len(flat)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = (words[j1 + k]["s"], words[j1 + k]["e"])
    for i, t in enumerate(times):
        if t is None:
            prev = next((times[j] for j in range(i - 1, -1, -1) if times[j]), (0, 0))
            nxt = next((times[j] for j in range(i + 1, len(times)) if times[j]), (prev[1] + 0.3,) * 2)
            times[i] = (prev[1], max(prev[1], nxt[0]))
    out, k = [], 0
    for t in turns:
        n = len([x for x in t.split() if norm(x)])
        seg = times[k:k + n] if n else [(0, 0)]
        k += n
        out.append([seg[0][0], seg[-1][1]])
    for i in range(len(out) - 1):
        if out[i][1] > out[i + 1][0] - 0.02:
            out[i][1] = out[i + 1][0] - 0.02
    return [(max(0, round(s - offset, 2)), max(0.1, round(e - offset, 2))) for s, e in out]


def main():
    report = json.load(open(REPORT))
    slides = {n: parse_slides(os.path.join(DATA, f"l{n:02d}.ts")) for n in range(2, 11)}
    for lesson, items in report.items():
        n = int(lesson[1:])
        ok = [x for x in items if x["status"] == "ok"]
        usage = {}
        for x in ok:
            usage[x["file"]] = usage.get(x["file"], 0) + 1
        for x in ok:
            if usage[x["file"]] != 1 or x["ratio"] >= 0.9:
                continue
            cache = os.path.join(CACHE, x["file"] + ".json")
            if not os.path.exists(cache):
                continue
            data = json.load(open(cache))
            words = data["words"]
            start, end = 0.0, float(data["duration"])
            out_mp3 = os.path.join(OUT, f"l{n:02d}", f"scene_{x['num']}.mp3")
            src = os.path.expanduser(f"~/Desktop/new MM/AUDIO /{x['file']}")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ss", "0", "-to", str(end),
                            "-ar", "24000", "-ac", "1", "-b:a", "64k", out_mp3], check=True)
            inside = [w for w in words if w["s"] >= start - 0.02 and w["e"] <= end + 0.02]
            slide = slides[n].get(x["num"], {})
            out_json = os.path.join(OUT, f"l{n:02d}", f"scene_{x['num']}.json")
            if slide.get("turns"):
                times = align_lines(slide["turns"], inside, start)
                json.dump({"lines": [{"s": "", "t": t, "start": s, "end": e} for t, (s, e) in zip(slide["turns"], times)]},
                          open(out_json, "w"), ensure_ascii=False, indent=1)
            else:
                json.dump({"words": [{"w": w["w"], "s": round(w["s"] - start, 2), "e": round(w["e"] - start, 2)} for w in inside],
                           "duration": round(end - start, 2)}, open(out_json, "w"), ensure_ascii=False)
            print(f"expanded {lesson} {x['num']} {x['title'][:40]} -> {end:.1f}s (was ratio {x['ratio']})")


if __name__ == "__main__":
    main()
