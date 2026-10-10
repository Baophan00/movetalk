#!/usr/bin/env bash
# ============================================================
# Deploy MoveTalk to Surge.
#
#   bash tools/deploy.sh
#
# Builds a clean staging directory first, so the 2 GB .ttsvenv
# (TTS renderer) and node_modules never get pushed. Only what the
# site actually serves at runtime is uploaded:
#   index.html, config.js, CNAME, audio/**/*.mp3
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="${TMPDIR:-/tmp}/movetalk-deploy"
DOMAIN="${MT_DOMAIN:-movetalk.surge.sh}"

echo "== building staging dir =="
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp "$ROOT/index.html" "$STAGE/"
[ -f "$ROOT/config.js" ] && cp "$ROOT/config.js" "$STAGE/"
[ -f "$ROOT/CNAME" ]     && cp "$ROOT/CNAME"     "$STAGE/"

# audio: only the mp3 clips the lessons reference
mkdir -p "$STAGE/audio"
find "$ROOT/audio" -type f -name '*.mp3' -print0 \
  | while IFS= read -r -d '' f; do
      rel="${f#"$ROOT"/}"
      mkdir -p "$STAGE/$(dirname "$rel")"
      cp "$f" "$STAGE/$rel"
    done

echo "   files: $(find "$STAGE" -type f | wc -l | tr -d ' ')"
echo "   size:  $(du -sh "$STAGE" | cut -f1)"

if [ "${1:-}" = "--dry-run" ]; then
  echo "== dry run, not uploading =="
  exit 0
fi

echo "== uploading to $DOMAIN =="
surge "$STAGE" "$DOMAIN"

echo "== done: https://$DOMAIN/ =="
