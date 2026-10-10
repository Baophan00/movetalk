#!/usr/bin/env python3
"""US IPA + Edge-TTS (Jenny) for A1 L02–L10 vocab flashcards."""
import asyncio
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPS = ROOT / "audio" / "clips"
VOICE = "en-US-JennyNeural"
RATE = "-18%"
LESSONS = range(2, 11)

# General American IPA (Merriam-Webster / Cambridge US style)
US = {
    "teammate": "/ˈtimeɪt/",
    "colleague": "/ˈkɑliɡ/",
    "manager": "/ˈmænɪdʒər/",
    "client": "/ˈklaɪənt/",
    "report": "/rɪˈpɔrt/",
    "deadline": "/ˈdedlaɪn/",
    "supportive": "/səˈpɔrtɪv/",
    "helpful": "/ˈhelpfl/",
    "work in sales": "/wɜrk ɪn seɪlz/",
    "work from home": "/wɜrk frəm hoʊm/",
    "handle client calls": "/ˈhændl ˈklaɪənt kɔlz/",
    "support the team": "/səˈpɔrt ðə tim/",
    "need regular updates": "/nid ˈreɡjələr ˈʌpdeɪts/",
    "talk after work": "/tɔk ˈæftər wɜrk/",
    "use English at work": "/juz ˈɪŋɡlɪʃ æt wɜrk/",
    "be easy to talk to": "/bi ˈizi tə tɔk tu/",
    "be good with clients": "/bi ɡʊd wɪð ˈklaɪənts/",
    "be busy this week": "/bi ˈbɪzi ðɪs wik/",
    "be at a meeting": "/bi æt ə ˈmitɪŋ/",
    "be free after work": "/bi fri ˈæftər wɜrk/",
    "this new laptop": "/ðɪs nu ˈlæptɑp/",
    "my new work laptop": "/maɪ nu wɜrk ˈlæptɑp/",
    "those client files": "/ðoʊz ˈklaɪənt faɪlz/",
    "those blue files": "/ðoʊz blu faɪlz/",
    "my manager's files": "/maɪ ˈmænɪdʒərz faɪlz/",
    "that woman near the window": "/ðæt ˈwʊmən nɪr ðə ˈwɪndoʊ/",
    "our new sales manager": "/ɑr nu seɪlz ˈmænɪdʒər/",
    "her office": "/hər ˈɑfɪs/",
    "the second floor": "/ðə ˈsekənd flɔr/",
    "this": "/ðɪs/",
    "that": "/ðæt/",
    "these": "/ðiz/",
    "those": "/ðoʊz/",
    "first time": "/fɜrst taɪm/",
    "across the street": "/əˈkrɔs ðə strit/",
    "over there": "/ˈoʊvər ðer/",
    "so far": "/soʊ fɑr/",
    "follow-up": "/ˈfɑloʊ ʌp/",
    "a balcony": "/ə ˈbælkəni/",
    "an elevator": "/ən ˈeləveɪtər/",
    "a meeting room": "/ə ˈmitɪŋ rum/",
    "a convenience store": "/ə kənˈvinjəns stɔr/",
    "two bedrooms": "/tu ˈbedrumz/",
    "some small shops": "/sʌm smɔl ʃɑps/",
    "many trees": "/ˈmeni triz/",
    "several cafés": "/ˈsevrəl kæˈfeɪz/",
    "a supermarket": "/ə ˈsupərmɑrkɪt/",
    "a park": "/ə pɑrk/",
    "almost": "/ˈɔlmoʊst/",
    "most": "/moʊst/",
    "each": "/itʃ/",
    "every": "/ˈevri/",
    "a few": "/ə fju/",
    "few": "/fju/",
    "a little": "/ə ˈlɪtl/",
    "little": "/ˈlɪtl/",
    "much": "/mʌtʃ/",
    "many": "/ˈmeni/",
    "a lot of": "/ə lɑt əv/",
    "some": "/sʌm/",
    "any": "/ˈeni/",
    "another": "/əˈnʌðər/",
    "other": "/ˈʌðər/",
    "fewer": "/ˈfjuər/",
    "less": "/les/",
    "both": "/boʊθ/",
    "either": "/ˈiðər/",
    "neither": "/ˈniðər/",
    "enough": "/ɪˈnʌf/",
    "too much": "/tu mʌtʃ/",
    "too many": "/tu ˈmeni/",
    "all": "/ɔl/",
    "whole": "/hoʊl/",
    "how long": "/haʊ lɑŋ/",
    "how far": "/haʊ fɑr/",
    "how often": "/haʊ ˈɔfən/",
    "how much": "/haʊ mʌtʃ/",
    "how many": "/haʊ ˈmeni/",
    "what kind of": "/wʌt kaɪnd əv/",
    "which": "/wɪtʃ/",
    "how about": "/haʊ əˈbaʊt/",
    "yesterday": "/ˈjestərdeɪ/",
    "last week": "/læst wik/",
    "since Monday": "/sɪns ˈmʌndeɪ/",
    "for three years": "/fɔr θri jɪrz/",
    "right now": "/raɪt naʊ/",
    "at the moment": "/æt ðə ˈmoʊmənt/",
    "tomorrow": "/təˈmɑroʊ/",
    "next week": "/nekst wik/",
    "going to": "/ˈɡoʊɪŋ tu/",
    "quickly": "/ˈkwɪkli/",
    "carefully": "/ˈkerfəli/",
    "usually": "/ˈjuʒuəli/",
    "sometimes": "/ˈsʌmtaɪmz/",
    "never": "/ˈnevər/",
    "always": "/ˈɔlweɪz/",
    "feel": "/fil/",
    "sound": "/saʊnd/",
    "look": "/lʊk/",
    "taste": "/teɪst/",
    "smell": "/smel/",
    "become": "/bɪˈkʌm/",
}


def to_us_ipa(ph: str) -> str:
    if not ph:
        return ph
    s = ph
    s = s.replace("əʊ", "oʊ").replace("ɒ", "ɑ").replace("ɜː", "ɜr")
    s = s.replace("ɔː", "ɔ").replace("ɑː", "ɑ").replace("uː", "u").replace("iː", "i")
    s = s.replace("nju", "nu")
    # r-color common BrE endings
    s = re.sub(r"ə(?=/)", "ər", s)
    s = s.replace("eə", "er").replace("ɪə", "ɪr").replace("ʊə", "ʊr")
    s = s.replace("ðeə", "ðer").replace("nɪə", "nɪr")
    return s


def collect():
    texts = []
    missing_ipa = []
    for n in LESSONS:
        path = ROOT / "data" / f"L{n:02d}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for block in data["parts"]["vocab"]:
            if block.get("t") != "flashcard":
                continue
            for it in block["items"]:
                word = it["word"]
                if word in US:
                    if it.get("phonetic") != US[word]:
                        it["phonetic"] = US[word]
                        changed = True
                else:
                    new = to_us_ipa(it.get("phonetic") or "")
                    if new and new != it.get("phonetic"):
                        it["phonetic"] = new
                        changed = True
                    missing_ipa.append(word)
                texts.append(word)
                for ex in it.get("examples") or []:
                    if ex.get("text"):
                        texts.append(ex["text"])
        if changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    seen, uniq = set(), []
    for t in texts:
        if t not in seen:
            seen.add(t)
            uniq.append(t)
    return uniq, missing_ipa


async def render_one(sem, edge_tts, text):
    async with sem:
        h = hashlib.sha1(text.encode()).hexdigest()[:12]
        mp3 = CLIPS / f"{h}.mp3"
        rel = f"audio/clips/{h}.mp3"
        if mp3.exists() and mp3.stat().st_size >= 1000:
            return text, rel, "skip"
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, VOICE, rate=RATE)
                await comm.save(str(mp3))
                if mp3.exists() and mp3.stat().st_size >= 800:
                    return text, rel, "ok"
            except Exception as e:
                if attempt == 2:
                    return text, rel, f"fail:{e}"
                await asyncio.sleep(1.5 * (attempt + 1))
        return text, rel, "fail"


async def main():
    import edge_tts

    CLIPS.mkdir(parents=True, exist_ok=True)
    uniq, missing_ipa = collect()
    print(f"unique texts: {len(uniq)}")
    if missing_ipa:
        print("no explicit IPA (regex only):", ", ".join(missing_ipa))

    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*[render_one(sem, edge_tts, t) for t in uniq])
    mapping = {}
    ok = skip = fail = 0
    for text, rel, status in results:
        mapping[text] = rel
        if status == "ok":
            ok += 1
        elif status == "skip":
            skip += 1
        else:
            fail += 1
            print("FAIL", text, status)
    print(f"rendered={ok} skipped={skip} fail={fail}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    m = re.search(r"/\* AUDIO_MAP:BEGIN \*/\nconst AUDIO_MAP=(\{.*?\});\n/\* AUDIO_MAP:END \*/", html, re.S)
    if not m:
        raise SystemExit("AUDIO_MAP missing")
    existing = json.loads(m.group(1))
    existing.update(mapping)
    body = json.dumps(existing, ensure_ascii=False, separators=(",", ":"))
    block = "/* AUDIO_MAP:BEGIN */\nconst AUDIO_MAP=" + body + ";\n/* AUDIO_MAP:END */"
    html = html[: m.start()] + block + html[m.end() :]
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    print(f"AUDIO_MAP entries: {len(existing)}")


if __name__ == "__main__":
    asyncio.run(main())
