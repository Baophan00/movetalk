import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { A1, lessonA1, partPlan, quizFor, titleOf, type FlowGroup, type LessonFile } from '../lib/curriculum'
import { speak } from '../lib/audio'
import { markPart, partsSeen } from '../lib/progress'
import { pushPart } from '../lib/sync'
import { cn } from '../lib/utils'

type Props = {
  lessonN: number
  onPickLesson: (n: number) => void
  onBack: () => void
}

const PLAY_LABEL = 'Play'
const VI_CHARS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i

type Tone = 'violet' | 'mint' | 'lavender' | 'sky' | 'peach' | 'rose' | 'amber'

const TONES: Record<Tone, { soft: string; border: string; text: string; solid: string; chip: string }> = {
  violet: { soft: 'bg-[#f4f0ff]', border: 'border-[#ded4fb]', text: 'text-[#5b45a8]', solid: 'bg-[#7a5cf0]', chip: 'bg-[#ece5ff] text-[#5b45a8]' },
  mint: { soft: 'bg-[#eafaf3]', border: 'border-[#c9eddd]', text: 'text-[#0f6b4f]', solid: 'bg-[#2f9e79]', chip: 'bg-[#d9f4e9] text-[#0f6b4f]' },
  lavender: { soft: 'bg-[#eff1ff]', border: 'border-[#d7ddfb]', text: 'text-[#3f4c9a]', solid: 'bg-[#5a6ad4]', chip: 'bg-[#e4e8ff] text-[#3f4c9a]' },
  sky: { soft: 'bg-[#eaf5ff]', border: 'border-[#cbe6fb]', text: 'text-[#1c5a86]', solid: 'bg-[#3793d1]', chip: 'bg-[#dcefff] text-[#1c5a86]' },
  peach: { soft: 'bg-[#fff3e6]', border: 'border-[#fbddc2]', text: 'text-[#8a5320]', solid: 'bg-[#e08a3c]', chip: 'bg-[#ffe8d2] text-[#8a5320]' },
  rose: { soft: 'bg-[#fdeef5]', border: 'border-[#f8d8e8]', text: 'text-[#8c3560]', solid: 'bg-[#c9528c]', chip: 'bg-[#fbdfed] text-[#8c3560]' },
  amber: { soft: 'bg-[#fff8e8]', border: 'border-[#f3e3bd]', text: 'text-[#7a5a12]', solid: 'bg-[#c99a2e]', chip: 'bg-[#fbf0d4] text-[#7a5a12]' },
}

/** The sections a lesson shows, in the order the handout runs them. */
const FLOW_LABEL: Record<string, string> = {
  Pronunciation: 'Pronunciation',
  Activate: 'Activate',
  'Real talk': 'Real talk',
  Reflect: 'Reflect & Retry',
  Mission: 'Daily mission',
  Work: 'Work',
  Notes: 'Notes',
  'Point & say': 'Point & say',
  Speaking: 'Speaking',
  'Everyday scenes': 'Everyday scenes',
  Listening: 'Listening',
  'Before you listen': 'Before you listen',
}

const TONE_CYCLE: Tone[] = ['peach', 'rose', 'mint', 'amber', 'lavender', 'sky', 'violet']

type SecDef = { id: string; label: string; tone: Tone; keys: string[] }

function sectionDefs(lesson: LessonFile): SecDef[] {
  const groups = lesson.parts.flow.map((g) => g.group)
  const has = (g: string) => groups.includes(g)
  const defs: SecDef[] = [{ id: 'overview', label: 'Overview', tone: 'violet', keys: ['flow-Overview'] }]

  if (lesson.parts.vocab.length) defs.push({ id: 'words', label: 'Words', tone: 'mint', keys: ['vocab'] })

  const grammarKeys: string[] = []
  if (lesson.parts.grammar.length) grammarKeys.push('grammar')
  if (lesson.parts.grammarChoose.length) grammarKeys.push('choose')
  if (has('Grammar')) grammarKeys.push('flow-Grammar')
  if (grammarKeys.length) defs.push({ id: 'grammar', label: 'Grammar', tone: 'lavender', keys: grammarKeys })

  const listenKeys = ['flow-Before you listen', 'dialogue', 'check'].filter(
    (k) => (k === 'dialogue' ? lesson.parts.dialogue.length > 0 : k === 'check' ? lesson.parts.listenCheck.length > 0 : has('Before you listen')),
  )
  if (listenKeys.length) defs.push({ id: 'listen', label: 'Listen & discover', tone: 'sky', keys: listenKeys })

  const rest = groups.filter((g) => g !== 'Overview' && g !== 'Before you listen' && g !== 'Grammar')
  rest.forEach((g, i) => {
    defs.push({
      id: `flow-${g}`,
      label: FLOW_LABEL[g] ?? g,
      tone: FLOW_TONE[g] ?? TONE_CYCLE[i % TONE_CYCLE.length],
      keys: [`flow-${g}`],
    })
  })

  return defs
}

const FLOW_TONE: Record<string, Tone> = {
  Overview: 'violet',
  'Before you listen': 'sky',
  Pronunciation: 'peach',
  Activate: 'lavender',
  'Real talk': 'rose',
  Reflect: 'mint',
  Mission: 'mint',
  Work: 'sky',
  'Point & say': 'amber',
  'Everyday scenes': 'rose',
  Speaking: 'peach',
  Listening: 'sky',
  Notes: 'amber',
}

const POS_TONE: Record<string, Tone> = { v: 'peach', n: 'mint', adj: 'sky', adv: 'rose', prep: 'lavender' }

function PlayButton({ text, small }: { text: string; small?: boolean }) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={PLAY_LABEL}
      onClick={() => speak(text)}
      className={cn(small ? 'h-7 w-7' : 'h-8 w-8', 'shrink-0')}
    >
      <Volume2 className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
    </Button>
  )
}

function Chip({ children, tone = 'violet' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', TONES[tone].chip)}>
      {children}
    </span>
  )
}

function isPattern(line: string) {
  return !VI_CHARS.test(line) && (/\+/.test(line) || /^[A-Z0-9 …?.,'/-]{4,}$/.test(line))
}

/** "Chọn Do hay Are" reads as an instruction, so show it in English; the note lines stay Vietnamese. */
function englishSub(sub: string) {
  const m = sub.match(/^Chọn\s+(.+?)\s+hay\s+(.+)$/i)
  if (m) return `${m[1].trim()} or ${m[2].trim()}?`
  return sub.replace(/\shay\s/gi, ' or ')
}

/** Bold the word that carries the meaning: the first word after "you". */
function Highlight({ text }: { text: string }) {
  const m = text.match(/^(.*?\byou\s+)(\S+)(.*)$/i)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]}
      <span className="font-bold text-[#c8352a]">{m[2]}</span>
      {m[3]}
    </>
  )
}

function Vocabulary({ items }: { items: LessonFile['parts']['vocab'] }) {
  const [open, setOpen] = useState<string[]>([])
  const toggle = (w: string) => setOpen((o) => (o.includes(w) ? o.filter((x) => x !== w) : [...o, w]))

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between text-[11.5px] text-muted">
        <span>Tap a word for the meaning, the example and the gap.</span>
        <span>{items.length} words</span>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((v) => {
          const isOpen = open.includes(v.word)
          const pos = (v.pos ?? '').toLowerCase().slice(0, 3)
          return (
            <li
              key={v.word}
              className={cn(
                'rounded-2xl border transition-shadow',
                isOpen ? 'border-[#c9eddd] bg-[#f6fdfa] shadow-card' : 'border-line bg-surface hover:shadow-card',
              )}
            >
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => toggle(v.word)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(v.word)
                  }
                }}
                className="flex cursor-pointer items-center gap-2 px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold leading-tight text-ink">{v.word}</p>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    {v.ipa && <span className="truncate font-mono text-[11px] text-muted">{v.ipa}</span>}
                    {v.pos && <Chip tone={POS_TONE[pos] ?? 'lavender'}>{v.pos}</Chip>}
                  </div>
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <PlayButton text={v.word} small />
                </span>
                <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted transition-transform', isOpen && 'rotate-90')} />
              </div>
              {isOpen && (
                <div className="space-y-1 px-3.5 pb-3">
                  <p className="text-[13px] font-semibold text-[#0f6b4f]">{v.vi}</p>
                  {v.def && <p className="text-[11.5px] text-muted">{v.def}</p>}
                  {v.example && <p className="rounded-xl bg-[#eafaf3] px-2.5 py-1.5 text-[12px] italic text-ink/75">{v.example}</p>}
                  {v.cloze && <p className="text-[11.5px] text-muted">Gap: {v.cloze}</p>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const STAGES: Record<string, Tone> = {
  QUESTION: 'violet',
  ANSWER: 'mint',
  'ASK BACK': 'sky',
  ADD: 'peach',
  'ASK & RESPOND': 'sky',
  'LISTEN & FOLLOW': 'mint',
  'MISSION COMPLETE WHEN…': 'rose',
}

type Block = { label?: string; lines: string[] }

/** Split a slide's lines into stages (QUESTION / ANSWER / ASK BACK) so a template reads as a table, not a list. */
function intoBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [{ lines: [] }]
  for (const line of lines) {
    const key = line.trim().toUpperCase()
    if (STAGES[key]) {
      blocks.push({ label: key, lines: [] })
      continue
    }
    blocks[blocks.length - 1].lines.push(line)
  }
  return blocks.filter((b) => b.lines.length > 0)
}

const SUBJECTS = ['I', 'you', 'we', 'they', 'he', 'she', 'it'] as const
type Subj = (typeof SUBJECTS)[number]

type QCell = { verb: string; subject: Subj }
type AnswerRow = { subject: Subj; be: boolean; text: string }

/** "Do I …?" / "Is she …?" lines turn into a subject table: one column for DO/DOES, one for BE. */

const BE_FOR: Record<Subj, string> = { I: 'am', you: 'are', we: 'are', they: 'are', he: 'is', she: 'is', it: 'is' }
const DO_FOR: Record<Subj, string> = { I: 'do', you: 'do', we: 'do', they: 'do', he: 'does', she: 'does', it: 'does' }

/** One deck line can carry two short answers ("Yes, they do. / No, they don't. Yes, she does."). */
function parseAnswers(line: string): AnswerRow[] {
  const out: AnswerRow[] = []
  for (const seg of line.split(/(?<=\.)\s*(?=Yes|No)/)) {
    const m = seg.match(/\b(I|you|we|they|he|she|it)\s+(do|does|am|is|are)\b/i)
    if (!m) continue
    const subject = m[1] as Subj
    const verb = m[2].toLowerCase()
    const be = ['am', 'is', 'are'].includes(verb)
    const correct = be ? BE_FOR[subject] : DO_FOR[subject]
    let text = seg.trim()
    if (verb !== correct) {
      let swapped = false
      text = text.replace(be ? /\b(am|is|are)\b/i : /\b(do|does)\b/i, (hit) => {
        if (swapped) return hit
        swapped = true
        return correct
      })
    }
    out.push({ subject, be, text })
  }
  return out
}

function readSubjectGroups(lines: string[]) {
  const cells: QCell[] = []
  const answers: AnswerRow[] = []
  const rest: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    const q = line.match(/^(Do|Does|Am|Is|Are)\s+(I|you|we|they|he|she|it)\s*(?:\.\.\.|…)\s*\?$/)
    if (q) {
      cells.push({ verb: q[1], subject: q[2] as Subj })
      continue
    }
    if (/^(?:Yes|No)\b/i.test(line)) {
      answers.push(...parseAnswers(line))
      continue
    }
    rest.push(raw)
  }
  const seen = new Set<string>()
  const unique = answers.filter((a) => {
    const k = `${a.subject}-${a.be}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { cells, answers: unique, rest }
}

function SubjectMatrix({ cells, answers }: { cells: QCell[]; answers: AnswerRow[] }) {
  const hasDo = cells.some((c) => !['am', 'is', 'are'].includes(c.verb.toLowerCase()))
  const hasBe = cells.some((c) => ['am', 'is', 'are'].includes(c.verb.toLowerCase()))
  const rows = [...new Set(cells.map((c) => c.subject))]

  const cellFor = (subject: Subj, be: boolean) =>
    cells.find((c) => c.subject === subject && ['am', 'is', 'are'].includes(c.verb.toLowerCase()) === be)
  const answerFor = (subject: Subj, be: boolean) => answers.find((a) => a.subject === subject && a.be === be)

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="grid grid-cols-[68px_1fr_1fr] border-b border-line bg-[#fbfaff] text-[10px] font-bold uppercase tracking-[.1em]">
        <div className="px-3 py-1.5 text-muted">Subject</div>
        {hasDo && <div className="border-l border-line/70 px-3 py-1.5 text-[#5b45a8]">Do / Does</div>}
        {hasBe && <div className="border-l border-line/70 px-3 py-1.5 text-[#1c5a86]">Am / Is / Are</div>}
      </div>
      {rows.map((subject, i) => (
        <div key={subject} className={cn('grid grid-cols-[68px_1fr_1fr] items-stretch text-[13px]', i % 2 === 1 && 'bg-[#fcfbff]')}>
          <div className="px-3 py-2 font-semibold text-ink">{subject}</div>
          {hasDo && (
            <div className="border-l border-line/70 px-3 py-2">
              {(() => {
                const c = cellFor(subject, false)
                const a = answerFor(subject, false)
                return c ? (
                  <>
                    <span className="rounded-md bg-[#ece5ff] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[#5b45a8]">
                      {c.verb} {c.subject} …
                    </span>
                    {a && <p className="mt-1 text-[11px] leading-snug text-ink/60">{a.text}</p>}
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )
              })()}
            </div>
          )}
          {hasBe && (
            <div className="border-l border-line/70 px-3 py-2">
              {(() => {
                const c = cellFor(subject, true)
                const a = answerFor(subject, true)
                return c ? (
                  <>
                    <span className="rounded-md bg-[#dcefff] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[#1c5a86]">
                      {c.verb} {c.subject} …
                    </span>
                    {a && <p className="mt-1 text-[11px] leading-snug text-ink/60">{a.text}</p>}
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


const SINGULAR = /^(Is|Does|Was)\b/i

/** The deck compares one person with a group; show the two forms side by side. */
function ContrastPairs({ lines }: { lines: string[] }) {
  const questions = lines.filter((l) => /\?$/.test(l.trim()))
  const rest = lines.filter((l) => !/\?$/.test(l.trim()))
  const rows: { one?: string; many?: string }[] = []
  for (const q of questions) {
    if (SINGULAR.test(q) || !rows.length || rows[rows.length - 1].many) rows.push({ one: q })
    else rows[rows.length - 1].many = q
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_18px_1fr] items-center gap-1 text-[9.5px] font-bold uppercase tracking-[.1em] text-muted">
        <span>One person</span>
        <span />
        <span>A group</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_18px_1fr] items-center gap-1">
            <span className="rounded-lg border border-[#ded4fb] bg-[#f6f2ff] px-2 py-1.5 font-mono text-[11.5px] text-[#5b45a8]">{r.one ?? '—'}</span>
            <span className="text-center text-[11px] text-muted">↔</span>
            <span className="rounded-lg border border-[#cbe6fb] bg-[#eff8ff] px-2 py-1.5 font-mono text-[11.5px] text-[#1c5a86]">{r.many ?? '—'}</span>
          </div>
        ))}
      </div>
      {rest.length > 0 && <p className="text-[11px] italic text-ink/55">{rest.join(' · ')}</p>}
    </div>
  )
}

/** "Does she works here?" + a Vietnamese nudge: read them as mistakes to repair, not as examples. */
function RepairCards({ lines }: { lines: string[] }) {
  const items: { wrong: string; hint?: string }[] = []
  const HINT = /^(Sau|Động|Một|Câu|Có|HE |THEY |Nhóm|Chọn|Nói|Số |Danh)\b/
  for (const line of lines) {
    if (VI_CHARS.test(line) || HINT.test(line)) {
      if (items.length) items[items.length - 1].hint = line
      continue
    }
    items.push({ wrong: line })
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((it, i) => (
        <li key={`${it.wrong}-${i}`} className="rounded-xl border border-[#f3c9c4] bg-[#fdf5f4] px-3 py-2">
          <p className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-[#8a2b22]">
            <span className="mt-0.5 shrink-0 font-bold">×</span>
            <span className="min-w-0">{it.wrong}</span>
          </p>
          {it.hint && <p className="mt-1 text-[11px] italic text-[#8a5320]">{it.hint}</p>}
          <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Say it again, right</p>
        </li>
      ))}
    </ul>
  )
}


/** Question + short answer pairs read as a drill: the question, then what you say back. */
function QaList({ lines }: { lines: string[] }) {
  const pairs: { q: string; a?: string }[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (/\?$/.test(line)) pairs.push({ q: line })
    else if (pairs.length && !pairs[pairs.length - 1].a) pairs[pairs.length - 1].a = line
  }
  const leftover = lines.filter((l) => !VI_CHARS.test(l) && !pairs.some((p) => p.q === l.trim() || p.a === l.trim()))
  return (
    <div className="space-y-2">
      <ul className="grid gap-2 sm:grid-cols-2">
        {pairs.map((p, i) => (
          <li key={`${p.q}-${i}`} className="rounded-xl border border-line bg-surface px-3 py-2">
            <p className="text-[13px] font-semibold leading-snug text-ink">{p.q}</p>
            {p.a && <p className="mt-1 border-l-2 border-[#2f9e79]/40 pl-2 text-[12px] text-[#0f6b4f]">{p.a}</p>}
          </li>
        ))}
      </ul>
      {leftover.length > 0 && <p className="text-[11px] italic text-ink/55">{leftover.join(' · ')}</p>}
    </div>
  )
}

function Grammar({ sections }: { sections: LessonFile['parts']['grammar'] }) {
  return (
    <div className="space-y-3">
      {sections.map((g) => {
        const groups = readSubjectGroups(g.lines)
        const matrix = groups.cells.length >= 4
        const questions = g.lines.filter((l) => /\?$/.test(l.trim()) && !/\.\.\.|…/.test(l)).length
        const isQa = !matrix && questions >= 3 && !/REPAIR|CONTRAST/i.test(g.section)
        const isContrast = /CONTRAST/i.test(g.section)
        const isRepair = /REPAIR/i.test(g.section)
        const NOISE = /^(WHO ARE YOU|ASKING ABOUT\?|DO\s*\/\s*DOES|AM\s*\/\s*IS\s*\/\s*ARE)$/i
        const lines = matrix ? groups.rest.filter((l) => !NOISE.test(l.trim())) : g.lines
        const blocks = intoBlocks(lines)
        const staged = blocks.filter((b) => b.label).length >= 2
        const notes = blocks.flatMap((b) => b.lines).filter((l) => VI_CHARS.test(l))
        void lines
        return (
          <article key={g.section + g.sub} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <header className="flex flex-wrap items-center gap-2 border-b border-line/60 bg-[#fbfaff] px-4 py-2">
              <Chip tone="lavender">{g.section}</Chip>
              {g.sub && <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug">{englishSub(g.sub)}</p>}
            </header>

            <div className="space-y-3 px-4 py-3">
              {matrix && <SubjectMatrix cells={groups.cells} answers={groups.answers} />}
              {isRepair ? (
                <RepairCards lines={g.lines} />
              ) : isContrast ? (
                <ContrastPairs lines={g.lines} />
              ) : isQa ? (
                <>
                  <QaList lines={lines} />
                  {notes.length > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-[#fff8e8] px-3 py-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a5a12]" />
                      <div className="min-w-0 space-y-0.5">
                        {notes.map((n, i) => (
                          <p key={`${n}-${i}`} className="text-[11.5px] leading-relaxed text-[#7a5a12]">
                            {n}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : staged ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {blocks.map((b, bi) => {
                    const t = b.label ? TONES[STAGES[b.label] ?? 'lavender'] : TONES.amber
                    return (
                      <div key={`${b.label}-${bi}`} className={cn('rounded-xl border px-3 py-2', t.border, t.soft)}>
                        <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[.12em]', t.text)}>{b.label ?? 'Note'}</p>
                        <ul className="space-y-1">
                          {b.lines.map((line, i) => {
                            const vi = VI_CHARS.test(line)
                            return (
                              <li
                                key={`${line}-${i}`}
                                className={cn(
                                  'break-words text-[12.5px] leading-snug',
                                  vi ? 'italic text-ink/60' : isPattern(line) ? 'font-mono text-[11.5px] font-semibold text-ink' : 'text-ink/85',
                                )}
                              >
                                {line}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <>
                  <ul className="space-y-1">
                    {lines
                      .filter((l) => !VI_CHARS.test(l))
                      .map((line, i) => (
                        <li key={`${line}-${i}`} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink/85">
                          {isPattern(line) ? (
                            <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-[11px]', /ARE/.test(line) ? TONES.sky.chip : TONES.violet.chip)}>
                              {line}
                            </span>
                          ) : (
                            <>
                              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                              <span className="min-w-0 flex-1 break-words">{line}</span>
                            </>
                          )}
                        </li>
                      ))}
                  </ul>
                  {notes.length > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-[#fff8e8] px-3 py-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a5a12]" />
                      <div className="min-w-0 space-y-0.5">
                        {notes.map((n, i) => (
                          <p key={`${n}-${i}`} className="text-[11.5px] leading-relaxed text-[#7a5a12]">
                            {n}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Dialogue({ turns }: { turns: LessonFile['parts']['dialogue'] }) {
  const speakers = [...new Set(turns.map((t) => t.who))]
  return (
    <div className="space-y-1.5">
      {turns.map((t, i) => {
        const mine = speakers.indexOf(t.who) % 2 === 1
        return (
          <div key={`${t.who}-${i}`} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                mine ? TONES.sky.chip : TONES.violet.chip,
              )}
            >
              {t.who.slice(0, 1)}
            </span>
            <div className={cn('max-w-[82%]', mine ? 'items-end text-right' : 'items-start')}>
              {turns[i - 1]?.who !== t.who && (
                <p className={cn('mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted', mine && 'text-right')}>
                  {t.who}
                </p>
              )}
              <div
                className={cn(
                  'group inline-flex items-start gap-2 rounded-2xl px-3 py-2 text-left',
                  mine ? 'rounded-br-md bg-[#3793d1] text-white' : 'rounded-bl-md bg-[#f1ecff] text-ink',
                )}
              >
                <p className="min-w-0 text-[13px] leading-snug">{t.line}</p>
                <button
                  onClick={() => speak(t.line)}
                  className={cn('mt-0.5 shrink-0 opacity-60 transition-opacity hover:opacity-100', mine ? 'text-white' : 'text-primary')}
                  aria-label={PLAY_LABEL}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Checks({ items }: { items: LessonFile['parts']['listenCheck'] }) {
  const [shown, setShown] = useState<number[]>([])
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((c, i) => {
        const open = shown.includes(i)
        return (
          <li
            key={c.q}
            className={cn('rounded-2xl border px-3.5 py-2.5 transition-colors', open ? 'border-[#c9eddd] bg-[#f6fdfa]' : 'border-line bg-surface')}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#dcefff] text-[10px] font-bold text-[#1c5a86]">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug">{c.q}</p>
            </div>
            {open ? (
              <p className="mt-1.5 border-l-2 border-[#2f9e79]/40 pl-2 text-[12px] text-[#0f6b4f]">{c.a}</p>
            ) : (
              <button onClick={() => setShown((s) => [...s, i])} className="mt-1.5 text-[11.5px] font-semibold text-primary hover:underline">
                Show the answer
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** The deck opens on a title slide; show it as a cover, not as a wall of slide lines. */
function Overview({ lesson, agenda, onStart }: { lesson: LessonFile; agenda: SecDef[]; onStart: () => void }) {
  const g = lesson.parts.flow.find((x) => x.group === 'Overview')
  const lines = g?.slides?.[0]?.lines ?? []
  const vi = lines.find((l) => VI_CHARS.test(l) && l.length > 8)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ded4fb] bg-[#f8f5ff] px-5 py-6 sm:px-7 sm:py-8">
      <span aria-hidden className="pointer-events-none absolute right-4 top-1 select-none text-[96px] font-bold leading-none text-primary/[.06]">
        {String(lesson.n).padStart(2, '0')}
      </span>
      <p className="text-[10.5px] font-bold uppercase tracking-[.16em] text-primary">A1 · Lesson {lesson.n}</p>
      <h3 className="mt-1.5 max-w-[22ch] text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[30px]">
        {titleOf(lesson) || `Lesson ${lesson.n}`}
      </h3>
      {vi && <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-ink/70">{vi}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Chip tone="mint">{lesson.parts.vocab.length} words</Chip>
        <Chip tone="lavender">{agenda.length} sections</Chip>
        {lesson.parts.dialogue.length > 0 && <Chip tone="sky">{lesson.parts.dialogue.length} dialogue lines</Chip>}
        {lesson.parts.listenCheck.length > 0 && <Chip tone="sky">{lesson.parts.listenCheck.length} listening checks</Chip>}
        {lesson.parts.grammarChoose.length > 0 && <Chip tone="peach">{lesson.parts.grammarChoose.length} sentences to choose</Chip>}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" onClick={onStart}>
          Start the lesson <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <p className="hidden text-[11.5px] text-muted sm:block">Title slide of the handout. Next section opens Words.</p>
      </div>
    </div>
  )
}

type PracticeItem = { prompt: string; vi?: string; options: string[]; answer: string }

/** The handout's choose exercise, laid out like the slide: two columns of cards, meaning under each. */
function Choose({ items }: { items: PracticeItem[] }) {
  const [picked, setPicked] = useState<Record<number, string>>({})

  if (items.length === 0) return null

  const right = items.filter((it, i) => picked[i] === it.answer).length
  const answered = Object.keys(picked).length

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
        <span>Read the Vietnamese, then choose Do or Are. Say the whole question out loud.</span>
        <span className="tabular-nums">
          {answered} / {items.length} answered · <span className="font-semibold text-ink">{right} right</span>
        </span>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((it, i) => {
          const pick = picked[i]
          const chosen = pick !== undefined
          const ok = pick === it.answer
          return (
            <li
              key={`${it.prompt}-${i}`}
              className={cn(
                'rounded-2xl border px-4 py-3 transition-colors',
                !chosen && 'border-[#e7e2f5] bg-[#fbf8ff]',
                chosen && ok && 'border-[#bfe7d3] bg-[#f1fbf5]',
                chosen && !ok && 'border-[#f3c9c4] bg-[#fdf3f2]',
              )}
            >
              <p className="text-[14px] font-medium leading-snug text-ink">
                {it.prompt.split(/_+/).map((chunk, k) => (
                  <span key={k}>
                    {k > 0 && (
                      <span className="mx-1 inline-block w-8 border-b-2 border-dashed border-primary/50 align-baseline">&nbsp;</span>
                    )}
                    <Highlight text={chunk} />
                  </span>
                ))}
              </p>
              {it.vi && <p className="mt-1 text-[11.5px] italic text-ink/55">{it.vi}</p>}
              <div className="mt-2 flex items-center gap-1.5">
                {['Do', 'Are'].map((opt) => {
                  const isRight = opt === it.answer
                  const isPick = opt === pick
                  return (
                    <button
                      key={opt}
                      disabled={chosen}
                      onClick={() => setPicked((p) => ({ ...p, [i]: opt }))}
                      className={cn(
                        'rounded-lg border px-3 py-1 text-[12px] font-semibold transition-colors',
                        !chosen && 'border-line bg-surface hover:border-primary/40 hover:bg-primary-soft/60',
                        chosen && isRight && 'border-[#0f6b4f]/30 bg-[#c8f0e0] text-[#0f6b4f]',
                        chosen && isPick && !isRight && 'border-[#8a2b22]/30 bg-[#fde4e1] text-[#8a2b22]',
                        chosen && !isRight && !isPick && 'border-line/60 text-muted opacity-60',
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
                {chosen && !ok && <span className="ml-1 text-[11.5px] text-[#8a2b22]">It is “{it.answer}”.</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const LINK_MARK = /‿/

function ReadCard({ title, lines, pal }: { title: string; lines: string[]; pal: Palette }) {
  const body = lines.map((l) => l.trim()).filter((l) => l.length > 0 && l.toLowerCase() !== title.trim().toLowerCase())
  const links = body.filter((l) => LINK_MARK.test(l))
  if (links.length < 2) return null
  const prose = body.filter((l) => !LINK_MARK.test(l) && l.length > 90)
  const head = body.filter((l) => !LINK_MARK.test(l) && l.length <= 90)
  const heading = head[0] ?? ''
  const instruction = head.slice(1).find((l) => l.length > 20) ?? ''
  const footer = head.filter((l) => l !== heading && l !== instruction).pop() ?? ''
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-2">
      <header className={cn('flex items-center gap-2 border-b border-line/50 px-3.5 py-1.5', pal.soft)}>
        <span className={cn('h-2 w-2 shrink-0 rounded-full', pal.solid)} />
        <p className={cn('min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-wide', pal.text)}>{title}</p>
      </header>

      <div className="grid gap-2.5 px-3.5 py-3 sm:grid-cols-[1.6fr_1fr]">
        <div>
          {heading && <p className="text-[14px] font-bold leading-snug text-ink">{heading}</p>}
          {instruction && <p className="mt-0.5 text-[11.5px] italic leading-relaxed text-ink/60">{instruction}</p>}
          <div className="mt-2 space-y-1.5 rounded-xl border border-line/70 px-3 py-2">
            {prose.map((para, i) => (
              <p key={i} className="text-[13.5px] leading-[1.75] text-ink/85">
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className={cn('rounded-xl border px-2.5 py-2', pal.border, pal.soft)}>
          <p className={cn('mb-1.5 text-[9.5px] font-bold uppercase tracking-[.12em]', pal.text)}>Link the sounds</p>
          <div className="space-y-1">
            {links.map((l, i) => (
              <p key={i} className={cn('rounded-md px-1.5 py-0.5 font-mono text-[11.5px]', pal.chip)}>
                {l}
              </p>
            ))}
          </div>
          {footer && <p className="mt-1.5 text-[11px] italic leading-relaxed text-ink/55">{footer}</p>}
        </div>
      </div>
    </article>
  )
}

const NAME_LINE = /^[A-Z][A-Z0-9 .'’&-]{1,22}$/

function parseTalk(title: string, lines: string[]) {
  const body = lines.map((l) => l.trim()).filter((l) => l.length > 0 && l.toLowerCase() !== title.trim().toLowerCase())
  const turns: { who: string; text: string }[] = []
  const notes: string[] = []
  for (let i = 0; i < body.length; i++) {
    const name = body[i]
    const tag = body[i + 1]
    const text = body[i + 2]
    if (NAME_LINE.test(name) && /^[A-Z]$/.test(tag ?? '') && text && !NAME_LINE.test(text)) {
      turns.push({ who: name, text })
      i += 2
      continue
    }
    notes.push(body[i])
  }
  return turns.length >= 4 ? { turns, notes } : null
}

function TalkCard({ title, lines, pal }: { title: string; lines: string[]; pal: Palette }) {
  const t = parseTalk(title, lines)
  if (!t) return null
  const names = [...new Set(t.turns.map((x) => x.who))]
  const sub = t.notes.find((l) => !/^NOTICE/i.test(l)) ?? ''
  const foot = t.notes.filter((l) => /^NOTICE/i.test(l))
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-2">
      <header className={cn('flex items-center gap-2 border-b border-line/50 px-3.5 py-1.5', pal.soft)}>
        <span className={cn('h-2 w-2 shrink-0 rounded-full', pal.solid)} />
        <p className={cn('min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-wide', pal.text)}>{title}</p>
        <span className="text-[10.5px] text-muted">{t.turns.length} turns</span>
      </header>

      {sub && <p className="px-3.5 pt-2 text-[12px] italic leading-relaxed text-ink/60">{sub}</p>}

      <div className="space-y-1.5 px-3.5 py-3">
        {t.turns.map((turn, i) => {
          const right = names.indexOf(turn.who) === 1
          return (
            <div key={i} className={cn('flex flex-col', right ? 'items-end' : 'items-start')}>
              <span className="mb-0.5 px-0.5 text-[9.5px] font-bold uppercase tracking-[.12em] text-muted">{turn.who}</span>
              <p
                className={cn(
                  'max-w-[86%] rounded-2xl border px-3 py-1.5 text-[13px] leading-relaxed text-ink',
                  pal.border,
                  right ? 'rounded-tr-sm' : 'rounded-tl-sm',
                  right ? 'bg-surface' : pal.soft,
                )}
              >
                {turn.text}
              </p>
            </div>
          )
        })}
      </div>

      {foot.length > 0 && (
        <p className="border-t border-line/60 px-3.5 py-1.5 text-[11.5px] leading-relaxed text-ink/55">{foot.join(' · ')}</p>
      )}
    </article>
  )
}

const REFLECT_LEFT = /^(MY NEXT TRY|VIẾT LẠI)$/i
const REFLECT_RIGHT = /^(PARTNER CHECK|CÙNG HỌC KIỂM TRA)$/i
const CHECK_LINE = /^(Tôi|Chủ ngữ|Sau |Câu trả lời|Cuộc)/

function parseReflect(title: string, lines: string[]) {
  const body = lines.map((l) => l.trim()).filter((l) => l.length > 0 && l.toLowerCase() !== title.trim().toLowerCase())
  if (!body.some((l) => REFLECT_LEFT.test(l)) || !body.some((l) => REFLECT_RIGHT.test(l))) return null
  const firstLabel = body.findIndex((l) => REFLECT_LEFT.test(l) || REFLECT_RIGHT.test(l))
  const head = body.slice(0, firstLabel)
  const rest = body.slice(firstLabel).filter((l) => !REFLECT_LEFT.test(l) && !REFLECT_RIGHT.test(l))
  const left: string[] = []
  const right: string[] = []
  let side: 'left' | 'right' = 'left'
  for (const line of rest) {
    if (CHECK_LINE.test(line)) side = 'right'
    ;(side === 'left' ? left : right).push(line)
  }
  return { head, left, right }
}

function ReflectCard({ title, lines, pal }: { title: string; lines: string[]; pal: Palette }) {
  const r = parseReflect(title, lines)
  if (!r) return null
  const subtitle = r.head[0] ?? ''
  const instruction = r.head.slice(1).join(' ')
  const fill = r.left.filter((l) => /_{3,}/.test(l))
  const leftNotes = r.left.filter((l) => !/_{3,}/.test(l))
  const rightChecks = r.right.filter((l) => !/^(Lượt|Đổi) /.test(l))
  const rightNotes = r.right.filter((l) => /^(Lượt|Đổi) /.test(l))
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-2">
      <header className={cn('flex items-center gap-2 border-b border-line/50 px-3.5 py-1.5', pal.soft)}>
        <span className={cn('h-2 w-2 shrink-0 rounded-full', pal.solid)} />
        <p className={cn('min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-wide', pal.text)}>{title}</p>
      </header>

      <div className="px-3.5 pt-2.5">
        {subtitle && <p className="text-[14px] font-bold leading-snug text-ink">{subtitle}</p>}
        {instruction && <p className="mt-0.5 text-[12px] italic leading-relaxed text-ink/60">{instruction}</p>}
      </div>

      <div className="mt-2.5 grid gap-2.5 px-3.5 pb-3 sm:grid-cols-2">
        <div className={cn('rounded-xl border px-2.5 py-2', pal.border, pal.soft)}>
          <p className={cn('mb-1.5 text-[9.5px] font-bold uppercase tracking-[.12em]', pal.text)}>My next try</p>
          <div className="space-y-1.5">
            {fill.map((line, i) => {
              const [label] = line.split(/_{3,}/)
              return (
                <div key={i} className="text-[12.5px] leading-relaxed text-ink/85">
                  <span className="block text-[11.5px] text-ink/60">{label.trim()}</span>
                  <span className="mt-0.5 block border-b border-dashed border-ink/35">&nbsp;</span>
                </div>
              )
            })}
          </div>
          {leftNotes.length > 0 && (
            <p className="mt-1.5 text-[11px] italic leading-relaxed text-ink/55">{leftNotes.join(' · ')}</p>
          )}
        </div>

        <div className="rounded-xl border border-line/70 px-2.5 py-2">
          <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[.12em] text-muted">Partner check</p>
          <ul className="space-y-1">
            {rightChecks.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink/85">
                <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded border border-ink/25" />
                <span className="min-w-0 break-words">{line}</span>
              </li>
            ))}
          </ul>
          {rightNotes.length > 0 && (
            <p className="mt-1.5 text-[11px] italic leading-relaxed text-ink/55">{rightNotes.join(' · ')}</p>
          )}
        </div>
      </div>
    </article>
  )
}

const SCENE_MARK = /^NOW KEEP IT GOING$/

function parseScene(title: string, lines: string[]) {
  const body = lines.map((l) => l.trim()).filter((l) => l.length > 0 && l.toLowerCase() !== title.trim().toLowerCase())
  const out = { sub: [] as string[], imagine: [] as string[], ideas: [] as string[], opener: [] as string[], keep: [] as { q: string; pattern: string }[], notes: [] as string[] }
  let mode: 'sub' | 'imagine' | 'ideas' | 'opener' | 'keep' = 'sub'
  for (const line of body) {
    if (/^IMAGINE THE MOMENT$/i.test(line)) { mode = 'imagine'; continue }
    if (/^IDEA PATHS/i.test(line)) { mode = 'ideas'; continue }
    if (/^START WITH/i.test(line)) { mode = 'opener'; continue }
    if (SCENE_MARK.test(line)) { mode = 'keep'; continue }
    if (mode === 'sub') out.sub.push(line)
    else if (mode === 'imagine') out.imagine.push(line)
    else if (mode === 'ideas') out.ideas.push(line)
    else if (mode === 'opener') out.opener.push(line)
    else if (/^Q\d+$/.test(line)) out.keep.push({ q: line, pattern: '' })
    else if (out.keep.length > 0 && out.keep[out.keep.length - 1].pattern === '') out.keep[out.keep.length - 1].pattern = line
    else out.notes.push(line)
  }
  return out
}

function SceneCard({ title, lines, pal }: { title: string; lines: string[]; pal: Palette }) {
  const sc = parseScene(title, lines)
  const subtitle = sc.sub[0] ?? ''
  const setup = sc.sub.slice(1).join(' ')
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-2">
      <header className={cn('flex items-center gap-2 border-b border-line/50 px-3.5 py-1.5', pal.soft)}>
        <span className={cn('h-2 w-2 shrink-0 rounded-full', pal.solid)} />
        <p className={cn('min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-wide', pal.text)}>{title}</p>
      </header>

      <div className="px-3.5 pt-2.5">
        {subtitle && <p className="text-[14px] font-bold leading-snug text-ink">{subtitle}</p>}
        {setup && <p className="mt-0.5 text-[12px] italic leading-relaxed text-ink/60">{setup}</p>}
      </div>

      <div className="mt-2.5 grid gap-2.5 px-3.5 pb-3 sm:grid-cols-2">
        <div className="space-y-2">
          {sc.imagine.length > 0 && (
            <div className={cn('rounded-xl border px-2.5 py-2', pal.border, pal.soft)}>
              <p className={cn('mb-1 text-[9.5px] font-bold uppercase tracking-[.12em]', pal.text)}>Imagine the moment</p>
              <ol className="space-y-1">
                {sc.imagine.map((line, i) => (
                  <li key={`${line}-${i}`} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink/80">
                    <span className={cn('mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold', pal.chip)}>{i + 1}</span>
                    <span className="min-w-0 break-words">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {sc.ideas.length > 0 && (
            <div className="rounded-xl border border-line/70 px-2.5 py-2">
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[.12em] text-muted">Idea paths</p>
              <div className="flex flex-wrap gap-1">
                {sc.ideas.map((idea) => (
                  <span key={idea} className={cn('rounded-full border px-2 py-0.5 text-[11px]', pal.border, pal.chip)}>
                    {idea}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {sc.opener.length > 0 && (
            <div className={cn('rounded-xl border px-2.5 py-2', pal.border)}>
              <p className={cn('mb-1 text-[9.5px] font-bold uppercase tracking-[.12em]', pal.text)}>Start with</p>
              {sc.opener.map((line, i) => (
                <p key={i} className="text-[13px] font-medium leading-snug text-ink">
                  {line}
                </p>
              ))}
            </div>
          )}

          {sc.keep.length > 0 && (
            <div className="rounded-xl border border-line/70 px-2.5 py-2">
              <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[.12em] text-muted">Keep it going</p>
              <div className="space-y-1">
                {sc.keep.map(({ q, pattern }) => {
                  const [head, ...rest] = pattern.split(/_{3,}/)
                  return (
                    <div key={q} className="flex items-baseline gap-1.5 text-[12.5px] text-ink/85">
                      <span className="w-5 shrink-0 text-[10px] font-bold text-muted">{q}</span>
                      <span className={cn('shrink-0 rounded px-1 py-0.5 font-mono text-[10.5px]', pal.chip)}>{head.trim()}</span>
                      {rest.length > 0 && <span className="min-w-0 flex-1 border-b border-dashed border-ink/35">&nbsp;</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {sc.notes.length > 0 && (
        <p className="border-t border-line/60 px-3.5 py-1.5 text-[11.5px] leading-relaxed text-ink/55">{sc.notes.join(' · ')}</p>
      )}
    </article>
  )
}

const GENERIC_LABEL = /^[A-Z][A-Z0-9 ,&/'’+…-]{2,30}$/

type Palette = (typeof TONES)[Tone]

function LineRow({ line, pal, reading }: { line: string; pal: Palette; reading: boolean }) {
  const vi = VI_CHARS.test(line)
  const pattern = isPattern(line)
  const check = /^(Tôi|Có |Câu trả lời|Cuộc|Do \/ Are)/.test(line)
  const teacher = /^Giáo viên/i.test(line)
  return (
    <li className={cn('flex items-start gap-1.5 text-[12.5px] leading-relaxed', reading ? 'text-ink/75' : vi ? 'text-ink/55' : 'text-ink/85')}>
      {check && <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded border border-ink/25" />}
      {!vi && !pattern && !check && <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink/20" />}
      <span
        className={cn(
          'min-w-0 break-words',
          pattern ? cn('rounded-md px-1.5 py-0.5 font-mono text-[11px]', pal.chip) : 'flex-1',
          vi && !reading && 'italic',
          reading && vi && 'font-medium',
        )}
      >
        {teacher && <Info className="mr-1 inline h-3 w-3 text-[#7a5a12]" />}
        {line.split(/_{3,}/).map((chunk, ci, arr) => (
          <span key={ci}>
            {chunk}
            {ci < arr.length - 1 && <span className="mx-1 inline-block w-16 border-b border-dashed border-ink/40 align-baseline">&nbsp;</span>}
          </span>
        ))}
      </span>
    </li>
  )
}

function Flow({ groups, tone: sectionTone }: { groups: FlowGroup[]; tone?: Tone }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const pal = TONES[sectionTone ?? FLOW_TONE[g.group] ?? 'violet']
        return (
          <div key={g.group} className="grid gap-2.5 lg:grid-cols-2">
            {g.slides.map((slide, i) => {
              const dup = g.slides.filter((x) => x.title === slide.title).length > 1
              const body = slide.lines.filter((line) => line.trim().toLowerCase() !== slide.title.trim().toLowerCase())
              const viShare = body.filter((l) => VI_CHARS.test(l)).length / Math.max(body.length, 1)
              const readingSlide = viShare >= 0.6

              // A slide made of stage labels (ENTER THE SCENE, DAY 1, PREDICT…) reads better as steps.
              const blocks: { label?: string; lines: string[] }[] = [{ lines: [] }]
              for (const line of body) {
                const t = line.trim()
                if (GENERIC_LABEL.test(t) && !t.includes('+') && !t.endsWith('?')) blocks.push({ label: t, lines: [] })
                else blocks[blocks.length - 1].lines.push(line)
              }
              const labelled = blocks.filter((b) => b.label && b.lines.length > 0)
              const stepped = labelled.length >= 2
              // Labels written before their items ("MY NEXT TRY", "PARTNER CHECK") stay as a chip row.
              const looseLabels = stepped ? [] : [...new Set(blocks.map((b) => b.label).filter(Boolean) as string[])]

              if (body.some((line) => SCENE_MARK.test(line.trim())) && body.some((l) => /^START WITH/i.test(l.trim()))) {
                return <SceneCard key={`${slide.title}-${i}`} title={slide.title} lines={slide.lines} pal={pal} />
              }

              if (slide.lines.filter((l) => LINK_MARK.test(l)).length >= 2) {
                return <ReadCard key={`${slide.title}-${i}`} title={slide.title} lines={slide.lines} pal={pal} />
              }

              const talk = parseTalk(slide.title, slide.lines)
              if (talk) {
                return <TalkCard key={`${slide.title}-${i}`} title={slide.title} lines={slide.lines} pal={pal} />
              }

              const reflect = parseReflect(slide.title, slide.lines)
              if (reflect) {
                return <ReflectCard key={`${slide.title}-${i}`} title={slide.title} lines={slide.lines} pal={pal} />
              }

              return (
                <article
                  key={`${slide.title}-${i}`}
                  className={cn('overflow-hidden rounded-2xl border border-line bg-surface', g.slides.length === 1 && 'lg:col-span-2')}
                >
                  <header className={cn('flex items-center gap-2 border-b border-line/50 px-3.5 py-1.5', pal.soft)}>
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', pal.solid)} />
                    <p className={cn('min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-wide', pal.text)}>{slide.title}</p>
                    {dup && (
                      <span className="text-[10.5px] text-muted">
                        {i + 1}/{g.slides.length}
                      </span>
                    )}
                  </header>

                  {stepped ? (
                    <div className="grid gap-2 px-3.5 py-3 sm:grid-cols-2">
                      {blocks
                        .filter((b) => b.lines.length > 0)
                        .map((b, bi) => (
                          <div key={`${b.label}-${bi}`} className={cn('rounded-xl border px-2.5 py-2', pal.border, pal.soft, !b.label && 'sm:col-span-2')}>
                            {b.label && (
                              <p className={cn('mb-1 text-[9.5px] font-bold uppercase tracking-[.12em]', pal.text)}>{b.label}</p>
                            )}
                            <ul className="space-y-0.5">
                              {b.lines.map((line, li) => (
                                <LineRow key={`${line}-${li}`} line={line} pal={pal} reading={readingSlide} />
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5">
                      {looseLabels.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-1">
                          {looseLabels.map((l) => (
                            <span key={l} className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide', pal.chip)}>
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                      <ul className="space-y-1">
                        {body
                          .filter((line) => !looseLabels.includes(line.trim()))
                          .map((line, k) => (
                            <LineRow key={`${line}-${k}`} line={line} pal={pal} reading={readingSlide} />
                          ))}
                      </ul>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function Lesson({ lessonN, onPickLesson, onBack }: Props) {
  const lesson = lessonA1(lessonN) ?? A1[0]
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<number[]>([])

  const plan = useMemo(() => (lesson ? partPlan(lesson) : []), [lesson])

  const nodes = useMemo<Record<string, React.ReactNode>>(() => {
    if (!lesson) return {}
    const n: Record<string, React.ReactNode> = {
      vocab: <Vocabulary items={lesson.parts.vocab} />,
      grammar: <Grammar sections={lesson.parts.grammar.filter((g) => !/CHOOSE/i.test(g.section))} />,
      dialogue: <Dialogue turns={lesson.parts.dialogue} />,
      check: <Checks items={lesson.parts.listenCheck} />,
      choose: (
        <Choose
          items={quizFor(lesson.n)
            .filter((q) => q.kind === 'choice' && q.options && q.options.length > 1)
            .slice(0, 10)
            .map((q) => ({
              prompt: q.prompt,
              vi: lesson.parts.grammarChoose.find((c) => c.prompt === q.prompt)?.vi,
              options: q.options ?? [],
              answer: q.answer,
            }))}
        />
      ),
    }
    for (const g of lesson.parts.flow) {
      if (g.group === 'Overview') continue
      n[`flow-${g.group}`] = <Flow groups={[g]} tone={FLOW_TONE[g.group]} />
    }
    n['flow-Overview'] = <Overview lesson={lesson} agenda={sectionDefs(lesson).slice(1)} onStart={() => setActive(1)} />
    return n
  }, [lesson])

  const defs = useMemo(() => (lesson ? sectionDefs(lesson) : []), [lesson])

  const sections = useMemo(
    () =>
      defs
        .map((sec) => ({
          ...sec,
          blocks: sec.keys
            .filter((k) => nodes[k])
            .map((k) => ({ key: k, label: plan.find((p) => p.key === k)?.label ?? '', node: nodes[k] })),
        }))
        .filter((sec) => sec.blocks.length > 0),
    [defs, nodes, plan],
  )

  useEffect(() => {
    if (!lesson) return
    setActive(0)
    setSeen(partsSeen(lesson.n))
  }, [lessonN, lesson])

  const current = sections[active] ?? sections[0]

  useEffect(() => {
    if (!lesson || !current) return
    const t = window.setTimeout(() => {
      for (const b of current.blocks) {
        const i = plan.findIndex((p) => p.key === b.key)
        if (i >= 0) markPart(lesson.n, i)
        void pushPart(lesson.n, b.key)
      }
      setSeen(partsSeen(lesson.n))
    }, 1200)
    return () => window.clearTimeout(t)
  }, [active, lesson, current, plan])

  if (!lesson) return null

  const opened = (sec: (typeof sections)[number]) => sec.blocks.some((b) => seen.includes(plan.findIndex((p) => p.key === b.key)))
  const openedCount = sections.filter(opened).length
  const percent = plan.length ? Math.round((seen.length / plan.length) * 100) : 0
  const prevLesson = A1.find((l) => l.n === lesson.n - 1)
  const nextLesson = A1.find((l) => l.n === lesson.n + 1)
  const tone = TONES[current?.tone ?? 'violet']

  return (
    <div className="w-full px-3 pb-10 pt-3 sm:px-5 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All lessons
        </button>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" aria-label="Previous lesson" disabled={!prevLesson} onClick={() => prevLesson && onPickLesson(prevLesson.n)}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <select
            value={lesson.n}
            onChange={(e) => onPickLesson(Number(e.target.value))}
            className="focus-ring h-8 w-[calc(100vw-200px)] max-w-[280px] truncate rounded-xl border border-line bg-surface px-2 text-[12px] font-semibold tabular-nums sm:w-auto"
            aria-label="Choose a lesson"
          >
            {A1.map((l) => (
              <option key={l.n} value={l.n}>
                Lesson {l.n} · {titleOf(l) || 'A1'}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" aria-label="Next lesson" disabled={!nextLesson} onClick={() => nextLesson && onPickLesson(nextLesson.n)}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[.16em] text-primary">
            A1 · Lesson {lesson.n} of {A1.length}
          </p>
          <h2 className="mt-0.5 truncate text-[22px] font-semibold leading-tight tracking-tight sm:text-[25px]">
            {titleOf(lesson) || `Lesson ${lesson.n}`}
          </h2>
        </div>
        <div className="flex min-w-[160px] flex-1 items-center gap-3 sm:max-w-[300px]">
          <Progress value={percent} className="h-1.5 flex-1" />
          <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-ink">
            {openedCount}/{sections.length} sections · {seen.length}/{plan.length} parts
          </span>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
        {sections.map((sec, i) => {
          const t = TONES[sec.tone]
          const on = i === active
          return (
            <button
              key={sec.id}
              onClick={() => setActive(i)}
              aria-current={on ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                on ? cn(t.soft, t.border, t.text) : 'border-line bg-surface text-ink/65 hover:border-ink/15 hover:text-ink',
              )}
            >
              <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-[5px] text-[9.5px] font-bold tabular-nums', on ? 'bg-white/75' : t.soft, t.text)}>
                {i + 1}
              </span>
              {sec.label}
              {opened(sec) && <Check className={cn('h-3 w-3', on ? t.text : 'text-ok')} />}
            </button>
          )
        })}
      </div>

      {current && (
        <section key={current.id} className={cn('mt-3 overflow-hidden rounded-3xl border bg-surface', tone.border)}>
          <header className={cn('flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6', tone.soft)}>
            <div className="min-w-0">
              <p className={cn('text-[10.5px] font-bold uppercase tracking-[.16em]', tone.text)}>
                Section {active + 1} of {sections.length}
              </p>
              <h3 className="mt-0.5 text-[19px] font-semibold leading-tight tracking-tight sm:text-[21px]">{current.label}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {active > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setActive(active - 1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              {active < sections.length - 1 ? (
                <Button size="sm" onClick={() => setActive(active + 1)}>
                  Next section <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => nextLesson && onPickLesson(nextLesson.n)} disabled={!nextLesson}>
                  {nextLesson ? `Lesson ${nextLesson.n}` : 'Done'} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </header>

          <div className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
            {current.blocks.map((b) => {
              const i = plan.findIndex((p) => p.key === b.key)
              const done = seen.includes(i)
              return (
                <div key={b.key}>
                  {current.blocks.length > 1 && (
                    <div className="mb-2 flex items-center gap-2">
                      <p className={cn('text-[10.5px] font-bold uppercase tracking-[.14em]', tone.text)}>{b.label}</p>
                      <span className="h-px flex-1 bg-line/70" />
                      {done && <Check className="h-3 w-3 text-ok" />}
                    </div>
                  )}
                  {b.node}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
