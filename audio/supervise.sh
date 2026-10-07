#!/bin/bash
# Render until every job is done, surviving OOM kills. Resumable by design.
cd "$(dirname "$0")"
for i in $(seq 1 40); do
  python3 build_jobs.py > jobs.json 2>/dev/null
  LEFT=$("$HOME/movetalk/.ttsvenv/bin/python" - <<'PY'
import json,os
j=json.load(open('jobs.json'))
n=sum(1 for x in j if not (os.path.exists(x['out']) and os.path.exists(os.path.splitext(x['out'])[0]+'.mp3')))
print(n)
PY
)
  echo "=== round $i: $LEFT remaining ===" >> supervise.log
  if [ "$LEFT" -eq 0 ]; then echo "ALL DONE" >> supervise.log; break; fi
  "$HOME/movetalk/.ttsvenv/bin/python" render_voice.py < jobs.json >> render.log 2>&1
  echo "round $i exited $?" >> supervise.log
  sleep 5
done
python3 build_manifest.py >> supervise.log 2>&1
echo "MANIFEST REBUILT" >> supervise.log
