import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ChevronRight, Download, Mic, PenLine, Play, Square } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { A1, titleOf } from '../lib/curriculum'
import { myAssignments, type Assigned } from '../lib/assignments'
import { allAttempts } from '../lib/study'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

const KEY = 'mt2_homework'

type Props = {
  onPractise: (lessonN: number) => void
  onOpenLesson: (lessonN: number) => void
  onLessons: () => void
  onReview: () => void
  hasBackend: boolean
}

type Saved = Record<string, { writing: string }>

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Saved
  } catch {
    return {}
  }
}

function writeSaved(next: Saved) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

function dueLabel(iso?: string | null) {
  if (!iso) return { text: 'no due date', late: false }
  const due = new Date(iso)
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000)
  const text = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (days < 0) return { text: `was due ${text}`, late: true }
  if (days === 0) return { text: `due today`, late: true }
  return { text: `due ${text}`, late: false }
}

function Recorder() {
  const [state, setState] = useState<'idle' | 'asking' | 'recording' | 'done'>('idle')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [size, setSize] = useState(0)

  const start = async () => {
    setError('')
    setState('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const parts: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(parts, { type: rec.mimeType || 'audio/webm' })
        setSize(Math.round(blob.size / 1024))
        setUrl(URL.createObjectURL(blob))
        setState('done')
      }
      rec.start()
      setRecorder(rec)
      setState('recording')
    } catch {
      setState('idle')
      setError('The browser blocked the microphone. Allow it in the address bar and try again.')
    }
  }

  return (
    <div>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
        <Mic className="h-3.5 w-3.5" /> Say it out loud
      </p>
      <p className="mt-1 text-[12px] text-muted">
        {state === 'recording' ? 'Recording…' : state === 'done' ? 'Have a listen, then keep it or try again.' : 'One take, 60 seconds.'}
      </p>
      {url && <audio controls src={url} className="mt-3 w-full max-w-[420px]" />}
      {error && <p className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {state !== 'recording' && state !== 'asking' && (
          <Button size="sm" variant="soft" onClick={start}>
            <Mic className="h-3.5 w-3.5" /> {state === 'done' ? 'Record again' : 'Start recording'}
          </Button>
        )}
        {state === 'asking' && (
          <Button size="sm" disabled>
            Waiting for the microphone…
          </Button>
        )}
        {state === 'recording' && (
          <Button size="sm" variant="outline" onClick={() => recorder?.stop()}>
            <Square className="h-3.5 w-3.5" /> Stop
          </Button>
        )}
        {state === 'done' && url && (
          <a href={url} download="take.webm" className="inline-flex">
            <Button size="sm" variant="ghost">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </a>
        )}
      </div>
      {size > 0 && <p className="mt-1.5 text-[11px] text-muted">{size} KB</p>}
    </div>
  )
}

export function Homework({ onPractise, onOpenLesson, onLessons, onReview, hasBackend }: Props) {
  const [saved, setSaved] = useState<Saved>(readSaved)
  const [writing, setWriting] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    myAssignments()
      .then((rows) => alive && setAssigned(rows))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const open = assigned.filter((a) => a.status !== 'closed')
  const late = open.filter((a) => dueLabel(a.due).late)

  // The lesson the learner is on, so the optional part has a real target.
  const current = useMemo(() => A1[A1.length - 1], [])
  const entry = saved[String(current.n)] ?? { writing: '' }
  const attempts = allAttempts()
  const doneLessons = new Set(attempts.map((a) => a.lesson)).size

  const saveWriting = () => {
    const next = { ...saved, [String(current.n)]: { writing } }
    setSaved(next)
    writeSaved(next)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 1600)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Set by your teacher</p>
      <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Homework</h2>
      <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
        Only the work your teacher sends appears here. Everything else in the app is practice you choose yourself.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={open.length ? 'primary' : 'neutral'}>{open.length} open</Badge>
        {late.length > 0 && <Badge tone="warn">{late.length} late</Badge>}
        <Badge tone="neutral">{doneLessons} lessons practised</Badge>
        {!hasBackend && <Badge tone="neutral">no classroom linked</Badge>}
      </div>

      <div className="mt-4 grid gap-3">
        {loading && <Card><CardBody className="py-4 text-[12.5px] text-muted">Checking with your teacher…</CardBody></Card>}

        {!loading && open.length === 0 && (
          <Card>
            <CardBody className="py-6">
              <p className="text-[14px] font-semibold">Nothing to hand in.</p>
              <p className="mt-1 max-w-[52ch] text-[12.5px] text-muted">
                Your teacher has not set work right now. You can still practise any lesson, and nothing there counts as homework.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={onLessons}>
                  <Play className="h-3.5 w-3.5" /> Go to Class practice
                </Button>
                <Button size="sm" variant="soft" onClick={onReview}>
                  Review what you got wrong
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {open.map((a) => {
          const due = dueLabel(a.due)
          const lesson = A1.find((l) => l.n === a.lessonN)
          const rows = attempts.filter((x) => x.lesson === a.lessonN)
          const right = rows.filter((x) => x.correct).length
          const pct = rows.length ? Math.round((right / rows.length) * 100) : 0
          return (
            <Card key={a.id}>
              <CardBody className="p-4">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold leading-tight">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Lesson {a.lessonN}
                      {lesson ? ` · ${titleOf(lesson)}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold',
                      due.late ? 'border-danger/30 bg-danger/10 text-danger' : 'border-line bg-bg text-muted',
                    )}
                  >
                    <CalendarClock className="h-3 w-3" /> {due.text}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] text-muted">
                    {rows.length ? `${rows.length} answered · ${pct}% right` : 'not started'}
                  </span>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onOpenLesson(a.lessonN)}>
                      Read the lesson
                    </Button>
                    <Button size="sm" onClick={() => onPractise(a.lessonN)}>
                      <Play className="h-3.5 w-3.5" /> Practise it
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="mt-7">
        <h3 className="text-[15px] font-semibold">Optional, not graded</h3>
        <p className="mt-1 max-w-[58ch] text-[12.5px] text-muted">
          Practice you choose yourself. Your teacher sees the recording and the paragraph only if you send them.
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Write about your week</CardTitle>
          </CardHeader>
          <CardBody className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {current.parts.vocab.slice(0, 5).map((w) => (
                <button
                  key={w.word}
                  onClick={() => speak(w.word)}
                  className="rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-ink/75 hover:bg-primary-soft"
                >
                  {w.word}
                </button>
              ))}
            </div>
            <textarea
              value={writing || entry.writing}
              onChange={(e) => setWriting(e.target.value)}
              onBlur={saveWriting}
              rows={4}
              placeholder="Five sentences with the words above…"
              className="focus-ring mt-3 w-full resize-y rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <PenLine className="h-3.5 w-3.5" /> Kept in this browser
              </p>
              <Button size="sm" variant="soft" onClick={saveWriting}>
                {justSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <Recorder />
            <button onClick={onReview} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
              Or review what you got wrong <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
