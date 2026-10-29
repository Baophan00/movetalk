/**
 * Speaking, graded in the browser. Chrome/Edge can turn speech into words on the device,
 * so a learner gets an answer immediately instead of waiting for the teacher.
 * Everything here degrades to "no score" when the browser cannot listen.
 */

export type WordHit = { text: string; ok: boolean }

export type Score = {
  pct: number
  target: string[]
  hits: WordHit[]
  missing: string[]
  extra: string[]
  transcript: string
}

export type Listener = {
  stop: () => void
  text: Promise<string>
}

const strip = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function words(text: string): string[] {
  const t = strip(text)
  return t ? t.split(' ') : []
}

function ctor(): any {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function canListen(): boolean {
  return Boolean(ctor())
}

/** Longest common subsequence over words, so one dropped word does not shift everything. */
function near(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.min(a.length, b.length) < 6) return false
  if (Math.abs(a.length - b.length) > 1) return false
  // one substitution or one dropped letter is a speech-to-text quirk, not a mistake
  let i = 0
  let j = 0
  let diff = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1
      j += 1
      continue
    }
    diff += 1
    if (diff > 1) return false
    if (a.length > b.length) i += 1
    else if (b.length > a.length) j += 1
    else {
      i += 1
      j += 1
    }
  }
  return true
}

export function compare(target: string, heard: string): Score {
  const T = words(target)
  const H = words(heard)
  const n = T.length
  const m = H.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = near(T[i], H[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const hits: WordHit[] = []
  let i = 0
  let j = 0
  const extra: string[] = []
  while (i < n && j < m) {
    if (near(T[i], H[j])) {
      hits.push({ text: T[i], ok: true })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      hits.push({ text: T[i], ok: false })
      i += 1
    } else {
      extra.push(H[j])
      j += 1
    }
  }
  while (i < n) {
    hits.push({ text: T[i], ok: false })
    i += 1
  }
  while (j < m) {
    extra.push(H[j])
    j += 1
  }
  const matched = hits.filter((h) => h.ok).length
  const pct = n ? Math.round((matched / n) * 100) : 0
  return { pct, target: T, hits, missing: hits.filter((h) => !h.ok).map((h) => h.text), extra, transcript: heard }
}

/** One shot: start listening, resolve with the transcript when the learner stops. */
export function listen(opts: { lang?: string; onInterim?: (t: string) => void; onError?: (e: string) => void } = {}): Listener | null {
  const C = ctor()
  if (!C) return null
  const rec = new C()
  rec.lang = opts.lang ?? 'en-US'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  let final = ''
  let settle: (v: string) => void = () => undefined
  const text = new Promise<string>((resolve) => {
    settle = resolve
  })

  let stoppedByUser = false

  rec.onresult = (e: any) => {
    let interim = ''
    for (let k = e.resultIndex; k < e.results.length; k += 1) {
      const chunk = e.results[k][0].transcript
      if (e.results[k].isFinal) final += chunk + ' '
      else interim += chunk
    }
    opts.onInterim?.((final + interim).trim())
  }
  rec.onerror = (e: any) => {
    opts.onError?.(e?.error ?? 'unknown')
  }
  rec.onend = () => {
    if (!stoppedByUser) {
      try {
        rec.start()
        return
      } catch {
        // fall through
      }
    }
    settle(final.trim())
  }

  try {
    rec.start()
  } catch {
    return null
  }

  return {
    stop: () => {
      stoppedByUser = true
      try {
        rec.stop()
      } catch {
        settle(final.trim())
      }
    },
    text,
  }
}
