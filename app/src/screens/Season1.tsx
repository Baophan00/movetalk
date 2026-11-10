import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { season1Slides, SEASON1_SECTIONS } from '../data/season1Slides'

const SECTION_LABELS: Record<string, string> = {
  RECONNECTION: 'Reconnection',
  VOCABULARY: 'Vocabulary',
  GRAMMAR: 'Grammar',
  LISTENING: 'Listening',
  PRONUNCIATION: 'Pronunciation',
  ACTIVATION: 'Activation',
  'Real Talk': 'Real Talk',
  'Reflection & Retry': 'Reflection & Retry',
}

const SECTION_TONE: Record<string, string> = {
  RECONNECTION: 'bg-[#EEF3EA] border-[#D8E3D4] text-[#2B3A31]',
  VOCABULARY: 'bg-[#E9F1EC] border-[#CBE0D3] text-[#2F5D45]',
  GRAMMAR: 'bg-[#EDEFEA] border-[#D9DED4] text-[#3A4A3E]',
  LISTENING: 'bg-[#E7F0F0] border-[#CBE0E0] text-[#2C5654]',
  PRONUNCIATION: 'bg-[#F7EFE6] border-[#EBD9C4] text-[#6F4A18]',
  ACTIVATION: 'bg-[#F6ECEA] border-[#E7D2CD] text-[#7A3F35]',
  'Real Talk': 'bg-[#FAF3E2] border-[#E9DDBB] text-[#6B4E12]',
  'Reflection & Retry': 'bg-[#EEF3EA] border-[#D8E3D4] text-[#2B3A31]',
}

export function Season1({ onBack }: { onBack?: () => void }) {
  const [activeSection, setActiveSection] = useState<string>(SEASON1_SECTIONS[0])
  const [slideIdx, setSlideIdx] = useState(0)

  const sectionSlides = useMemo(
    () => season1Slides.filter((s) => s.section === activeSection),
    [activeSection],
  )

  const currentSlide = sectionSlides[slideIdx] ?? sectionSlides[0]

  const goSection = (sec: string) => {
    setActiveSection(sec)
    setSlideIdx(0)
  }

  const prevSlide = () => setSlideIdx((i) => Math.max(0, i - 1))
  const nextSlide = () => setSlideIdx((i) => Math.min(sectionSlides.length - 1, i + 1))

  return (
    <div className="w-full px-3 pb-10 pt-3 sm:px-5 lg:px-7">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {onBack && (
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Season 1 · Lesson 1</h2>
          <p className="text-[12px] text-muted">Build a Yes–No Question · Do you…? / Are you…?</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {SEASON1_SECTIONS.map((sec) => {
          const active = sec === activeSection
          const count = season1Slides.filter((s) => s.section === sec).length
          return (
            <button
              key={sec}
              onClick={() => goSection(sec)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-ink hover:border-primary/40',
              )}
            >
              {SECTION_LABELS[sec] ?? sec}
              <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Slide navigation */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-muted">
          Slide {slideIdx + 1} / {sectionSlides.length}
        </p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={prevSlide} disabled={slideIdx === 0}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextSlide} disabled={slideIdx === sectionSlides.length - 1}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Current slide card */}
      {currentSlide && (
        <div className={cn('rounded-2xl border p-5 sm:p-6', SECTION_TONE[currentSlide.section] ?? 'bg-surface border-line')}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[.16em] opacity-70">
              Slide {currentSlide.num}
            </span>
            <ChevronRight className="h-3 w-3 opacity-40" />
            <span className="text-[10.5px] font-bold uppercase tracking-[.16em] opacity-70">
              {SECTION_LABELS[currentSlide.section] ?? currentSlide.section}
            </span>
          </div>
          <h3 className="text-[22px] font-bold leading-tight sm:text-[26px]">{currentSlide.title}</h3>
          {currentSlide.subtitle && (
            <p className="mt-1.5 text-[13px] italic opacity-80">{currentSlide.subtitle}</p>
          )}
          <div className="mt-4 space-y-2">
            {currentSlide.blocks.map((block, bi) => (
              <ul key={bi} className="space-y-1.5">
                {block.content.map((line, li) => (
                  <li key={li} className="flex items-start gap-2 text-[14px] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* Slide thumbnails */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">All slides in this section</p>
        <div className="flex flex-wrap gap-1.5">
          {sectionSlides.map((s, i) => (
            <button
              key={s.num}
              onClick={() => setSlideIdx(i)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
                i === slideIdx
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-ink hover:border-primary/40',
              )}
            >
              {s.num}. {s.title.slice(0, 20)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
