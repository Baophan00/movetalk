import { useEffect, useState } from 'react'
import { Sidebar, type Route } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Landing } from './screens/Landing'
import { Dashboard } from './screens/Dashboard'
import { Lesson } from './screens/Lesson'
import { Homework } from './screens/Homework'
import { Library } from './screens/Library'
import { Button } from './components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog'
import { Input } from './components/ui/input'

type User = { name: string; email: string }

const USER_KEY = 'mt2_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(loadUser)
  const [route, setRoute] = useState<Route>(() => (loadUser() ? 'dashboard' : 'landing'))
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
    const next: User = { name: (name.trim() || clean.split('@')[0]).replace(/^./, (c) => c.toUpperCase()), email: clean }
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

  if (!user && route === 'landing') {
    return (
      <>
        <Landing onStart={() => setSignIn(true)} onOpenLesson={() => setSignIn(true)} />
        <SignInDialog open={signIn} onOpenChange={setSignIn} email={email} setEmail={setEmail} name={name} setName={setName} onSubmit={doSignIn} />
      </>
    )
  }

  const title =
    route === 'dashboard' ? 'Tổng quan' : route === 'lesson' ? `Bài ${lessonN}` : route === 'homework' ? 'Bài tập' : 'Tài liệu'

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        route={route}
        onNav={go}
        open={menu}
        onClose={() => setMenu(false)}
        user={user!}
        onSignOut={signOut}
        done={1}
      />
      <div className="lg:pl-[268px]">
        <TopBar
          title={title}
          crumb={route === 'lesson' ? 'Lộ trình · A1' : undefined}
          onMenu={() => setMenu(true)}
          right={
            <Button variant="soft" size="sm" className="hidden sm:inline-flex" onClick={() => openLesson(lessonN)}>
              Học tiếp
            </Button>
          }
        />
        <main key={route + lessonN} className="animate-fade-up">
          {route === 'dashboard' && (
            <Dashboard name={user!.name} onOpenLesson={openLesson} onHomework={() => go('homework')} />
          )}
          {route === 'lesson' && <Lesson lessonN={lessonN} onPickLesson={setLessonN} onBack={() => go('dashboard')} />}
          {route === 'homework' && <Homework onBack={() => openLesson(lessonN)} hasBackend={false} />}
          {route === 'library' && <Library onBack={() => go('dashboard')} />}
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
        <DialogTitle>Vào học</DialogTitle>
        <DialogDescription>Nhập email để lưu tiến độ trên máy này. Chưa cần mật khẩu.</DialogDescription>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Tên gọi</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minh Anh" autoFocus />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" type="email" required />
          </label>
          <Button className="w-full" type="submit" disabled={!email.includes('@')}>
            Vào học
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
