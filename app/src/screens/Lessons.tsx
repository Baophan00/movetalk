import { BookOpen, Lock, Play, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { A1, partCount, partPlan, titleOf, type LessonFile } from '../lib/curriculum'
import { partsSeen } from '../lib/progress'
import { isPracticeOpen } from '../lib/access'
import { speak } from '../lib/audio'
import { cn } from '../lib/utils'

/** A lesson the learner has already met: something was opened in it, or it comes before that one. */
function furthestSeen(): number {
  let max = 0
  for (const l of A1) if (partsSeen(l.n).length > 0) max = Math.max(max, l.n)
  return max
}

function goalOf(l: LessonFile): string {
  const g = l.parts.grammar[0]
  if (g) return `${g.section}${g.sub ? ` · ${g.sub}` : ''}`
  return `${l.parts.vocab.length} words to use out loud`
}

export function Lessons({ onPractice }: { onPractice: (n: number) => void }) {
  const visibleUpTo = Math.max(1, furthestSeen())

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Level A1</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Activate 1 · {A1.length} lessons</h2>
          <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
            A short recap of each lesson you have had, and the practice your teacher opens for it. Nothing to read end to end.
          </p>
        </div>
        <Badge tone="neutral">{A1.filter((l) => isPracticeOpen(l.n)).length} of {A1.length} practice open</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {A1.map((l) => {
          const plan = partPlan(l)
          const seen = partsSeen(l.n).filter((i) => i < plan.length)
          const pct = plan.length ? Math.round((seen.length / plan.length) * 100) : 0
          const open = isPracticeOpen(l.n)
          const phrases = l.parts.vocab.slice(0, 3)
          const grammar = l.parts.grammar[0]?.lines.slice(0, 2) ?? []
          const dialogue = l.parts.dialogue.slice(0, 4)

          if (l.n > visibleUpTo && !open)
            return (
              <Card key={l.n} className="border-dashed bg-bg/40 shadow-none">
                <CardBody className="flex items-center gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ecebf2] text-[11.5px] font-bold text-[#7d7a90]">
                    {String(l.n).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-[#7d7a90]">Not taught yet</p>
                    <p className="text-[11.5px] text-muted">Your teacher opens it when the lesson comes.</p>
                  </div>
                  <Lock className="ml-auto h-4 w-4 shrink-0 text-[#b3b0c2]" />
                </CardBody>
              </Card>
            )

          return (
            <Card key={l.n} className="overflow-hidden">
              <CardBody className="p-0">
                <div className="grid gap-0 sm:grid-cols-[1.15fr_1fr]">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'grid h-8 w-8 place-items-center rounded-lg text-[11.5px] font-bold',
                          pct === 100 ? 'bg-[#c8f0e0] text-[#0f6b4f]' : 'bg-[#e8f0ff] text-[#2f6bff]',
                        )}
                      >
                        {String(l.n).padStart(2, '0')}
                      </span>
                      <p className="text-[15px] font-semibold leading-tight">{titleOf(l) || `Lesson ${l.n}`}</p>
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-[.1em] text-muted">{goalOf(l)}</p>

                    <ul className="mt-3 space-y-1.5">
                      {phrases.map((v) => (
                        <li key={v.word} className="flex items-center gap-2 rounded-lg bg-bg/60 px-2.5 py-1.5">
                          <button onClick={() => speak(v.word)} aria-label={`Hear ${v.word}`} className="text-[#2f6bff] hover:text-[#1b4ddb]">
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[13px] font-medium">{v.word}</span>
                          <span className="text-[11px] text-muted">{v.ipa}</span>
                          <span className="ml-auto truncate text-[11.5px] text-[#5a6a86]">{v.vi}</span>
                        </li>
                      ))}
                    </ul>

                    {grammar.length > 0 && (
                      <ul className="mt-3 space-y-1 border-l-2 border-[#e3eaf6] pl-2.5">
                        {grammar.map((line, i) => (
                          <li key={i} className="text-[11.5px] leading-relaxed text-[#4a5a75]">
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-line/70 bg-[#fbfcfe] p-4 sm:border-l sm:border-t-0 sm:p-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[.12em] text-muted">In the conversation</p>
                    <ul className="mt-2 space-y-1.5">
                      {dialogue.map((t, i) => (
                        <li key={i} className="text-[11.5px] leading-snug">
                          <span className="font-semibold text-[#26344f]">{t.who}</span>{' '}
                          <span className="text-[#4a5a75]">{t.line}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                      <span>
                        {partCount(l)} parts · {pct}% met
                      </span>
                      {open ? <Badge tone="ok">practice open</Badge> : <Badge tone="neutral">practice locked</Badge>}
                    </div>

                    <Button size="sm" className="mt-2.5 w-full" variant={open ? 'default' : 'outline'} disabled={!open} onClick={() => onPractice(l.n)}>
                      {open ? (
                        <>
                          <Play className="h-3.5 w-3.5" /> Practice this lesson
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Waiting for your teacher
                        </>
                      )}
                    </Button>
                    {!open && <p className="mt-1.5 text-center text-[10.5px] text-muted">Opens when the work is sent or unlocked.</p>}
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl bg-[#f4f8ff] px-4 py-3">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6bff]" />
        <p className="text-[12px] leading-relaxed text-[#3d4f6d]">
          Practice has five rooms: quick quiz, word match, build a sentence, listen and pick, and a recording room where your teacher hears you
          say the line. Every lesson adds one more set.
        </p>
      </div>
    </div>
  )
}
