import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Star } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'

type SpeakSubmission = {
  mode: string
  idx: number
  prompt: string
  attempts: { url: string; ts: number; score?: number }[]
  selfScore: number
  sent: boolean
  sentAt?: number
  grade?: number
  feedback?: string
  gradedAt?: number
}

function ago(at: number) {
  const min = Math.round((Date.now() - at) / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

const MODE_LABELS: Record<string, string> = {
  repeat: 'Phần 1: Nói lại',
  answer: 'Phần 2: Nghe hỏi',
  test: 'Phần 3: Kiểm tra',
}

export function TeacherSpeaking() {
  const [rows, setRows] = useState<SpeakSubmission[]>([])
  const [mode, setMode] = useState<string>('All')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [grades, setGrades] = useState<Record<number, { grade: number; feedback: string }>>({})

  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem('speak_submissions_l01') || '[]')
      setRows(data)
    } catch {
      setRows([])
    }
  }

  useEffect(load, [])

  const shown = useMemo(() => {
    return rows.filter((r) => {
      if (mode !== 'All' && r.mode !== mode) return false
      if (!term.trim()) return true
      return r.prompt.toLowerCase().includes(term.trim().toLowerCase())
    })
  }, [rows, mode, term])

  const handleGrade = (i: number, grade: number, feedback: string) => {
    setGrades((prev) => ({ ...prev, [i]: { grade, feedback } }))
    // Update localStorage
    const updated = [...rows]
    updated[i] = { ...updated[i], grade, feedback, gradedAt: Date.now() }
    localStorage.setItem('speak_submissions_l01', JSON.stringify(updated))
    setRows(updated)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Level 3 Speaking</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Chấm bài Nói</h1>
          <p className="mt-1 text-[13px] text-muted">
            {rows.length ? `${rows.length} bài nộp` : 'Chưa có bài nộp nào.'}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40">
          <RefreshCw className="h-3.5 w-3.5" /> Tải lại
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {['All', 'repeat', 'answer', 'test'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition',
              mode === m ? 'border-primary bg-primary/10 text-primary' : 'border-line bg-surface hover:border-primary/40',
            )}
          >
            {m === 'All' ? 'Tất cả' : MODE_LABELS[m] || m}
          </button>
        ))}
        <div className="ml-auto">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm prompt..."
            className="w-48"
          />
        </div>
      </div>

      {/* Submissions list */}
      <div className="mt-4 space-y-3">
        {shown.length === 0 && (
          <Card><CardBody><p className="text-[13px] text-muted text-center py-4">Không có bài nộp nào.</p></CardBody></Card>
        )}
        {shown.map((sub, i) => (
          <Card key={i}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge>{MODE_LABELS[sub.mode] || sub.mode}</Badge>
                    <span className="text-[11px] text-muted">Câu {sub.idx + 1}</span>
                    {sub.sentAt && <span className="text-[11px] text-muted">{ago(sub.sentAt)}</span>}
                    {sub.grade !== undefined && (
                      <span className="text-[11px] font-semibold text-green-600">✓ Đã chấm: {sub.grade}/5</span>
                    )}
                  </div>
                  <p className="text-[13px] font-semibold text-ink truncate">{sub.prompt}</p>
                  {sub.attempts.map((a, j) => (
                    <div key={j} className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-muted">Lần {j + 1}</span>
                      <audio controls src={a.url} className="h-8 flex-1" />
                      {a.score !== undefined && a.score >= 0 && (
                        <span className="text-[11px] font-semibold text-blue-600">{a.score}/100</span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="shrink-0 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40"
                >
                  {open === i ? 'Đóng' : 'Chấm'}
                </button>
              </div>

              {/* Grading panel */}
              {open === i && (
                <div className="mt-3 border-t border-line pt-3 space-y-2">
                  <div>
                    <p className="text-[11px] text-muted mb-1">Điểm (1-5 sao):</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleGrade(i, s, grades[i]?.feedback || '')}
                          className="transition"
                        >
                          <Star className={cn('h-5 w-5', s <= (grades[i]?.grade || sub.grade || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted/40')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted mb-1">Nhận xét:</p>
                    <textarea
                      value={grades[i]?.feedback ?? sub.feedback ?? ''}
                      onChange={(e) => setGrades((prev) => ({ ...prev, [i]: { grade: prev[i]?.grade || sub.grade || 0, feedback: e.target.value } }))}
                      onBlur={() => {
                        const g = grades[i]
                        if (g) handleGrade(i, g.grade, g.feedback)
                      }}
                      placeholder="VD: Cố gắng phát âm rõ âm cuối nhé!"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] resize-none"
                      rows={2}
                    />
                  </div>
                  {sub.feedback && (
                    <p className="text-[11px] text-muted">Nhận xét cũ: {sub.feedback}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
