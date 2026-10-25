import { motion } from 'motion/react'
import { ArrowRight, BookOpen, Headphones, Mic, Sparkles, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { LESSONS } from '../lib/lessons'
import { speak } from '../lib/audio'

type Props = { onStart: () => void; onOpenLesson: () => void }

const STEPS = [
  { icon: BookOpen, title: 'Học từ trong câu thật', body: 'Không học từ rời. Mỗi từ đi kèm hai câu bạn dùng được ngay hôm sau.' },
  { icon: Headphones, title: 'Nghe rồi nhắc lại', body: 'Mỗi câu có bản đọc riêng. Nghe, nhắc lại, rồi nghe lại để chỉnh ngữ điệu.' },
  { icon: Mic, title: 'Nói thành việc', body: 'Cuối bài là một nhiệm vụ nói cụ thể, không phải bài tập điền chỗ trống.' },
]

export function Landing({ onStart, onOpenLesson }: Props) {
  const l1 = LESSONS[0]
  const demo = l1.parts.vocab.find((b) => b.t === 'flashcard')
  const cards = demo && demo.t === 'flashcard' ? demo.items.slice(0, 3) : []

  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[15px] font-bold text-white">M</span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">MOVE</span>
            <span className="block text-[11px] text-muted">English bạn dùng được</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onStart}>
          Đăng nhập
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:pt-14">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> {LESSONS.length} bài đang mở · nghe được từng câu
            </span>
            <h1 className="mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[46px] lg:text-[52px]">
              Học tiếng Anh để <span className="relative whitespace-nowrap text-primary">dùng được<svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none"><path d="M2 4c40-3 120-4 196-1" stroke="currentColor" strokeWidth="2.5" fill="none" opacity=".35" /></svg></span> ngay ngày mai.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
              Mỗi bài là một tình huống thật: gặp đồng nghiệp mới, xin lỗi vì trễ hẹn, thương lượng giá. Bạn học câu, nghe câu, rồi nói câu đó trong việc của mình.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onStart}>
                Bắt đầu học <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onOpenLesson}>
                Xem một bài
              </Button>
            </div>
            <p className="mt-5 text-[12px] text-muted">Không cần thẻ tín dụng. Học trên điện thoại là chính.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-3xl border border-line bg-surface p-5 shadow-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Bài 1 · A1</p>
                <p className="mt-0.5 text-[15px] font-semibold">{l1.title}</p>
                <p className="text-[12px] text-muted">{l1.vi}</p>
              </div>
              <span className="rounded-full bg-ok/10 px-2.5 py-1 text-[11px] font-semibold text-ok">đang mở</span>
            </div>

            <div className="mt-4 space-y-2">
              {cards.map((c) => (
                <button
                  key={c.word}
                  onClick={() => speak(c.word)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg/50 px-3.5 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft/40"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-primary shadow-card">
                    <Volume2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{c.word}</span>
                    <span className="block truncate text-[11.5px] text-muted">{c.vi}</span>
                  </span>

                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-bg/60 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Nhiệm vụ cuối bài</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink/80">Nói về một người bạn thích làm việc cùng, và một thói quen bạn không chịu nổi.</p>
            </div>
          </motion.div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3.5 text-[14px] font-semibold">{title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl border border-primary/20 bg-primary p-8 text-white sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-lg">
              <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-white/70">Bắt đầu hôm nay</p>
              <p className="mt-2 text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">20 phút mỗi ngày. Một bài mỗi tuần. Nói được trong một tháng.</p>
            </div>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={onStart}>
              Vào học <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-6xl px-5 text-[11.5px] text-muted sm:px-8">MOVE · học tiếng Anh bằng tình huống thật</p>
      </footer>
    </div>
  )
}
