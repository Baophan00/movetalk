import { useState } from 'react'
import { BookOpen, ChevronDown, ClipboardList } from 'lucide-react'
import { A1, readingFor, titleOf, partCount } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { cn } from '../lib/utils'

const SECTIONS = [
  { key: 'vocab', label: 'Từ vựng' },
  { key: 'review', label: 'Ôn tập' },
  { key: 'dictation', label: 'Nghe viết' },
  { key: 'pronunciation', label: 'Phát âm' },
]

export function Lessons({
  onPractise,
  onOpenLesson,
  onHomework,
  onReview,
  onSeason1,
  onOpenSpeak,
}: {
  onPractise: (n: number) => void
  onOpenLesson?: (n: number, level?: 1 | 2) => void
  onHomework?: () => void
  onReview?: () => void
  onSeason1?: () => void
  onOpenSpeak?: (n: number) => void
}) {
  const [selected, setSelected] = useState<number>(A1[0]?.n ?? 1)
  const [openRead, setOpenRead] = useState<number | null>(null)

  const selectedLesson = A1.find((l) => l.n === selected) ?? A1[0]

  return (
    <div className="theme-overview mx-auto max-w-6xl bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Level A1</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Class practice</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onReview && (
            <button onClick={onReview} className="rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              Review
            </button>
          )}
          {onHomework && (
            <button onClick={onHomework} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40">
              <ClipboardList className="h-3.5 w-3.5" /> Homework
            </button>
          )}
          {onSeason1 && (
            <button onClick={onSeason1} className="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary/20">
              <BookOpen className="h-3.5 w-3.5" /> Giáo trình đầy đủ (Season 1)
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row" style={{ minHeight: '60vh' }}>
        {/* Left 30%: lesson list */}
        <div className="w-full shrink-0 overflow-y-auto rounded-2xl border border-line bg-surface/60 p-2 lg:w-[240px]">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Bài học</p>
          <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
            {A1.map((l) => {
              const active = selected === l.n
              return (
                <button
                  key={l.n}
                  onClick={() => setSelected(l.n)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition lg:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active ? 'bg-primary-soft/70 border border-primary/30' : 'hover:bg-bg/60 border border-transparent',
                  )}
                >
                  <span className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10.5px] font-bold',
                    'bg-primary-soft text-primary',
                  )}>
                    {String(l.n).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted leading-none">Lesson {l.n}</p>
                    <p className="truncate text-[12px] font-semibold leading-tight mt-0.5">{titleOf(l)}</p>
                    <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((partsSeen(l.n).length / Math.max(1, partCount(l))) * 100)}%` }} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right 70%: levels + sections */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-line bg-surface/60 p-4">
          {selectedLesson && (
            <>
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Lesson {String(selectedLesson.n).padStart(2, '0')}</p>
                <h3 className="mt-1 text-[20px] font-semibold tracking-tight">{titleOf(selectedLesson) || `Lesson ${selectedLesson.n}`}</h3>
                <p className="mt-1 text-[11.5px] text-muted">{partsSeen(selectedLesson.n).length}/{partCount(selectedLesson)} parts done</p>
              </div>

              {[1, 2].map((lvl) => (
                <div key={lvl} className="mb-3 rounded-xl border border-line bg-bg/40 p-3">
                  <p className="mb-2 text-[13px] font-semibold text-primary">Level {lvl}</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {SECTIONS.map((sec) => (
                      <button
                        key={sec.key}
                        onClick={() => onOpenLesson ? onOpenLesson(selectedLesson.n, lvl as 1 | 2) : onPractise(selectedLesson.n)}
                        className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-2.5 text-center transition hover:border-primary/40 hover:bg-primary-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="text-[11.5px] font-semibold">{sec.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {selectedLesson.n === 1 && (
                <div className="mb-3 rounded-xl border border-line bg-bg/40 p-3">
                  <p className="mb-2 text-[13px] font-semibold text-primary">Level 3 — Nói câu (Speak sentences)</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { key: 'repeat', label: 'Phần 1: Nói lại', desc: '12 câu' },
                      { key: 'answer', label: 'Phần 2: Nghe hỏi', desc: '10 câu' },
                      { key: 'test', label: 'Phần 3: Kiểm tra', desc: '15 câu' },
                    ].map((sec) => (
                      <button
                        key={sec.key}
                        onClick={() => onOpenSpeak ? onOpenSpeak(selectedLesson.n) : undefined}
                        className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-2.5 text-center transition hover:border-primary/40 hover:bg-primary-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="text-[11.5px] font-semibold">{sec.label}</span>
                        <span className="text-[9.5px] text-muted">{sec.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLesson && readingFor(selectedLesson.n) && (
                <div className="mt-2">
                  <button
                    onClick={() => setOpenRead(openRead === selectedLesson.n ? null : selectedLesson.n)}
                    className="flex w-full items-center justify-between rounded-xl bg-bg/50 px-3 py-2 text-[12px] font-medium text-ink/75"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> Read: {readingFor(selectedLesson.n)?.title}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition', openRead === selectedLesson.n && 'rotate-180')} />
                  </button>
                  {openRead === selectedLesson.n && (
                    <p className="mt-2 rounded-xl border border-line/70 bg-bg/40 px-3 py-2 text-[12px] leading-relaxed text-ink/80">
                      {readingFor(selectedLesson.n)?.text}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
