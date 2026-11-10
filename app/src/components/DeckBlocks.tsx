/**
 * DeckBlocks — layouts that match the original L01 deck (slide 16–26).
 * Two accent colours come straight from the deck: teal #2D7894 (DO-group)
 * and terracotta #B86C4C (ARE-group). Content is never rewritten here.
 */
import { useState } from 'react'
import { cn } from '../lib/utils'

const TEAL = '#2D7894'
const CLAY = '#B86C4C'

const isUpper = (s: string) => /^[A-ZĐ][A-ZĐ’'&/-]{1,}$/.test(s)

function Upper({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        isUpper(part.trim()) && part.trim().length > 1 ? (
          <strong key={i} className="font-extrabold" style={{ color: TEAL }}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function Aux({ text }: { text: string }) {
  const parts = text.split(/(\bDO\b|\bDON’T\b|\bDON'T\b|\bAM\b|\bNOT\b)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^(DO|DON’T|DON'T|AM|NOT)$/.test(p) ? (
          <strong key={i} className="font-extrabold" style={{ color: TEAL }}>{p}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

/** Two columns per row: prompt on the left, tip/answer on the right. */
function PairRows({ pairs, right }: { pairs: [string, string][]; right: 'tip' | 'answer' }) {
  return (
    <div className="divide-y divide-line/70">
      {pairs.map(([q, a], i) => (
        <div key={i} className="grid gap-1 py-3.5 sm:grid-cols-2 sm:gap-8 sm:py-4">
          <p className="text-[17px] font-semibold leading-relaxed text-ink">{right === 'tip' ? <Upper text={q} /> : q}</p>
          <p className={cn('text-[16px] leading-relaxed', right === 'tip' ? 'text-ink/75' : 'text-ink')}>
            {right === 'tip' ? <Upper text={a} /> : <Aux text={a} />}
          </p>
        </div>
      ))}
    </div>
  )
}

export function RhythmRows({ lines }: { lines: string[] }) {
  const pairs: [string, string][] = []
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([lines[i], lines[i + 1]])
  return <PairRows pairs={pairs} right="tip" />
}

export function AnswerRows({ lines }: { lines: string[] }) {
  const pairs: [string, string][] = []
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([lines[i], lines[i + 1]])
  return <PairRows pairs={pairs} right="answer" />
}

/** Clickable list: one item takes the focus so the teacher can point at it. */
export function FocusList({ items, variant = 'cue' }: { items: string[]; variant?: 'cue' | 'vi' | 'question' }) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="grid gap-2">
      {items.map((it, i) => {
        const on = active === i
        return (
          <button
            key={i}
            onClick={() => setActive(on ? null : i)}
            aria-pressed={on}
            className={cn(
              'flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition',
              on ? 'border-[#2D7894]/45 bg-[#2D7894]/[0.08] shadow-card' : 'border-line bg-surface hover:border-[#2D7894]/30 hover:bg-[#2D7894]/[0.03]',
            )}
          >
            <span
              className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold', on ? 'text-white' : 'text-[#2D7894]')}
              style={{ backgroundColor: on ? TEAL : 'rgba(45,120,148,0.12)' }}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'min-w-0 text-ink',
                variant === 'cue' ? 'text-[18px] font-semibold' : variant === 'vi' ? 'text-[16.5px] font-medium' : 'text-[16.5px] font-medium',
              )}
            >
              {it}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** DO YOU / ARE YOU split, side by side like the deck. */
export function FrameColumns({ lines }: { lines: string[] }) {
  const groups: { head: string; cues: string[]; frame: string }[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^(DO YOU|ARE YOU)\s*\+/.test(t)) groups.push({ head: t, cues: [], frame: '' })
    else if (/_{2,}/.test(t) && groups.length) groups[groups.length - 1].frame = t
    else if (groups.length) groups[groups.length - 1].cues.push(t)
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.slice(0, 2).map((g, i) => {
        const color = i === 0 ? TEAL : CLAY
        return (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] font-extrabold uppercase tracking-wide" style={{ color }}>{g.head}</p>
            <ul className="mt-3 space-y-1.5">
              {g.cues.map((c, j) => (
                <li key={j} className="text-[17px] leading-relaxed text-ink/90">{c}</li>
              ))}
            </ul>
            {g.frame && (
              <p className="mt-4 rounded-lg px-3.5 py-2.5 text-[16px] font-semibold" style={{ backgroundColor: `${color}14`, color }}>
                {g.frame}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const SHORT = /^(Yes, I am\.|Yes, I do\.|No, I’m not\.|No, I don’t\.|Yes, please\.|No, thanks\.)/

function ExchangeRow({ label, text, color, mode }: { label: string; text: string; color: string; mode: 'missing' | 'full' }) {
  const body = text.replace(/^[AB]:\s*/, '')
  const short = mode === 'full' ? body.match(SHORT) : null
  const rest = short ? body.slice(short[1].length) : body
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-extrabold text-white" style={{ backgroundColor: color }}>
        {label}
      </span>
      <p className="min-w-0 text-[16.5px] leading-relaxed text-ink">
        {short && <strong className="font-bold" style={{ color: TEAL }}>{short[1]}</strong>}
        {rest.split(/(_{2,})/).map((p, i) =>
          /^_{2,}$/.test(p) ? (
            <span key={i} className="mx-0.5 inline-block min-w-[70px] border-b-2 border-dashed align-baseline" style={{ borderColor: `${TEAL}80` }} aria-label="blank" />
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  )
}

/** A:/B: pairs stay together in one block, blocks are separated. */
export function ExchangeBlocks({ lines, mode }: { lines: string[]; mode: 'missing' | 'full' }) {
  const blocks: { a: string; b: string }[] = []
  let cur: { a?: string; b?: string } = {}
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^A:/.test(t)) {
      if (cur.a) { blocks.push({ a: cur.a, b: cur.b ?? '' }); cur = {} }
      cur.a = t
    } else if (/^B:/.test(t)) {
      cur.b = t
      blocks.push({ a: cur.a ?? '', b: cur.b })
      cur = {}
    }
  }
  if (cur.a) blocks.push({ a: cur.a, b: cur.b ?? '' })
  return (
    <div className="grid gap-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/40 p-4 sm:p-5">
          <ExchangeRow label="A" text={b.a} color={TEAL} mode={mode} />
          <div className="ml-9 mt-2 border-l border-dashed border-line pl-0">
            <ExchangeRow label="B" text={b.b} color={CLAY} mode={mode} />
          </div>
        </div>
      ))}
    </div>
  )
}
