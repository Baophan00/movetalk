import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { cn } from '../lib/utils'

const LEVELS = [
  { key: 'A1', name: 'A1 — Beginner', desc: 'Basic phrases, simple conversations, everyday topics.', available: true },
  { key: 'A2', name: 'A2 — Elementary', desc: 'Routine tasks, simple descriptions, familiar situations.', available: false },
  { key: 'B1', name: 'B1 — Intermediate', desc: 'Main points of clear speech, travel situations, opinions.', available: false },
  { key: 'B2', name: 'B2 — Upper-Intermediate', desc: 'Complex texts, fluent interaction, detailed arguments.', available: false },
  { key: 'C1', name: 'C1 — Advanced', desc: 'Demanding texts, flexible language use, nuanced expression.', available: false },
  { key: 'C2', name: 'C2 — Proficiency', desc: 'Near-native comprehension and expression in any situation.', available: false },
]

export function CEFRLevels({ onSelectLevel, onBack }: { onSelectLevel: (level: string) => void; onBack: () => void }) {
  return (
    <div className="theme-overview mx-auto max-w-4xl bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <button onClick={onBack} className="mb-3 text-[12.5px] font-semibold text-muted transition hover:text-ink">
          ← Back to programs
        </button>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">CEFR — General English</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Choose your level</h2>
        <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
          Six levels from beginner to proficiency. A1 is available now.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((lv) => (
          <Card
            key={lv.key}
            className={cn(
              'transition',
              lv.available ? 'hover:border-primary/40 hover:shadow-md cursor-pointer' : 'opacity-60',
            )}
          >
            <CardBody className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight">{lv.name}</h3>
                  <p className="mt-1 text-[12.5px] text-muted">{lv.desc}</p>
                </div>
                {lv.available ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-muted" />
                )}
              </div>
              <div className="mt-3">
                {lv.available ? (
                  <Button onClick={() => onSelectLevel(lv.key)} size="sm" className="w-full">
                    Open {lv.key} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed border-line bg-bg/60 px-3 py-1.5 text-center text-[12px] text-muted">
                    Coming soon
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}