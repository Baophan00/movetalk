// Streak and milestone logic for 30 Days Speaking
// Stores progress in localStorage

const STORAGE_KEY = 'speaking30_progress'
const STREAK_KEY = 'speaking30_streak'

export interface DayProgress {
  day: number
  completed: boolean
  completedAt: string | null
  recordingDuration: number | null
  reflection: string | null
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDay: number | null
  lastCompletedDate: string | null
  completedDays: number[]
}

export function loadProgress(): DayProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    completed: false,
    completedAt: null,
    recordingDuration: null,
    reflection: null,
  }))
}

export function saveProgress(progress: DayProgress[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDay: null,
    lastCompletedDate: null,
    completedDays: [],
  }
}

export function saveStreak(streak: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
}

export function completeDay(day: number, duration: number): StreakData {
  const progress = loadProgress()
  const idx = progress.findIndex(p => p.day === day)
  if (idx >= 0) {
    progress[idx].completed = true
    progress[idx].completedAt = new Date().toISOString()
    progress[idx].recordingDuration = duration
  }
  saveProgress(progress)

  const streak = loadStreak()
  const today = new Date().toISOString().slice(0, 10)
  if (!streak.completedDays.includes(day)) {
    streak.completedDays.push(day)
  }
  // Streak: if last completed was yesterday or today, increment; else reset to 1
  if (streak.lastCompletedDate === today) {
    // already completed today, don't double count
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (streak.lastCompletedDate === yesterday || streak.lastCompletedDate === null) {
      streak.currentStreak += 1
    } else {
      // missed a day - gentle, don't punish: keep streak but don't increment
      // Actually, per spec: "Không bắt học bù" - just start new streak
      streak.currentStreak = 1
    }
  }
  streak.lastCompletedDay = day
  streak.lastCompletedDate = today
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak
  }
  saveStreak(streak)
  return streak
}

export function isMilestone(day: number): boolean {
  return [7, 14, 21, 28, 30].includes(day)
}

export function getMilestoneLabel(day: number): string {
  const labels: Record<number, string> = {
    7: 'Tuần 1 hoàn thành!',
    14: 'Tuần 2 hoàn thành!',
    21: 'Tuần 3 hoàn thành!',
    28: 'Tuần 4 hoàn thành!',
    30: '30 ngày hoàn thành!',
  }
  return labels[day] || ''
}

export function getStreakMessage(streak: StreakData): string {
  if (streak.currentStreak === 0) return 'Bắt đầu hành trình nói tiếng Anh của bạn!'
  if (streak.currentStreak >= 30) return 'Tuyệt vời! Bạn đã hoàn thành 30 ngày!'
  if (streak.currentStreak >= 14) return 'Bạn đang làm rất tốt! Tiếp tục nhé!'
  if (streak.currentStreak >= 7) return 'Tuyệt! Streak 7 ngày! Keep going!'
  if (streak.currentStreak >= 3) return 'Good start! 3 ngày liên tiếp!'
  return 'Hôm nay là ngày bắt đầu. Bạn làm được!'
}
