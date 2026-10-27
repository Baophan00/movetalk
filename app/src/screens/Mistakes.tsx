import { useMemo, useState } from 'react'
import { ArrowRight, Headphones, Pencil, BookOpen, Volume2, RotateCcw } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { allAttempts, wrongItems, type Attempt } from '../lib/study'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

type Go = (room: 'listen' | 'read' | 'write' | 'speak', level?: string, prompt?: string) => void

const ROOM_OF: Record<string, 'listen' | 'read' | 'write'> = {
  Listening: 'listen',
  Reading: 'read',
  Writing: 'write',
  Paragraph: 'write',
}

function roomFor(a: Attempt): 'listen' | 'read' | 'write' | null {
  const head = (a.section ?? '').split(' ')[0]
  return ROOM_OF[head] ?? null
}

function levelFor(a: Attempt): string | undefined {
  const match = (a.section ?? '').match(/\b(A1|A2|B1|B2)\b/)
  return match?.[1]
}

function isEnglish(t: string) {
  return /^[\x20-\x7E’'",.?!;:-]+$/.test(t)
}

/** Everything answered wrong in practice, with the answer, and a way back to the exact room. */
export function Mistakes({ onGo }: { onGo: Go }) {
  const rows = useMemo(() => wrongItems(), [])
  const [filter, setFilter] = useState<'all' | 'A1' | 'A2'>('all')
  const total = allAttempts().length

  const shown = rows.filter((r) => filter === 'all' || levelFor(r) === filter)
  const practice = shown.filter((r) => roomFor(r))
  const course = shown.filter((r) => !roomFor(r))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">To redo</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{rows.length} question{rows.length === 1 ? '' : 's'} you got wrong</h1>
      <p className="mt-1 text-[13px] text-muted">
        {total ? `From ${total} answers so far. A question leaves this list once you get it right.` : 'Answer something in practice and this fills up.'}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {(['all', 'A1', 'A2'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-xl border py-2 text-[12.5px] font-semibold transition',
              filter === f ? 'border-transparent bg-primary text-white shadow-card' : 'border-line bg-surface text-muted',
            )}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {!shown.length && (
        <Card className="mt-4">
          <CardBody className="p-5">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold"><RotateCcw className="h-4 w-4 text-primary" /> Nothing waiting</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">Every question you missed has been answered right again. Nice.</p>
          </CardBody>
        </Card>
      )}

      {practice.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">From practice</p>
          <div className="mt-2 grid gap-2">
            {practice.map((r) => {
              const room = roomFor(r)!
              const Icon = room === 'listen' ? Headphones : room === 'read' ? BookOpen : Pencil
              return (
                <Card key={r.prompt}>
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="neutral">{r.section || 'Practice'}</Badge>
                          {levelFor(r) && <Badge tone="primary">{levelFor(r)}</Badge>}
                        </div>
                        <p className="mt-2 text-[13.5px] font-medium leading-snug">{r.prompt}</p>
                        {r.answer && (
                          <p className="mt-1 text-[12.5px] text-muted">
                            Answer: <span className="font-medium text-ink">{r.answer}</span>
                          </p>
                        )}
                      </div>
                      {isEnglish(r.prompt) && (
                        <button onClick={() => speak(r.prompt)} className="shrink-0 rounded-lg border border-line p-1.5"><Volume2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    <button
                      onClick={() => onGo(room, levelFor(r), r.prompt)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40"
                    >
                      <Icon className="h-3.5 w-3.5" /> Practise again <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {course.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">From your lessons</p>
          <div className="mt-2 grid gap-2">
            {course.map((r) => (
              <Card key={r.prompt}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge tone="neutral">{r.section || `Lesson ${r.lesson ?? ''}`}</Badge>
                      <p className="mt-2 text-[13.5px] font-medium leading-snug">{r.prompt}</p>
                      {r.answer && <p className="mt-1 text-[12.5px] text-muted">Answer: <span className="font-medium text-ink">{r.answer}</span></p>}
                    </div>
                    {isEnglish(r.prompt) && (
                      <button onClick={() => speak(r.prompt)} className="shrink-0 rounded-lg border border-line p-1.5"><Volume2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
