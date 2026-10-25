import { FileText, Headphones, Search } from 'lucide-react'
import { Card, CardBody } from '../components/ui/card'
import { Button } from '../components/ui/button'

type Props = { onBack: () => void }

export function Library({ onBack }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Tài liệu</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight">Tra nhanh khi đang nói</h2>
        <p className="mt-1 text-[13px] text-muted">Mẫu câu, bảng ngữ pháp và bản đọc của từng bài, gom một chỗ.</p>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <Search className="h-[18px] w-[18px]" />
          </span>
          <p className="min-w-0 flex-1 text-[13px] text-muted">Tìm theo câu tiếng Anh hoặc nghĩa tiếng Việt. Sẽ mở cùng bản tra của từng bài.</p>
          <Button variant="outline" size="sm" disabled>
            Đang hoàn thiện
          </Button>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { icon: FileText, title: 'Bảng ngữ pháp', body: 'Các bảng đang dùng trong 10 bài A1.' },
          { icon: Headphones, title: 'Bản đọc', body: '548 câu có giọng đọc, nghe lại bất cứ lúc nào.' },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title} className="card-hover">
            <CardBody>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-bg text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[13.5px] font-semibold">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{body}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <button onClick={onBack} className="mt-6 text-[12.5px] text-muted hover:text-ink">
        ← về tổng quan
      </button>
    </div>
  )
}
