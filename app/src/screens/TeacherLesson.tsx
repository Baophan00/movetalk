import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AudioLines, BookOpen, ChevronLeft, ChevronRight, Lightbulb, Pause, Pencil, Play,
} from 'lucide-react'
import { SpeakButton } from '../components/SpeakButton'
import { LessonBlocks } from '../components/LessonContent'
import { cn } from '../lib/utils'
import { TEACH_LESSONS } from '../data/teacherLessons'
import { LESSON_INTROS } from '../data/teacherLessons/intros'
import { supabase } from '../lib/supabase'
import type { TeachSlide } from '../data/teacherLessons'

type LessonData = (typeof TEACH_LESSONS)[number]

/** One soft accent per section, all sitting on the same cream/sage palette. */
const SECTION_TONE: Record<string, { dot: string; chip: string; grad: string }> = {
  OVERVIEW: { dot: 'bg-[#5D7B6F]', chip: 'bg-[#5D7B6F]/10 text-[#31503F] border-[#5D7B6F]/25', grad: 'from-[#EDF3E8] to-[#F8FAF3]' },
  'REVIEW MAP': { dot: 'bg-[#8A6FD1]', chip: 'bg-[#8A6FD1]/10 text-[#503785] border-[#8A6FD1]/25', grad: 'from-[#F1EEFA] to-[#F9F7FC]' },
  RECONNECTION: { dot: 'bg-[#5D7B6F]', chip: 'bg-[#5D7B6F]/10 text-[#31503F] border-[#5D7B6F]/25', grad: 'from-[#EDF3E8] to-[#F8FAF3]' },
  VOCABULARY: { dot: 'bg-[#3E7A72]', chip: 'bg-[#3E7A72]/10 text-[#2A5A53] border-[#3E7A72]/25', grad: 'from-[#E8F2EF] to-[#F5FAF8]' },
  GRAMMAR: { dot: 'bg-[#6B7B6E]', chip: 'bg-[#6B7B6E]/10 text-[#3F4C42] border-[#6B7B6E]/25', grad: 'from-[#EEF0EA] to-[#F8F9F4]' },
  LISTENING: { dot: 'bg-[#31647F]', chip: 'bg-[#31647F]/10 text-[#234A5E] border-[#31647F]/25', grad: 'from-[#E9F1F6] to-[#F5F9FC]' },
  PRONUNCIATION: { dot: 'bg-[#A9743C]', chip: 'bg-[#A9743C]/10 text-[#6E4A20] border-[#A9743C]/25', grad: 'from-[#F7EFE4] to-[#FBF6EE]' },
  ACTIVATION: { dot: 'bg-[#9C5A4A]', chip: 'bg-[#9C5A4A]/10 text-[#68362A] border-[#9C5A4A]/25', grad: 'from-[#F7ECE8] to-[#FBF5F2]' },
  'REAL TALK': { dot: 'bg-[#B27C3A]', chip: 'bg-[#B27C3A]/10 text-[#7C5322] border-[#B27C3A]/25', grad: 'from-[#FAF3E4] to-[#FCF8EF]' },
  'REFLECTION & RETRY': { dot: 'bg-[#5D7B6F]', chip: 'bg-[#5D7B6F]/10 text-[#31503F] border-[#5D7B6F]/25', grad: 'from-[#EDF3E8] to-[#F8FAF3]' },
  'DAILY MISSION': { dot: 'bg-[#C97A35]', chip: 'bg-[#C97A35]/10 text-[#82491A] border-[#C97A35]/25', grad: 'from-[#FBF0E4] to-[#FDF7EF]' },
  EXTENSION: { dot: 'bg-[#5B7FA6]', chip: 'bg-[#5B7FA6]/10 text-[#365070] border-[#5B7FA6]/25', grad: 'from-[#ECF2F8] to-[#F6FAFC]' },
  SPEAKING: { dot: 'bg-[#8A5AB8]', chip: 'bg-[#8A5AB8]/10 text-[#533179] border-[#8A5AB8]/25', grad: 'from-[#F2EDF8] to-[#F9F6FC]' },
  'NOUN PHRASE CHALLENGE': { dot: 'bg-[#8A845C]', chip: 'bg-[#8A845C]/10 text-[#55502F] border-[#8A845C]/25', grad: 'from-[#F1F0E8] to-[#F9F8F2]' },
  REFERENCE: { dot: 'bg-[#8A8A8A]', chip: 'bg-[#8A8A8A]/10 text-[#4F4F4F] border-[#8A8A8A]/25', grad: 'from-[#F1F1F1] to-[#F9F9F9]' },
}
const FALLBACK_TONE = SECTION_TONE.EXTENSION

const SPEAKER_COLORS = [
  'bg-[#2E6E65]', 'bg-[#B07A3C]', 'bg-[#5A5FA0]', 'bg-[#A4574C]', 'bg-[#4E7C4F]', 'bg-[#31647F]',
]

// ── parsers ──────────────────────────────────────────────────────────────

function isIPA(s: string): boolean {
  return s.startsWith('/') && s.endsWith('/') && s.length > 2
}

function parseVocab(lines: string[]): { word: string; pos: string; ipa: string; meaning: string; example: string }[] {
  const items: { word: string; pos: string; ipa: string; meaning: string; example: string }[] = []
  let i = 0
  while (i < lines.length) {
    const head = lines[i]
    if (i + 2 < lines.length && isIPA(lines[i + 1]) && !isIPA(head) && head.length < 70) {
      const m = head.match(/^(.*?)\s*·\s*(.+)$/)
      const word = (m ? m[1] : head).trim()
      const pos = m ? m[2].trim() : ''
      const ipa = lines[i + 1]
      const meaning = lines[i + 2]
      const frags: string[] = []
      let j = i + 3
      while (j < lines.length) {
        const nextIsHead = j + 1 < lines.length && isIPA(lines[j + 1]) && !isIPA(lines[j]) && lines[j].length < 70
        if (nextIsHead) break
        frags.push(lines[j]); j++
      }
      items.push({ word, pos, ipa, meaning, example: frags.join(' ') })
      i = j
    } else {
      i++
    }
  }
  return items
}

function parseChunks(lines: string[]): { chunk: string; meaning: string }[] {
  const items: { chunk: string; meaning: string }[] = []
  let i = 0
  while (i < lines.length) {
    if (i + 1 < lines.length && lines[i + 1].startsWith('·')) {
      items.push({ chunk: lines[i], meaning: lines[i + 1].replace(/^·\s*/, '') })
      i += 2
    } else i++
  }
  return items
}

function isVocabSlide(lines: string[]): boolean {
  // A phrase bank is "head / IPA / meaning / example" repeated. Section names vary
  // (VOCABULARY, EXTENSION, REACTIONS...), so the IPA shape decides.
  let heads = 0
  for (let i = 0; i + 1 < lines.length; i += 1) {
    if (isIPA(lines[i + 1]) && !isIPA(lines[i]) && lines[i].length < 70) heads += 1
  }
  return heads >= 2
}

function isChunksSlide(title: string): boolean {
  const t = title.toLowerCase()
  return t.includes('chunk') || t.includes('useful') || t.includes('more than one word') || t.includes('little more')
}

function isStorySlide(kind: string): boolean {
  return /SHORT STORY|SCRIPT & FOLLOW-UP|READ & RECORD|READ & RETELL/i.test(kind)
}

// ── dialogue player ──────────────────────────────────────────────────────

function WaveBars() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="wave-bar w-[3px] rounded-full bg-white" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  )
}

function DialoguePlayer({ lesson, slide }: { lesson: number; slide: TeachSlide }) {
  const d = slide.dialogue!
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [timeline, setTimeline] = useState<{ s: string; t: string; start: number; end: number }[] | null>(null)
  const base = `/audio/teach/l${String(lesson).padStart(2, '0')}`
  const src = `${base}/scene_${slide.num}.mp3`

  useEffect(() => {
    fetch(`${base}/scene_${slide.num}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setTimeline(j ? j.lines : null))
      .catch(() => setTimeline(null))
    return () => { audioRef.current?.pause(); audioRef.current = null }
  }, [base, slide.num])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlaying(false)
    setProgress(0)
    setActiveIdx(-1)
  }, [])

  const toggle = () => {
    if (playing) { stop(); return }
    const el = new Audio(src)
    el.onended = () => { setPlaying(false); setProgress(0); setActiveIdx(-1) }
    el.ontimeupdate = () => {
      const t = el.currentTime
      setProgress(el.duration ? t / el.duration : 0)
      if (timeline) {
        const idx = timeline.findIndex((l) => t >= l.start && t < l.end)
        setActiveIdx(idx)
      }
    }
    el.onerror = () => { setPlaying(false); setProgress(0); setActiveIdx(-1) }
    audioRef.current = el
    setPlaying(true)
    void el.play().catch(() => { setPlaying(false); audioRef.current = null })
  }

  const colorOf = (name: string) => {
    const i = d.speakers.indexOf(name)
    return SPEAKER_COLORS[Math.max(0, i) % SPEAKER_COLORS.length]
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,540px)_minmax(300px,1fr)] lg:items-stretch lg:gap-6">
      <div className="order-2 space-y-1 lg:order-1">
        {d.lines.map((t, i) => {
          const mine = t.s !== d.speakers[0]
          return (
            <div key={i} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-white', colorOf(t.s))}>
                {t.s.slice(0, 1)}
              </span>
              <div className={cn(
                'max-w-[80%] break-words rounded-2xl border px-3 py-1.5 transition-all duration-200',
                mine ? 'rounded-br-md border-line bg-bg' : 'rounded-bl-md border-line bg-surface',
                activeIdx === i && 'border-primary/40 bg-primary-soft/70 ring-2 ring-primary/30',
              )}>
                <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">{t.s}</p>
                <p className="text-[15px] leading-relaxed text-ink">{t.t}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="order-1 flex lg:order-2">
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <button onClick={toggle} className="group relative block min-h-[260px] w-full flex-1 text-left" aria-label={playing ? 'Pause conversation' : 'Play conversation'}>
            <div className="absolute inset-0 overflow-hidden">
              {slide.images[0] ? (
                <img src={slide.images[0]} alt={slide.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E7F0F0] to-[#CBE0E0]">
                  <span className="text-6xl">💬</span>
                </div>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className={cn(
                  'grid h-16 w-16 place-items-center rounded-full bg-white text-primary shadow-lift transition group-hover:scale-105',
                  playing && 'scale-105',
                )}>
                  {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
                </span>
              </span>
              {playing && (
                <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-white backdrop-blur">
                  <WaveBars />
                  <span className="text-[11px] font-semibold">Listening…</span>
                </span>
              )}
            </div>
          </button>
          <div className="h-1.5 w-full bg-line/60">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="px-4 py-2 text-[11.5px] text-muted">Nhấn ảnh để nghe cả đoạn hội thoại.</p>
        </div>
      </div>
    </div>
  )
}

// ── story screens ────────────────────────────────────────────────────────

function StoryQuestions({ lines }: { lines: string[] }) {
  const groups: { label: string; items: string[] }[] = []
  const notes: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^[\p{Lu}0-9][\p{Lu}0-9 ·&/-]{3,}$/u.test(t)) groups.push({ label: t, items: [] })
    else if (!groups.length) groups.push({ label: '', items: [t] })
    else {
      const g = groups[groups.length - 1]
      const last = g.items[g.items.length - 1]
      if (/^(Sau khi|Mục tiêu|Ghi chú|Lưu ý)\b/i.test(t)) notes.push(t)
      else if (/^\d+[.)]\s*/.test(t) || !last) g.items.push(t)
      else g.items[g.items.length - 1] += ` ${t}`
    }
  }
  return (
    <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((g, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-5">
          {g.label && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{g.label}</p>}
          <ol className="mt-3 space-y-2.5">
            {g.items.map((it, j) => (
              <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/90">
                <span className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[10.5px] font-bold text-primary">{j + 1}</span>
                <span>{it.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
      {notes.length > 0 && <p className="rounded-lg bg-bg/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">{notes.join(' ')}</p>}
    </div>
  )
}

function StoryReader({ slide }: { lesson: number; slide: TeachSlide }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(26)
  const src = `/audio/teach/l01/scene_${slide.num}.mp3`

  const labelAt = slide.lines.findIndex((l) => /^[\p{Lu}0-9][\p{Lu}0-9 ·&/-]{3,}$/u.test(l.trim()))
  const storyPart = labelAt < 0 ? slide.lines : slide.lines.slice(0, labelAt)
  const followPart = labelAt < 0 ? [] : slide.lines.slice(labelAt)
  const sentences = storyPart.join(' ').split(/(?<=[.!?])\s+/).filter(Boolean)
  const weights = sentences.map((x) => Math.max(12, x.length))
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  const timed = sentences.map((text) => {
    const start = (acc / total) * duration
    acc += Math.max(12, text.length)
    return { text, start, end: (acc / total) * duration }
  })
  const active = timed.findIndex((x) => time >= x.start && time < x.end)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (!el.paused) { el.pause(); setPlaying(false); return }
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d) && d > 1) setDuration(d)
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setTime(0) }}
        onPause={() => setPlaying(false)}
        className="hidden"
      />
      <div className="order-2 lg:order-1">
        <p className="text-[16.5px] leading-[1.95] text-ink/90">
          {timed.map((x, i) => (
            <span
              key={i}
              className={cn('rounded px-0.5 transition-colors duration-150', active === i && 'bg-primary/20 font-semibold text-ink shadow-[inset_0_-2px_0_rgba(46,110,101,0.45)]')}
            >{x.text} </span>
          ))}
        </p>
        {followPart.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-bg/40 p-4">
            {followPart.map((l, i) =>
              /^[\p{Lu}0-9][\p{Lu}0-9 ·&/-]{3,}$/u.test(l.trim()) ? (
                <p key={i} className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{l}</p>
              ) : (
                <p key={i} className="mt-1.5 text-[14.5px] leading-relaxed text-ink/85">{l}</p>
              ),
            )}
          </div>
        )}
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <button onClick={toggle} className="group relative block w-full text-left" aria-label={playing ? 'Pause the story' : 'Play the story'}>
            <div className="relative h-56 w-full sm:h-64">
              {slide.images[0] ? (
                <img src={slide.images[0]} alt={slide.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#E7F0F0] to-[#CBE0E0]" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-primary shadow-lift transition group-hover:scale-105">
                  {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
                </span>
              </span>
              {playing && (
                <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-white backdrop-blur">
                  <WaveBars />
                  <span className="text-[11px] font-semibold">Reading…</span>
                </span>
              )}
            </div>
          </button>
          <div className="h-1.5 w-full bg-line/60">
            <div className="h-full bg-primary transition-all" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          </div>
          <p className="px-4 py-2 text-[11.5px] text-muted">Nhấn ảnh để nghe bài đọc.</p>
        </div>
      </div>
    </div>
  )
}

// ── pre-listening brief ──────────────────────────────────────────────────

function PreListen({ lines }: { lines: string[] }) {
  const groups: { label: string; items: string[] }[] = []
  const footer: string[] = []
  let cur: { label: string; items: string[] } = { label: '', items: [] }
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^Lượt\b/.test(t)) { footer.push(t); continue }
    if (/^[A-Z][A-Z ’'&/-]{2,24}$/.test(t)) {
      if (cur.label || cur.items.length) groups.push(cur)
      cur = { label: t, items: [] }
    } else cur.items.push(t)
  }
  if (cur.label || cur.items.length) groups.push(cur)
  const labelled = groups.filter((g) => g.label)
  const tail = [...groups.filter((g) => !g.label).flatMap((g) => g.items), ...footer]

  return (
    <div className="space-y-3">
      <div className={cn('grid gap-3', labelled.length > 1 ? 'sm:grid-cols-2' : '')}>
        {labelled.map((g, i) => (
          <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary">{g.label}</p>
            <ul className="mt-2.5 space-y-2">
              {g.items.map((it, j) => (
                <li key={j} className="border-l-2 border-primary/25 pl-3 text-[14.5px] leading-relaxed text-ink/90">{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {tail.length > 0 && (
        <p className="rounded-lg bg-bg/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">{tail.join(' ')}</p>
      )}
    </div>
  )
}

// ── story player ─────────────────────────────────────────────────────────

function StoryPlayer({ lesson, slide }: { lesson: number; slide: TeachSlide }) {
  const base = `/audio/teach/l${String(lesson).padStart(2, '0')}`
  const src = `${base}/scene_${slide.num}.mp3`
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null }, [])

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); return }
    const el = new Audio(src)
    el.onended = () => setPlaying(false)
    el.onerror = () => setPlaying(false)
    audioRef.current = el
    setPlaying(true)
    void el.play().catch(() => { setPlaying(false); audioRef.current = null })
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:shadow-card',
        playing ? 'border-primary/40 bg-primary-soft/50' : 'border-line bg-surface hover:border-primary/30',
      )}
    >
      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-card transition', playing ? 'animate-pulse bg-primary' : 'bg-[#31647F]')}>
        {playing ? <AudioLines className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold uppercase tracking-wide text-muted">
          {playing ? 'Đang nghe…' : 'Nghe bài đọc'}
        </span>
        <span className="block truncate text-[15.5px] font-semibold text-ink">{slide.title}</span>
      </span>
    </button>
  )
}

// ── smart text blocks ────────────────────────────────────────────────────

function normalizeScript(lines: string[]): string[] {
  if (!lines.some((l) => /^[AB][:：]/.test(l))) return lines
  const stop = (l: string) =>
    /^[AB][:：]/.test(l) || /^\d+\s*·/.test(l) || /^(MỞ RỘNG|Ôn chính|REVIEW|EXTENSION|NOTE)\b/i.test(l)
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^[AB][:：]/.test(line)) {
      const parts = [line]
      let j = i + 1
      while (j < lines.length && !stop(lines[j])) {
        parts.push(lines[j])
        j += 1
      }
      out.push(parts.join(' ').replace(/\s+([.,!?;:])/g, '$1'))
      i = j
    } else {
      out.push(line)
      i += 1
    }
  }
  return out
}

// ── slide body dispatch ──────────────────────────────────────────────────

function SlideBody({
  lesson,
  slide,
  shape,
}: {
  lesson: number
  slide: TeachSlide
  shape: { lines: string[]; title: string; hasDialogue: boolean }
}) {
  // Layout decisions use the original slide. Only the text comes from the edit.
  const displayLines = normalizeScript(slide.lines)
  const shapeLines = normalizeScript(shape.lines)
  const shapeTitle = shape.title
  const vocab = parseVocab(displayLines)
  const isBack = /·\s*BACK\s*$/i.test(shapeTitle) || /BACK/i.test(slide.kind)

  // Back sides ("nghĩa + phiên âm + khung câu") are recall cards, not word cards.
  const vnHead = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/
  if (isVocabSlide(shapeLines) && vocab.length >= 2 && !vnHead.test(vocab[0].word)) {
    if (isBack) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vocab.map((v, i) => (
            <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
              <p className="text-[17px] font-bold text-ink">{v.word}</p>
              <p className="mt-0.5 text-[13px] text-muted">{v.ipa}</p>
              {v.example && <p className="mt-2.5 border-l-2 border-primary/30 pl-3 text-[14.5px] leading-relaxed text-ink/80">{v.example}</p>}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {vocab.map((v, i) => (
          <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[21px] font-bold tracking-tight text-ink">{v.word}</span>
                <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">{v.pos}</span>
              </div>
              <SpeakButton text={v.word} size="sm" />
            </div>
            <p className="mt-1 text-[13px] text-muted">{v.ipa}</p>
            <p className="mt-2 text-[15px] font-medium text-ink">{v.meaning}</p>
            {v.example && (
              <p className="mt-2.5 border-l-2 border-primary/30 pl-3 text-[14.5px] leading-relaxed text-ink/80">
                {v.example}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const chunks = parseChunks(displayLines)
  if (isChunksSlide(shapeTitle) && chunks.length >= 2) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {chunks.map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/40 p-4">
            <div className="min-w-0">
              <p className="text-[16.5px] font-bold text-ink">{c.chunk}</p>
              <p className="mt-1 text-[14px] text-muted">{c.meaning}</p>
            </div>
            <SpeakButton text={c.chunk} size="sm" />
          </div>
        ))}
      </div>
    )
  }

  if (shape.hasDialogue && slide.dialogue && slide.dialogue.lines.length >= 3) {
    return <DialoguePlayer lesson={lesson} slide={slide} />
  }

  if (/^A SHORT STORY$/i.test(slide.kind) && displayLines.length >= 2) {
    return <StoryQuestions lines={displayLines} />
  }

  if (/^SCRIPT & FOLLOW-UP$/i.test(slide.kind) && displayLines.length >= 2) {
    return <StoryReader lesson={lesson} slide={slide} />
  }

  if (/BEFORE LISTENING|TRANSFER INPUT|OPTIONAL HOME LISTENING/i.test(slide.kind) && displayLines.length >= 3) {
    return <PreListen lines={displayLines} />
  }

  if (isStorySlide(slide.kind)) {
    return (
      <div className="space-y-3">
        <StoryPlayer lesson={lesson} slide={slide} />
        {displayLines.length > 0 && (
          <div className="rounded-xl border border-line bg-bg/40 p-4 text-[15.5px] leading-relaxed text-ink/90">
            {displayLines.join(' ')}
          </div>
        )}
      </div>
    )
  }

  if (displayLines.length) return <LessonBlocks lines={displayLines} shape={shapeLines} section={slide.section} kind={slide.kind} />
  return null
}

// ── slide card ───────────────────────────────────────────────────────────

type SlideEdit = {
  title?: string
  instruction?: string
  lines?: string[]
  dialogue?: TeachSlide['dialogue']
  notes?: string
}

type VocabItem = { word: string; pos: string; ipa: string; meaning: string; example: string }
type Triple = { a: string; b: string; c: string }
type Turn = { s: string; t: string }

type EditModel =
  | { kind: 'rows'; rows: string[] }
  | { kind: 'vocab'; items: VocabItem[] }
  | { kind: 'groups'; groups: Triple[] }
  | { kind: 'qa'; groups: Triple[] }
  | { kind: 'turns'; turns: Turn[] }

const triple = (lines: string[]): Triple[] => {
  const out: Triple[] = []
  for (let i = 0; i + 2 < lines.length; i += 3) out.push({ a: lines[i], b: lines[i + 1], c: lines[i + 2] })
  return out
}

const isDoOrAreLines = (lines: string[]) =>
  lines.length >= 6 && lines.filter((_, i) => i % 3 === 0).every((l) => l.trim() === '___ you')

const isQaLines = (lines: string[]) =>
  lines.length >= 6 &&
  lines.filter((_, i) => i % 3 === 0).every((l) => /[?？]/.test(l)) &&
  lines.filter((_, i) => i % 3 === 1).every((l) => /^(yes|no|sure|of course|not really)/i.test(l.trim()))

function buildModel(slide: TeachSlide, rawLines: string[], dialogue: TeachSlide['dialogue']): EditModel {
  if (slide.dialogue) return { kind: 'turns', turns: (dialogue ?? slide.dialogue)!.lines.map((x) => ({ ...x })) }
  const lines = normalizeScript(rawLines)
  if (isVocabSlide(normalizeScript(slide.lines))) {
    const items = parseVocab(lines).map((v) => ({ ...v }))
    if (items.length) return { kind: 'vocab', items }
  }
  if (isDoOrAreLines(normalizeScript(slide.lines)))
    return { kind: 'groups', groups: triple(lines).map((g) => ({ a: '', b: g.b, c: g.c })) }
  if (isQaLines(normalizeScript(slide.lines))) return { kind: 'qa', groups: triple(lines) }
  return { kind: 'rows', rows: [...lines] }
}

function ItemBox({ children, onRemove, label }: { children: React.ReactNode; onRemove: () => void; label: string }) {
  return (
    <div className="relative rounded-xl border border-line bg-surface p-3">
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-line bg-surface text-[14px] font-bold text-muted transition hover:border-danger/40 hover:text-danger"
        aria-label={label}
        title="Xoá"
      >
        ×
      </button>
      {children}
    </div>
  )
}

function LineEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className="min-h-[42px] w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none focus:border-primary/50"
    />
  )
}

function VocabEditor({ items, onChange }: { items: VocabItem[]; onChange: (v: VocabItem[]) => void }) {
  const set = (i: number, patch: Partial<VocabItem>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  return (
    <div className="space-y-2.5">
      {items.map((v, i) => (
        <ItemBox key={i} label={`Xoá từ ${i + 1}`} onRemove={() => onChange(items.filter((_, j) => j !== i))}>
          <div className="flex flex-wrap items-end gap-2 pr-8">
            <label className="min-w-[140px] flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Từ</span>
              <input
                value={v.word}
                onChange={(e) => set(i, { word: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[16px] font-semibold text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="w-24">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Loại</span>
              <input
                value={v.pos}
                onChange={(e) => set(i, { pos: e.target.value })}
                placeholder="v / adj"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[14px] text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="w-40">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Phiên âm</span>
              <input
                value={v.ipa}
                onChange={(e) => set(i, { ipa: e.target.value })}
                placeholder="/…/"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[14px] text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="min-w-[140px] flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Nghĩa</span>
              <input
                value={v.meaning}
                onChange={(e) => set(i, { meaning: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[15px] text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="min-w-[180px] flex-[2]">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Câu ví dụ</span>
              <input
                value={v.example}
                onChange={(e) => set(i, { example: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[15px] text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>
        </ItemBox>
      ))}
      <button
        onClick={() => onChange([...items, { word: '', pos: '', ipa: '', meaning: '', example: '' }])}
        className="rounded-lg border border-dashed border-primary/40 bg-primary-soft/30 px-3 py-2 text-[13.5px] font-semibold text-primary transition hover:bg-primary-soft/60"
      >
        + Thêm từ
      </button>
    </div>
  )
}

function GroupsEditor({
  groups,
  onChange,
  prefix,
  labels,
  hideA,
}: {
  groups: Triple[]
  onChange: (v: Triple[]) => void
  prefix?: string
  labels: [string, string, string]
  hideA?: boolean
}) {
  const set = (i: number, patch: Partial<Triple>) => onChange(groups.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  return (
    <div className="space-y-2.5">
      {groups.map((g, i) => (
        <ItemBox key={i} label={`Xoá mục ${i + 1}`} onRemove={() => onChange(groups.filter((_, j) => j !== i))}>
          <div className="flex flex-wrap items-end gap-2 pr-8">
            {prefix && <span className="pb-2.5 text-[15px] font-semibold text-muted">{prefix}</span>}
            {!hideA && (
              <label className="min-w-[110px] flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{labels[0]}</span>
                <input
                  value={g.a}
                  onChange={(e) => set(i, { a: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[15.5px] font-semibold text-ink outline-none focus:border-primary/50"
                />
              </label>
            )}
            <label className="min-w-[110px] flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{labels[1]}</span>
              <input
                value={g.b}
                onChange={(e) => set(i, { b: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[15.5px] text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="min-w-[110px] flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{labels[2]}</span>
              <input
                value={g.c}
                onChange={(e) => set(i, { c: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[15.5px] text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>
        </ItemBox>
      ))}
      <button
        onClick={() => onChange([...groups, { a: '', b: '', c: '' }])}
        className="rounded-lg border border-dashed border-primary/40 bg-primary-soft/30 px-3 py-2 text-[13.5px] font-semibold text-primary transition hover:bg-primary-soft/60"
      >
        + Thêm mục
      </button>
    </div>
  )
}

function RowsEditor({ rows, onChange }: { rows: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-3 w-5 shrink-0 text-right text-[12px] font-semibold text-muted">{i + 1}</span>
          <div className="flex-1">
            <LineEditor value={row} onChange={(v) => onChange(rows.map((r, j) => (j === i ? v : r)))} />
          </div>
          <button
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-[15px] font-bold text-muted transition hover:border-danger/40 hover:text-danger"
            aria-label={`Xoá dòng ${i + 1}`}
            title="Xoá dòng"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...rows, ''])}
        className="ml-7 rounded-lg border border-dashed border-primary/40 bg-primary-soft/30 px-3 py-2 text-[13.5px] font-semibold text-primary transition hover:bg-primary-soft/60"
      >
        + Thêm dòng
      </button>
    </div>
  )
}

function TurnEditor({ turns, onChange }: { turns: Turn[]; onChange: (v: Turn[]) => void }) {
  const set = (i: number, patch: Partial<Turn>) => onChange(turns.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  return (
    <div className="space-y-2">
      {turns.map((turn, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={turn.s}
            onChange={(e) => set(i, { s: e.target.value })}
            className="mt-0.5 w-20 shrink-0 rounded-lg border border-line bg-surface px-2 py-2.5 text-center text-[12.5px] font-bold uppercase tracking-wide text-ink outline-none focus:border-primary/50"
            placeholder="TÊN"
          />
          <div className="flex-1">
            <LineEditor value={turn.t} onChange={(v) => set(i, { t: v })} />
          </div>
          <button
            onClick={() => onChange(turns.filter((_, j) => j !== i))}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-[15px] font-bold text-muted transition hover:border-danger/40 hover:text-danger"
            aria-label={`Xoá lượt ${i + 1}`}
            title="Xoá lượt"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...turns, { s: turns[turns.length - 1]?.s ?? '', t: '' }])}
        className="ml-[88px] rounded-lg border border-dashed border-primary/40 bg-primary-soft/30 px-3 py-2 text-[13.5px] font-semibold text-primary transition hover:bg-primary-soft/60"
      >
        + Thêm lượt
      </button>
    </div>
  )
}

function SlideCard({
  lesson,
  slide,
  tone,
  edit,
  onSaveEdit,
  onResetEdit,
}: {
  lesson: number
  slide: TeachSlide
  tone: (typeof FALLBACK_TONE)
  edit?: SlideEdit
  onSaveEdit: (patch: SlideEdit) => Promise<'cloud' | 'local'>
  onResetEdit: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftInstruction, setDraftInstruction] = useState('')
  const [model, setModel] = useState<EditModel>({ kind: 'rows', rows: [] })

  const title = edit?.title ?? slide.title
  const instruction = edit?.instruction ?? slide.instruction
  const lines = edit?.lines ?? slide.lines
  const dialogue = edit?.dialogue ?? slide.dialogue
  const edited = Boolean(edit && (edit.title || edit.instruction || edit.lines || edit.dialogue))
  const bodySlide: TeachSlide = { ...slide, lines, dialogue: dialogue ?? null }

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(''), 5000)
    return () => clearTimeout(timer)
  }, [status])

  const startEdit = () => {
    setDraftTitle(title)
    setDraftInstruction(instruction)
    setModel(buildModel(slide, lines, dialogue))
    setStatus('')
    setEditing(true)
  }

  const save = async () => {
    setBusy(true)
    try {
      const patch: SlideEdit = { title: draftTitle.trim(), instruction: draftInstruction.trim() }
      if (model.kind === 'turns') {
        const turns = model.turns.map((x) => ({ s: (x.s.trim() || 'A').toUpperCase(), t: x.t.trim() })).filter((x) => x.t)
        const speakers: string[] = []
        for (const x of turns) if (!speakers.includes(x.s)) speakers.push(x.s)
        patch.dialogue = turns.length ? { speakers, lines: turns } : null
      } else if (model.kind === 'vocab') {
        patch.lines = model.items
          .filter((v) => v.word.trim())
          .flatMap((v) => [
            `${v.word.trim()}${v.pos.trim() ? ` · ${v.pos.trim()}` : ''}`,
            v.ipa.trim(),
            v.meaning.trim(),
            ...(v.example.trim() ? [v.example.trim()] : []),
          ])
      } else if (model.kind === 'groups') {
        patch.lines = model.groups
          .filter((g) => g.b.trim() || g.c.trim())
          .flatMap((g) => ['___ you', g.b.trim(), g.c.trim()])
      } else if (model.kind === 'qa') {
        patch.lines = model.groups.filter((g) => g.a.trim()).flatMap((g) => [g.a.trim(), g.b.trim(), g.c.trim()])
      } else {
        patch.lines = model.rows.map((r) => r.trim()).filter(Boolean)
      }
      const where = await onSaveEdit(patch)
      setStatus(where === 'cloud' ? 'Đã lưu cho tất cả giáo viên.' : 'Đã lưu trên máy này (chưa đăng nhập).')
      setEditing(false)
    } catch (e) {
      setStatus(`Không lưu được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`)
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    setBusy(true)
    try {
      await onResetEdit()
      setStatus('Đã trả về bản gốc của giáo trình.')
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="min-w-0 break-words rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
      <header className="mb-2 flex flex-wrap items-center gap-2.5">
        <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', tone.chip)}>
          {slide.kind || 'Part'}
        </span>
        <button
          onClick={editing ? () => setEditing(false) : startEdit}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition',
            editing ? 'border-primary/40 bg-primary-soft/60 text-primary' : 'border-line bg-surface text-muted hover:border-primary/30 hover:text-ink',
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? 'Đóng' : 'Update'}
        </button>
      </header>

      {editing ? (
        <div className="mt-2 space-y-4 rounded-xl border border-primary/30 bg-primary-soft/20 p-4 sm:p-5">
          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted">Tiêu đề</span>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[17px] font-semibold text-ink outline-none focus:border-primary/50"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted">Hướng dẫn cho học sinh</span>
            <textarea
              value={draftInstruction}
              onChange={(e) => setDraftInstruction(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none focus:border-primary/50"
            />
          </label>

          <div>
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted">
              {model.kind === 'vocab'
                ? 'Từ vựng'
                : model.kind === 'groups'
                  ? 'Câu hỏi'
                  : model.kind === 'qa'
                    ? 'Câu hỏi và câu trả lời'
                    : model.kind === 'turns'
                      ? 'Các lượt hội thoại'
                      : 'Nội dung từng dòng'}
            </span>
            <div className="mt-1.5">
              {model.kind === 'vocab' && <VocabEditor items={model.items} onChange={(items) => setModel({ kind: 'vocab', items })} />}
              {model.kind === 'groups' && (
                <GroupsEditor groups={model.groups} onChange={(groups) => setModel({ kind: 'groups', groups })} prefix="___ you" labels={['', 'Động từ', 'Phần còn lại']} hideA />
              )}
              {model.kind === 'qa' && (
                <GroupsEditor groups={model.groups} onChange={(groups) => setModel({ kind: 'qa', groups })} labels={['Câu hỏi', 'Trả lời ngắn', 'Chi tiết']} />
              )}
              {model.kind === 'turns' && <TurnEditor turns={model.turns} onChange={(turns) => setModel({ kind: 'turns', turns })} />}
              {model.kind === 'rows' && <RowsEditor rows={model.rows} onChange={(rows) => setModel({ kind: 'rows', rows })} />}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-primary/20 pt-3">
            <button onClick={save} disabled={busy} className="rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition hover:border-primary/40 disabled:opacity-50">
              Huỷ
            </button>
            {edited && (
              <button onClick={reset} disabled={busy} className="text-[12.5px] font-semibold text-muted underline underline-offset-2 hover:text-danger">
                Trả về bản gốc
              </button>
            )}
            {status && <span className="text-[12px] text-muted">{status}</span>}
          </div>
        </div>
      ) : (
        <>
          <h3 className="break-words text-[19px] font-bold leading-snug tracking-tight text-ink">{title}</h3>
          {instruction && (
            <p className="mt-2 flex items-start gap-2 text-[14px] leading-relaxed text-muted">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{instruction}</span>
            </p>
          )}
          {status && <p className="mt-2 text-[12px] text-muted">{status}</p>}
          <div className="mt-4">
            <SlideBody lesson={lesson} slide={bodySlide} shape={{ lines: slide.lines, title: slide.title, hasDialogue: Boolean(slide.dialogue) }} />
          </div>
        </>
      )}
    </article>
  )
}

// ── overview panel ───────────────────────────────────────────────────────

function OverviewPanel({ lesson, onPick }: { lesson: LessonData; onPick: (key: string) => void }) {
  const stats = useMemo(() => {
    let words = 0
    let convos = 0
    let reads = 0
    for (const s of lesson.slides) {
      if (isVocabSlide(s.lines) && !/BACK/i.test(s.title)) words += parseVocab(s.lines).length
      if (s.dialogue && s.dialogue.lines.length >= 3) convos++
      if (isStorySlide(s.kind)) reads++
    }
    return { words, convos, reads }
  }, [lesson])

  const overviewSlide = lesson.slides.find((s) => s.section === 'OVERVIEW')
  const intro = LESSON_INTROS[lesson.lesson] ?? overviewSlide?.instruction ?? ''

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Tổng quan bài học</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-ink">
          L{String(lesson.lesson).padStart(2, '0')} · {lesson.title}
        </h2>
        {intro && (
          <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-ink/90">{intro}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Hoạt động', value: lesson.slides.length },
            { label: 'Từ và cụm', value: stats.words },
            { label: 'Hội thoại có audio', value: stats.convos },
            { label: 'Bài đọc nghe', value: stats.reads },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-bg/50 px-4 py-3">
              <p className="text-[22px] font-bold tracking-tight text-ink">{s.value}</p>
              <p className="text-[12.5px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {(() => {
        const overview = lesson.slides.find((x) => x.section === 'OVERVIEW')
        const idx = overview ? overview.lines.findIndex((l) => /YOUR FINAL TASK/i.test(l)) : -1
        if (!overview || idx < 0) return null
        const criteria = overview.lines.slice(idx + 1).filter((l) => l.trim() && !/^Bắt đầu với/i.test(l))
        return (
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Nhiệm vụ cuối bài</p>
            <ul className="mt-3 space-y-2">
              {criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink/90">
                  <span className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[10.5px] font-bold text-primary">{i + 1}</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Các phần trong bài</p>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {lesson.sections.filter((sec) => sec.key !== 'OVERVIEW').map((sec) => {
            const n = lesson.slides.filter((s) => s.section === sec.key).length
            return (
              <button
                key={sec.key}
                onClick={() => onPick(sec.key)}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg/40 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <span className="text-[20px]">{sec.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{sec.label}</span>
                  {sec.blurb && <span className="block truncate text-[13px] text-muted">{sec.blurb}</span>}
                </span>
                <span className="text-[12.5px] font-semibold text-muted">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── main screen ──────────────────────────────────────────────────────────

export function TeacherLesson() {
  const [lessonIdx, setLessonIdx] = useState(0)
  const lesson = TEACH_LESSONS[lessonIdx] as LessonData
  const [activeKey, setActiveKey] = useState<string>('__overview')
  const [edits, setEdits] = useState<Record<number, SlideEdit>>({})

  // Teacher edits live in Supabase (shared) with a local copy for the dev bypass.
  useEffect(() => {
    let alive = true
    const local: Record<number, SlideEdit> = {}
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i)
        if (!k) continue
        const m = k.match(/^mt2_edit_(\d+)_(\d+)$/)
        if (m && Number(m[1]) === lesson.lesson) local[Number(m[2])] = JSON.parse(localStorage.getItem(k) ?? '{}') as SlideEdit
      }
    } catch {
      /* storage can be unavailable in private mode */
    }
    setEdits(local)
    supabase
      .from('teacher_notes')
      .select('slide_no, title, instruction, lines, dialogue, content')
      .eq('lesson_no', lesson.lesson)
      .then(({ data }) => {
        if (!alive || !data) return
        const fromDb: Record<number, SlideEdit> = {}
        for (const row of data as Array<Record<string, unknown>>) {
          const edit: SlideEdit = {}
          if (typeof row.title === 'string') edit.title = row.title
          if (typeof row.instruction === 'string') edit.instruction = row.instruction
          if (Array.isArray(row.lines)) edit.lines = (row.lines as unknown[]).map(String)
          if (row.dialogue && typeof row.dialogue === 'object') edit.dialogue = row.dialogue as TeachSlide['dialogue']
          if (typeof row.content === 'string' && row.content) edit.notes = row.content
          fromDb[Number(row.slide_no)] = edit
        }
        setEdits((prev) => ({ ...prev, ...fromDb }))
      })
    return () => {
      alive = false
    }
  }, [lesson.lesson])

  const saveEdit = async (slideNo: number, patch: SlideEdit): Promise<'cloud' | 'local'> => {
    const merged: SlideEdit = { ...(edits[slideNo] ?? {}), ...patch }
    setEdits((prev) => ({ ...prev, [slideNo]: merged }))
    try {
      localStorage.setItem(`mt2_edit_${lesson.lesson}_${slideNo}`, JSON.stringify(merged))
    } catch {
      /* ignore quota errors */
    }
    const { data } = await supabase.auth.getSession()
    if (!data.session) return 'local'
    const { error } = await supabase.from('teacher_notes').upsert({
      lesson_no: lesson.lesson,
      slide_no: slideNo,
      content: merged.notes ?? '',
      title: merged.title ?? null,
      instruction: merged.instruction ?? null,
      lines: merged.lines ?? null,
      dialogue: merged.dialogue ?? null,
      updated_by: data.session.user.id,
    })
    if (error) throw new Error(error.message)
    return 'cloud'
  }

  const resetEdit = async (slideNo: number) => {
    try {
      localStorage.removeItem(`mt2_edit_${lesson.lesson}_${slideNo}`)
    } catch {
      /* ignore */
    }
    setEdits((prev) => {
      const next = { ...prev }
      delete next[slideNo]
      return next
    })
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      await supabase.from('teacher_notes').delete().eq('lesson_no', lesson.lesson).eq('slide_no', slideNo)
    }
  }

  const bySection = useMemo(() => {
    const map = new Map<string, TeachSlide[]>()
    for (const s of lesson.slides) {
      const arr = map.get(s.section) ?? []
      arr.push(s)
      map.set(s.section, arr)
    }
    return map
  }, [lesson])

  // a new lesson always opens on its overview
  useEffect(() => { setActiveKey('__overview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [lessonIdx])

  const tabs = useMemo(
    () => [
      { key: '__overview', label: 'Tổng quan', icon: '🧭', count: 0 },
      ...lesson.sections
        .filter((s) => s.key !== 'OVERVIEW')
        .map((s) => ({
          key: s.key, label: s.label, icon: s.icon, count: bySection.get(s.key)?.length ?? 0,
        })),
    ],
    [lesson, bySection],
  )

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeKey))
  const activeTab = tabs[activeIndex]
  const activeSec = lesson.sections.find((s) => s.key === activeTab?.key)
  const tone = SECTION_TONE[activeTab?.key ?? ''] ?? FALLBACK_TONE
  const slides = activeTab?.key === '__overview' ? [] : bySection.get(activeTab?.key ?? '') ?? []

  const goTab = (delta: number) => {
    const next = tabs[Math.min(tabs.length - 1, Math.max(0, activeIndex + delta))]
    if (next) setActiveKey(next.key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goLesson = (delta: number) => setLessonIdx((i) => Math.min(TEACH_LESSONS.length - 1, Math.max(0, i + delta)))

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 pb-16 pt-4 sm:px-5 lg:px-7">
      {/* hero */}
      <div className="rounded-2xl border border-line bg-gradient-to-r from-[#EDF3E8] via-[#F4F6EC] to-[#EBF2F4] px-5 py-5 shadow-card sm:px-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-card">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Foundation 1 · Giáo trình dạy trên lớp</p>
            <h1 className="mt-0.5 break-words text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[26px]">
              L{String(lesson.lesson).padStart(2, '0')} · {lesson.title}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 max-w-full items-center gap-1.5">
          <button onClick={() => goLesson(-1)} disabled={lessonIdx === 0} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink shadow-card transition hover:border-primary/40 disabled:opacity-35" aria-label="Previous lesson">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1 shadow-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TEACH_LESSONS.map((l, i) => (
              <button
                key={i}
                onClick={() => setLessonIdx(i)}
                title={l.title}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-bold transition',
                  i === lessonIdx ? 'bg-primary text-white shadow-card' : 'text-muted hover:bg-bg hover:text-ink',
                )}
              >
                L{String(l.lesson).padStart(2, '0')}
              </button>
            ))}
          </div>
          <button onClick={() => goLesson(1)} disabled={lessonIdx === TEACH_LESSONS.length - 1} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink shadow-card transition hover:border-primary/40 disabled:opacity-35" aria-label="Next lesson">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* part tabs */}
      <nav className="sticky top-[68px] z-30 -mx-3 mt-4 mb-5 max-w-[calc(100%+1.5rem)] overflow-x-auto border-y border-line bg-bg/95 px-3 py-2 backdrop-blur sm:mx-0 sm:max-w-full sm:rounded-xl sm:border sm:shadow-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {tabs.map((t) => {
            const active = activeKey === t.key
            return (
              <button
                key={t.key}
                onClick={() => { setActiveKey(t.key); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition',
                  active ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-surface text-ink/75 hover:border-primary/40 hover:text-ink',
                )}
              >
                <span>{t.icon}</span>
                {t.label}
                {t.count > 0 && (
                  <span className={cn('rounded-md px-1.5 text-[11px] font-bold', active ? 'bg-white/20 text-white' : 'bg-bg text-muted')}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* active panel */}
      <div key={activeKey} className="animate-fade-up">
        {activeKey === '__overview' ? (
          <OverviewPanel lesson={lesson} onPick={(k) => { setActiveKey(k); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        ) : (
          <div className="space-y-4">
            <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line bg-gradient-to-r px-5 py-4 shadow-card', tone.grad)}>
              <span className={cn('h-2.5 w-2.5 shrink-0 self-center rounded-full', tone.dot)} />
              <h2 className="min-w-0 text-[18px] font-bold tracking-tight text-ink">
                <span className="mr-2">{activeSec?.icon}</span>
                {activeSec?.label}
              </h2>
              <span className="text-[13px] font-semibold text-muted">{slides.length} hoạt động</span>
              {activeSec?.blurb && <span className="ml-auto min-w-0 truncate text-[13.5px] text-muted">{activeSec.blurb}</span>}
            </div>
            {slides.map((s) => (
              <SlideCard
                key={s.num}
                lesson={lesson.lesson}
                slide={s}
                tone={tone}
                edit={edits[s.num]}
                onSaveEdit={(patch) => saveEdit(s.num, patch)}
                onResetEdit={() => resetEdit(s.num)}
              />
            ))}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => goTab(-1)}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:border-primary/40 disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" /> Phần trước
              </button>
              <button
                onClick={() => goTab(1)}
                disabled={activeIndex === tabs.length - 1}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-card transition hover:opacity-90 disabled:opacity-35"
              >
                Phần tiếp <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
