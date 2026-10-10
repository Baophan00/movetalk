#!/usr/bin/env bash
# Verify the deployed MoveTalk site serves the new build.
set -u
T="$(date +%s)"

echo "=== index.html ==="
curl -s "https://movetalk.surge.sh/?v=$T" -o /tmp/live.html -w "http=%{http_code} size=%{size_download}\n"

echo "--- markers in live HTML ---"
for m in 'data-view="homework"' 'data-view="teacher"' 'id="v-homework"' 'id="v-teacher"' \
         'const HW_ON = !!HB' 'supabase-js@2' 'script src="config.js"' 'HOMEWORK:BEGIN' 'hw-chip'; do
  printf "%-28s %s\n" "$m" "$(grep -c "$m" /tmp/live.html)"
done

echo "=== config.js ==="
curl -s -o /dev/null -w "http=%{http_code}\n" "https://movetalk.surge.sh/config.js?v=$T"

echo "=== audio clip ==="
curl -s -o /dev/null -w "http=%{http_code} size=%{size_download}\n" \
  "https://movetalk.surge.sh/audio/clips/689e76a3bea9.mp3"

echo "=== old v1-only files should 404 ==="
for p in tests/homework.test.js sql/001_homework.sql src/homework.js; do
  printf "%-28s " "$p"
  curl -s -o /dev/null -w "http=%{http_code}\n" "https://movetalk.surge.sh/$p"
done

echo "=== local build vs live ==="
if cmp -s /tmp/live.html "$HOME/movetalk/index.html"; then
  echo "IDENTICAL to the local build"
else
  echo "DIFFERS"
  wc -c /tmp/live.html "$HOME/movetalk/index.html"
fi
