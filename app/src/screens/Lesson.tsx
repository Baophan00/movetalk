import { useState, useMemo, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { SpeakButton } from '../components/SpeakButton'
import { cn } from '../lib/utils'
import { A1, titleOf } from '../lib/curriculum'
import { season1Slides, SEASON1_SECTIONS } from '../data/season1Slides'

const SECTION_META: Record<string, { label: string; color: string; bg: string; border: string; accent: string; icon: string; gradient: string }> = {
  RECONNECTION: { label: 'Reconnection', color: 'text-[#2B3A31]', bg: 'bg-[#EEF3EA]', border: 'border-[#D8E3D4]', accent: 'bg-[#5D7B6F]', icon: '🔄', gradient: 'from-[#EEF3EA] to-[#D8E3D4]' },
  VOCABULARY: { label: 'Vocabulary', color: 'text-[#2F5D45]', bg: 'bg-[#E9F1EC]', border: 'border-[#CBE0D3]', accent: 'bg-[#4E7C78]', icon: '📖', gradient: 'from-[#E9F1EC] to-[#CBE0D3]' },
  GRAMMAR: { label: 'Grammar', color: 'text-[#3A4A3E]', bg: 'bg-[#EDEFEA]', border: 'border-[#D9DED4]', accent: 'bg-[#6B7B6E]', icon: '📐', gradient: 'from-[#EDEFEA] to-[#D9DED4]' },
  LISTENING: { label: 'Listening', color: 'text-[#2C5654]', bg: 'bg-[#E7F0F0]', border: 'border-[#CBE0E0]', accent: 'bg-[#3B6360]', icon: '🎧', gradient: 'from-[#E7F0F0] to-[#CBE0E0]' },
  PRONUNCIATION: { label: 'Pronunciation', color: 'text-[#6F4A18]', bg: 'bg-[#F7EFE6]', border: 'border-[#EBD9C4]', accent: 'bg-[#A9743C]', icon: '🗣️', gradient: 'from-[#F7EFE6] to-[#EBD9C4]' },
  ACTIVATION: { label: 'Activation', color: 'text-[#7A3F35]', bg: 'bg-[#F6ECEA]', border: 'border-[#E7D2CD]', accent: 'bg-[#9C5A4A]', icon: '⚡', gradient: 'from-[#F6ECEA] to-[#E7D2CD]' },
  'Real Talk': { label: 'Real Talk', color: 'text-[#6B4E12]', bg: 'bg-[#FAF3E2]', border: 'border-[#E9DDBB]', accent: 'bg-[#C08A4A]', icon: '💬', gradient: 'from-[#FAF3E2] to-[#E9DDBB]' },
  'Reflection & Retry': { label: 'Reflection', color: 'text-[#2B3A31]', bg: 'bg-[#EEF3EA]', border: 'border-[#D8E3D4]', accent: 'bg-[#5D7B6F]', icon: '🔁', gradient: 'from-[#EEF3EA] to-[#D8E3D4]' },
}

// ── Parsers ──────────────────────────────────────────────────────────

function parseVocab(lines: string[]): { word: string; pos: string; ipa: string; meaning: string; example: string }[] {
  const items: { word: string; pos: string; ipa: string; meaning: string; example: string }[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.includes('·') && i + 3 < lines.length && lines[i + 1].startsWith('/') && lines[i + 1].endsWith('/')) {
      const [word, pos] = line.split('·').map((s) => s.trim())
      items.push({ word, pos: pos || '', ipa: lines[i + 1], meaning: lines[i + 2], example: lines[i + 3] })
      i += 4
    } else { i++ }
  }
  return items
}

function parseRecall(lines: string[]): { meaning: string; frame: string }[] {
  const items: { meaning: string; frame: string }[] = []
  let i = 0
  while (i < lines.length) {
    if (i + 1 < lines.length) { items.push({ meaning: lines[i], frame: lines[i + 1] }); i += 2 } else { i++ }
  }
  return items
}

function parseChunks(lines: string[]): { chunk: string; meaning: string }[] {
  const items: { chunk: string; meaning: string }[] = []
  let i = 0
  while (i < lines.length) {
    if (i + 1 < lines.length && lines[i + 1].startsWith('·')) {
      items.push({ chunk: lines[i], meaning: lines[i + 1].replace(/^·\s*/, '') }); i += 2
    } else { i++ }
  }
  return items
}

function isVocabSlide(slide: { title: string; blocks: { content: string[] }[] }): boolean {
  const lines = slide.blocks.flatMap((b) => b.content)
  return lines.some((l) => l.includes('·') && l.match(/\w+\s*·\s*(v|adj|n|adv)/) !== null) && lines.some((l) => l.startsWith('/') && l.endsWith('/'))
}

function isRecallSlide(slide: { title: string }): boolean {
  return slide.title.toLowerCase().includes('recall')
}

function isChunksSlide(slide: { title: string }): boolean {
  const t = slide.title.toLowerCase()
  return t.includes('chunks') || t.includes('useful') || t.includes('more than one word') || t.includes('little more')
}

// Detect if a line is a speaker label (ALL CAPS, short)
function isSpeaker(line: string): boolean {
  return /^[A-Z][A-Z\s·']+$/.test(line.trim()) && line.trim().length < 30 && line.trim().length > 1
}

// Detect section header (ALL CAPS with · or short ALL CAPS label)
function isSectionHeader(line: string): boolean {
  return line.includes('·') && /^[A-Z]/.test(line) && line === line.toUpperCase() || /^(ABOUT YOU|FIRST LISTEN|LISTEN FOR|MỤC TIÊU|LẦN 1|LẦN 2|FOLLOW-UP|MY NEXT TRY|MY CHECK|YOUR ROLE|YOUR PARTNER|PERSON A|PERSON B|MỞ LỜI|KẾT QUẢ|CHỌN MỘT CÂU|ĐIỀN|ĐÓNG|MỞ|TRA KHI|CUỘC TRAO ĐỔI)/i.test(line)
}

// Detect cue (short, no punctuation)
function isCue(line: string): boolean {
  return line.length < 30 && !/[.?!:;…]/.test(line) && !line.startsWith('/') && !line.includes('·') && !isSpeaker(line) && !isSectionHeader(line)
}

// ── Smart text renderer ─────────────────────────────────────────────

function SmartSlideBody({ lines, presentMode, meta }: { lines: string[]; presentMode: boolean; meta: typeof SECTION_META[string] }) {
  // Detect "Do or Are?" pattern: groups of 3 lines (___ you, keyword, suffix?)
  const isDoOrAre = lines.length >= 6 && lines.filter((_, i) => i % 3 === 0).every((l) => l.trim() === '___ you')
  if (isDoOrAre) {
    const questions: { prefix: string; keyword: string; suffix: string }[] = []
    for (let i = 0; i < lines.length; i += 3) {
      questions.push({ prefix: lines[i], keyword: lines[i + 1], suffix: lines[i + 2] })
    }
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {questions.map((q, i) => (
          <div key={i} className={cn('rounded-2xl border p-4 transition-all hover:shadow-md', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}>
            <p className={cn('text-[18px] font-bold leading-tight', presentMode ? 'text-white' : meta.color)}>
              <span className={presentMode ? 'text-white/50' : 'text-muted'}>___ you</span>{' '}
              <span className={cn('underline decoration-2 underline-offset-4', presentMode ? 'text-white' : 'text-ink')}>{q.keyword}</span>{' '}
              <span>{q.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    )
  }

  // Detect Q&A + detail pattern: groups of 3 where first ends with ?
  const isQADetail = lines.length >= 3 && lines.filter((_, i) => i % 3 === 0).every((l) => l.trim().endsWith('?'))
  if (isQADetail) {
    const cards: { q: string; a: string; detail: string }[] = []
    for (let i = 0; i + 2 < lines.length; i += 3) {
      cards.push({ q: lines[i], a: lines[i + 1], detail: lines[i + 2] })
    }
    if (cards.length >= 2) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <div key={i} className={cn('rounded-2xl border p-4 space-y-2', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}>
              <p className={cn('text-[15px] font-semibold', presentMode ? 'text-white' : meta.color)}>{c.q}</p>
              <p className={cn('text-[14px] font-bold', presentMode ? 'text-white/80' : 'text-primary')}>{c.a}</p>
              <p className={cn('text-[13px] italic', presentMode ? 'text-white/60' : 'text-ink/70')}>{c.detail}</p>
            </div>
          ))}
        </div>
      )
    }
  }

  // Detect "Do you…? / Are you…?" pattern: two sections with DO YOU and ARE YOU
  const hasDoYou = lines.some((l) => l.toUpperCase().includes('DO YOU') && l.includes('…'))
  const hasAreYou = lines.some((l) => l.toUpperCase().includes('ARE YOU') && l.includes('…'))
  if (hasDoYou && hasAreYou) {
    // Split into two sections
    const doIdx = lines.findIndex((l) => l.toUpperCase().includes('DO YOU') && l.includes('…'))
    const areIdx = lines.findIndex((l) => l.toUpperCase().includes('ARE YOU') && l.includes('…'))
    const doSection = lines.slice(doIdx, areIdx)
    const areSection = lines.slice(areIdx)
    const renderSection = (section: string[]) => (
      <div className="space-y-3">
        <div className={cn('rounded-xl px-4 py-2.5 font-mono text-[14px] font-bold', presentMode ? 'bg-white/8 text-white/90' : cn(meta.bg, meta.color))}>
          {section[0]}
        </div>
        {section.slice(1).map((l, i) => {
          const isShortAnswer = l === 'Yes,' || l === 'No,' || l === 'I do' || l === 'I don’t' || l === 'I am' || l === "I'm not" || l === '.' || l === "I don't" || l === "I'm not."
          if (isShortAnswer || l === '.') {
            return <span key={i} className={cn('inline-block mr-1 text-[14px] font-bold', presentMode ? 'text-white/80' : 'text-primary')}>{l === '.' ? '' : l} </span>
          }
          if (l.endsWith('?')) {
            return <div key={i} className={cn('rounded-xl border px-4 py-2.5', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}><p className={cn('text-[15px] font-medium', presentMode ? 'text-white/90' : 'text-ink')}>{l}</p></div>
          }
          return null
        })}
      </div>
    )
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn('rounded-2xl border p-4', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}>
          {renderSection(doSection)}
        </div>
        <div className={cn('rounded-2xl border p-4', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}>
          {renderSection(areSection)}
        </div>
      </div>
    )
  }

  // Detect A:/B: guided conversation pattern
  const hasABPattern = lines.some((l) => /^[AB]:/.test(l.trim()))
  if (hasABPattern) {
    return (
      <div className="space-y-2">
        {lines.map((l, i) => {
          const isA = l.trim().startsWith('A:')
          const isB = l.trim().startsWith('B:')
          if (isA || isB) {
            return (
              <div key={i} className={cn('rounded-xl px-4 py-3', isA ? (presentMode ? 'bg-white/8' : 'bg-bg') : (presentMode ? 'bg-white/5' : 'bg-surface'))}>
                <span className={cn('mr-2 text-[12px] font-bold uppercase', isA ? (presentMode ? 'text-white/70' : meta.color) : (presentMode ? 'text-white/50' : 'text-muted'))}>
                  {l.trim().slice(0, 2)}
                </span>
                <span className={cn('text-[14px] leading-relaxed', presentMode ? 'text-white/90' : 'text-ink')}>
                  {l.trim().slice(2).trim()}
                </span>
              </div>
            )
          }
          return (
            <p key={i} className={cn('text-[14px] leading-relaxed pl-4', presentMode ? 'text-white/70' : 'text-ink/70')}>{l}</p>
          )
        })}
      </div>
    )
  }
  type Block = { type: string; lines: string[] }
  const blocks: Block[] = []
  let current: Block = { type: 'text', lines: [] }

  const flush = () => { if (current.lines.length > 0) { blocks.push({ ...current }); current = { type: 'text', lines: [] } } }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (isSpeaker(trimmed)) {
      flush()
      current = { type: 'speaker', lines: [trimmed] }
    } else if (isSectionHeader(trimmed)) {
      flush()
      current = { type: 'header', lines: [trimmed] }
    } else if (isCue(trimmed) && current.type !== 'cues') {
      flush()
      current = { type: 'cues', lines: [trimmed] }
    } else if (isCue(trimmed) && current.type === 'cues') {
      current.lines.push(trimmed)
    } else {
      if (current.type === 'cues' || current.type === 'speaker' || current.type === 'header') {
        flush()
        current = { type: 'text', lines: [trimmed] }
      } else {
        current.lines.push(trimmed)
      }
    }
  }
  flush()

  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        switch (block.type) {
          case 'speaker': {
            const fullText = block.lines.slice(1).join(' ').replace(/\s+/g, ' ').trim()
            return (
              <div key={bi} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em]', presentMode ? 'bg-white/10 text-white/80' : cn(meta.bg, meta.color))}>
                    {block.lines[0]}
                  </span>
                  {fullText && <SpeakButton text={fullText} size="sm" label={`Listen to ${block.lines[0]}`} />}
                </div>
                <div className={cn('ml-2 space-y-1.5 border-l-2 pl-4', presentMode ? 'border-white/10' : 'border-line')}>
                  {block.lines.slice(1).map((l, li) => {
                    const isComplete = l.trim().endsWith('.') || l.trim().endsWith('?') || l.trim().endsWith('!')
                    return (
                      <div key={li} className="flex items-start gap-2">
                        <p className={cn('flex-1 text-[15px] leading-relaxed', presentMode ? 'text-white/90' : 'text-ink')}>{l}</p>
                        {isComplete && <SpeakButton text={l.trim()} size="sm" label="Listen to line" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
          case 'header':
            return (
              <div key={bi} className={cn('rounded-xl px-4 py-2.5', presentMode ? 'bg-white/8' : 'bg-bg')}>
                <p className={cn('text-[12px] font-bold uppercase tracking-[.14em]', presentMode ? 'text-white/70' : meta.color)}>
                  {block.lines[0]}
                </p>
                {block.lines.slice(1).map((l, li) => (
                  <p key={li} className={cn('mt-1 text-[14px] leading-relaxed', presentMode ? 'text-white/80' : 'text-ink/80')}>
                    {l}
                  </p>
                ))}
              </div>
            )
          case 'cues':
            return (
              <div key={bi} className="flex flex-wrap gap-2">
                {block.lines.map((l, li) => (
                  <span
                    key={li}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-[13px] font-semibold shadow-sm transition hover:shadow-md',
                      presentMode ? 'border-white/10 bg-white/8 text-white/90' : cn(meta.border, 'bg-white text-ink'),
                    )}
                  >
                    {l}
                  </span>
                ))}
              </div>
            )
          default:
            return (
              <div key={bi} className="space-y-2">
                {block.lines.map((l, li) => {
                  const isQ = l.endsWith('?')
                  const isIPA = l.startsWith('/') && l.endsWith('/')
                  const isFormula = l.includes('…') || l.includes('+ V') || l.includes('DO YOU') || l.includes('ARE YOU')
                  if (isIPA) {
                    return (
                      <p key={li} className={cn('font-mono text-[13px] tracking-wide', presentMode ? 'text-white/50' : 'text-muted')}>
                        {l}
                      </p>
                    )
                  }
                  if (isFormula) {
                    return (
                      <div key={li} className={cn('rounded-xl px-4 py-2.5 font-mono text-[14px] font-semibold', presentMode ? 'bg-white/8 text-white/90' : cn(meta.bg, meta.color))}>
                        {l}
                      </div>
                    )
                  }
                  if (isQ) {
                    return (
                      <div key={li} className={cn('rounded-xl border px-4 py-3', presentMode ? 'border-white/10 bg-white/5' : cn(meta.border, 'bg-white'))}>
                        <p className={cn('text-[15px] font-medium leading-relaxed', presentMode ? 'text-white/90' : 'text-ink')}>
                          {l}
                        </p>
                      </div>
                    )
                  }
                  return (
                    <div key={li} className={cn('flex items-start gap-3 rounded-xl px-4 py-3', presentMode ? 'bg-white/5' : 'bg-bg/50')}>
                      <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', presentMode ? 'bg-white/30' : meta.accent)} />
                      <p className={cn('text-[15px] leading-relaxed', presentMode ? 'text-white/90' : 'text-ink')}>
                        {l}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
        }
      })}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────

type Props = { lessonN: number; onPickLesson: (n: number) => void }

export function Lesson({ lessonN, onPickLesson }: Props) {
  const [activeSection, setActiveSection] = useState<string>(SEASON1_SECTIONS[0])
  const [slideIdx, setSlideIdx] = useState(0)
  const [presentMode, setPresentMode] = useState(false)
  const [showEx, setShowEx] = useState<Set<number>>(new Set())

  const prevLesson = A1.find((l) => l.n === lessonN - 1)
  const nextLesson = A1.find((l) => l.n === lessonN + 1)
  const currentLesson = A1.find((l) => l.n === lessonN)

  const sectionSlides = useMemo(() => season1Slides.filter((s) => s.section === activeSection), [activeSection])
  const currentSlide = sectionSlides[slideIdx] ?? sectionSlides[0]
  const meta = SECTION_META[activeSection] ?? SECTION_META.RECONNECTION

  const lines = useMemo(() => currentSlide ? currentSlide.blocks.flatMap((b) => b.content) : [], [currentSlide])

  const vocabItems = useMemo(() => {
    if (!currentSlide) return []
    return isVocabSlide(currentSlide) ? parseVocab(lines) : []
  }, [currentSlide, lines])

  const recallItems = useMemo(() => {
    if (!currentSlide) return []
    return isRecallSlide(currentSlide) ? parseRecall(lines) : []
  }, [currentSlide, lines])

  const chunkItems = useMemo(() => {
    if (!currentSlide) return []
    return isChunksSlide(currentSlide) ? parseChunks(lines) : []
  }, [currentSlide, lines])

  const isSpecialSlide = vocabItems.length > 0 || recallItems.length > 0 || chunkItems.length > 0

  const goSection = useCallback((sec: string) => { setActiveSection(sec); setSlideIdx(0) }, [])
  const prevSlide = useCallback(() => setSlideIdx((i) => Math.max(0, i - 1)), [])
  const nextSlide = useCallback(() => setSlideIdx((i) => Math.min(sectionSlides.length - 1, i + 1)), [sectionSlides.length])

  return (
    <div className={cn('w-full min-h-screen transition-colors duration-500', presentMode ? 'bg-[#0f1410] text-white' : 'bg-bg')}>
      {/* Top bar */}
      <div className={cn('sticky top-0 z-20 border-b backdrop-blur-md', presentMode ? 'border-white/10 bg-[#0f1410]/90' : 'border-line bg-surface/95')}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className={cn('h-8 w-8', presentMode && 'border-white/20 bg-white/5 text-white hover:bg-white/10')} disabled={!prevLesson} onClick={() => prevLesson && onPickLesson(prevLesson.n)}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <select value={lessonN} onChange={(e) => onPickLesson(Number(e.target.value))} className={cn('focus-ring h-8 max-w-[200px] truncate rounded-xl border px-3 text-[12px] font-semibold tabular-nums', presentMode ? 'border-white/20 bg-white/5 text-white' : 'border-line bg-surface')} aria-label="Choose a lesson">
              {A1.map((l) => (<option key={l.n} value={l.n}>Lesson {l.n} · {titleOf(l) || 'A1'}</option>))}
            </select>
            <Button variant="outline" size="icon" className={cn('h-8 w-8', presentMode && 'border-white/20 bg-white/5 text-white hover:bg-white/10')} disabled={!nextLesson} onClick={() => nextLesson && onPickLesson(nextLesson.n)}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="hidden min-w-0 flex-1 text-center sm:block">
            <p className={cn('text-[10px] font-bold uppercase tracking-[.2em]', presentMode ? 'text-white/40' : 'text-muted')}>A1 · Lesson {lessonN} of {A1.length}</p>
            <h2 className={cn('truncate text-[15px] font-semibold', presentMode ? 'text-white' : 'text-ink')}>{titleOf(currentLesson!) || `Lesson ${lessonN}`}</h2>
          </div>
          <Button variant="outline" size="sm" className={cn('gap-1.5', presentMode && 'border-white/20 bg-white/5 text-white hover:bg-white/10')} onClick={() => setPresentMode(!presentMode)}>
            {presentMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{presentMode ? 'Exit' : 'Present'}</span>
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className={cn('border-b', presentMode ? 'border-white/10' : 'border-line')}>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {SEASON1_SECTIONS.map((sec) => {
            const m = SECTION_META[sec]
            const active = sec === activeSection
            const count = season1Slides.filter((s) => s.section === sec).length
            return (
              <button key={sec} onClick={() => goSection(sec)} className={cn('group flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-200', active ? cn(m.accent, 'text-white shadow-lg shadow-black/10') : presentMode ? 'text-white/60 hover:bg-white/10 hover:text-white' : cn('text-ink/60 hover:bg-bg hover:text-ink'))}>
                <span className="text-base">{m.icon}</span>
                <span>{m.label}</span>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/20 text-white' : presentMode ? 'bg-white/10 text-white/50' : 'bg-bg text-muted')}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Slide nav bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className={cn('flex h-8 items-center gap-2 rounded-full px-4 text-[12px] font-semibold', presentMode ? 'bg-white/10 text-white/70' : cn(meta.bg, meta.color))}>
            <span>{meta.icon}</span><span>{meta.label}</span><span className="opacity-40">·</span><span>Slide {slideIdx + 1}/{sectionSlides.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className={cn('gap-1', presentMode && 'border-white/20 bg-white/5 text-white hover:bg-white/10')} onClick={prevSlide} disabled={slideIdx === 0}><ArrowLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className={cn('gap-1', presentMode && 'border-white/20 bg-white/5 text-white hover:bg-white/10')} onClick={nextSlide} disabled={slideIdx === sectionSlides.length - 1}><ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Slide card */}
        {currentSlide && (
          <div className={cn('relative overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-300', presentMode ? 'border-white/10 bg-[#1a2018]' : cn(meta.border, 'bg-surface'))}>
            {/* Slide header */}
            <div className={cn('px-6 py-5 sm:px-8 sm:py-6', presentMode ? 'bg-white/5' : `bg-gradient-to-r ${meta.gradient}`)}>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-md', presentMode ? 'bg-white/10' : 'bg-white/70')}>{meta.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[10px] font-bold uppercase tracking-[.2em]', presentMode ? 'text-white/40' : 'text-ink/50')}>Slide {currentSlide.num} · {meta.label}</p>
                  <h3 className={cn('mt-0.5 text-[22px] font-bold leading-tight sm:text-[26px]', presentMode ? 'text-white' : meta.color)}>{currentSlide.title}</h3>
                </div>
              </div>
              {currentSlide.subtitle && (<p className={cn('mt-3 text-[14px] italic leading-relaxed', presentMode ? 'text-white/60' : 'text-ink/70')}>{currentSlide.subtitle}</p>)}
            </div>

            {/* Slide body */}
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              {/* Vocabulary cards */}
              {vocabItems.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {vocabItems.map((v, i) => (
                    <div key={i} className={cn('group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5', presentMode ? 'border-white/10 bg-white/5 hover:bg-white/8' : cn(meta.border, 'bg-white hover:shadow-xl'))}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={cn('text-[20px] font-bold leading-tight', presentMode ? 'text-white' : meta.color)}>{v.word}</h4>
                          <span className={cn('mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase', presentMode ? 'bg-white/10 text-white/60' : cn(meta.bg, meta.color))}>{v.pos}</span>
                        </div>
                        <SpeakButton text={v.word} size="sm" label={`Listen to ${v.word}`} />
                      </div>
                      <p className={cn('mt-2 font-mono text-[13px] tracking-wide', presentMode ? 'text-white/50' : 'text-muted')}>{v.ipa}</p>
                      <p className={cn('mt-1.5 text-[14px] font-medium', presentMode ? 'text-white/80' : 'text-ink')}>{v.meaning}</p>
                      <div className={cn('mt-3 rounded-xl px-3 py-2', presentMode ? 'bg-white/5' : 'bg-bg/60')}>
                        <button
                          onClick={() => setShowEx((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })}
                          className={cn('text-[11px] font-semibold', presentMode ? 'text-white/60' : 'text-primary')}
                        >
                          {showEx.has(i) ? 'Ẩn ví dụ' : 'Xem ví dụ'}
                        </button>
                        {showEx.has(i) && (
                          <p className={cn('mt-1.5 text-[12.5px] italic leading-relaxed', presentMode ? 'text-white/60' : 'text-ink/70')}>{v.example}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recall cards */}
              {recallItems.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {recallItems.map((r, i) => (
                    <div key={i} className={cn('group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5', presentMode ? 'border-white/10 bg-white/5 hover:bg-white/8' : cn(meta.border, 'bg-white hover:shadow-xl'))}>
                      <div className="mb-3">
                        <p className={cn('text-[11px] font-bold uppercase tracking-[.14em]', presentMode ? 'text-white/40' : 'text-muted')}>Meaning</p>
                        <p className={cn('mt-1 text-[22px] font-bold leading-tight', presentMode ? 'text-white' : meta.color)}>{r.meaning}</p>
                      </div>
                      <div className={cn('rounded-xl px-3 py-2.5', presentMode ? 'bg-white/5' : 'bg-bg/60')}>
                        <p className={cn('text-[12px] font-bold uppercase tracking-[.12em]', presentMode ? 'text-white/40' : 'text-muted')}>Say</p>
                        <p className={cn('mt-1 font-mono text-[16px] font-semibold tracking-wide', presentMode ? 'text-white/80' : 'text-ink')}>{r.frame}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={cn('rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase', presentMode ? 'bg-white/10 text-white/50' : 'bg-bg text-muted')}>Recall the word →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chunks cards */}
              {chunkItems.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {chunkItems.map((c, i) => (
                    <div key={i} className={cn('group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5', presentMode ? 'border-white/10 bg-white/5 hover:bg-white/8' : cn(meta.border, 'bg-white hover:shadow-xl'))}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-[17px] font-bold leading-tight', presentMode ? 'text-white' : meta.color)}>{c.chunk}</p>
                          <p className={cn('mt-1.5 text-[13px]', presentMode ? 'text-white/60' : 'text-ink/70')}>{c.meaning}</p>
                        </div>
                        <SpeakButton text={c.chunk} size="sm" label={`Listen to ${c.chunk}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Smart text slides (Grammar, Listening, Pronunciation, Activation, Real Talk, Reflection) */}
              {!isSpecialSlide && (
                <SmartSlideBody lines={lines} presentMode={presentMode} meta={meta} />
              )}
            </div>

            {/* Slide footer */}
            <div className={cn('flex items-center justify-between border-t px-6 py-3 sm:px-8', presentMode ? 'border-white/10' : 'border-line')}>
              <button onClick={prevSlide} disabled={slideIdx === 0} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition', slideIdx === 0 ? 'opacity-30' : presentMode ? 'text-white/70 hover:bg-white/10' : 'text-muted hover:bg-bg')}>
                <ArrowLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <div className="flex items-center gap-1">
                {sectionSlides.map((_, i) => (
                  <button key={i} onClick={() => setSlideIdx(i)} className={cn('h-2 rounded-full transition-all duration-200', i === slideIdx ? cn('w-6', presentMode ? 'bg-white' : meta.accent) : cn('w-2', presentMode ? 'bg-white/20 hover:bg-white/40' : 'bg-line hover:bg-muted'))} />
                ))}
              </div>
              <button onClick={nextSlide} disabled={slideIdx === sectionSlides.length - 1} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition', slideIdx === sectionSlides.length - 1 ? 'opacity-30' : presentMode ? 'text-white/70 hover:bg-white/10' : 'text-muted hover:bg-bg')}>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Thumbnail grid */}
        <div className="mt-6">
          <p className={cn('mb-3 text-[11px] font-bold uppercase tracking-[.14em]', presentMode ? 'text-white/40' : 'text-muted')}>All slides · {meta.label}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sectionSlides.map((s, i) => (
              <button key={s.num} onClick={() => setSlideIdx(i)} className={cn('group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', i === slideIdx ? presentMode ? 'border-white/30 bg-white/10 ring-2 ring-white/20' : cn(meta.border, meta.bg, 'ring-2 ring-primary/20 shadow-md') : presentMode ? 'border-white/10 bg-white/5 hover:bg-white/8' : 'border-line bg-surface hover:border-primary/30 hover:shadow-sm')}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold', i === slideIdx ? (presentMode ? 'bg-white text-black' : cn(meta.accent, 'text-white')) : presentMode ? 'bg-white/10 text-white/50' : 'bg-bg text-muted')}>{s.num}</span>
                </div>
                <p className={cn('text-[11.5px] font-semibold leading-snug line-clamp-2', presentMode ? 'text-white/80' : 'text-ink')}>{s.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

