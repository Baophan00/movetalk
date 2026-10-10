#!/usr/bin/env python3
"""A1 L01 conversations: plain-text TTS only (Jenny=A, Guy=B). No SSML."""
import asyncio
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPS = ROOT / "audio" / "clips"
LESSON = ROOT / "data" / "L01.json"
VOICES = {"A": "en-US-JennyNeural", "B": "en-US-GuyNeural"}
RATE = "-8%"
PITCH = {"A": "+8Hz", "B": "-4Hz"}


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


async def render_one(sem, edge_tts, speaker, text):
    async with sem:
        voice = VOICES[speaker]
        h = hashlib.sha1(f"plain|{voice}|{text}".encode()).hexdigest()[:12]
        mp3 = CLIPS / f"{h}.mp3"
        rel = f"audio/clips/{h}.mp3"
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(
                    text, voice, rate=RATE, pitch=PITCH[speaker]
                )
                await comm.save(str(mp3))
                if mp3.exists() and mp3.stat().st_size >= 800:
                    return text, rel, mp3.stat().st_size
            except Exception as e:
                if attempt == 2:
                    return text, rel, f"fail:{e}"
                await asyncio.sleep(1.2 * (attempt + 1))
        return text, rel, "fail"


async def main():
    import edge_tts

    CLIPS.mkdir(parents=True, exist_ok=True)
    jobs = lines()
    sem = asyncio.Semaphore(3)
    results = await asyncio.gather(
        *[render_one(sem, edge_tts, sp, t) for sp, t in jobs]
    )
    mapping = {}
    fail = 0
    for text, rel, status in results:
        if isinstance(status, int):
            mapping[text] = rel
            print(f"ok {status:6d}  {text}")
        else:
            fail += 1
            print("FAIL", text, status)
    print(f"mapped={len(mapping)} fail={fail}")

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
    print(f"AUDIO_MAP entries: {len(existing)}")


if __name__ == "__main__":
    asyncio.run(main())
