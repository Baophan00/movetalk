#!/usr/bin/env python3
"""Generate teacher dialogue + story audio with edge-tts (dual voice), per-line timelines."""
import json, os, re, subprocess, sys, glob, shutil, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "app", "public", "audio", "teach")
TMP = "/tmp/teach_audio"
os.makedirs(TMP, exist_ok=True)

EDGE = None
for cand in ["edge-tts"] + glob.glob(os.path.expanduser("~/.hermes/installs/*/environments/*/venv/bin/edge-tts")):
    p = shutil.which(cand) if "/" not in cand else cand
    if p and os.path.exists(p):
        EDGE = p; break
assert EDGE, "edge-tts not found"

FEMALE = {"mai","lan","linh","anna","mia","sara","emma","sophie","assistant","reception",
          "host","guest","customer","visitor","guide","doctor","local","waitress","nina"}
MALE = {"nam","tom","ben","leo","minh","adam","sam","dan","matt","guide","driver",
        "waiter","receptionist","visitor","customer","boss","manager"}
VF = "en-GB-SoniaNeural"
VM = "en-GB-RyanNeural"

def voice_for(name, idx):
    n = name.strip().lower()
    if n in FEMALE: return VF
    if n in MALE: return VM
    return VF if idx % 2 == 0 else VM

def say(text, voice, out):
    t = re.sub(r'[\u201c\u201d]', '"', text)
    t = re.sub(r'[\u2018\u2019]', "'", t)
    t = re.sub(r'[·•●◆▪]', ', ', t)
    t = t.strip()
    subprocess.run([EDGE, "--voice", voice, "--text", t, "--write-media", out],
                   check=True, capture_output=True, timeout=120)


VN_CHARS = set("ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ")

def english_only(lines):
    """Story slides carry a Vietnamese task line; don't read it aloud."""
    out = [l for l in lines if l.strip() and not any(ch in VN_CHARS for ch in l)]
    return out or [l for l in lines if l.strip()]

def split_text(text, limit=320):
    parts, cur = [], ""
    for sentence in re.split(r'(?<=[.!?])\s+', text):
        if not sentence:
            continue
        if len(cur) + len(sentence) + 1 > limit and cur:
            parts.append(cur)
            cur = sentence
        else:
            cur = (cur + " " + sentence).strip()
    if cur:
        parts.append(cur)
    return parts or [text]

JUNK_SPEAKERS = {"NOTICE", "DO", "DOES", "CHECK", "MODEL", "NOTE", "KEY", "ANSWER", "ANSWERS", "RECALL", "CHUNK"}

def clean_turns(lines):
    out = []
    for t in lines:
        txt = re.sub(r"[^A-Za-z0-9À-ỹ'’,.?!\- %]", "", t["t"]).strip()
        if not txt or txt in ("/", "-", ".", "·"):
            continue
        sp = t["s"].strip().upper()
        if sp in JUNK_SPEAKERS:
            continue
        out.append({"s": t["s"], "t": txt})
    return out

def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())

def silence(path, ms=420):
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r=24000:cl=mono",
                    "-t", f"{ms/1000:.3f}", "-c:a", "libmp3lame", "-b:a", "48k", path],
                   check=True, capture_output=True)

def concat(clips, out):
    if len(clips) == 1:
        shutil.copy(clips[0], out); return
    inputs = []
    fc = []
    for c in clips:
        inputs += ["-i", c]
    for i in range(len(clips)):
        fc.append(f"[{i}]")
    flt = "".join(fc) + f"concat=n={len(clips)}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-y", *inputs, "-filter_complex", flt,
                    "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "48k", out],
                   check=True, capture_output=True)

def build_scene(sc):
    no, num = sc["lesson"], sc["slide"]
    d = os.path.join(PUB, f"l{no:02d}")
    os.makedirs(d, exist_ok=True)
    out_mp3 = os.path.join(d, f"scene_{num}.mp3")
    if os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 0:
        return f"L{no:02d} s{num} cached"
    lines = clean_turns(sc["lines"])
    if len(lines) < 2:
        return f"L{no:02d} s{num} SKIP (no clean turns)"
    clips, meta = [], []
    for i, t in enumerate(lines):
        v = voice_for(t["s"], i)
        c = os.path.join(TMP, f"l{no:02d}_{num}_{i}.mp3")
        say(t["t"], v, c)
        clips.append(c)
        meta.append((t["s"], t["t"]))
    sil = os.path.join(TMP, "sil.mp3")
    silence(sil)
    seq = []
    for c in clips:
        seq.append(c); seq.append(sil)
    seq = seq[:-1]
    concat(seq, out_mp3)
    # timeline
    tl = []
    t0 = 0.0
    for i, c in enumerate(clips):
        dline = dur(c)
        tl.append({"s": meta[i][0], "t": meta[i][1], "start": round(t0, 2), "end": round(t0 + dline, 2)})
        t0 += dline + 0.42
    with open(os.path.join(d, f"scene_{num}.json"), "w") as f:
        json.dump({"lines": tl}, f, ensure_ascii=False)
    for c in clips: os.remove(c)
    return f"L{no:02d} s{num} {len(lines)} lines OK"

def build_story(no, num, text):
    d = os.path.join(PUB, f"l{no:02d}")
    os.makedirs(d, exist_ok=True)
    out = os.path.join(d, f"scene_{num}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return f"L{no:02d} s{num} story cached"
    t = " ".join(english_only(text))
    if not t:
        return f"L{no:02d} s{num} story EMPTY skip"
    clips = []
    for i, part in enumerate(split_text(t)):
        c = os.path.join(TMP, f"story_{no:02d}_{num}_{i}.mp3")
        say(part, VF, c)
        clips.append(c)
    concat(clips, out)
    for c in clips:
        os.remove(c)
    return f"L{no:02d} s{num} story OK ({len(clips)} parts)"

def main():
    scenes = json.load(open("/tmp/teach_scenes.json"))
    scenes = [s for s in scenes if not (s["kind"] == "OPEN CONVERSATION")]
    # add MODEL & RETRY scenes from L07 (dialogue turns exist) and 2/2 transcripts reuse part-1 audio
    jobs_story = []
    jobs_scene = []
    for f in sorted(glob.glob(os.path.join(ROOT, "app/src/data/teacherLessons/l*.ts"))):
        no = int(re.search(r"l(\d+)\.ts", f).group(1))
        t = open(f).read()
        for m in re.finditer(r"num: (\d+), section: '([^']*)', kind: '([^']*)',\s*\n\s*title: '([^']*)', instruction: '([^']*)',\s*\n\s*lines: \[(.*?)\],\s*\n\s*dialogue: (\{ speakers: \[(.*?)\]|null)", t, re.S):
            num = int(m.group(1)); kind = m.group(3); title = m.group(4)
            dlg = m.group(7)
            story_kinds = ("A SHORT STORY", "SCRIPT & FOLLOW-UP", "READ & RECORD", "READ & RETELL")
            if any(k in kind for k in story_kinds):
                lines = [l.strip("' ") for l in re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(6))]
                jobs_story.append((no, num, lines))
            elif dlg.startswith("{") and "MODEL & RETRY" in kind:
                # parse turns
                turns = re.findall(r"\{ s: '([^']*)', t: '([^']*)' \}", m.group(7))
                if len(turns) >= 4:
                    jobs_scene.append({"lesson": no, "slide": num, "lines": [{"s": a, "t": b} for a, b in turns], "kind": kind})
    # part-2 transcripts: reuse part-1 audio (no separate job)
    known_scene_ids = {(s["lesson"], s["slide"]) for s in scenes}
    seen = set(known_scene_ids)
    for s in scenes:
        seen.add((s["lesson"], s["slide"]))
    # generate part-1 only; part 2 copies in frontend (title contains "2/2")
    results = []
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        futs = [ex.submit(build_scene, s) for s in scenes]
        for f in cf.as_completed(futs):
            try: results.append(f.result())
            except Exception as e: results.append(f"SCENE FAIL {e}")
    # stories sequential (single voice, quick)
    for no, num, lines in jobs_story:
        try: results.append(build_story(no, num, lines))
        except Exception as e: results.append(f"STORY FAIL L{no} s{num} {e}")
    print("\n".join(results))
    print("DONE", len(results))

if __name__ == "__main__":
    main()
