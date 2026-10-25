import { BookOpen, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

type Props = { onBack: () => void; hasBackend: boolean }

export function Homework({ onBack, hasBackend }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Homework</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Work from your teacher</h2>
        <p className="mt-1 text-[13px] text-muted">Submissions are graded against criteria, not just right or wrong.</p>
      </div>

      <Card className="border-[#ded4fb] bg-[#f3efff]">
        <CardBody className="py-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-[#7a5cf0] shadow-card">
            <BookOpen className="h-[22px] w-[22px]" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">Nothing assigned yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">
            When your teacher assigns work you will see the lesson, the due date and where to submit it. Until then, carry on with the open lesson.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onBack}>Continue learning</Button>
            <Badge tone={hasBackend ? 'ok' : 'neutral'}>
              <Clock className="h-3 w-3" /> {hasBackend ? 'classroom connected' : 'self-study mode'}
            </Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
