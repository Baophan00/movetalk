import type { Route } from '../components/Sidebar'

/**
 * The app keeps its screens in React state, so the address bar knew nothing: reloading a lesson
 * dropped the learner on Today, and the browser's Back button left the app altogether. These helpers
 * map a route (plus which lesson or exercise set) to a hash, and back again.
 */

export type Nav = { route: Route; lessonN?: number; practiceN?: number }

const ROUTES: Route[] = [
  'landing',
  'today',
  'study',
  'progress',
  'words',
  'mistakes',
  'dashboard',
  'class-practice',
  'cefr',
  'lessons',
  'lesson',
  'homework',
  'library',
  'review',
  'practice',
  'profile',
  't-overview',
  't-schedule',
  't-students',
  't-assignments',
  't-writing',
]

/**
 * Where each nested screen goes when there is no history to step back through. Tabs are null: they
 * are destinations, not steps, so they never carry a Back button.
 */
export const PARENT: Record<Route, Route | null> = {
  landing: null,
  today: null,
  'class-practice': null,
  cefr: 'class-practice',
  lessons: 'cefr',
  progress: null,
  profile: null,
  't-overview': null,
  study: 'today',
  words: 'progress',
  mistakes: 'today',
  dashboard: 'today',
  lesson: 'lessons',
  homework: 'lessons',
  library: 'lessons',
  review: 'lessons',
  practice: 'lessons',
  't-schedule': 't-overview',
  't-students': 't-overview',
  't-assignments': 't-overview',
  't-writing': 't-overview',
}

/** What the Back button says it returns to. */
export const PARENT_TITLE: Partial<Record<Route, string>> = {
  today: 'Today',
  lessons: 'Class practice',
  progress: 'Progress',
  't-overview': 'Overview',
}

export function hashFor({ route, lessonN, practiceN }: Nav): string {
  if (route === 'lesson') return `#/lesson/${lessonN ?? 1}`
  if (route === 'practice') return `#/practice/${practiceN ?? 1}`
  return `#/${route}`
}

export function parseHash(hash: string): Nav | null {
  const clean = hash.replace(/^#\/?/, '')
  if (!clean) return null
  const [name, value] = clean.split('/')
  if (!ROUTES.includes(name as Route)) return null
  const route = name as Route
  const n = value ? Number(value) : NaN
  if (route === 'lesson') return { route, lessonN: Number.isFinite(n) && n > 0 ? n : 1 }
  if (route === 'practice') return { route, practiceN: Number.isFinite(n) && n > 0 ? n : 1 }
  return { route }
}

/** True when the browser has an in-app step to go back to, so Back never leaves MOVE by accident. */
export function hasAppHistory(): boolean {
  const state = window.history.state as { move?: boolean; depth?: number } | null
  return Boolean(state?.move) && (state?.depth ?? 0) > 0
}
