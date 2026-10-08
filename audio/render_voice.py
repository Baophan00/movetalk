#!/usr/bin/env python3
"""Render MoveTalk lesson audio with cloned voices (F5-TTS, zero-shot).

Job list on stdin:
  [{"text": "...", "voice": "mia"|"alex", "out": "/abs/path.wav"}, ...]

Idempotent: existing outputs are skipped, so re-running resumes.
Long texts are split into sentence-sized chunks and stitched, because a
single 250+ char generation makes F5-TTS stall on 8 GB machines.
Writes 24 kHz mono WAV plus a sibling .mp3 for the web.
"""
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
REFS = {
    "mia": (os.path.join(ROOT, "ref", "ref_mia.wav"), os.path.join(ROOT, "ref", "ref_mia.txt")),
    "alex": (os.path.join(ROOT, "ref", "ref_alex.wav"), os.path.join(ROOT, "ref", "ref_alex.txt")),
}
DEVICE = os.environ.get("MOVETALK_TTS_DEVICE", "mps")
MAX_CHARS = int(os.environ.get("MOVETALK_TTS_MAX_CHARS", "130"))


def to_mp3(wav_path):
    mp3 = os.path.splitext(wav_path)[0] + ".mp3"
    if os.path.exists(mp3):
        return
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", wav_path, "-c:a", "libmp3lame", "-b:a", "96k", mp3],
        check=False,
    )


def split_text(text, limit=MAX_CHARS):
    """Split into <=limit-char chunks on sentence, then clause, then word."""
    text = text.strip()
    if len(text) <= limit:
        return [text]
    parts = re.split(r"(?<=[.!?])\s+", text)
    chunks, cur = [], ""
    for p in parts:
        if not p:
            continue
        while len(p) > limit:
            cut = p.rfind(",", 0, limit)
            if cut < limit // 2:
                cut = p.rfind(" ", 0, limit)
            if cut < limit // 2:
                cut = limit
            head, p = p[: cut + 1].strip(), p[cut + 1:].strip()
            if cur:
                chunks.append(cur)
                cur = ""
            chunks.append(head)
        if not cur:
            cur = p
        elif len(cur) + 1 + len(p) <= limit:
            cur += " " + p
        else:
            chunks.append(cur)
            cur = p
    if cur:
        chunks.append(cur)
    return [c for c in chunks if c]


def main():
    jobs = json.load(sys.stdin)
    todo = [j for j in jobs if not (os.path.exists(j["out"]) and os.path.exists(os.path.splitext(j["out"])[0] + ".mp3"))]
    print(f"{len(jobs)} jobs, {len(todo)} to render (device={DEVICE}, max_chars={MAX_CHARS})", flush=True)
    if not todo:
        return 0

    from f5_tts.api import F5TTS

    t0 = time.time()
    tts = F5TTS(device=DEVICE)
    print(f"model loaded in {time.time()-t0:.1f}s", flush=True)

    import numpy as np
    import soundfile as sf

    ok = fail = 0
    for i, j in enumerate(todo, 1):
        voice = j.get("voice", "mia")
        ref_file, ref_txt_file = REFS[voice]
        if not (os.path.exists(ref_file) and os.path.exists(ref_txt_file)):
            print(f"SKIP no reference for {voice}", flush=True)
            continue
        ref_text = open(ref_txt_file, encoding="utf-8").read().strip()
        chunks = split_text(j["text"])
        t1 = time.time()
        try:
            pieces, sr = [], 24000
            for c in chunks:
                wav, sr, _ = tts.infer(
                    ref_file=ref_file,
                    ref_text=ref_text,
                    gen_text=c,
                    show_info=lambda *a, **k: None,
                )
                pieces.append(np.asarray(wav, dtype="float32"))
                pieces.append(np.zeros(int(sr * 0.18), dtype="float32"))
            merged = np.concatenate(pieces[:-1]) if len(pieces) > 1 else pieces[0]
            os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
            sf.write(j["out"], merged, sr)
            to_mp3(j["out"])
            ok += 1
            tag = f"{len(chunks)} chunk" + ("s" if len(chunks) > 1 else "")
            print(f"[{i}/{len(todo)}] {time.time()-t1:5.1f}s {voice} {tag} "
                  f"{os.path.basename(j['out'])} | {j['text'][:50]}", flush=True)
        except Exception as e:  # noqa: BLE001
            fail += 1
            print(f"[{i}/{len(todo)}] FAIL {type(e).__name__}: {e} :: {j['text'][:40]}", flush=True)
    print(f"\nrendered {ok}, failed {fail}, total {time.time()-t0:.0f}s", flush=True)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
