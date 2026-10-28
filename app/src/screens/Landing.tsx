import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen, Headphones, Mic, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { A1 } from '../lib/curriculum'
import { cn } from '../lib/utils'

type Props = { onStart: () => void; onOpenLesson: () => void; signedIn: boolean; onContinue: () => void }

const STEPS = [
  { icon: BookOpen, title: 'Words inside real sentences', body: 'No isolated vocabulary. Every word arrives with two sentences you can use tomorrow.' },
  { icon: Headphones, title: 'Hear it, then repeat it', body: 'Every line has its own recording. Listen, repeat, listen again and fix the rhythm.' },
  { icon: Mic, title: 'Speak for a reason', body: 'Each lesson ends with a concrete speaking task, not a gap-fill drill.' },
]

const HERO = ['/hero/1.jpg', '/hero/2.jpg', '/hero/3.jpg', '/hero/4.jpg']

function LessonPhotos() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % HERO.length), 4000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e6ddfb]">
      {HERO.map((src, n) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={n === 0 ? 'eager' : 'lazy'}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000',
            n === i ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#f3efff] to-transparent" />
      <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
        {HERO.map((src, n) => (
          <button
            key={src}
            onClick={() => setI(n)}
            aria-label={`Photo ${n + 1}`}
            className={cn('h-1.5 rounded-full transition-all', n === i ? 'w-4 bg-primary' : 'w-1.5 bg-primary/30')}
          />
        ))}
      </div>
    </div>
  )
}

export function Landing({ onStart, onOpenLesson, signedIn, onContinue }: Props) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[15px] font-bold text-white">M</span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">MOVE</span>
            <span className="block text-[11px] text-muted">English you can use</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={signedIn ? onContinue : onStart}>
          {signedIn ? 'Open MOVE' : 'Sign in'}
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:pt-14">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> {A1.length} lessons open · every word has audio
            </span>
            <h1 className="mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[46px] lg:text-[52px]">
              English you can <span className="relative whitespace-nowrap text-primary">actually use<svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none"><path d="M2 4c40-3 120-4 196-1" stroke="currentColor" strokeWidth="2.5" fill="none" opacity=".35" /></svg></span> tomorrow.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
              Every lesson is a situation you actually meet: a new colleague, a late apology, a price to negotiate. You learn the sentence, hear it, then say it at work.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onStart}>
                Start learning <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onOpenLesson}>
                See a lesson
              </Button>
            </div>
            <p className="mt-5 text-[12px] text-muted">No card needed. Built for the phone first.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#E2CBA0] shadow-lift"
          >
            <LessonPhotos />
          </motion.div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                'rounded-3xl p-5 shadow-card',
                ['bg-[#dfd7fb]', 'bg-[#fde3c6]', 'bg-[#fbd0ee]'][i % 3],
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/45 text-ink">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3.5 text-[14px] font-semibold text-ink">{title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/60">{body}</p>
            </motion.div>
          ))}
        </section>

        <section className="relative mt-16 overflow-hidden rounded-3xl bg-[#5D7B6F] p-8 text-white sm:p-10">
          <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15" />
          <span className="pointer-events-none absolute bottom-6 right-24 h-8 w-8 rounded-full bg-[#C08A4A]/70" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-lg">
              <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-white/70">Start today</p>
              <p className="mt-2 text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">Twenty minutes a day, one lesson a week, speaking within a month.</p>
            </div>
            <Button size="lg" className="bg-[#2B3A31] text-white hover:bg-[#3A4A3E]" onClick={onStart}>
              Go to class <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-6xl px-5 text-[11.5px] text-muted sm:px-8">MOVE · English through situations you actually meet</p>
      </footer>
    </div>
  )
}
