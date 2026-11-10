import { useMemo } from 'react'
import { Lightbulb, UserRound, Users, Check, CalendarDays, Quote } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * One renderer for lesson text imported from the curriculum decks.
 *
 * The decks arrive as a flat list of lines where headings, grammar frames,
 * examples, questions, answers and teacher notes all look alike. Each card is
 * classified from its ORIGINAL shape (never from what a teacher typed), then
 * every kind gets its own visual weight, so an edit can't change the layout.
 */

type Kind = 'formula' | 'example' | 'note' | 'heading' | 'question' | 'answer' | 'numbered' | 'bullet' | 'ipa' | 'paragraph'

const WORD_ONLY = /^[A-Z][A-Z0-9 &/–—·.,'’-]{2,44}$/

const VN_CHARS = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/

export function isFormulaLine(line: string): boolean {
  const t = line.trim()
  if (VN_CHARS.test(t)) return false
  if (t.includes('…')) return t.length <= 32
  if (/\+ ?V\b/.test(t)) return t.length <= 32
  return /^(DO YOU|ARE YOU|DOES|I'M\+|YOU'RE\+|I \+|HAVE \+)/.test(t)
}

export function classifyLine(line: string): Kind {
  const t = line.trim()
  if (t.startsWith('/') && t.endsWith('/')) return 'ipa'
  if (isFormulaLine(t)) return 'formula'
  if (/^(Lưu ý|Mẹo|Ghi chú|Chú ý|Tip|Note|Remember|NHỚ)\b/i.test(t)) return 'note'
  if (t.includes('→') || /^(Ví dụ|Example|VD)\b/i.test(t)) return 'example'
  if (/^\d+[.)]\s+/.test(t)) return 'numbered'
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length >= 2 && words.length <= 5 && WORD_ONLY.test(t) && !/[?？]/.test(t)) return 'heading'
  if (/[?？]/.test(t)) return VN_CHARS.test(t) && t.length > 30 ? 'paragraph' : 'question'
  if (/^(yes|no|sure|of course|not really|maybe|sometimes|i do|i don't|i am|i'm not)\b/i.test(t) && t.length <= 40)
    return 'answer'
  return 'bullet'
}

// ── shared primitives ────────────────────────────────────────────────────

function Label({ children, tone = 'primary' }: { children: string; tone?: 'primary' | 'muted' }) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em]',
        tone === 'primary' ? 'text-primary' : 'text-muted',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'primary' ? 'bg-primary/70' : 'bg-muted/50')} />
      <span className="min-w-0 break-words">{children}</span>
      <span className="ml-1 h-px min-w-5 flex-1 bg-line" />
    </p>
  )
}

function Formula({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-primary/25 border-l-4 border-l-primary bg-primary-soft/55 px-4 py-2.5 text-[16px] font-semibold leading-relaxed tracking-tight text-ink">
      {text}
    </div>
  )
}

function Example({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1 shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
        VD
      </span>
      <p className="min-w-0 break-words text-[15px] leading-[1.7] text-ink/90">{text}</p>
    </div>
  )
}

function Note({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/[0.06] px-3.5 py-2.5">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <p className="min-w-0 break-words text-[14px] leading-[1.65] text-ink/85">{text}</p>
    </div>
  )
}

/** "___" becomes a ruled blank instead of literal underscores. */
function GapText({ text, className }: { text: string; className?: string }) {
  const parts = text.replace(/\s+([.,!?;:])/g, '$1').split(/(_{2,})/)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^_{2,}$/.test(part) ? (
          <span key={i} className="mx-1 inline-block h-[1.05em] w-16 border-b-2 border-line align-baseline sm:w-24" />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((l, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
          <p className="min-w-0 break-words text-[15px] leading-[1.65] text-ink/90">
            <GapText text={l} />
          </p>
        </li>
      ))}
    </ul>
  )
}

function CheckRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-primary/35 bg-surface">
        <Check className="h-2.5 w-2.5 text-primary/45" />
      </span>
      <p className="min-w-0 break-words text-[15px] leading-[1.6] text-ink/90">{text}</p>
    </li>
  )
}

// ── detectors ────────────────────────────────────────────────────────────

const SINGLE_LABELS = new Set(['QUESTION', 'ANSWER', 'ADD', 'STRUCTURE', 'MEANING', 'SPEECH', 'VOCABULARY', 'REFERENCE', 'NOTE'])

function isLabel(line: string): boolean {
  const t = line.trim().replace(/[:：]$/, '')
  if (!t || t.length > 52) return false
  const letters = t.replace(/[^A-Za-zÀ-Ỹà-ỹ]/g, '')
  if (!letters) return false
  if (t !== t.toUpperCase()) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length === 1 && !SINGLE_LABELS.has(t)) return false
  if (words.length > 9) return false
  if (isFormulaLine(t) && /[+?]/.test(t)) return false
  if (/^DAY\s*\d/.test(t)) return false
  return /[A-Z]{2,}/.test(letters) || VN_CHARS.test(t)
}

type Part = { label?: string; lines: string[] }

type Range = { labelIndex: number | null; end: number }

function splitRanges(lines: string[]): Range[] {
  const out: Range[] = []
  let cur: Range = { labelIndex: null, end: lines.length }
  lines.forEach((line, i) => {
    if (isLabel(line)) {
      cur.end = i
      out.push(cur)
      cur = { labelIndex: i, end: lines.length }
    }
  })
  out.push(cur)
  return out.filter((r) => r.end > (r.labelIndex === null ? -1 : r.labelIndex))
}

function partsOf(base: string[], lines: string[]): Part[] {
  return splitRanges(base).map((r) => {
    const from = r.labelIndex === null ? 0 : r.labelIndex + 1
    return {
      label: r.labelIndex === null ? undefined : (lines[r.labelIndex] ?? base[r.labelIndex]).replace(/[:：]$/, '').trim(),
      lines: lines.slice(from, r.end),
    }
  })
}

const isQuestion = (l: string) => /[?？]/.test(l)
const isShortAnswer = (l: string) =>
  /^(yes|no|sure|of course|not really|because|i |i'm|i’m|she |he |they |we |it )/i.test(l) && l.length <= 70

function qaPairs(base: string[], lines: string[]): { pairs: { q: string; a: string }[]; tail: string[] } | null {
  const pairs: { q: string; a: string }[] = []
  let i = 0
  while (i + 1 < base.length && isQuestion(base[i]) && !isQuestion(base[i + 1])) {
    if (!isShortAnswer(base[i + 1]) && base[i + 1].length > 70) break
    pairs.push({ q: lines[i], a: lines[i + 1] })
    i += 2
  }
  const tail = lines.slice(i)
  if (pairs.length < 2 || base.slice(i).some((l) => isQuestion(l) && !VN_CHARS.test(l))) return null
  return { pairs, tail }
}

function QASection({ result }: { result: { pairs: { q: string; a: string }[]; tail: string[] } }) {
  return (
    <div className="space-y-3">
      <QAPairs pairs={result.pairs} />
      {result.tail.length > 0 && <Note text={result.tail.join(' ')} />}
    </div>
  )
}


const isIpa = (l: string) => /^\/.*\/$/.test(l.trim())

function chunkPairs(base: string[], lines: string[]): { en: string; vi: string }[] | null {
  if (base.length < 3) return null
  const out: { en: string; vi: string }[] = []
  for (let i = 0; i < base.length; i += 1) {
    const m = base[i].match(/^(.{2,70}?)\s·\s(.{2,70})$/)
    if (!m) return null
    const dm = (lines[i] ?? base[i]).match(/^(.{2,70}?)\s·\s(.{2,70})$/)
    out.push({ en: dm ? dm[1].trim() : m[1].trim(), vi: dm ? dm[2].trim() : m[2].trim() })
  }
  return out
}

function recallPairs(base: string[], lines: string[]): { prompt: string; ipa?: string; frame: string }[] | null {
  const items: { prompt: string; ipa?: string; frame: string }[] = []
  let i = 0
  while (i < base.length) {
    const prompt = base[i]
    if (!VN_CHARS.test(prompt) || /_{2,}/.test(prompt)) return null
    let ipa: string | undefined
    let frameIdx = i + 1
    if (isIpa(base[frameIdx] ?? '')) {
      ipa = lines[frameIdx] ?? base[frameIdx]
      frameIdx += 1
    }
    const frame = base[frameIdx]
    if (!frame || !/_{2,}/.test(frame)) return null
    items.push({ prompt: lines[i] ?? prompt, ipa, frame: lines[frameIdx] ?? frame })
    i = frameIdx + 1
  }
  return items.length >= 3 ? items : null
}

function frameGroups(base: string[], lines: string[]) {
  const heads = base.map((l, i) => (/…\?$/.test(l.trim()) && /\+/.test(l) ? i : -1)).filter((i) => i >= 0)
  if (heads.length < 2) return null
  const groups = heads.map((start, k) => {
    const end = k + 1 < heads.length ? heads[k + 1] : base.length
    const body = []
    for (let i = start + 1; i < end; i += 1) body.push(lines[i] ?? base[i])
    return {
      head: lines[start] ?? base[start],
      questions: body.filter((l) => /[?？]/.test(l) && !/^(yes|no)\b/i.test(l)),
      answers: body.filter((l) => /^(yes|no)\b/i.test(l)),
    }
  })
  return groups.every((g) => g.questions.length >= 2) ? groups : null
}

// ── section layouts ──────────────────────────────────────────────────────

function DefinitionRows({ parts }: { parts: Part[] }) {
  return (
    <div className="space-y-3.5">
      {parts.map((part, i) => (
        <div key={i} className="grid gap-1.5 sm:grid-cols-[116px_minmax(0,1fr)] sm:gap-4">
          {part.label && <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{part.label}</p>}
          <div className="min-w-0 space-y-1.5">
            {part.lines.map((l, j) =>
              isFormulaLine(l) ? (
                <Formula key={j} text={l} />
              ) : l.startsWith('☐') ? (
                <ul key={j} className="space-y-1">
                  <CheckRow text={l.replace(/^☐\s*/, '')} />
                </ul>
              ) : VN_CHARS.test(l) && l.length > 45 ? (
                <Note key={j} text={l} />
              ) : (
                <p key={j} className="break-words text-[15.5px] leading-[1.65] text-ink/90">
                  <GapText text={l} />
                </p>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function QAPairs({ pairs }: { pairs: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line/70">
      {pairs.map((p, i) => (
        <div
          key={i}
          className="grid gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:gap-4"
        >
          <p className="text-[15.5px] font-medium leading-snug text-ink">
            <GapText text={p.q} />
          </p>
          <p className="text-[15px] leading-snug text-primary">
            <span className="mr-1 text-muted">→</span>
            {p.a}
          </p>
        </div>
      ))}
    </div>
  )
}

function ContrastCards({ parts }: { parts: Part[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {parts.slice(0, 2).map((part, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-primary">{part.label}</p>
          <div className="mt-2 space-y-1.5">
            {part.lines.map((l, j) => (
              <p key={j} className="text-[15px] leading-[1.65] text-ink/90">
                {l}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GapGrid({ items, cols = 2 }: { items: string[]; cols?: number }) {
  return (
    <ol className={cn('grid gap-2.5', cols === 2 && 'sm:grid-cols-2')}>
      {items.map((l, i) => (
        <li key={i} className="flex items-start gap-3 border-b border-line/60 pb-2.5 last:border-0">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-primary-soft/60 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          <p className="min-w-0 break-words text-[15.5px] leading-[1.6] text-ink">
            <GapText text={l.replace(/^\d+[.)]\s+/, '')} />
          </p>
        </li>
      ))}
    </ol>
  )
}



function ChunkGrid({ items }: { items: { en: string; vi: string }[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/40 px-3.5 py-3">
          <p className="text-[15.5px] font-semibold leading-snug text-ink">{it.en}</p>
          <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{it.vi}</p>
        </div>
      ))}
    </div>
  )
}

function RecallGrid({ items }: { items: { prompt: string; ipa?: string; frame: string }[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/40 px-3.5 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[14px] leading-snug text-muted">{it.prompt}</p>
            {it.ipa && <p className="shrink-0 text-[11.5px] text-muted/80">{it.ipa}</p>}
          </div>
          <p className="mt-1.5 text-[15.5px] font-semibold leading-snug text-ink">
            {it.frame.split(/(_{2,})/).map((part, j) =>
              /^_{2,}$/.test(part) ? (
                <span key={j} className="mx-1 inline-block h-[1.05em] w-10 border-b-2 border-line align-baseline sm:w-14" />
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        </div>
      ))}
    </div>
  )
}

function FrameGroups({ groups }: { groups: { head: string; questions: string[]; answers: string[] }[] }) {
  return (
    <div className={cn('grid gap-3', groups.length === 2 ? 'lg:grid-cols-2' : 'sm:grid-cols-2')}>
      {groups.map((g, i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-line bg-bg/35 p-4">
          <p className="rounded-lg border border-primary/25 border-l-4 border-l-primary bg-primary-soft/55 px-3 py-2 text-[15px] font-semibold leading-snug text-ink">
            {g.head}
          </p>
          <ul className="space-y-1.5">
            {g.questions.map((q, j) => (
              <li key={j} className="border-t border-line/60 pt-1.5 text-[14.5px] leading-snug text-ink first:border-0 first:pt-0">
                {q}
              </li>
            ))}
          </ul>
          {g.answers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {g.answers.map((a, j) => (
                <span key={j} className="rounded-md bg-primary-soft/70 px-2.5 py-1 text-[13px] font-semibold text-primary">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SubjectCues({ lines, idx }: { lines: string[]; idx: number[] }) {
  const isNote = (l: string) => /^(Vòng|Lượt|Sau|Đổi|Ghi|Thử|Chọn)\b/i.test(l) || (VN_CHARS.test(l) && l.length > 40)
  const rows = idx.map((start, k) => {
    const end = k + 1 < idx.length ? idx[k + 1] : lines.length
    return { label: lines[start], cues: lines.slice(start + 1, end).filter((l) => l && !isNote(l)) }
  })
  const trailing = lines.filter((l, i) => isNote(l) && i > (idx[0] ?? -1))
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-line bg-bg/35 px-3.5 py-2.5">
            <span className="mt-0.5 grid h-6 min-w-10 shrink-0 place-items-center rounded bg-primary-soft px-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
              {r.label}
            </span>
            <p className="min-w-0 flex-1 break-words text-[15.5px] font-medium leading-relaxed text-ink">
              {r.cues.join(' / ')}
            </p>
          </div>
        ))}
      </div>
      {trailing.length > 0 && (
        <p className="text-[13px] leading-relaxed text-muted">{trailing.join(' ')}</p>
      )}
    </div>
  )
}

function PromptPairs({ rows }: { rows: { src: string; dst: string }[] }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-1.5 rounded-lg border border-line bg-bg/35 px-3.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:items-center sm:gap-4">
          <p className="text-[15px] leading-relaxed text-muted">{r.src}</p>
          <p className="flex items-start gap-2 text-[15.5px] font-medium leading-relaxed text-ink">
            <span className="text-muted">→</span>
            <span className="min-w-0 break-words">{r.dst}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

function RoleCards({ parts, footer }: { parts: Part[]; footer?: string }) {
  const icons = [UserRound, Users]
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {parts.slice(0, 2).map((part, i) => {
          const Icon = icons[i] ?? UserRound
          return (
            <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
              <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">
                <Icon className="h-3.5 w-3.5" />
                {part.label}
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {part.lines.map((l, j) => (
                  <li key={j} className="flex items-start gap-2 text-[15px] leading-[1.6] text-ink/90">
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                    <span className="min-w-0 break-words">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      {footer && <p className="text-[13.5px] text-muted">{footer}</p>}
    </div>
  )
}

function SceneCard({ parts }: { parts: Part[] }) {
  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        const label = (part.label ?? '').toUpperCase()
        if (!part.label) {
          return part.lines.length ? (
            <p key={i} className="text-[13.5px] leading-relaxed text-muted">
              {part.lines.join(' ')}
            </p>
          ) : null
        }
        if (label.startsWith('IDEA PATH')) {
          return (
            <div key={i} className="space-y-2">
              <Label tone="muted">{part.label}</Label>
              <div className="flex flex-wrap gap-2">
                {part.lines.map((l, j) => (
                  <span key={j} className="rounded-lg border border-line bg-bg/40 px-3 py-1.5 text-[14px] font-medium text-ink">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )
        }
        if (label.startsWith('START WITH')) {
          return (
            <div key={i} className="space-y-2">
              <Label tone="muted">{part.label}</Label>
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/40 px-4 py-3">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                <p className="text-[15.5px] font-medium leading-relaxed text-ink">{part.lines.join(' ')}</p>
              </div>
            </div>
          )
        }
        if (label.startsWith('NOW KEEP')) {
          const slots: { n: string; t: string }[] = []
          let pending = ''
          part.lines.forEach((l) => {
            if (/^Q\d+$/i.test(l.trim())) pending = l.trim()
            else if (pending) {
              slots.push({ n: pending, t: l })
              pending = ''
            } else if (l.trim()) slots.push({ n: '', t: l })
          })
          return (
            <div key={i} className="space-y-2.5">
              <Label>{part.label}</Label>
              <div className="space-y-2">
                {slots.map((s, j) =>
                  s.n ? (
                    <div key={j} className="flex items-center gap-3 rounded-lg border border-line bg-bg/35 px-3.5 py-2.5">
                      <span className="grid h-6 w-7 shrink-0 place-items-center rounded bg-primary-soft text-[11px] font-bold text-primary">
                        {s.n}
                      </span>
                      <p className="min-w-0 flex-1 text-[15.5px] leading-relaxed text-ink">
                        <GapText text={s.t} />
                      </p>
                    </div>
                  ) : (
                    <p key={j} className="text-[13.5px] leading-relaxed text-muted">
                      {s.t}
                    </p>
                  ),
                )}
              </div>
            </div>
          )
        }
        return (
          <div key={i} className="space-y-2">
            <Label>{part.label}</Label>
            <ol className="space-y-1.5">
              {part.lines.map((l, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[12px] font-semibold text-muted">{j + 1}</span>
                  <p className="min-w-0 break-words text-[15px] leading-[1.65] text-ink/90">{l}</p>
                </li>
              ))}
            </ol>
          </div>
        )
      })}
    </div>
  )
}

function DayPlan({ base, lines }: { base: string[]; lines: string[] }) {
  const text = (i: number) => lines[i] ?? base[i]
  const days: { key: string; items: number[] }[] = []
  const extras: number[] = []
  const pushDay = (key: string) => {
    let found = days.find((d) => d.key === key)
    if (!found) {
      found = { key, items: [] }
      days.push(found)
    }
    return found
  }
  let bucket: { key: string; items: number[] } | null = null
  base.forEach((raw, i) => {
    const line = raw.trim()
    const byPrefix = line.match(/^(?:Ngày|DAY)\s*(\d+)\b[:.)·-]?\s*(.*)$/i)
    if (byPrefix) {
      bucket = pushDay(`DAY ${byPrefix[1]}`)
      if (byPrefix[2] && !/^\/\s*DAY\s*\d/i.test(byPrefix[2])) bucket.items.push(i)
      return
    }
    if (/^NEXT CLASS/i.test(line)) {
      extras.push(i)
      bucket = null
      return
    }
    if (/^DAY\s*\d/i.test(line)) {
      bucket = pushDay(line.replace(/^DAY\s*(\d+).*$/i, 'DAY $1'))
      return
    }
    if (bucket) bucket.items.push(i)
    else if (days.length === 0 && !isLabel(line)) extras.push(i)
  })
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {days.map((d) => (
          <div key={d.key} className="rounded-xl border border-line bg-bg/40 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              {d.key}
            </p>
            <ul className="mt-2 space-y-1.5">
              {d.items.map((i) => (
                <li key={i} className="flex items-start gap-2 text-[14.5px] leading-[1.6] text-ink/90">
                  <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                  <span className="min-w-0 break-words">{text(i)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {extras.length > 0 && (
        <div className="rounded-xl border border-primary/25 bg-primary-soft/35 px-4 py-3">
          {extras.map((i) => (
            <p key={i} className="text-[14.5px] leading-relaxed text-ink/90">
              {text(i)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function RetryForm({ base, lines }: { base: string[]; lines: string[] }) {
  const fieldIdx = base.map((l, i) => (/_{2,}/.test(l) ? i : -1)).filter((i) => i >= 0)
  const noteIdx = base
    .map((l, i) => (!/_{2,}/.test(l) && /^(Lượt|Đổi|Thử lại|Ghi|So với)/i.test(l) ? i : -1))
    .filter((i) => i >= 0)
  const checkIdx = base
    .map((l, i) => (!/_{2,}/.test(l) && !noteIdx.includes(i) && !isLabel(l) ? i : -1))
    .filter((i) => i >= 0)
  return (
    <div className="space-y-4">
      {fieldIdx.length > 0 && (
        <div className="space-y-2">
          <Label>MY NEXT TRY</Label>
          <div className="space-y-2">
            {fieldIdx.map((idx, k) => {
              const l = lines[idx] ?? base[idx]
              const [head, ...rest] = l.split(':')
              return (
                <div key={k} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-line bg-bg/35 px-3.5 py-2.5">
                  <span className="text-[14px] font-medium text-muted">{head}:</span>
                  <span className="min-w-0 flex-1">
                    <GapText text={rest.join(':') || '____'} className="text-[15px] text-ink" />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {checkIdx.length > 0 && (
        <div className="space-y-2">
          <Label>PARTNER CHECK</Label>
          <ul className="space-y-1.5">
            {checkIdx.map((idx, k) => (
              <CheckRow key={k} text={lines[idx] ?? base[idx]} />
            ))}
          </ul>
        </div>
      )}
      {noteIdx.length > 0 && (
        <div className="space-y-1">
          {noteIdx.map((idx, k) => (
            <p key={k} className="text-[13px] leading-relaxed text-muted">
              {lines[idx] ?? base[idx]}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── generic fallback ─────────────────────────────────────────────────────

type Block = { kind: 'list'; ordered: boolean; items: string[] } | { kind: 'text'; kindOf: Kind; text: string }
type Group = { heading?: string; blocks: Block[] }


// ── grammar helpers ──────────────────────────────────────────────────────

const AUX_WORD = /^(do|don’t|don't|am|not|’m|'m)$/i

function Emph({ text }: { text: string }) {
  const parts = text.split(/(\bdo\b|\bdon’t\b|\bdon't\b|\bam\b|\bnot\b|\b’m\b|\b'm\b)/gi)
  return (
    <>
      {parts.map((part, i) =>
        AUX_WORD.test(part) ? (
          <strong key={i} className="rounded bg-primary/15 px-1 font-extrabold text-primary">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function CheckBoard({ lines }: { lines: string[] }) {
  const items: { q: string; a: string[] }[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/[?？]$/.test(t) || items.length === 0) items.push({ q: t, a: [] })
    else items[items.length - 1].a.push(t)
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/40 p-4">
          <p className="text-[10.5px] font-bold tracking-[0.14em] text-muted">{String(i + 1).padStart(2, '0')}</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">{it.q}</p>
          {it.a.map((a, j) =>
            j === 0 ? (
              <p key={j} className="mt-2 text-[14px] font-bold text-primary"><Emph text={a} /></p>
            ) : (
              <p key={j} className="mt-1.5 rounded-md bg-surface px-2 py-1 text-[13px] leading-relaxed text-ink/75">{a}</p>
            ),
          )}
        </div>
      ))}
    </div>
  )
}

function GrammarFrames({ lines }: { lines: string[] }) {
  const frames: { head: string; rest: string[] }[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^(DO YOU|ARE YOU)\b/.test(t)) frames.push({ head: t, rest: [] })
    else if (frames.length) frames[frames.length - 1].rest.push(t)
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {frames.map((f, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-4">
          <p className="rounded-lg bg-primary-soft/70 px-3 py-2 text-[13px] font-bold tracking-wide text-primary">{f.head}</p>
          <div className="mt-3 space-y-2">
            {f.rest.map((l, j) =>
              /^(yes|no)\b/i.test(l) ? (
                <p key={j} className="rounded-lg border border-primary/20 bg-primary-soft/35 px-3 py-2 text-[15px] font-semibold text-ink">
                  <Emph text={l} />
                </p>
              ) : (
                <p key={j} className="border-l-2 border-line pl-3 text-[15px] leading-relaxed text-ink/85">{l}</p>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnswerAdd({ lines }: { lines: string[] }) {
  const cards: { q: string; a: string; detail: string }[] = []
  const tail: string[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const q = lines[i].trim()
    const a = (lines[i + 1] ?? '').trim()
    if (/[?？]$/.test(q) && /^(yes|no)\b/i.test(a)) {
      const d = (lines[i + 2] ?? '').trim()
      const hasDetail = Boolean(d) && !/[?？]$/.test(d) && !/^(yes|no)\b/i.test(d)
      cards.push({ q, a, detail: hasDetail ? d : '' })
      i += hasDetail ? 2 : 1
    } else tail.push(q)
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[14.5px] font-medium leading-relaxed text-ink/85">{c.q}</p>
            <p className="mt-2 rounded-lg border border-primary/20 bg-primary-soft/45 px-3 py-2 text-[15.5px] font-semibold text-ink">
              <Emph text={c.a} />
              {c.detail && <span className="font-normal text-ink/75"> {c.detail}</span>}
            </p>
          </div>
        ))}
      </div>
      {tail.length > 0 && <Note text={tail.join(' ')} />}
    </div>
  )
}

function groupBlocks(lines: string[], shape: string[]): Group[] {
  const items = lines.map((text, i) => ({ text, kind: classifyLine(shape[i] ?? shape[shape.length - 1] ?? lines[i]) }))
  const groups: Group[] = [{ blocks: [] }]
  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (item.kind === 'bullet' || item.kind === 'numbered') {
      const ordered = item.kind === 'numbered'
      const run: string[] = []
      while (i < items.length && items[i].kind === item.kind) {
        run.push(items[i].text)
        i += 1
      }
      groups[groups.length - 1].blocks.push({ kind: 'list', ordered, items: run })
      continue
    }
    if (item.kind === 'heading') {
      groups.push({ heading: item.text, blocks: [] })
      i += 1
      continue
    }
    groups[groups.length - 1].blocks.push({ kind: 'text', kindOf: item.kind, text: item.text })
    i += 1
  }
  return groups.filter((g) => g.heading || g.blocks.length)
}

function blockNode(block: Block, key: number) {
  if (block.kind === 'list')
    return block.ordered ? (
      <ol key={key} className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-[12px] font-bold text-primary">
              {i + 1}
            </span>
            <span className="min-w-0 break-words text-[15.5px] leading-[1.7] text-ink/90">{item}</span>
          </li>
        ))}
      </ol>
    ) : (
      <Bullets key={key} items={block.items} />
    )
  switch (block.kindOf) {
    case 'formula':
      return <Formula key={key} text={block.text} />
    case 'example':
      return <Example key={key} text={block.text} />
    case 'note':
      return <Note key={key} text={block.text} />
    case 'question':
      return (
        <p
          key={key}
          className="border-l-2 border-primary/25 py-0.5 pl-3 text-[15.5px] font-medium leading-relaxed text-ink"
        >
          <GapText text={block.text} />
        </p>
      )
    case 'answer':
      return (
        <p key={key} className="inline-flex max-w-full rounded-md bg-primary-soft/70 px-3 py-1.5 text-[14.5px] font-semibold text-primary">
          {block.text}
        </p>
      )
    case 'ipa':
      return (
        <p key={key} className="text-[13.5px] font-medium tracking-wide text-muted">
          {block.text}
        </p>
      )
    default:
      return (
        <p key={key} className="max-w-[70ch] break-words text-[15.5px] leading-[1.8] text-ink/90">
          <GapText text={block.text} />
        </p>
      )
  }
}

function GenericBlocks({ lines, shape }: { lines: string[]; shape: string[] }) {
  const blocks = useMemo(() => groupBlocks(lines, shape), [lines, shape])
  return (
    <div className="space-y-5">
      {blocks.map((group, gi) => (
        <section key={gi} className={cn('space-y-3', group.heading && 'rounded-xl border border-line/70 bg-bg/25 p-4')}>
          {group.heading && <Label>{group.heading}</Label>}
          {group.blocks.map((b, bi) => blockNode(b, bi))}
        </section>
      ))}
    </div>
  )
}

// ── entry point ──────────────────────────────────────────────────────────

export function LessonBlocks({ lines, shape, section = '', kind = '' }: { lines: string[]; shape?: string[]; section?: string; kind?: string }) {
  const base = shape ?? lines
  const sec = section.toUpperCase()
  const stable = lines.length === base.length
  const baseParts = useMemo(() => partsOf(base, base), [base])
  const display = useMemo(() => partsOf(base, lines), [base, lines])

  // answer checks: one row per prompt, details underneath (horizontal on wide screens)
  if (/^CHECK$/i.test(kind) && stable) return <CheckBoard lines={lines} />

  // grammar: Do you…? / Are you…? frames, then short answer + detail
  if (sec.includes('GRAMMAR') && stable) {
    if (base.some((l) => /^DO YOU \+ V1/.test(l)) && base.some((l) => /^ARE YOU/.test(l)))
      return <GrammarFrames lines={lines} />
    const triples =
      base.length >= 6 &&
      base.filter((_, i) => i % 3 === 0).every((l) => /[?？]$/.test(l.trim())) &&
      base.filter((_, i) => i % 3 === 1).every((l) => /^(yes|no)\b/i.test(l.trim()))
    if (triples) return <AnswerAdd lines={lines} />
  }

  // FIRST TRY: ___ you + verb + rest, two columns, answer still hidden
  const doOrAreCards = base.length >= 6 && base.filter((_, i) => i % 3 === 0).every((l) => l.trim() === '___ you')
  if (doOrAreCards && stable) {
    const groups: { b: string; c: string }[] = []
    for (let i = 0; i + 2 < lines.length; i += 3) groups.push({ b: lines[i + 1], c: lines[i + 2] })
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {groups.map((g, i) => (
          <div key={i} className="rounded-lg border border-line bg-bg/40 px-3.5 py-2.5">
            <p className="text-[15.5px] font-medium leading-relaxed text-ink">
              <span className="text-muted">___ you</span>{' '}
              <span className="underline decoration-primary/60 decoration-2 underline-offset-4">{g.b}</span> {g.c}
            </p>
          </div>
        ))}
      </div>
    )
  }

  // chunk banks ("chunk · nghĩa") and recall cards (nghĩa + phiên âm + khung câu)
  const chunks = chunkPairs(base, lines)
  if (stable && chunks) return <ChunkGrid items={chunks} />

  const recall = recallPairs(base, lines)
  if (stable && recall) return <RecallGrid items={recall} />

  const frames = frameGroups(base, lines)
  if (stable && frames) return <FrameGroups groups={frames} />

  // REAL TALK: role briefs, otherwise scene script
  if (sec.includes('REAL TALK') && stable) {
    const roleIdx = baseParts.map((p, i) => (/ROLE|PARTNER|PERSON\s*[AB]/i.test(p.label ?? '') ? i : -1)).filter((i) => i >= 0)
    if (roleIdx.length >= 2) {
      const footer = display.filter((p) => !p.label).flatMap((p) => p.lines).slice(-1)[0]
      return <RoleCards parts={roleIdx.map((i) => display[i])} footer={footer} />
    }
    return <SceneCard parts={display} />
  }

  // DAILY MISSION: day-by-day plan
  if (sec.includes('DAILY') && stable && base.some((l) => /^(DAY|Ngày)\s*\d/i.test(l)))
    return <DayPlan base={base} lines={lines} />

  // REFLECTION & RETRY: fill-in form, checklist, notes
  if (sec.includes('REFLECTION') && stable) {
    if (base.some((l) => /_{2,}/.test(l))) return <RetryForm base={base} lines={lines} />
    return <DefinitionRows parts={display} />
  }

  // REFERENCE: label + rules cheat sheet
  if (sec.includes('REFERENCE') && stable && baseParts.filter((p) => p.label).length >= 2)
    return <DefinitionRows parts={display} />

  // GRAMMAR
  if (sec.includes('GRAMMAR') && stable) {
    const pairs = qaPairs(base, lines)
    if (pairs) return <QASection result={pairs} />
    const labelled = baseParts.filter((p) => p.label)
    const filled = labelled.filter((p) => p.lines.length >= 2)
    if (filled.length === 2)
      return <ContrastCards parts={display.filter((_, i) => baseParts[i].label && baseParts[i].lines.length >= 2)} />
    if (labelled.length >= 2) return <DefinitionRows parts={display} />
    const gapIdx = base.map((l, i) => (/_{2,}/.test(l) ? i : -1)).filter((i) => i >= 0)
    if (gapIdx.length >= 3) return <GapGrid items={gapIdx.map((i) => lines[i])} />
  }

  // ACTIVATION: subject cues, Vietnamese prompt -> English cue, gaps
  if (sec.includes('ACTIVATION') && stable) {
    const subject = /^(I|YOU|HE|SHE|IT|WE|THEY)$/
    const subjectIdx = base.map((l, i) => (subject.test(l.trim()) ? i : -1)).filter((i) => i >= 0)
    if (subjectIdx.length >= 3) return <SubjectCues lines={lines} idx={subjectIdx} />
    const rows: { src: string; dst: string }[] = []
    let vi = 0
    while (vi + 1 < lines.length && VN_CHARS.test(lines[vi]) && /[?？]/.test(lines[vi]) && !VN_CHARS.test(lines[vi + 1])) {
      rows.push({ src: lines[vi], dst: lines[vi + 1] })
      vi += 2
    }
    if (rows.length >= 2) {
      const tail = lines.slice(vi).filter(Boolean)
      return (
        <div className="space-y-3">
          <PromptPairs rows={rows} />
          {tail.length > 0 && <Note text={tail.join(' ')} />}
        </div>
      )
    }
    const qa = qaPairs(base, lines)
    if (qa && qa.pairs.length >= 3) return <QASection result={qa} />
    const labelled = baseParts.filter((p) => p.label)
    if (labelled.length >= 3 && labelled.every((p) => (p.label ?? '').split(/\s+/).length <= 2))
      return <DefinitionRows parts={display} />
    const gapIdx = base.map((l, i) => (/_{2,}/.test(l) ? i : -1)).filter((i) => i >= 0)
    if (gapIdx.length >= 3) return <GapGrid items={gapIdx.map((i) => lines[i])} />
  }

  // structured layouts used everywhere
  const isDoOrAre = base.length >= 6 && base.filter((_, i) => i % 3 === 0).every((l) => l.trim() === '___ you')
  if (isDoOrAre && stable) {
    const groups: { b: string; c: string }[] = []
    for (let i = 0; i + 2 < lines.length; i += 3) groups.push({ b: lines[i + 1], c: lines[i + 2] })
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {groups.map((g, i) => (
          <div key={i} className="rounded-lg border border-line bg-bg/40 px-3.5 py-2.5">
            <p className="text-[15.5px] font-medium leading-relaxed text-ink">
              <span className="text-muted">___ you</span>{' '}
              <span className="underline decoration-primary/60 decoration-2 underline-offset-4">{g.b}</span> {g.c}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const pairs =
    base.length >= 4 &&
    base.length % 2 === 0 &&
    base.every((l, i) => (i % 2 === 0 ? l.includes(' / ') : l.includes(' / ') && /\?/.test(l)))
  if (pairs && stable) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines.length / 2 }, (_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-1.5 rounded-lg border border-line bg-bg/40 p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4"
          >
            <p className="text-[14px] font-semibold leading-relaxed text-muted">{lines[i * 2]}</p>
            <p className="text-[15px] font-medium leading-relaxed text-ink">{lines[i * 2 + 1]}</p>
          </div>
        ))}
      </div>
    )
  }

  const speakerLines = base.filter((l) => /^[AB][:：]/.test(l)).length
  if (speakerLines >= 3 && speakerLines * 2 >= base.length) {
    return (
      <div className="space-y-2">
        {lines.map((l, i) => {
          const m = l.match(/^([AB])[:：]\s*(.*)$/)
          if (!m)
            return (
              <p key={i} className="pl-11 text-[14.5px] leading-[1.7] text-muted">
                {l}
              </p>
            )
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-6 w-7 shrink-0 place-items-center rounded bg-primary-soft text-[11px] font-bold text-primary">
                {m[1]}
              </span>
              <p className="min-w-0 flex-1 break-words text-[15px] leading-[1.7] text-ink">{m[2]}</p>
            </div>
          )
        })}
      </div>
    )
  }

  const chips = base.length >= 3 && base.every((l) => l.length < 35 && !/[?!:;…]/.test(l) && !l.startsWith('/'))
  if (chips) {
    return (
      <div className="flex flex-wrap gap-2">
        {lines.map((l, i) => (
          <span key={i} className="rounded-lg border border-line bg-bg/40 px-3 py-1.5 text-[15px] font-medium text-ink">
            {l}
          </span>
        ))}
      </div>
    )
  }

  return <GenericBlocks lines={lines} shape={base} />
}
