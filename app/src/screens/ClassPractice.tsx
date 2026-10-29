import { ArrowRight, Clock, Globe, Trophy, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { cn } from '../lib/utils'

type Program = 'cefr' | 'toeic' | 'ielts'

const PROGRAMS: {
  key: Program
  name: string
  fullName: string
  description: string
  icon: typeof Globe
  status: 'available' | 'coming-soon'
  levels?: string[]
  color: string
}[] = [
  {
    key: 'cefr',
    name: 'CEFR',
    fullName: 'General English — CEFR',
    description: 'English for everyday life, work, and study. Six levels from beginner to proficiency.',
    icon: Globe,
    status: 'available',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    color: 'from-primary/15 to-primary/5',
  },
  {
    key: 'toeic',
    name: 'TOEIC',
    fullName: 'TOEIC Preparation',
    description: 'Listening, Reading, Speaking, Writing — depending on the exam format you choose.',
    icon: Trophy,
    status: 'coming-soon',
    color: 'from-accent/15 to-accent/5',
  },
  {
    key: 'ielts',
    name: 'IELTS',
    fullName: 'IELTS Preparation',
    description: 'Listening, Reading, Writing, Speaking — academic and general training.',
    icon: Zap,
    status: 'coming-soon',
    color: 'from-mint/15 to-mint/5',
  },
]

export function ClassPractice({
  onSelectProgram,
}: {
  onSelectProgram: (p: Program) => void
}) {
  return (
    <div className="theme-overview mx-auto max-w-4xl bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Class practice</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Choose your program</h2>
        <p className="mt-1 max-w-[58ch] text-[13px] text-muted">
          Three learning programs. Pick one to start.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMS.map((p) => {
          const Icon = p.icon
          const available = p.status === 'available'
          return (
            <Card
              key={p.key}
              className={cn(
                'relative overflow-hidden transition',
                available ? 'hover:border-primary/40 hover:shadow-md cursor-pointer' : 'opacity-70',
              )}
            >
              <CardBody className="p-5">
                <div className={cn('mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br', p.color)}>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-[18px] font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-0.5 text-[12px] font-medium text-muted">{p.fullName}</p>
                <p className="mt-2 text-[13px] text-ink/80">{p.description}</p>

                {p.levels && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.levels.map((lv) => (
                      <span
                        key={lv}
                        className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary"
                      >
                        {lv}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  {available ? (
                    <Button onClick={() => onSelectProgram(p.key)} className="w-full">
                      Start learning <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-bg/60 px-3 py-2.5">
                      <Clock className="h-4 w-4 text-muted" />
                      <span className="text-[12.5px] font-medium text-muted">Coming soon</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-4 text-[12.5px] text-muted">
        <p>
          <span className="font-semibold text-ink">CEFR</span> is available now with A1 lessons. A2–C2 and TOEIC/IELTS
          programs will be added in later phases.
        </p>
      </div>
    </div>
  )
}