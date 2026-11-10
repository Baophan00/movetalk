#!/usr/bin/env python3
"""Shrink canvas artwork to web-sized JPEGs and point canvas.json at them."""
import glob, json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "app", "public", "teach")
TMP = "/tmp/canvas_png_backup"
os.makedirs(TMP, exist_ok=True)

for d in sorted(glob.glob(os.path.join(PUB, "l*", "canvas"))):
    lesson_dir = os.path.dirname(d)
    cj = os.path.join(lesson_dir, "canvas.json")
    if not os.path.exists(cj):
        continue
    data = json.load(open(cj))
    changed = False
    for img in glob.glob(os.path.join(d, "*")):
        base, ext = os.path.splitext(os.path.basename(img))
        if ext.lower() not in (".png", ".jpg", ".jpeg", ".gif", ".bmp"):
            continue
        out = os.path.join(d, base + ".jpg")
        if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(img):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", img,
                            "-vf", "scale='min(1600,iw)':-2:flags=lanczos", "-q:v", "4", out], check=False)
        if os.path.abspath(out) != os.path.abspath(img):
            os.replace(img, os.path.join(TMP, os.path.basename(img)))
        changed = True
    if changed:
        s = json.dumps(data, ensure_ascii=False)
        s = re.sub(r'(/canvas/[A-Za-z0-9_]+)\.(png|PNG|jpeg|gif|bmp)', r'\1.jpg', s)
        json.dump(json.loads(s), open(cj, "w"), ensure_ascii=False, separators=(",", ":"))
    size = sum(os.path.getsize(f) for f in glob.glob(os.path.join(d, "*")))
    print(os.path.basename(lesson_dir), f"{size/1024/1024:.1f}MB")
