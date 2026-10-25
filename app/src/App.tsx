import { useEffect, useState } from 'react'
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

type User = { name: string; email: string; role: Role }

const USER_KEY = 'mt2_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    return { ...parsed, role: parsed.role === 'teacher' ? 'teacher' : 'student' }
  } catch {
    return null
  }
}

const TEACHER_ROUTES: Route[] = ['t-overview', 't-schedule', 't-students', 't-assignments']
const FIRST_TEACHER: Route = 't-overview'

export default function App() {
  const [user, setUser] = useState<User | null>(loadUser)
  const [route, setRoute] = useState<Route>(() => (loadUser()?.role === 'teacher' ? FIRST_TEACHER : loadUser() ? 'dashboard' : 'landing'))
  const [lessonN, setLessonN] = useState(1)
  const [menu, setMenu] = useState(false)
  const [signIn, setSignIn] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!user && route !== 'landing') setRoute('landing')
  }, [user, route])

  const go = (r: Route) => {
    if (!user && r !== 'landing') {
      setSignIn(true)
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

  const doSignIn = () => {
    const clean = email.trim().toLowerCase()
    if (!clean.includes('@')) return
    const next: User = {
      name: (name.trim() || clean.split('@')[0]).replace(/^./, (c) => c.toUpperCase()),
      email: clean,
      role: 'student',
    }
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setUser(next)
    setSignIn(false)
    setRoute('dashboard')
  }

  const signOut = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setRoute('landing')
  }

  const switchRole = () => {
    if (!user) return
    const role: Role = user.role === 'teacher' ? 'student' : 'teacher'
    const next = { ...user, role }
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setUser(next)
    setRoute(role === 'teacher' ? FIRST_TEACHER : 'dashboard')
  }

  if (!user || route === 'landing') {
    return (
      <>
        <Landing onStart={() => setSignIn(true)} onOpenLesson={() => setSignIn(true)} />
        <SignInDialog
          open={signIn}
          onOpenChange={setSignIn}
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          onSubmit={doSignIn}
        />
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

  const isTeacher = TEACHER_ROUTES.includes(route)

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        role={user.role}
        route={route}
        onNav={go}
        open={menu}
        onClose={() => setMenu(false)}
        user={user}
        onSignOut={signOut}
        onSwitchRole={switchRole}
        done={A1.filter((l) => partsSeen(l.n).length > 0).length}
        total={A1.length}
      />
      <div className="lg:pl-[264px]">
        <TopBar
          title={titles[route] || 'MOVE'}
          crumb={route === 'lesson' ? 'Level A1' : isTeacher ? 'Teacher' : undefined}
          onMenu={() => setMenu(true)}
          right={
            !isTeacher && (
              <Button variant="soft" size="sm" className="hidden sm:inline-flex" onClick={() => openLesson(lessonN)}>
                Continue
              </Button>
            )
          }
        />
        <main key={route + lessonN} className="animate-fade-up">
          {route === 'dashboard' && (
            <Dashboard name={user.name} onOpenLesson={openLesson} onHomework={() => go('homework')} />
          )}
          {route === 'lesson' && <Lesson lessonN={lessonN} onPickLesson={setLessonN} onBack={() => go('dashboard')} />}
          {route === 'homework' && <Homework onBack={() => openLesson(lessonN)} hasBackend={false} />}
          {route === 'library' && <Review />}
          {route === 't-overview' && <TeacherOverview />}
          {route === 't-schedule' && <TeacherSchedule />}
          {route === 't-students' && <TeacherStudents />}
          {route === 't-assignments' && <TeacherAssignments />}
        </main>
      </div>
    </div>
  )
}

function SignInDialog({
  open,
  onOpenChange,
  email,
  setEmail,
  name,
  setName,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  email: string
  setEmail: (v: string) => void
  name: string
  setName: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Sign in</DialogTitle>
        <DialogDescription>Enter an email to keep your progress on this device. No password yet.</DialogDescription>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Display name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minh Anh" autoFocus />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" required />
          </label>
          <Button className="w-full" type="submit" disabled={!email.includes('@')}>
            Continue
          </Button>
        </form>
        <p className="mt-3 text-[11px] text-muted">You can switch between the student and teacher view once inside.</p>
      </DialogContent>
    </Dialog>
  )
}
