import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, Info, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react'
import type { Block, Flashcard, QuizItem } from '../lib/lessons'
import { hasAudio, speak } from '../lib/audio'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

/* ---------- audio ---------- */

function SpeakButton({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' }) {
  const [playing, setPlaying] = useState(false)
  if (!hasAudio(text)) return null
  return (
    <button
      onClick={() => {
        setPlaying(true)
        speak(text, () => setPlaying(false))
      }}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full border border-line bg-surface text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft focus-ring',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
      )}
      aria-label="Nghe"
    >
      {playing ? <Pause className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> : <Volume2 className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
    </button>
  )
}

/* ---------- flashcards ---------- */

function Deck({ items }: { items: Flashcard[] }) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<number[]>([])
  const card = items[i]
  if (!card) return null

  const go = (dir: 1 | -1) => {
    setFlipped(false)
    setI((v) => (v + dir + items.length) % items.length)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[12px] text-muted">
        <span>
          Thẻ {i + 1}/{items.length}
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-ok" /> {known.length} thẻ đã thuộc
        </span>
      </div>

      <div className="[perspective:1400px]">
        <motion.div
          key={card.word}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setFlipped((f) => !f)}
          className="relative h-[248px] w-full cursor-pointer select-none flip-3d"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform .55s cubic-bezier(.22,1,.36,1)' }}
        >
          {/* front */}
          <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary">từ mới</span>
              <SpeakButton text={card.word} />
            </div>
            <div>
              <p className="text-[30px] font-semibold leading-tight tracking-tight">{card.word}</p>
              {card.phonetic && <p className="mt-1 text-[13px] text-muted">{card.phonetic}</p>}
            </div>
            <p className="text-[12px] text-muted">
              Chạm để xem nghĩa <ChevronRight className="inline h-3 w-3" />
            </p>
          </div>

          {/* back */}
          <div
            className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-primary/25 bg-primary-soft/60 p-6 shadow-card"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div>
              <p className="text-[13px] font-semibold text-primary">{card.vi}</p>
              {card.def && <p className="mt-2 text-[13px] leading-relaxed text-ink/80">{card.def}</p>}
            </div>
            <ul className="space-y-2">
              {card.examples?.slice(0, 2).map((ex) => (
                <li key={ex.text} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink/85">
                  <SpeakButton text={ex.text} size="sm" />
                  <span>{ex.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Thẻ trước">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={known.includes(i) ? 'soft' : 'default'}
          className="flex-1"
          onClick={() => {
            setKnown((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))
            go(1)
          }}
        >
          <Check className="h-4 w-4" /> {known.includes(i) ? 'Đã thuộc' : 'Thuộc thẻ này'}
        </Button>
        <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Thẻ sau">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- quiz ---------- */

function Quiz({ items }: { items: QuizItem[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const score = useMemo(
    () => items.reduce((n, q, i) => (picked[i] === q.answer ? n + 1 : n), 0),
    [items, picked],
  )
  const answered = Object.keys(picked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-ink/[.03] px-3.5 py-2 text-[12px]">
        <span className="text-muted">
          Đúng {score}/{items.length}
        </span>
        <button onClick={() => setPicked({})} className="inline-flex items-center gap-1 text-muted hover:text-ink">
          <RotateCcw className="h-3 w-3" /> làm lại
        </button>
      </div>

      {items.map((q, qi) => {
        const choice = picked[qi]
        const done = choice !== undefined
        return (
          <div key={q.q} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[13.5px] font-medium leading-relaxed">
              <span className="mr-1.5 text-muted">{qi + 1}.</span>
              {q.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer
                const isChoice = oi === choice
                return (
                  <button
                    key={opt}
                    onClick={() => !done && setPicked((p) => ({ ...p, [qi]: oi }))}
                    disabled={done}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition-all',
                      !done && 'border-line hover:border-primary/40 hover:bg-primary-soft/40',
                      done && isAnswer && 'border-ok/40 bg-ok/10 text-ok',
                      done && isChoice && !isAnswer && 'border-warn/40 bg-warn/10 text-warn',
                      done && !isAnswer && !isChoice && 'border-line opacity-60',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {hasAudio(opt) && <SpeakButton text={opt} size="sm" />}
                      {opt}
                    </span>
                    {done && isAnswer && <Check className="h-4 w-4" />}
                    {done && isChoice && !isAnswer && <X className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {answered === items.length && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary-soft px-4 py-3 text-[13px] text-primary"
        >
          {score === items.length ? 'Đúng hết. Sang phần tiếp theo thôi.' : `Đúng ${score}/${items.length}. Xem lại các câu đỏ rồi làm lại.`}
        </motion.p>
      )}
    </div>
  )
}

/* ---------- dialog ---------- */

function Dialog({ block }: { block: Extract<Block, { t: 'dialog' }> }) {
  const [playingAll, setPlayingAll] = useState(false)
  const playAll = () => {
    setPlayingAll(true)
    const step = (idx: number) => {
      if (idx >= block.lines.length) return setPlayingAll(false)
      speak(block.lines[idx].text, () => step(idx + 1))
    }
    step(0)
  }

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold">{block.title}</p>
          {block.target && <p className="truncate text-[11.5px] text-muted">{block.target}</p>}
        </div>
        <Button variant="soft" size="sm" className="ml-auto" onClick={playAll}>
          {playingAll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playingAll ? 'Đang phát' : 'Nghe cả đoạn'}
        </Button>
      </div>
      <ul className="divide-y divide-line/70">
        {block.lines.map((line, li) => {
          const a = line.speaker === 'A'
          return (
            <li key={li} className={cn('flex items-start gap-2.5 px-4 py-2.5', !a && 'bg-bg/40')}>
              <span
                className={cn(
                  'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10.5px] font-bold',
                  a ? 'bg-primary-soft text-primary' : 'bg-accent/15 text-[#b45309]',
                )}
              >
                {line.speaker}
              </span>
              <p className="flex-1 text-[13px] leading-relaxed text-ink/90">{line.text}</p>
              <SpeakButton text={line.text} size="sm" />
            </li>
          )
        })}
      </ul>
      {(block.check?.length || block.note) && (
        <div className="space-y-1.5 border-t border-line bg-bg/40 px-4 py-3">
          {block.check?.map((c, ci) => (
            <p key={ci} className="text-[12px] text-ink/75">
              <span className="mr-1.5 font-semibold text-primary">?</span>
              {c}
            </p>
          ))}
          {block.note && <p className="text-[11.5px] text-muted">{block.note}</p>}
        </div>
      )}
    </div>
  )
}

/* ---------- retrieval ---------- */

function Retrieval({ items }: { items: { vi: string; en: string }[] }) {
  const [shown, setShown] = useState<number[]>([])
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((it, i) => {
        const on = shown.includes(i)
        return (
          <button
            key={it.vi}
            onClick={() => setShown((s) => (on ? s.filter((x) => x !== i) : [...s, i]))}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
              on ? 'border-primary/30 bg-primary-soft/50' : 'border-line bg-surface hover:border-primary/30',
            )}
          >
            <span className="text-[13px] text-ink/80">{it.vi}</span>
            <span className={cn('text-[13px] font-semibold transition-opacity', on ? 'text-primary opacity-100' : 'opacity-0')}>{it.en}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- generic block renderer ---------- */

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h':
            return (
              <h2 key={i} className="pt-1 text-[15px] font-semibold tracking-tight text-ink">
                {b.text}
              </h2>
            )
          case 'p':
            return (
              <p key={i} className="text-[14px] leading-[1.75] text-ink/85">
                {b.text}
              </p>
            )
          case 'note':
            return (
              <div key={i} className="flex gap-2.5 rounded-xl border border-accent/25 bg-accent/[.07] px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/80">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>{b.text}</p>
              </div>
            )
          case 'label':
            return (
              <p key={i} className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">
                {b.text}
              </p>
            )
          case 'list':
            return (
              <ul key={i} className="space-y-1.5">
                {b.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[13.5px] leading-relaxed text-ink/85">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {it}
                  </li>
                ))}
              </ul>
            )
          case 'say':
            return (
              <ul key={i} className="grid gap-2 sm:grid-cols-2">
                {b.items.map((it) => (
                  <li key={it} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
                    <SpeakButton text={it} size="sm" />
                    <span className="text-[13px] text-ink/85">{it}</span>
                  </li>
                ))}
              </ul>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-bg/70 text-[11px] uppercase tracking-wide text-muted">
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} className="px-3.5 py-2.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className="hover:bg-bg/40">
                        {r.map((c, ci) => (
                          <td key={ci} className={cn('px-3.5 py-2.5', ci === 0 ? 'font-medium text-ink' : 'text-ink/75')}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'flashcard':
            return <Deck key={i} items={b.items} />
          case 'quiz':
            return <Quiz key={i} items={b.items} />
          case 'dialog':
            return <Dialog key={i} block={b} />
          case 'steps':
            return (
              <div key={i} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-[13.5px] font-semibold">{b.title}</p>
                {b.context && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{b.context}</p>}
                <ol className="mt-3 space-y-2">
                  {b.steps.map((s, si) => (
                    <li key={si} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/85">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[10.5px] font-bold text-primary">
                        {si + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                {b.useful && (
                  <p className="mt-3 rounded-xl bg-bg/70 px-3 py-2 text-[12px] text-muted">
                    <span className="font-semibold text-ink/70">Câu dùng được: </span>
                    {b.useful}
                  </p>
                )}
              </div>
            )
          case 'retrieval':
            return (
              <div key={i}>
                <AnimatePresence initial={false}>
                  <Retrieval items={b.items} />
                </AnimatePresence>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
