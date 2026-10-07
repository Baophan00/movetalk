#!/usr/bin/env python3
"""Render MoveTalk lesson audio with cloned voices (F5-TTS, zero-shot).

Job list on stdin:
  [{"text": "...", "voice": "mia"|"alex", "out": "/abs/path.wav"}, ...]

Idempotent: existing outputs are skipped, so re-running resumes.
Writes 24 kHz mono WAV plus a sibling .mp3 for the web.

Usage:
  python3 build_jobs.py | ~/movetalk/.ttsvenv/bin/python render_voice.py
"""
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
REFS = {
    "mia": (os.path.join(ROOT, "ref", "ref_mia.wav"), os.path.join(ROOT, "ref", "ref_mia.txt")),
    "alex": (os.path.join(ROOT, "ref", "ref_alex.wav"), os.path.join(ROOT, "ref", "ref_alex.txt")),
}
DEVICE = os.environ.get("MOVETALK_TTS_DEVICE", "mps")


def to_mp3(wav_path):
    mp3 = os.path.splitext(wav_path)[0] + ".mp3"
    if os.path.exists(mp3):
        return
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", wav_path, "-c:a", "libmp3lame", "-b:a", "96k", mp3],
        check=False,
    )


def main():
    jobs = json.load(sys.stdin)
    todo = [j for j in jobs if not (os.path.exists(j["out"]) and os.path.exists(os.path.splitext(j["out"])[0] + ".mp3"))]
    print(f"{len(jobs)} jobs, {len(todo)} to render (device={DEVICE})", flush=True)
    if not todo:
        return 0

    from f5_tts.api import F5TTS

    t0 = time.time()
    tts = F5TTS(device=DEVICE)
    print(f"model loaded in {time.time()-t0:.1f}s", flush=True)

    import soundfile as sf

    ok = fail = 0
    for i, j in enumerate(todo, 1):
        voice = j.get("voice", "mia")
        ref_file, ref_txt_file = REFS[voice]
        if not (os.path.exists(ref_file) and os.path.exists(ref_txt_file)):
            print(f"SKIP no reference for {voice}", flush=True)
            continue
        ref_text = open(ref_txt_file, encoding="utf-8").read().strip()
        t1 = time.time()
        try:
            wav, sr, _ = tts.infer(
                ref_file=ref_file,
                ref_text=ref_text,
                gen_text=j["text"],
                show_info=lambda *a, **k: None,
            )
            os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
            sf.write(j["out"], wav, sr)
            to_mp3(j["out"])
            ok += 1
            print(f"[{i}/{len(todo)}] {time.time()-t1:5.1f}s {voice} "
                  f"{os.path.basename(j['out'])} | {j['text'][:50]}", flush=True)
        except Exception as e:  # noqa: BLE001
            fail += 1
            print(f"[{i}/{len(todo)}] FAIL {type(e).__name__}: {e} :: {j['text'][:40]}", flush=True)
    print(f"\nrendered {ok}, failed {fail}, total {time.time()-t0:.0f}s", flush=True)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
