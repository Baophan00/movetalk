import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, MessageSquare, RefreshCw, Search } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { allWritings, type StudentWriting } from '../lib/writings'
import { cn } from '../lib/utils'

const LEVELS = ['All', 'A2', 'B1', 'B2'] as const

function ago(at: number) {
  const min = Math.round((Date.now() - at) / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

/** Paragraphs learners wrote in Practice your way. Read only: the teacher reacts on paper or in class. */
export function TeacherWritings() {
  const [rows, setRows] = useState<StudentWriting[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = () => {
    setState('loading')
    void allWritings()
      .then((list) => {
        setRows(list)
        setState(list.length || navigator.onLine ? 'ready' : 'offline')
      })
      .catch(() => setState('offline'))
  }

  useEffect(load, [])

  const shown = useMemo(() => {
    const q = term.trim().toLowerCase()
    return rows.filter((r) => {
      if (level !== 'All' && r.level !== level) return false
      if (!q) return true
      return `${r.student} ${r.topic} ${r.body}`.toLowerCase().includes(q)
    })
  }, [rows, level, term])

  const students = new Set(rows.map((r) => r.studentId)).size

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Practice your way</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Writing</h1>
          <p className="mt-1 text-[13px] text-muted">
            {rows.length ? `${rows.length} paragraph${rows.length === 1 ? '' : 's'} from ${students} learner${students === 1 ? '' : 's'}` : 'Paragraphs your learners write in the practice rooms.'}
          </p>
        </div>
        <button onClick={load} className="rounded-xl border border-line p-2" aria-label="Refresh">
          <RefreshCw className={cn('h-4 w-4', state === 'loading' && 'animate-spin')} />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition',
                level === l ? 'border-transparent bg-primary text-white' : 'border-line bg-surface text-muted',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search learner or wording" className="pl-9" />
      </div>

      {state === 'offline' && (
        <Card className="mt-4">
          <CardBody className="p-5">
            <p className="text-[13px] font-semibold">Cannot reach the server</p>
            <p className="mt-1 text-[12px] text-muted">Paragraphs live on the server, so this list needs a connection.</p>
          </CardBody>
        </Card>
      )}

      {state === 'ready' && !shown.length && (
        <Card className="mt-4">
          <CardBody className="p-6 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-[13px] font-semibold">Nothing here yet</p>
            <p className="mt-1 text-[12px] text-muted">
              {rows.length ? 'No paragraph matches that filter.' : 'When a learner writes a paragraph in the Writing room it shows up here.'}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="mt-3 grid gap-2">
        {shown.map((r) => {
          const expanded = open === r.id
          return (
            <Card key={r.id}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13.5px] font-semibold">{r.student}</span>
                      <Badge tone="primary">{r.level}</Badge>
                      {r.issues === 0 ? (
                        <Badge tone="ok"><Check className="mr-1 h-3 w-3" />no flagged errors</Badge>
                      ) : (
                        <Badge tone="warn">{r.issues} grammar flag{r.issues === 1 ? '' : 's'}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted">{r.topic} · {r.words} words · {ago(r.at)}</p>
                  </div>
                  <button onClick={() => setOpen(expanded ? null : r.id)} className="shrink-0 rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold">
                    {expanded ? 'Hide' : 'Read'}
                  </button>
                </div>

                {expanded ? (
                  <div className="mt-3 rounded-xl bg-bg p-3">
                    {r.prompt && <p className="text-[11.5px] font-semibold uppercase tracking-[.1em] text-muted">Task</p>}
                    {r.prompt && <p className="mt-0.5 text-[12.5px] text-muted">{r.prompt}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{r.body}</p>
                  </div>
                ) : (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{r.body}</p>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      {shown.length > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
          <MessageSquare className="h-3.5 w-3.5" /> Machine checked for grammar and keywords; the writing itself is yours to judge.
        </p>
      )}
    </div>
  )
}
