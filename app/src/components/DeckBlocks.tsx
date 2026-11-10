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
  const parts = text.split(/(\bDO\b|\bDON’T\b|\bDON'T\b|\bAM\b|\bNOT\b|\bI’m\b|\bI'm\b|\bYou’re\b|\bYou're\b)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^(DO|DON’T|DON'T|AM|NOT|I’m|I'm|You’re|You're)$/.test(p) ? (
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

// ── Real Talk: role briefs with the opening line pulled out ──────────────

const ROLE_LABEL = /^(YOUR ROLE|YOUR PARTNER|PERSON [AB]|BẠN [AB])$/i
const FOOTER_LINE = /^(Hết lượt|Kết quả cần đạt|Mục tiêu|Ghi chú|Lưu ý)\s*:/i

export function RoleBriefs({ lines }: { lines: string[] }) {
  const roles: { label: string; items: string[]; open: string }[] = []
  const footers: string[] = []
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    if (ROLE_LABEL.test(t)) roles.push({ label: t, items: [], open: '' })
    else if (FOOTER_LINE.test(t)) footers.push(t)
    else if (/^Mở lời\s*:/i.test(t) && roles.length) roles[roles.length - 1].open = t.replace(/^Mở lời\s*:\s*/i, '')
    else if (roles.length) roles[roles.length - 1].items.push(t)
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.slice(0, 2).map((r, i) => {
          const color = i === 0 ? TEAL : CLAY
          return (
            <div key={i} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.12em]" style={{ color }}>{r.label}</p>
              <ul className="mt-3 space-y-2">
                {r.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[15.5px] leading-[1.65] text-ink/90">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: `${color}99` }} />
                    <span className="min-w-0">{it}</span>
                  </li>
                ))}
              </ul>
              {r.open && (
                <div className="mt-auto pt-4">
                  <p className="rounded-xl px-4 py-3 text-[15.5px] font-semibold leading-relaxed text-ink" style={{ backgroundColor: `${color}12`, borderLeft: `3px solid ${color}` }}>
                    <span className="mr-2 text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color }}>Mở lời</span>
                    {r.open}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {footers.map((f, i) => (
        <p key={i} className="rounded-lg border-l-[3px] px-4 py-2.5 text-[14.5px] font-semibold" style={{ color: TEAL, backgroundColor: `${TEAL}0F`, borderColor: TEAL }}>{f}</p>
      ))}
    </div>
  )
}

// ── Reflection & Retry: two panels, hints below ──────────────────────────

export function ReflectionBoard({ lines }: { lines: string[] }) {
  const fields: string[] = []
  const checks: string[] = []
  const notes: string[] = []
  let zone: 'try' | 'check' | 'none' = 'none'
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    if (/^MY NEXT TRY$/i.test(t)) { zone = 'try'; continue }
    if (/^MY CHECK$/i.test(t)) { zone = 'check'; continue }
    if (/^(Lượt|Đổi|Thử lại|So với)\b/i.test(t)) { notes.push(t); continue }
    if (zone === 'try') fields.push(t)
    else if (zone === 'check') checks.push(t)
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.12em]" style={{ color: TEAL }}>MY NEXT TRY</p>
          <div className="mt-3 space-y-3">
            {fields.map((f, i) => {
              const [head, ...rest] = f.split(':')
              const gap = /_{2,}/.test(rest.join(':'))
              return (
                <div key={i}>
                  <p className="text-[14.5px] font-semibold text-ink">{head}</p>
                  <p className="mt-1 min-w-0 border-b border-dashed pb-1.5 text-[14px] leading-relaxed text-muted" style={{ borderColor: `${TEAL}55` }}>
                    {gap ? <span className="text-transparent">.</span> : rest.join(':')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.12em]" style={{ color: CLAY }}>MY CHECK</p>
          <ul className="mt-3 space-y-2.5">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15.5px] leading-[1.6] text-ink/90">
                <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border" style={{ borderColor: `${CLAY}80` }} />
                <span className="min-w-0">
                  {c.split(/(Do you \/ Are you)/).map((p, j) =>
                    p === 'Do you / Are you' ? <strong key={j} className="font-bold" style={{ color: TEAL }}>{p}</strong> : <span key={j}>{p}</span>,
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {notes.map((n, i) => (
        <p key={i} className="rounded-lg border-l-[3px] px-4 py-2.5 text-[14.5px] font-semibold" style={{ color: TEAL, backgroundColor: `${TEAL}0F`, borderColor: TEAL }}>{n}</p>
      ))}
    </div>
  )
}

// ── Daily mission: four practice blocks, nothing dropped ─────────────────

export function MissionDays({ lines }: { lines: string[] }) {
  const blocks: { tag: string; title: string; body: string; next?: boolean }[] = []
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const head = (lines[i] ?? '').trim()
    const body = (lines[i + 1] ?? '').trim()
    if (!head || /[?？]$/.test(head)) break
    const m = head.match(/^(DAY\s*\d+|NEXT CLASS)\s*[·-]\s*(.+)$/i)
    blocks.push(m ? { tag: m[1].toUpperCase(), title: m[2], body, next: /^NEXT/i.test(m[1]) } : { tag: '', title: head, body })
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {blocks.map((b, i) => {
        const color = b.next ? CLAY : TEAL
        return (
          <div key={i} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.14em]" style={{ color }}>{b.tag || `BƯỚC ${i + 1}`}</p>
            <p className="mt-1.5 text-[17px] font-bold leading-snug text-ink">{b.title}</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink/75">{b.body}</p>
          </div>
        )
      })}
    </div>
  )
}

// ── Reference: two panels ────────────────────────────────────────────────

export function ReferencePanels({ lines }: { lines: string[] }) {
  const panels: { head: string; items: string[] }[] = []
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    if (/^[A-ZĐ][A-ZĐ ’'&/-]{3,}$/.test(t)) panels.push({ head: t, items: [] })
    else if (panels.length) panels[panels.length - 1].items.push(t)
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {panels.map((p, i) => {
        const color = i === 0 ? TEAL : CLAY
        return (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.12em]" style={{ color }}>{p.head}</p>
            <ul className="mt-3 space-y-2">
              {p.items.map((it, j) => (
                <li key={j} className="text-[15.5px] leading-relaxed text-ink/90">
                  {it.split(/(Do you \+ V1…\?|Are you \+ …\?|Yes, I do\. \/ No, I don’t\.|Yes, I am\. \/ No, I’m not\.|What about you\? \/ And you\?)/).map((part, k) =>
                    k % 2 === 1 ? <strong key={k} className="font-semibold" style={{ color }}>{part}</strong> : <span key={k}>{part}</span>,
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
