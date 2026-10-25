import { FileText, Headphones, Search } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Button } from '../components/ui/button'

type Props = { onBack: () => void }

export function Library({ onBack }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Review</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Look it up while you talk</h2>
        <p className="mt-1 text-[13px] text-muted">Sentence patterns, grammar tables and the audio for every lesson, in one place.</p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <Search className="h-[18px] w-[18px]" />
          </span>
          <p className="min-w-0 flex-1 text-[13px] text-muted">Search by English sentence or Vietnamese meaning. Opens with each lesson lookup.</p>
          <Button variant="outline" size="sm" disabled>
            In progress
          </Button>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { icon: FileText, title: 'Grammar tables', body: 'The tables used across the 10 A1 lessons.', tone: 'bg-[#dfd7fb]' },
          { icon: Headphones, title: 'Audio', body: '548 sentences with audio, replay any time.', tone: 'bg-[#fde3c6]' },
        ].map(({ icon: Icon, title, body, tone }) => (
          <div key={title} className={`card-hover rounded-2xl p-4 shadow-card ${tone}`}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/45 text-ink">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold text-ink">{title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{body}</p>
          </div>
        ))}
      </div>

      <button onClick={onBack} className="mt-6 text-[12.5px] text-muted hover:text-ink">
        ← back to overview
      </button>
    </div>
  )
}
