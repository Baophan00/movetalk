import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Sidebar, type Role, type Route } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Landing } from './screens/Landing'
import { Dashboard } from './screens/Dashboard'
import { Lesson } from './screens/Lesson'
import { Homework } from './screens/Homework'
import { Review } from './screens/Review'
import { TeacherOverview, TeacherSchedule, TeacherStudents } from './screens/Teacher'
import { TeacherAssignments } from './screens/TeacherAssignments'
import { Button } from './components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog'
import { Input } from './components/ui/input'
import { A1 } from './lib/curriculum'
import { partsSeen } from './lib/progress'
import { pullProgress } from './lib/sync'
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
    setProfile(next)
    setView(next.role === 'teacher' ? 'teacher' : 'student')
    setRoute(next.role === 'teacher' ? FIRST_TEACHER : 'dashboard')
    setBooting(false)
  }, [])

  useEffect(() => {
    let alive = true
    currentSession().then((session) => {
      if (alive) void applySession(session)
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
      setRoute('dashboard')
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

  const openReview = (n: number) => {
    setQuizLesson(n)
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
    setRoute(next === 'teacher' ? FIRST_TEACHER : 'dashboard')
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
    lesson: `Lesson ${lessonN}`,
    homework: 'Homework',
    library: 'Review',
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
        onSignOut={doSignOut}
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
            !TEACHER_ROUTES.includes(route) && (
              <Button variant="soft" size="sm" className="hidden sm:inline-flex" onClick={() => openLesson(lessonN)}>
                Continue
              </Button>
            )
          }
        />
        <main key={route + lessonN} className="animate-fade-up">
          {route === 'dashboard' && (
            <Dashboard name={profile.name} onOpenLesson={openLesson} onHomework={() => go('homework')} />
          )}
          {route === 'lesson' && <Lesson lessonN={lessonN} onPickLesson={setLessonN} onBack={() => go('dashboard')} />}
          {route === 'homework' && (
            <Homework
              onOpenReview={openReview}
              onOpenLesson={openLesson}
              hasBackend={profile.role === 'teacher'}
            />
          )}
          {route === 'library' && <Review initialLesson={quizLesson ?? undefined} />}
          {route === 't-overview' && <TeacherOverview />}
          {route === 't-schedule' && <TeacherSchedule />}
          {route === 't-students' && <TeacherStudents />}
          {route === 't-assignments' && <TeacherAssignments />}
        </main>
      </div>
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
