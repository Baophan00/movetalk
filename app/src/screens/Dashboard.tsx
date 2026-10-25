import { motion } from 'motion/react'
import { ArrowRight, BookOpen, CalendarCheck, Flame, Lock, Play, Sparkles, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress, Ring } from '../components/ui/progress'
import { LESSONS, partsOf } from '../lib/lessons'
import { partsSeen } from '../lib/progress'
import { cn } from '../lib/utils'

type Props = {
  name: string
  onOpenLesson: (n: number) => void
  onHomework: () => void
}

const TRACKS = [
  { key: 'F1', name: 'Dựng câu', count: 50, live: false },
  { key: 'F2', name: 'Kiểm soát thì', count: 50, live: false },
  { key: 'A1', name: 'Bản đồ và chẩn đoán', count: 10, live: true, open: 10 },
  { key: 'A2', name: 'Sửa lỗi ngôn ngữ', count: 50, live: false },
  { key: 'E1', name: 'Mở rộng 1', count: 50, live: false },
  { key: 'E2', name: 'Mở rộng 2', count: 3, live: true, open: 3 },
]

export function Dashboard({ name, onOpenLesson, onHomework }: Props) {
  const next = LESSONS.find((l) => partsSeen(l.n).length < partsOf(l).length) || LESSONS[0]
  const totalParts = partsOf(next).length
  const read = partsSeen(next.n).length
  const percent = totalParts ? Math.round((read / totalParts) * 100) : 0
  const opened = LESSONS.filter((l) => partsSeen(l.n).length > 0).length
  const doneAll = LESSONS.filter((l) => partsSeen(l.n).length >= partsOf(l).length).length
  const partsRead = LESSONS.reduce((n, l) => n + partsSeen(l.n).length, 0)

  const stats = [
    { icon: Flame, label: 'Chuỗi ngày', value: opened ? `${Math.min(opened, 7)}` : '0', hint: 'ngày liên tiếp' },
    { icon: BookOpen, label: 'Phần đã học', value: String(partsRead), hint: `trên ${LESSONS.reduce((n, l) => n + partsOf(l).length, 0)} phần` },
    { icon: Target, label: 'Bài xong', value: String(doneAll), hint: `${LESSONS.length} bài đang mở` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted">Hôm nay</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight sm:text-[30px]">Chào {name.split(' ')[0]},</h2>
        <p className="mt-1 text-[13.5px] text-muted">Một phần mỗi ngày là đủ. Bạn đang ở bài {next.n}.</p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <CardHeader className="pt-6">
            <div>
              <Badge tone="primary">Việc tiếp theo</Badge>
              <CardTitle className="mt-2 text-[17px]">
                Bài {next.n}: {next.title}
              </CardTitle>
              <p className="mt-0.5 text-[12.5px] text-muted">{next.vi}</p>
            </div>
            <div className="relative grid shrink-0 place-items-center">
              <Ring value={percent} size={64} stroke={6} />
              <span className="absolute text-[12px] font-bold">{percent}%</span>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {next.today.slice(0, 4).map((t, i) => (
                <span key={t} className={i > 1 ? 'hidden rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-muted sm:inline' : 'rounded-full bg-bg px-2.5 py-1 text-[11.5px] text-muted'}>
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <Progress value={percent} />
              <p className="mt-1.5 text-[11.5px] text-muted">
                {read}/{totalParts} phần đã mở
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onOpenLesson(next.n)}>
                <Play className="h-4 w-4" /> {read ? 'Học tiếp' : 'Bắt đầu bài này'}
              </Button>
              <Button variant="outline" onClick={onHomework}>
                <BookOpen className="h-4 w-4" /> Bài tập
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ icon: Icon, label, value, hint }) => (
            <Card key={label} className="card-hover">
              <CardBody className="flex items-center gap-3.5 py-3.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[.12em] text-muted">{label}</p>
                  <p className="text-[19px] font-semibold leading-tight">{value}</p>
                  <p className="text-[11px] text-muted">{hint}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Lộ trình</h3>
            <p className="text-[12px] text-muted">Sáu chặng, mở dần từng chặng. Không có bài giả.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11.5px] text-muted sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> A1 và E2 đang mở
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t, i) => {
            const lessons = t.live ? LESSONS.filter((l) => l.n <= (t.key === 'A1' ? 10 : 10)) : []
            const openedHere = lessons.filter((l) => partsSeen(l.n).length > 0).length
            return (
              <motion.div key={t.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }}>
                <button
                  onClick={() => t.live && onOpenLesson(1)}
                  disabled={!t.live}
                  className={cn(
                    'h-full w-full rounded-2xl border p-4 text-left transition-all',
                    t.live ? 'border-line bg-surface shadow-card hover:-translate-y-0.5 hover:shadow-lift' : 'border-dashed border-line/80 bg-bg/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold', t.live ? 'bg-primary-soft text-primary' : 'bg-ink/[.05] text-muted')}>
                      {t.key}
                    </span>
                    {t.live ? (
                      <Badge tone="ok">đang mở</Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                        <Lock className="h-3 w-3" /> sắp mở
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[13.5px] font-semibold text-ink/90">{t.name}</p>
                  <p className="text-[11.5px] text-muted">{t.live ? `${t.open} bài đang mở` : `${t.count} bài đang soạn`}</p>
                  {t.live && (
                    <div className="mt-3">
                      <Progress value={(openedHere / Math.max(1, lessons.length)) * 100} />
                    </div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      </section>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-bg text-primary">
            <CalendarCheck className="h-[19px] w-[19px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Bài tập của giáo viên</p>
            <p className="text-[12px] text-muted">Chưa có bài nào được giao. Khi có, bài sẽ hiện ở đây kèm hạn nộp.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onHomework}>
            Xem trang bài tập <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
