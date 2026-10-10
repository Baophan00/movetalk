#!/usr/bin/env python3
"""A1 L01 conversations via ElevenLabs. Key from ELEVENLABS_API_KEY only."""
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPS = ROOT / "audio" / "clips"
LESSON = ROOT / "data" / "L01.json"
VOICES = {
    "A": "4NejU5DwQjevnR6mh3mb",  # female (user)
    "B": "UgBBYS2sOqTuMpoF3BR0",  # Mark male
}
MODEL = "eleven_turbo_v2_5"  # multilingual_v2 ignores speed → too fast / sounds cut off
HASH = "el3"


def lines():
    data = json.loads(LESSON.read_text(encoding="utf-8"))
    out = []
    for b in data["parts"]["conversations"]:
        if b.get("t") != "dialog":
            continue
        for ln in b.get("lines") or []:
            sp = (ln.get("speaker") or "A").strip()
            text = (ln.get("text") or "").strip()
            if text:
                out.append((sp if sp in VOICES else "A", text))
    return out


def tts(key, voice_id, text):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
    body = json.dumps(
        {
            "text": text,
            "model_id": MODEL,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.2,
                "use_speaker_boost": True,
                "speed": 0.82,
            },
            "apply_text_normalization": "on",
        }
    ).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY missing")
    CLIPS.mkdir(parents=True, exist_ok=True)
    jobs = lines()
    mapping = {}
    chars = 0
    for i, (sp, text) in enumerate(jobs, 1):
        voice = VOICES[sp]
        h = hashlib.sha1(f"{HASH}|{voice}|{text}".encode()).hexdigest()[:12]
        mp3 = CLIPS / f"{h}.mp3"
        rel = f"audio/clips/{h}.mp3"
        chars += len(text)
        if mp3.exists() and mp3.stat().st_size >= 800:
            mapping[text] = rel
            print(f"{i:02d}/{len(jobs)} {sp} skip  {text}")
            continue
        for attempt in range(4):
            try:
                data = tts(key, voice, text)
                if len(data) < 800 or data[:1] == b"{":
                    raise RuntimeError(data[:200])
                raw = CLIPS / f"{h}.raw.mp3"
                raw.write_bytes(data)
                import subprocess
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-v", "error", "-i", str(raw),
                        "-af", "apad=pad_dur=0.35", "-c:a", "libmp3lame", "-b:a", "128k",
                        str(mp3),
                    ],
                    check=True,
                )
                raw.unlink(missing_ok=True)
                mapping[text] = rel
                print(f"{i:02d}/{len(jobs)} {sp} {mp3.stat().st_size:6d}  {text}")
                break
            except urllib.error.HTTPError as e:
                err = e.read().decode("utf-8", "replace")[:300]
                if e.code in (429, 500, 502, 503) and attempt < 3:
                    time.sleep(2 * (attempt + 1))
                    continue
                raise SystemExit(f"HTTP {e.code} {text}: {err}")
        time.sleep(0.25)

    html_path = ROOT / "index.html"
    html = html_path.read_text(encoding="utf-8")
    m = re.search(
        r"/\* AUDIO_MAP:BEGIN \*/\nconst AUDIO_MAP=(\{.*?\});\n/\* AUDIO_MAP:END \*/",
        html,
        re.S,
    )
    if not m:
        raise SystemExit("AUDIO_MAP missing")
    existing = json.loads(m.group(1))
    existing.update(mapping)
    body = json.dumps(existing, ensure_ascii=False, separators=(",", ":"))
    block = "/* AUDIO_MAP:BEGIN */\nconst AUDIO_MAP=" + body + ";\n/* AUDIO_MAP:END */"
    html_path.write_text(html[: m.start()] + block + html[m.end() :], encoding="utf-8")
    print(f"chars={chars} AUDIO_MAP={len(existing)}")


if __name__ == "__main__":
    main()
