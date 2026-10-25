import { BookOpen, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

type Props = { onBack: () => void; hasBackend: boolean }

export function Homework({ onBack, hasBackend }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Bài tập</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Việc giáo viên giao</h2>
        <p className="mt-1 text-[13px] text-muted">Bài nộp được chấm theo tiêu chí, không phải chỉ đúng sai.</p>
      </div>

      <Card>
        <CardBody className="py-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bg text-primary">
            <BookOpen className="h-[22px] w-[22px]" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">Chưa có bài nào được giao</p>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">
            Khi giáo viên giao bài, bạn sẽ thấy tên bài, hạn nộp và chỗ nộp ngay tại đây. Trong lúc chờ, học tiếp bài đang mở.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onBack}>Học bài tiếp theo</Button>
            <Badge tone={hasBackend ? 'ok' : 'neutral'}>
              <Clock className="h-3 w-3" /> {hasBackend ? 'đã nối lớp học' : 'chế độ tự học'}
            </Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
