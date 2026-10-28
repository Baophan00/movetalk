import { useMemo, useState } from 'react'
import { Check, Plus, RotateCcw, Search, Volume2 } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { addCard, dueCards, listCards, reviewCard, type Card as Word } from '../lib/study'
import { playCorrect, playWrong } from '../lib/sfx'
import { Icon3D } from '../components/Icon3D'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

/** My Vocabulary: everything the learner kept, with spaced review of what is due. */
export function Vocabulary() {
  const [words, setWords] = useState<Word[]>(() => listCards())
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [showMeaning, setShowMeaning] = useState(false)
  const [added, setAdded] = useState<string | null>(null)

  const due = useMemo(() => dueCards(), [words])
  const current = due[0]

  const mastered = words.filter((w) => w.box >= 4).length
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rows = needle
      ? words.filter((w) => w.term.toLowerCase().includes(needle) || (w.meaning ?? '').toLowerCase().includes(needle))
      : [...words].sort((a, b) => a.due.localeCompare(b.due))
    return rows.slice(0, 60)
  }, [words, q])

  const grade = (right: boolean) => {
    if (!current) return
    if (right) playCorrect()
    else playWrong()
    setWords(reviewCard(current.id, right))
    setShowMeaning(false)
  }

  const save = () => {
    const t = term.trim()
    if (!t) return
    addCard(t, meaning.trim() || undefined, 'A1', 'manual')
    setWords(listCards())
    setAdded(t)
    setTerm('')
    setMeaning('')
    window.setTimeout(() => setAdded(null), 2200)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">My Vocabulary</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{words.length} words kept</h1>
      <p className="mt-1 text-[13px] text-muted">{due.length} due today · {mastered} you know well</p>

      {current ? (
        <Card className="mt-4">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <Badge tone="primary">Review · {due.length} left</Badge>
              <span className="text-[11.5px] text-muted">box {current.box}/5</span>
            </div>

            <p className="mt-4 text-[26px] font-semibold tracking-tight">{current.term}</p>
            {current.level && <p className="text-[11.5px] text-muted">from {current.level}{current.source ? ` · ${current.source}` : ''}</p>}

            {showMeaning ? (
              <>
                <p className="mt-3 rounded-2xl bg-bg/70 px-3 py-2.5 text-[14px]">{current.meaning || 'No meaning saved. Ask your teacher.'}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => grade(false)} className="rounded-xl border border-line px-3 py-2.5 text-[13px] font-semibold text-warn">Forgot</button>
                  <button onClick={() => grade(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[13px] font-semibold text-white">
                    <Check className="h-4 w-4" /> Knew it
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => speak(current.term)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-[13px] font-semibold">
                  <Volume2 className="h-4 w-4" /> Hear
                </button>
                <button onClick={() => setShowMeaning(true)} className="rounded-xl bg-primary px-3 py-2.5 text-[13px] font-semibold text-white">Show meaning</button>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardBody className="p-5">
            <div className="flex items-center gap-2.5">
              <Icon3D name="done" size={38} />
              <p className="text-[13px] font-semibold">Nothing due right now</p>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {words.length
                ? 'Every word here has been seen today. Words come back after 1, 3, 7, 16 and 35 days.'
                : 'Tap any word while you read, or add one below, and it lands here.'}
            </p>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardBody className="p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold"><Plus className="h-4 w-4 text-primary" /> Add a word</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="English word"
              className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary/50"
            />
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Nghĩa tiếng Việt"
              className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary/50"
            />
            <button onClick={save} disabled={!term.trim()} className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40">Save</button>
          </div>
          {added && <p className="mt-2 text-[11.5px] font-semibold text-[#0f6b4f]">Saved “{added}”.</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your words"
          className="w-full bg-transparent text-[13px] outline-none"
        />
        {q && <button onClick={() => setQ('')} className="text-[11.5px] font-semibold text-muted">Clear</button>}
      </div>

      <div className="mt-2 grid gap-1.5">
        {shown.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{w.term}</p>
              <p className="truncate text-[11.5px] text-muted">{w.meaning || 'no meaning yet'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((b) => (
                  <span key={b} className={cn('h-1.5 w-1.5 rounded-full', b <= w.box ? 'bg-primary' : 'bg-line')} />
                ))}
              </div>
              <button onClick={() => speak(w.term)} className="rounded-lg border border-line p-1.5"><Volume2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {!shown.length && (
          <p className="rounded-xl bg-bg/60 px-3 py-4 text-center text-[12px] text-muted">
            {words.length ? 'No word matches that search.' : 'Your word list is empty.'}
          </p>
        )}
      </div>

      {words.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <RotateCcw className="h-3 w-3" /> Every word returns after 1, 3, 7, 16 and 35 days. A word you forget goes back to day one.
        </p>
      )}
    </div>
  )
}
