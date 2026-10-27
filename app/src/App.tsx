import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { cn } from './lib/utils'
import { MobileTabs } from './components/MobileTabs'
import { Sidebar, type Role, type Route } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Landing } from './screens/Landing'
import { Dashboard } from './screens/Dashboard'
import { Lesson } from './screens/Lesson'
import { Lessons } from './screens/Lessons'
import { Homework } from './screens/Homework'
import { Review } from './screens/Review'
import { Practice } from './screens/Practice'
import { Profile as ProfileScreen } from './screens/Profile'
import { Today } from './screens/Today'
import { Study } from './screens/Study'
import { Progress } from './screens/Progress'
import { Vocabulary } from './screens/Vocabulary'
import { Mistakes } from './screens/Mistakes'
import { TeacherOverview, TeacherSchedule, TeacherStudents } from './screens/Teacher'
import { TeacherAssignments } from './screens/TeacherAssignments'
import { Button } from './components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog'
import { Input } from './components/ui/input'
import { A1 } from './lib/curriculum'
import { partsSeen } from './lib/progress'
import { pullProgress } from './lib/sync'
import { pullUnlocks } from './lib/unlockSync'
import { supabase } from './lib/supabase'
import { currentSession, loadProfile, signIn, signOut, signUp, type Profile } from './lib/auth'

const TEACHER_ROUTES: Route[] = ['t-overview', 't-schedule', 't-students', 't-assignments']
const FIRST_TEACHER: Route = 't-overview'

/** UX gate only. The authorization is the profiles table plus RLS on the server. */
function allowed(route: Route, role: Role): boolean {
  return role === 'teacher' || !TEACHER_ROUTES.includes(route)
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [booting, setBooting] = useState(true)
  const [route, setRoute] = useState<Route>('landing')
  const [view, setView] = useState<Role>('student')
  const [lessonN, setLessonN] = useState(1)
  const [quizLesson, setQuizLesson] = useState<number | null>(null)
  const [practiceTab, setPracticeTab] = useState<'quiz' | 'words' | 'build' | 'listen' | 'speak'>('quiz')
  // Where Practice your way should open when another screen sends the learner there.
  const [studySeed, setStudySeed] = useState<{ level?: 'A1' | 'A2' | 'B1' | 'B2'; room?: 'listen' | 'read' | 'write' | 'speak'; prompt?: string }>({})
  const [practiceN, setPracticeN] = useState(1)
  const [autoReview, setAutoReview] = useState(0)
  const [menu, setMenu] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

  const applySession = useCallback(async (session: Session | null) => {
    if (!session) {
      setProfile(null)
      setBooting(false)
      return
    }
    const next = await loadProfile(session)
    await pullProgress().catch(() => undefined)
    await pullUnlocks().catch(() => undefined)
    setProfile(next)
    setView(next.role === 'teacher' ? 'teacher' : 'student')
    setRoute(next.role === 'teacher' ? FIRST_TEACHER : 'today')
    setBooting(false)
  }, [])

  useEffect(() => {
    let alive = true
    // Dev-only shortcut so the teacher screens can be exercised without a live teacher login.
    // import.meta.env.DEV is false in the production build, so this never ships.
    if (import.meta.env.DEV && localStorage.getItem('mt2_dev_teacher')) {
      setProfile({ id: 'dev', email: 'dev@local', name: 'Dev Teacher', role: 'teacher' })
      setView('teacher')
      setRoute(FIRST_TEACHER)
      setBooting(false)
      return () => {
        alive = false
      }
    }
    // A phone with no signal must not sit on the splash screen: after a short wait we show
    // the local app instead of waiting for a session that cannot arrive.
    // The session lives in localStorage, so it arrives instantly even offline; the profile read
    // behind it does not. The timer therefore runs until the app is actually on screen.
    const fallback = window.setTimeout(() => {
      if (!alive) return
      setProfile(null)
      setBooting(false)
    }, 2500)
    currentSession()
      .then(async (session) => {
        if (!alive) return
        await applySession(session)
        window.clearTimeout(fallback)
      })
      .catch(() => {
        window.clearTimeout(fallback)
        if (alive) void applySession(null)
      })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      // Keep the boot path from overwriting a role read that is already in flight.
      void applySession(session)
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [applySession])

  const go = (r: Route) => {
    if (!profile) {
      setSignInOpen(true)
      return
    }
    if (!allowed(r, profile.role)) {
      setRoute('today')
      setMenu(false)
      return
    }
    setRoute(r)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }

  const openLesson = (n: number) => {
    setLessonN(n)
    go('lesson')
  }

  const openPractice = (n: number) => {
    setPracticeN(n)
    setPracticeTab('quiz')
    go('practice')
  }

  const openReview = (n: number, auto = false) => {
    setQuizLesson(n)
    setAutoReview(auto ? Date.now() : 0)
    go('library')
  }

  const doSignOut = async () => {
    await signOut()
    setProfile(null)
    setRoute('landing')
  }

  const switchView = () => {
    if (!profile || profile.role !== 'teacher') return
    const next: Role = view === 'teacher' ? 'student' : 'teacher'
    setView(next)
    setRoute(next === 'teacher' ? FIRST_TEACHER : 'today')
  }

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Opening MOVE…
        </div>
      </div>
    )
  }

  if (!profile || route === 'landing') {
    return (
      <>
        <Landing onStart={() => setSignInOpen(true)} onOpenLesson={() => setSignInOpen(true)} signedIn={Boolean(profile)} onContinue={() => go(view === 'teacher' ? FIRST_TEACHER : 'dashboard')} />
        <AuthDialog open={signInOpen} onOpenChange={setSignInOpen} onDone={() => setSignInOpen(false)} />
      </>
    )
  }

  const titles: Record<Route, string> = {
    landing: '',
    dashboard: 'Overview',
    lessons: 'Lessons',
    lesson: `Lesson ${lessonN}`,
    homework: 'Homework',
    today: 'Today',
    study: 'Practice your way',
    progress: 'Progress',
    words: 'My Vocabulary',
    mistakes: 'To redo',
    library: 'Review',
    practice: `Lesson ${practiceN} · Practice`,
    profile: 'Profile',
    't-overview': 'Overview',
    't-schedule': 'Schedule',
    't-students': 'Students',
    't-assignments': 'Assignments',
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        role={view}
        route={route}
        onNav={go}
        open={menu}
        onClose={() => setMenu(false)}
        user={{ name: profile.name, email: profile.email }}
        onSignOut={signOut}
        onSwitchRole={switchView}
        canSwitch={profile.role === 'teacher'}
        done={A1.filter((l) => partsSeen(l.n).length > 0).length}
        total={A1.length}
      />
      <div className="lg:pl-[264px]">
        <TopBar
          title={titles[route] || 'MOVE'}
          crumb={route === 'lesson' ? 'Level A1' : TEACHER_ROUTES.includes(route) ? 'Teacher' : undefined}
          onMenu={() => setMenu(true)}
          right={
            !TEACHER_ROUTES.includes(route) && route !== 'lesson' && route !== 'profile' && route !== 'today' && route !== 'study' && route !== 'progress' && route !== 'words' && route !== 'mistakes' && (
              <Button variant="soft" size="sm" className="hidden sm:inline-flex" onClick={() => openLesson(lessonN)}>
                Continue
              </Button>
            )
          }
        />
        <main key={route + lessonN} className={cn('animate-fade-up', view === 'student' && 'pb-24 lg:pb-0')}>
          {route === 'today' && (
            <Today
              name={profile.name}
              onGo={(r, n) => {
                if (r === 'lesson' && n) setLessonN(n)
                if (r === 'practice' && n) {
                  setPracticeN(n)
                  setPracticeTab(r === 'practice' ? 'speak' : 'quiz')
                }
                go(r)
              }}
            />
          )}
          {route === 'study' && <Study seedLevel={studySeed.level} seedRoom={studySeed.room as never} seedPrompt={studySeed.prompt} />}
          {route === 'mistakes' && (
            <Mistakes
              onGo={(room, level, prompt) => {
                setStudySeed({ room, level: level as never, prompt })
                go('study')
              }}
            />
          )}
          {route === 'progress' && (
            <Progress
              onWords={() => go('words')}
              onGo={(room, level) => {
                setStudySeed({ room, level: level as never })
                go('study')
              }}
            />
          )}
          {route === 'words' && <Vocabulary />}
          {route === 'dashboard' && (
            <Dashboard name={profile.name} onOpenLesson={openPractice} onHomework={() => go('homework')} onLessons={() => go('lessons')} />
          )}
          {route === 'lessons' && <Lessons onPractice={openPractice} onReview={() => go('library')} onHomework={() => go('homework')} />}
          {route === 'lesson' && <Lesson lessonN={lessonN} onPickLesson={setLessonN} onBack={() => go('dashboard')} />}
          {route === 'homework' && (
            <Homework
              onOpenReview={openReview}
              onOpenLesson={openPractice}
              hasBackend={profile.role === 'teacher'}
            />
          )}
          {route === 'library' && <Review initialLesson={quizLesson ?? undefined} autoStart={autoReview} />}
          {route === 'practice' && <Practice lessonN={practiceN} onBack={() => go('lessons')} initialTab={practiceTab} />}
          {route === 'profile' && (
            <ProfileScreen name={profile.name} email={profile.email} role={profile.role} onSignOut={doSignOut} onGo={(r) => go(r)} />
          )}
          {route === 't-overview' && <TeacherOverview onOpenLesson={openLesson} name={profile.name} onGo={go} />}
          {route === 't-schedule' && <TeacherSchedule onOpenLesson={openLesson} />}
          {route === 't-students' && <TeacherStudents onOpenLesson={openLesson} />}
          {route === 't-assignments' && <TeacherAssignments onOpenLesson={openLesson} />}
        </main>
      </div>
      {view === 'student' && <MobileTabs route={route} onNav={go} />}
    </div>
  )
}

function AuthDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Opening the dialog always starts clean, so a failed signup cannot leave the next sign-in on the
  // wrong tab (the "passwords don't match" loop).
  useEffect(() => {
    if (open) {
      setError('')
      setBusy(false)
      setPassword('')
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    setError('')
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (!result.session) {
      setError('Account created. Confirm the email, then sign in.')
      return
    }
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{mode === 'signin' ? 'Sign in' : 'Create your account'}</DialogTitle>
        <DialogDescription>
          {mode === 'signin'
            ? 'Your progress and homework follow the account, on any device.'
            : 'The first account on this classroom becomes the teacher account.'}
        </DialogDescription>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!busy) void submit()
          }}
        >
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">Full name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Phoebe Truong" autoFocus />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" required autoFocus={mode === 'signin'} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Password</span>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" type="password" minLength={6} required />
          </label>
          {error && <p className="rounded-xl bg-[#fde4e1] px-3 py-2 text-[12px] text-[#8a2b22]">{error}</p>}
          <Button className="w-full" type="submit" disabled={busy || !email.includes('@') || password.length < 6}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
          }}
          className="mt-3 text-[12px] font-semibold text-primary"
        >
          {mode === 'signin' ? 'No account yet? Create one' : 'I already have an account'}
        </button>
      </DialogContent>
    </Dialog>
  )
}
