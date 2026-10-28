import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Mic } from 'lucide-react'
import { A1, partPlan, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { dueCards, doneToday, mistakeCount, pullStudy, streak, weakSections } from '../lib/study'
import { myAssignments } from '../lib/assignments'
import { Icon3D } from '../components/Icon3D'
import type { Icon3DName } from '../components/Icon3D'

type Go = (r: 'lesson' | 'practice' | 'library' | 'homework' | 'words' | 'mistakes', n?: number) => void

/** One screen, one decision: what to do in the next ten minutes. */
export function Today({ name, onGo }: { name: string; onGo: Go }) {
  const [tick, setTick] = useState(0)
  const [assigned, setAssigned] = useState(0)

  useEffect(() => {
    void pullStudy().finally(() => setTick((n) => n + 1))
    void myAssignments()
      .then((rows) => setAssigned(rows.filter((a) => a.status === 'assigned').length))
      .catch(() => undefined)
  }, [])

  const view = useMemo(() => {
    const current = [...A1].reverse().find((l) => partsSeen(l.n).length > 0) ?? A1[0]
    const plan = partPlan(current)
    const seen = new Set(partsSeen(current.n))
    const nextPart = plan.find((_, i) => !seen.has(i)) ?? plan[0]
    const nextIndex = plan.findIndex((_, i) => !seen.has(i))
    return {
      lesson: current,
      title: titleOf(current),
      part: nextPart,
      partNo: nextIndex < 0 ? plan.length : nextIndex + 1,
      total: plan.length,
      read: Math.min(seen.size, plan.length),
      mistakes: mistakeCount(),
      weak: weakSections(2),
      due: dueCards().length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const run = streak()
  const first = (name || '').split(' ')[0] || 'there'
  const pct = Math.round((view.read / Math.max(1, view.total)) * 100)
  const finished = doneToday()

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
      {/* Greeting: a name in the serif, the date under it, the run and the face on the right. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]" title={`Hi ${first},`}>
            Hi {first},
          </h1>
          <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[.18em] text-muted">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft font-display text-[15px] font-semibold text-primary ring-2 ring-surface">
            {first.slice(0, 1).toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold shadow-card">
            <Icon3D name="streak" size={18} />
            {run === 0 ? 'Start today' : `${run} day${run === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <section
        className="relative mt-5 overflow-hidden rounded-[26px] px-5 py-5 text-white shadow-lift"
        style={{ backgroundImage: 'linear-gradient(135deg,#3C5748 0%,#4B6C5B 48%,#5F7F70 100%)' }}
      >
        <Waveform className="pointer-events-none absolute right-0 top-1 h-16 w-24 opacity-40" />
        <OpenBook className="pointer-events-none absolute right-1 top-[46px] h-24 w-28 rotate-[-7deg] opacity-95" />

        <p className="relative text-[10px] font-bold uppercase tracking-[.18em] text-white/75">Today's one thing</p>
        <h2 className="relative mt-2 max-w-[13ch] font-display text-[27px] font-semibold leading-[1.12] sm:text-[30px]">
          {finished ? 'Done for today. Anything else is a bonus.' : `Part ${view.partNo}: ${view.part.label}`}
        </h2>
        <p className="relative mt-3.5 text-[12px] font-medium text-white/85">
          Lesson {view.lesson.n} · {view.title}
        </p>
        <p className="relative text-[11.5px] text-white/78">
          {view.read} of {view.total} parts read
        </p>

        <div className="relative mt-4 flex items-center gap-2">
          <button
            onClick={() => onGo('lesson', view.lesson.n)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#33503C] shadow-sm transition hover:bg-white/92 active:scale-[.985]"
          >
            <BookOpen className="h-4 w-4" /> Continue lesson
          </button>
          <button
            onClick={() => onGo('practice', view.lesson.n)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/45 px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/12 active:scale-[.985]"
          >
            <Mic className="h-4 w-4" /> Say one sentence
          </button>
        </div>
      </section>

      <div className="mt-3 space-y-2">
        <Row
          icon="target"
          label={view.mistakes ? `${view.mistakes} question${view.mistakes === 1 ? '' : 's'} to redo` : 'No wrong answers waiting'}
          hint={view.weak.length ? view.weak.map((w) => `${w.section} (${w.wrong})`).join(' · ') : 'Answer a quiz and this fills up'}
          disabled={!view.mistakes}
          onClick={() => onGo('mistakes')}
        />
        <Row
          icon="writing"
          label={view.due ? `${view.due} word${view.due === 1 ? '' : 's'} due today` : 'No words due today'}
          hint={view.due ? 'Two minutes, spaced repetition' : 'Tap any word while reading to keep it'}
          disabled={!view.due}
          onClick={() => onGo('words')}
        />
        <Row
          icon="folder"
          label={assigned ? `${assigned} homework from your teacher` : 'No homework set'}
          hint={assigned ? 'Due dates inside' : 'Nothing to hand in'}
          disabled={!assigned}
          onClick={() => onGo('homework')}
        />

        {/* The last card counts the day instead of pointing anywhere. */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3">
          <ProgressRing value={pct} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">How today counts</p>
            <p className="text-[11.5px] leading-relaxed text-muted">
              Small steps build real progress. Finish one thing and the day is kept.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: Icon3DName
  label: string
  hint: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,.03)] transition enabled:hover:-translate-y-px enabled:hover:border-primary/35 enabled:hover:shadow-card disabled:opacity-55"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-bg">
        <Icon3D name={icon} size={30} className={disabled ? 'opacity-70 grayscale-[.35]' : undefined} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold">{label}</span>
        <span className="block truncate text-[11.5px] text-muted">{hint}</span>
      </span>
      {!disabled && <ArrowRight className="h-4 w-4 shrink-0 text-muted" />}
    </button>
  )
}

function ProgressRing({ value }: { value: number }) {
  const size = 44
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--line))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, value)) / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10.5px] font-bold tabular-nums text-primary">{value}%</span>
    </span>
  )
}

/** Thin bars that read as speech, not as a chart. */
function Waveform({ className }: { className?: string }) {
  const bars = [10, 26, 16, 38, 22, 48, 30, 56, 34, 44, 20, 30, 14, 22]
  return (
    <svg viewBox="0 0 160 80" className={className} aria-hidden fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={6 + i * 11} y={40 - h / 2} width={3} height={h} rx={1.5} fill="white" opacity={0.55} />
      ))}
    </svg>
  )
}

/** A small open book, drawn rather than borrowed, so it belongs to this palette. */
function OpenBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 112" className={className} aria-hidden style={{ filter: 'drop-shadow(0 6px 10px rgba(20,38,28,.28))' }}>
      <path d="M64 26c-10-7-24-9-38-6v56c14-3 28-1 38 6V26Z" fill="#F3EFE4" />
      <path d="M64 26c10-7 24-9 38-6v56c-14-3-28-1-38 6V26Z" fill="#FBF8F0" />
      <path d="M64 26v56" stroke="#D9CFBB" strokeWidth="1.6" />
      <path d="M34 34c8-1 16 0 24 3M34 46c8-1 16 0 24 3M34 58c8-1 16 0 24 3" stroke="#D9CFBB" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M94 34c-8-1-16 0-24 3M94 46c-8-1-16 0-24 3M94 58c-8-1-16 0-24 3" stroke="#D9CFBB" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M64 26c-10-7-24-9-38-6v56c14-3 28-1 38 6 10-7 24-9 38-6V20c-14-3-28-1-38 6Z" fill="none" stroke="#B9C9BC" strokeWidth="1.2" opacity=".7" />
    </svg>
  )
}
