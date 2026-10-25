import { BookOpen, ClipboardList, Layers, Upload } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { LESSONS } from '../lib/lessons'

export function TeacherAssignments() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Assignments</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Give work, collect it, grade it</h2>
          <p className="mt-1 text-[13px] text-muted">
            A row here is per student: assigned → submitted → graded → returned. Content stays in the library tab.
          </p>
        </div>
        <Button size="sm">
          <Upload className="h-4 w-4" /> New assignment
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nothing assigned yet</CardTitle>
            <Badge tone="neutral">0 open</Badge>
          </CardHeader>
          <CardBody>
            <div className="rounded-2xl border border-dashed border-line bg-bg/50 px-5 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-primary shadow-card">
                <ClipboardList className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[14px] font-semibold">Pick a lesson, pick a student, set a due date</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">
                Grading is the slowest part of teaching, so a submission opens straight into the next one after you
                score it.
              </p>
              <Button size="sm" className="mt-4">Create the first one</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content library</CardTitle>
            <Badge tone="primary">{LESSONS.length}</Badge>
          </CardHeader>
          <CardBody className="pt-1">
            <p className="text-[12px] text-muted">What you can hand out. Toggle per student, preview as they see it.</p>
            <ul className="mt-3 space-y-1.5">
              {LESSONS.map((l) => (
                <li key={l.n} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-[10px] font-bold text-primary">
                    {String(l.n).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{l.title}</span>
                  <Badge tone="ok">live</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
              <Layers className="h-3 w-3" /> 10 review sheets sit beside these in the same library.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardBody className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg text-primary">
            <BookOpen className="h-[18px] w-[18px]" />
          </span>
          <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-muted">
            Submitted audio and writing will land here with the student's name, the lesson and a play button. Nothing
            waits for you today.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
