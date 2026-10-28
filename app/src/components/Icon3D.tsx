import { cn } from '../lib/utils'

/**
 * The 3dicons set (Vijay Verma, CC0 1.0) — free for personal and commercial use, no attribution
 * required. Cropped to transparent squares and served from /icons3d. See CREDITS-3dicons.md.
 */
export const ICON_3D = {
  listening: '/icons3d/listening.webp',
  speaking: '/icons3d/speaking.webp',
  reading: '/icons3d/reading.webp',
  writing: '/icons3d/writing.webp',
  chat: '/icons3d/chat.webp',
  target: '/icons3d/target.webp',
  medal: '/icons3d/medal.webp',
  trophy: '/icons3d/trophy.webp',
  calendar: '/icons3d/calendar.webp',
  clock: '/icons3d/clock.webp',
  star: '/icons3d/star.webp',
  streak: '/icons3d/streak.webp',
  done: '/icons3d/done.webp',
  gift: '/icons3d/gift.webp',
  rocket: '/icons3d/rocket.webp',
  hint: '/icons3d/hint.webp',
  audio: '/icons3d/audio.webp',
  video: '/icons3d/video.webp',
  quiz: '/icons3d/quiz.webp',
  puzzle: '/icons3d/puzzle.webp',
  crown: '/icons3d/crown.webp',
  progress: '/icons3d/progress.webp',
  shield: '/icons3d/shield.webp',
  folder: '/icons3d/folder.webp',
  lock: '/icons3d/lock.webp',
} as const

export type Icon3DName = keyof typeof ICON_3D

export function Icon3D({ name, size = 44, className }: { name: Icon3DName; size?: number; className?: string }) {
  return (
    <img
      src={ICON_3D[name]}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('select-none object-contain', className)}
      style={{ width: size, height: size }}
    />
  )
}
