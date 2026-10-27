import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Mic, RotateCcw, Square, Volume2, X } from 'lucide-react'
import { addVoice, listVoice, removeVoice } from '../lib/voice'
import { uploadVoice } from '../lib/voiceSync'
import { recordAttempt } from '../lib/study'
import { canListen, compare, listen, type Score } from '../lib/speech'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

type Line = { text: string }
type Phase = 'idle' | 'rec' | 'done'

/**
 * The speaking room: hear the line, say it, get a score on the spot.
 * The recording still goes to the teacher — the score is for the learner, not a replacement.
 */
export function SpeakRoom({ lessonN, lines }: { lessonN: number; lines: Line[] }) {
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [interim, setInterim] = useState('')
  const [score, setScore] = useState<Score | null>(null)
  const [heard, setHeard] = useState('')
  const [secs, setSecs] = useState(0)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<'sending' | 'sent' | 'local' | null>(null)
  const [voices, setVoices] = useState(listVoice)

  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const sp = useRef<ReturnType<typeof listen>>(null)
  const started = useRef(0)

  const line = lines[i] ?? { text: '' }
  const supported = useMemo(() => canListen(), [])

  useEffect(() => {
    if (phase !== 'rec') return
    const t = setInterval(() => setSecs(Math.round((Date.now() - started.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [phase])

  const reset = () => {
    setPhase('idle')
    setInterim('')
    setScore(null)
    setHeard('')
    setSecs(0)
    setSent(null)
    setError('')
  }

  const start = async () => {
    reset()
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      chunks.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const mr = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data)
      }
      mr.onstop = () => {
        const type = chunks.current[0]?.type || 'audio/webm'
        const blob = new Blob(chunks.current, { type })
        const reader = new FileReader()
        reader.onload = () => setVoices(addVoice(lessonN, String(reader.result)))
        reader.readAsDataURL(blob)
        stream.current?.getTracks().forEach((t) => t.stop())
        const ms = started.current ? Date.now() - started.current : null
        setSent('sending')
        uploadVoice(lessonN, blob, ms)
          .then((row) => setSent(row ? 'sent' : 'local'))
          .catch(() => setSent('local'))
      }
      started.current = Date.now()
      setSecs(0)
      mr.start()
      rec.current = mr
      setPhase('rec')
      if (supported) sp.current = listen({ onInterim: setInterim })
    } catch {
      setError('Microphone is blocked. Allow it in the address bar, then try again.')
    }
  }

  const stop = async () => {
    const pending = sp.current?.text
    sp.current?.stop()
    sp.current = null
    rec.current?.stop()
    rec.current = null
    setPhase('done')
    if (!pending) return
    const said = await Promise.race([pending, new Promise<string>((r) => setTimeout(() => r(''), 2200))])
    setHeard(said)
    if (!said.trim()) return
    const result = compare(line.text, said)
    setScore(result)
    recordAttempt({
      kind: 'speak',
      lesson: lessonN,
      section: 'Speaking',
      prompt: line.text,
      correct: result.pct >= 70,
    })
  }

  const next = () => {
    setI((v) => (v + 1 < lines.length ? v + 1 : 0))
    reset()
  }

  const takes = voices.filter((v) => v.lesson === lessonN).slice(-3).reverse()

  return (
    <div className="pb-2">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-pink/15 blur-2xl" />

        <div className="relative px-5 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[.16em] text-muted">
              Line {i + 1} of {lines.length}
            </p>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold', supported ? 'bg-mint/15 text-[#0f6b4f]' : 'bg-bg text-muted')}>
              {supported ? 'scored on this device' : 'teacher listens only'}
            </span>
          </div>

          <p className="mt-2 text-[21px] font-semibold leading-snug tracking-tight sm:text-[24px]">{line.text}</p>

          <button
            onClick={() => speak(line.text)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary transition active:scale-95"
          >
            <Volume2 className="h-3.5 w-3.5" /> Hear it first
          </button>

          <div className="relative mt-5 grid place-items-center">
            {phase === 'rec' && (
              <>
                <span className="absolute h-32 w-32 animate-[ripple_1.8s_ease-out_infinite] rounded-full border border-primary/40" />
                <span className="absolute h-32 w-32 animate-[ripple_1.8s_ease-out_.6s_infinite] rounded-full border border-pink/40" />
              </>
            )}
            <button
              onClick={phase === 'rec' ? stop : start}
              aria-label={phase === 'rec' ? 'Stop recording' : 'Start recording'}
              className={cn(
                'relative grid h-24 w-24 place-items-center rounded-full text-white shadow-lift transition active:scale-95',
                phase === 'rec'
                  ? 'bg-gradient-to-br from-[#e4572e] to-[#b02a37]'
                  : 'bg-gradient-to-br from-primary to-pink hover:brightness-105',
              )}
            >
              {phase === 'rec' ? <Square className="h-7 w-7" /> : <Mic className="h-9 w-9" />}
            </button>
            <p className="mt-3 text-[12px] font-medium text-muted">
              {phase === 'rec' ? `Listening… ${secs}s · tap to stop` : phase === 'done' ? 'Saved for your teacher' : 'Tap, then say the line'}
            </p>
          </div>

          {phase === 'rec' && (
            <div className="mt-1 flex h-6 items-end justify-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                <span
                  key={b}
                  className="w-1.5 rounded-full bg-primary/70"
                  style={{ height: `${8 + ((b * 7) % 20)}px`, animation: `bar .9s ease-in-out ${b * 0.08}s infinite alternate` }}
                />
              ))}
            </div>
          )}

          {phase === 'rec' && interim && <p className="mt-2 line-clamp-2 text-center text-[12.5px] italic text-muted">“{interim}”</p>}

          {error && <p className="mt-3 rounded-xl bg-warn/10 px-3 py-2 text-[12px] font-medium text-warn">{error}</p>}

          {phase === 'done' && (
            <div className="mt-4 rounded-2xl bg-bg/70 p-3.5">
              {score ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">
                      {score.pct >= 90 ? 'Clean.' : score.pct >= 70 ? 'Close enough.' : 'Say it again slowly.'}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums',
                        score.pct >= 70 ? 'bg-mint/20 text-[#0f6b4f]' : 'bg-accent/20 text-[#7a4300]',
                      )}
                    >
                      {score.pct}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {score.hits.map((h, k) => (
                      <span
                        key={`${h.text}-${k}`}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[12.5px] font-medium',
                          h.ok ? 'bg-mint/15 text-[#0f6b4f]' : 'bg-warn/10 text-warn underline decoration-warn/40 decoration-2',
                        )}
                      >
                        {h.text}
                      </span>
                    ))}
                  </div>
                  {score.missing.length > 0 && (
                    <p className="mt-2 text-[11.5px] text-muted">Missed: {score.missing.join(', ')}</p>
                  )}
                  {heard && <p className="mt-1 text-[11.5px] text-muted">The browser heard: “{heard}”</p>}
                </>
              ) : (
                <p className="text-[12px] text-muted">
                  {supported ? 'Nothing was heard. Try again a little closer to the mic.' : 'This browser cannot score speech. Your recording still goes to the teacher.'}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={start} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12.5px] font-semibold transition active:scale-95">
                  <RotateCcw className="h-3.5 w-3.5" /> Again
                </button>
                <button onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white transition active:scale-95">
                  Next line
                </button>
                {sent === 'sending' && <span className="text-[11.5px] font-medium text-muted">Sending…</span>}
                {sent === 'sent' && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0f6b4f]">
                    <Check className="h-3.5 w-3.5" /> Sent
                  </span>
                )}
                {sent === 'local' && <span className="text-[11.5px] font-semibold text-muted">Saved on this device</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {takes.length > 0 && (
        <div className="mt-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-muted">Your last takes</p>
          <ul className="mt-1.5 space-y-1.5">
            {takes.map((v) => (
              <li key={v.id} className="flex items-center gap-2 rounded-xl bg-surface px-2.5 py-2 shadow-card">
                <audio controls src={v.file} className="h-8 w-full max-w-[220px]" />
                <span className="shrink-0 text-[10.5px] text-muted">{new Date(v.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                <button onClick={() => setVoices(removeVoice(v.id))} className="shrink-0 text-muted transition hover:text-warn" aria-label="Delete take">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
