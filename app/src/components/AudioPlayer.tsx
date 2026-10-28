import { useEffect, useRef, useState } from 'react'
import { Gauge, Loader2, Pause, Play, RotateCcw, TriangleAlert, Volume2 } from 'lucide-react'
import { clipFor } from '../lib/audio'
import { cn } from '../lib/utils'

const SPEEDS = [0.75, 1, 1.25] as const
const SPEED_KEY = 'mt2_speed'

function readSpeed(): number {
  try {
    const raw = Number(localStorage.getItem(SPEED_KEY))
    return SPEEDS.includes(raw as (typeof SPEEDS)[number]) ? raw : 1
  } catch {
    return 1
  }
}

type Props = {
  /** The English text. Recorded clips win; without one the browser voice reads it, labelled as such. */
  text: string
  label?: string
  /** Compact drops the speed row, for short lines inside a list. */
  compact?: boolean
  className?: string
  onEnded?: () => void
}

function clock(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * One player for recorded audio: play/pause, seek, replay, three speeds, and an honest error state.
 * Text without a clip is read by the browser voice instead, and the badge says so — never a fake file.
 */
export function AudioPlayer({ text, label, compact, className, onEnded }: Props) {
  const src = clipFor(text)
  const audio = useRef<HTMLAudioElement | null>(null)
  const utter = useRef<SpeechSynthesisUtterance | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle')
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [speed, setSpeed] = useState(readSpeed)

  // A new line means a new player: stop the old sound so two lines never overlap.
  useEffect(() => {
    setTime(0)
    setDur(0)
    setState('idle')
    return () => {
      audio.current?.pause()
      audio.current = null
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [text])

  // Load only the metadata on mount so the total length shows before the first press.
  useEffect(() => {
    if (!src) return
    const el = new Audio(src)
    el.preload = 'metadata'
    el.playbackRate = speed
    el.onloadedmetadata = () => setDur(el.duration)
    el.ontimeupdate = () => setTime(el.currentTime)
    el.onended = () => {
      setState('idle')
      setTime(0)
      onEnded?.()
    }
    audio.current = el
    return () => {
      el.pause()
      el.removeAttribute('src')
      audio.current = null
    }
    // The speed is applied by the effect below; re-creating the element on every speed change would
    // reload the clip and lose the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed
    try {
      localStorage.setItem(SPEED_KEY, String(speed))
    } catch {
      /* private mode */
    }
  }, [speed])

  const speakBrowser = () => {
    if (!('speechSynthesis' in window)) {
      setState('error')
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.95 * speed
    u.onend = () => {
      setState('idle')
      setTime(0)
      onEnded?.()
    }
    u.onerror = () => setState('idle')
    utter.current = u
    window.speechSynthesis.speak(u)
    setState('playing')
  }

  const play = () => {
    if (!src) {
      speakBrowser()
      return
    }
    if (!audio.current) {
      setState('loading')
      const el = new Audio(src)
      el.preload = 'auto'
      el.playbackRate = speed
      el.onloadedmetadata = () => setDur(el.duration)
      el.ontimeupdate = () => setTime(el.currentTime)
      el.onended = () => {
        setState('idle')
        setTime(0)
        onEnded?.()
      }
      el.onerror = () => setState('error')
      el.oncanplay = () => setState((s) => (s === 'loading' ? 'paused' : s))
      audio.current = el
      void el
        .play()
        .then(() => setState('playing'))
        // A blocked autoplay is not a broken file: the learner just needs to press play again.
        .catch((err: DOMException) => setState(err?.name === 'NotAllowedError' ? 'paused' : 'error'))
      return
    }
    void audio.current
      .play()
      .then(() => setState('playing'))
      .catch((err: DOMException) => setState(err?.name === 'NotAllowedError' ? 'paused' : 'error'))
  }

  const pause = () => {
    if (src) {
      audio.current?.pause()
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setState('paused')
  }

  const replay = () => {
    if (src && audio.current) {
      audio.current.currentTime = 0
      void audio.current.play().then(() => setState('playing')).catch(() => setState('error'))
      return
    }
    window.speechSynthesis?.cancel()
    play()
  }

  const seek = (value: number) => {
    if (!audio.current) return
    audio.current.currentTime = value
    setTime(value)
  }

  const playing = state === 'playing'
  const pct = dur ? Math.min(100, (time / dur) * 100) : 0

  return (
    <div className={cn('rounded-2xl border border-line bg-surface px-3 py-2.5', className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={playing ? pause : play}
          disabled={state === 'loading'}
          aria-pressed={playing}
          aria-label={playing ? 'Pause audio' : 'Play audio'}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white transition hover:brightness-110 disabled:opacity-70"
        >
          {state === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <p className="truncate text-[12px] font-semibold text-ink/80">{label ?? (src ? 'Recorded audio' : 'Browser voice')}</p>
            {!src && (
              <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#8A5A22]">
                browser
              </span>
            )}
          </div>

          {src ? (
            <div className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[10.5px] tabular-nums text-muted">{clock(time)}</span>
              <input
                type="range"
                min={0}
                max={dur || 0}
                step={0.1}
                value={Math.min(time, dur || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Audio position"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
                style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--line)) ${pct}%)` }}
              />
              <span className="w-8 shrink-0 text-right text-[10.5px] tabular-nums text-muted">{clock(dur)}</span>
            </div>
          ) : (
            <p className="text-[11px] text-muted">
              {state === 'error' ? 'This device has no speech voice for English.' : 'Read by this device, not a recording.'}
            </p>
          )}
        </div>

        <button
          onClick={replay}
          aria-label="Play again from the start"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {!compact && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-11">
          <Gauge className="h-3 w-3 text-muted" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              aria-label={`Playback speed ${s === 1 ? 'normal' : `${s} times`}`}
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold transition',
                speed === s
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:bg-ink/[.05] hover:text-ink',
              )}
            >
              {s === 1 ? '1x' : `${s}x`}
            </button>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-muted">
            <Volume2 className="h-3 w-3" /> {src ? 'recorded' : 'device voice'}
          </span>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-danger/10 px-2.5 py-1.5 text-[11px] text-danger">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            {src ? 'The audio did not load. Check your connection.' : 'This device has no English voice installed.'}
          </span>
          <button onClick={replay} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
