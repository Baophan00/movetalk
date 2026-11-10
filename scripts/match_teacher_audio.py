#!/usr/bin/env python3
"""Match the teacher-recorded audio files in ~/Desktop/new MM/AUDIO to the
listening slides of each lesson and build per-slide mp3 + timing json.

Strategy
  1. transcribe every F1_Lxx audio file once (word timestamps, cached)
  2. build the text of every listening target (dialogue scene or long reading)
  3. fuzzy-match target tokens against the transcript; the matched word span
     becomes the slide's slice inside the source file (files may cover 2+ slides)
  4. write scene_<num>.mp3 + scene_<num>.json under app/public/audio/teach/lNN/
"""
import json, os, re, subprocess, sys, unicodedata, difflib, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.expanduser("~/Desktop/new MM/AUDIO ")
DATA_DIR = os.path.join(ROOT, "app", "src", "data", "teacherLessons")
OUT_ROOT = os.path.join(ROOT, "app", "public", "audio", "teach")
CACHE = "/tmp/audio_tx"
SCENES = "/tmp/teach_scenes.json"

READ_KINDS = re.compile(r"SHORT STORY|SCRIPT|READ|STORY|PERSONALIZE|RETELL", re.I)
SKIP_KINDS = re.compile(r"SELF TRY|OPTIONAL HINT|MODEL|GUIDED|VERSION|CHECK|BEFORE|TRANSFER", re.I)


def norm_word(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9']", "", s.lower())


def toks(words):
    return [norm_word(w["w"]) for w in words if norm_word(w["w"])]


def unescape(s):
    return s.replace("\\'", "'").replace('\\"', '"').replace("\\n", " ")


def parse_slides(path):
    src = open(path, encoding="utf-8").read()
    out = []
    for chunk in re.split(r"\n    \{\n      num: ", src)[1:]:
        num = int(chunk.split(",", 1)[0])
        sec = re.search(r"section: '([^']*)'", chunk)
        kind = re.search(r"kind: '([^']*)'", chunk)
        title = re.search(r"title: '((?:[^'\\]|\\.)*)'", chunk)
        lines = re.search(r"lines: \[(.*?)\],\s*\n\s*dialogue:", chunk, re.S)
        vals = []
        if lines:
            vals = [unescape(v) for v in re.findall(r"'((?:[^'\\]|\\.)*)'", lines.group(1))]
        out.append({
            "num": num,
            "section": sec.group(1) if sec else "",
            "kind": kind.group(1) if kind else "",
            "title": unescape(title.group(1)) if title else "",
            "lines": vals,
        })
    return out


def load_model():
    from faster_whisper import WhisperModel
    return WhisperModel("small", device="cpu", compute_type="int8")


def transcribe(model, path):
    key = os.path.basename(path).replace("/", "_")
    cache_path = os.path.join(CACHE, key + ".json")
    if os.path.exists(cache_path):
        return json.load(open(cache_path))["words"]
    segs, info = model.transcribe(path, word_timestamps=True, language="en", beam_size=1, vad_filter=True)
    words = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)}
             for s in segs for w in s.words]
    os.makedirs(CACHE, exist_ok=True)
    json.dump({"duration": round(info.duration, 2), "words": words}, open(cache_path, "w"), ensure_ascii=False)
    print(f"  transcribed {os.path.basename(path)}: {len(words)} words, {info.duration:.1f}s", flush=True)
    return words


def match(target, audio_words):
    a = [norm_word(t) for t in target.split() if norm_word(t)]
    b = [norm_word(w["w"]) for w in audio_words]
    if not a or not b:
        return 0.0, None
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    blocks = [bl for bl in sm.get_matching_blocks() if bl.size >= 2]
    if not blocks:
        return 0.0, None
    matched = sum(bl.size for bl in blocks)
    start = blocks[0].b
    end = blocks[-1].b + blocks[-1].size - 1
    return matched / len(a), (start, end)


def align_lines(turns, words, offset):
    flat = [x for t in turns for x in t.split()]
    a = [norm_word(x) for x in flat]
    b = [norm_word(w["w"]) for w in words]
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
        n = len([x for x in t.split() if norm_word(x)])
        seg = times[k:k + n] if n else [(0, 0)]
        k += n
        out.append((seg[0][0], seg[-1][1]))
    for i in range(len(out) - 1):
        if out[i][1] > out[i + 1][0] - 0.02:
            out[i] = (out[i][0], round(out[i + 1][0] - 0.02, 2))
    return [(max(0, round(s - offset, 2)), max(0.1, round(e - offset, 2))) for s, e in out]


def main():
    model = load_model()
    scenes = json.load(open(SCENES))
    report = {}
    for lesson in range(2, 11):
        lpad = f"l{lesson:02d}"
        slides = parse_slides(os.path.join(DATA_DIR, lpad + ".ts"))
        slide_by_num = {s["num"]: s for s in slides}
        targets = []
        for sc in scenes:
            if sc["lesson"] != lesson:
                continue
            text = " ".join(t["t"] for t in sc["lines"])
            targets.append({"num": sc["slide"], "kind": sc["kind"], "title": sc["title"],
                            "text": text, "turns": [t["t"] for t in sc["lines"]]})
        for s in slides:
            if not READ_KINDS.search(s["kind"]) or SKIP_KINDS.search(s["kind"]):
                continue
            text = " ".join(l for l in s["lines"] if len(re.findall(r"[A-Za-z]", l)) > 40)
            if len(text) > 120 and not any(t["num"] == s["num"] for t in targets):
                targets.append({"num": s["num"], "kind": s["kind"], "title": s["title"],
                                "text": text, "turns": None})

        files = sorted(glob.glob(os.path.join(AUDIO_DIR, f"F1_L{lesson:02d}*.mp3")))
        print(f"\nL{lesson:02d}: {len(targets)} targets, {len(files)} audio files", flush=True)
        transcripts = {}
        for f in files:
            try:
                transcripts[f] = transcribe(model, f)
            except Exception as e:
                print("  FAIL", os.path.basename(f), e, flush=True)

        os.makedirs(os.path.join(OUT_ROOT, lpad), exist_ok=True)
        used = []
        for t in targets:
            best = (0.0, None, None)
            for f, words in transcripts.items():
                ratio, span = match(t["text"], words)
                if ratio > best[0]:
                    best = (ratio, f, span)
            if best[0] < 0.55 or not best[1]:
                report.setdefault(f"l{lesson:02d}", []).append({"num": t["num"], "title": t["title"], "status": "no-match", "best": round(best[0], 2)})
                print(f"  skip {t['num']} {t['title']}: best {best[0]:.2f}", flush=True)
                continue
            ratio, f, (w0, w1) = best
            words = transcripts[f]
            start = max(0.0, words[w0]["s"] - 0.25)
            end = words[w1]["e"] + 0.35
            out_mp3 = os.path.join(OUT_ROOT, lpad, f"scene_{t['num']}.mp3")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-ss", str(start),
                            "-to", str(end), "-ar", "24000", "-ac", "1", "-b:a", "64k", out_mp3], check=True)
            inside = [w for w in words if w["s"] >= start - 0.02 and w["e"] <= end + 0.02]
            out_json = os.path.join(OUT_ROOT, lpad, f"scene_{t['num']}.json")
            if t["turns"]:
                times = align_lines(t["turns"], inside, start)
                json.dump({"lines": [{"s": "", "t": txt, "start": s, "end": e}
                                     for txt, (s, e) in zip(t["turns"], times)]},
                          open(out_json, "w"), ensure_ascii=False, indent=1)
            else:
                json.dump({"words": [{"w": w["w"], "s": round(w["s"] - start, 2), "e": round(w["e"] - start, 2)} for w in inside],
                           "duration": round(end - start, 2)},
                          open(out_json, "w"), ensure_ascii=False)
            used.append((t["num"], t["title"], os.path.basename(f), round(ratio, 2)))
            report.setdefault(f"l{lesson:02d}", []).append({"num": t["num"], "title": t["title"], "status": "ok", "file": os.path.basename(f), "ratio": round(ratio, 2)})
            print(f"  ok {t['num']} {t['title'][:40]} <- {os.path.basename(f)} ({ratio:.2f})", flush=True)

    json.dump(report, open("/tmp/audio_map_report.json", "w"), ensure_ascii=False, indent=1)
    print("\nDONE")


if __name__ == "__main__":
    main()
