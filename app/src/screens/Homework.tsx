import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Download, Mic, PenLine, Square, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { A1, partCount, quizFor, titleOf } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { myAssignments, type Assigned } from '../lib/assignments'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

const KEY = 'mt2_homework'

type Props = {
  onOpenReview: (lessonN: number, auto?: boolean) => void
  onOpenLesson: (lessonN: number) => void
  hasBackend: boolean
}

type Saved = Record<string, { done: string[]; writing: string }>

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

function Recorder({ lessonN }: { lessonN: number }) {
  const [state, setState] = useState<'idle' | 'asking' | 'recording' | 'done'>('idle')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])

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
        setChunks(parts)
        setUrl(URL.createObjectURL(blob))
        setState('done')
      }
      rec.start()
      setChunks(parts)
      setRecorder(rec)
      setState('recording')
    } catch {
      setState('idle')
      setError('The browser blocked the microphone. Allow it in the address bar and try again.')
    }
  }

  const stop = () => {
    recorder?.stop()
    setRecorder(null)
  }

  const again = () => {
    if (url) URL.revokeObjectURL(url)
    setUrl('')
    setState('idle')
    setChunks([])
  }

  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
        <Mic className="h-3.5 w-3.5" /> Speak it
      </p>
      <p className="mt-1 text-[14.5px] font-semibold">
        {state === 'recording'
          ? 'Recording… read the dialogue out loud'
          : state === 'done'
            ? 'Have a listen before you keep it'
            : state === 'asking'
              ? 'Allow the microphone in the bar above'
              : 'Record the dialogue'}
      </p>
      <p className="text-[12px] text-muted">
        {state === 'done'
          ? 'Saved in this browser session. Download it if you want to send it to your teacher.'
          : 'One take, 60 seconds, straight into the microphone.'}
      </p>
      {url && <audio controls src={url} className="mt-3 w-full max-w-[420px]" />}
      {error && <p className="mt-2 rounded-xl bg-[#fde4e1] px-3 py-2 text-[12px] text-[#8a2b22]">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {state === 'idle' && (
          <Button size="sm" onClick={start}>
            <Mic className="h-3.5 w-3.5" /> Start recording
          </Button>
        )}
        {state === 'asking' && (
          <Button size="sm" disabled>
            <Mic className="h-3.5 w-3.5" /> Waiting for the microphone…
          </Button>
        )}
        {state === 'recording' && (
          <Button size="sm" variant="outline" onClick={stop}>
            <Square className="h-3.5 w-3.5" /> Stop
          </Button>
        )}
        {state === 'done' && (
          <>
            <a href={url} download={`lesson-${lessonN}-take.webm`} className="inline-flex">
              <Button size="sm" variant="outline">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </a>
            <Button size="sm" variant="ghost" onClick={again}>
              Record again
            </Button>
          </>
        )}
      </div>
      {chunks.length > 0 && <p className="mt-1.5 text-[11px] text-muted">{Math.round(chunks.reduce((n, c) => n + c.size, 0) / 1024)} KB</p>}
    </div>
  )
}

export function Homework({ onOpenReview, onOpenLesson, hasBackend }: Props) {
  const [saved, setSaved] = useState<Saved>(readSaved)
  const [justSaved, setJustSaved] = useState(false)
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [writing, setWriting] = useState('')

  // The lesson to work on: the first one that is not finished, exactly what the dashboard calls
  // "you are on lesson N", so the two screens never disagree.
  const current = useMemo(() => {
    return A1.find((l) => partsSeen(l.n).length < partCount(l)) ?? A1[A1.length - 1]
  }, [])

  useEffect(() => {
    let alive = true
    myAssignments()
      .then((rows) => {
        if (alive) setAssigned(rows)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const entry = saved[String(current.n)] ?? { done: [], writing: '' }
  const mission = current.parts.flow.find((g) => g.group === 'Mission')
  const steps = mission?.slides.flatMap((s) => s.lines).slice(0, 6) ?? []
  const questions = quizFor(current.n).length + current.parts.vocab.length
  const words = current.parts.vocab

  const toggle = (step: string) => {
    const done = entry.done.includes(step) ? entry.done.filter((d) => d !== step) : [...entry.done, step]
    const next = { ...saved, [String(current.n)]: { ...entry, done } }
    setSaved(next)
    writeSaved(next)
  }

  const saveWriting = () => {
    const next = { ...saved, [String(current.n)]: { ...entry, writing } }
    setSaved(next)
    writeSaved(next)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 1600)
  }

  const doneCount = entry.done.length
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Homework</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Lesson {current.n}: {titleOf(current) || 'today'}</h2>
          <p className="mt-1 text-[13px] text-muted">Three things to finish before the next class. Your answers stay in this browser.</p>
        </div>
        <Badge tone={hasBackend ? 'ok' : 'neutral'}>{hasBackend ? 'classroom connected' : 'self-study mode'}</Badge>
      </div>

      <div className="grid gap-4">
        {assigned.length > 0 && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>From your teacher</CardTitle>
              <Badge tone="primary">{assigned.length}</Badge>
            </CardHeader>
            <CardBody className="space-y-2 pt-1">
              {assigned.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-bg/70 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{a.title}</p>
                    <p className="text-[11.5px] text-muted">
                      {a.due ? `due ${new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'no due date'}
                      {a.status === 'closed' ? ' · closed' : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onOpenLesson(a.lessonN)}>
                    Open lesson
                  </Button>
                  <Button size="sm" onClick={() => onOpenReview(a.lessonN, true)}>
                    Start review
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                <Target className="h-3.5 w-3.5" /> Practice
              </p>
              <p className="mt-1 text-[14.5px] font-semibold">Review session · {Math.min(20, questions)} questions</p>
              <p className="text-[12px] text-muted">Words and exercises from this lesson. Missed ones come back at the end.</p>
            </div>
            <Button onClick={() => onOpenReview(current.n, true)}>
              Start review <ChevronRight className="h-4 w-4" />
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Daily mission</CardTitle>
            <span className="text-[11.5px] text-muted">
              {doneCount}/{steps.length || 0} done
            </span>
          </CardHeader>
          <CardBody className="pt-1">
            {steps.length === 0 ? (
              <p className="py-4 text-[12.5px] text-muted">This lesson has no mission slides.</p>
            ) : (
              <>
                <Progress value={percent} className="mb-3" />
                <div className="divide-y divide-line/70">
                  {steps.map((step) => {
                    const on = entry.done.includes(step)
                    return (
                      <button key={step} onClick={() => toggle(step)} className="flex w-full items-start gap-3 py-2.5 text-left">
                        <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border', on ? 'border-ok bg-ok text-white' : 'border-line bg-surface')}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn('min-w-0 flex-1 text-[12.5px] leading-relaxed', on && 'text-muted line-through')}>{step}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Write five sentences</CardTitle>
            <span className="text-[11.5px] text-muted">{writing.trim() ? `${writing.trim().split('\n').filter(Boolean).length} lines` : 'not started'}</span>
          </CardHeader>
          <CardBody className="pt-1">
            <p className="text-[12px] text-muted">Use five words from this lesson. Your teacher reads this before the next class.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {words.slice(0, 6).map((w) => (
                <button key={w.word} onClick={() => speak(w.word)} className="rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-ink/75 hover:bg-primary-soft">
                  {w.word}
                </button>
              ))}
            </div>
            <textarea
              value={writing || entry.writing}
              onChange={(e) => setWriting(e.target.value)}
              onBlur={() => saveWriting()}
              rows={5}
              placeholder="Five sentences with the words above…"
              className="focus-ring mt-3 w-full resize-y rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <PenLine className="h-3.5 w-3.5" /> Saved in this browser. Your teacher reads it in class.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenLesson(current.n)}>
                  Open lesson <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={saveWriting}>
                  {justSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-4">
            <Recorder lessonN={current.n} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
