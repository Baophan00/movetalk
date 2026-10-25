import map from '../content/audio-map.json'

const table = map as Record<string, string>

let current: HTMLAudioElement | null = null

export function clipFor(text: string): string | undefined {
  const rel = table[text]
  return rel ? '/' + rel : undefined
}

/** One voice at a time: a learner tapping a second line should never hear two. */
export function speak(text: string, onDone?: () => void) {
  const src = clipFor(text)
  if (!src) return false
  if (current) {
    current.pause()
    current = null
  }
  const el = new Audio(src)
  current = el
  el.onended = () => {
    current = null
    onDone?.()
  }
  void el.play()
  return true
}

export function hasAudio(text: string) {
  return Boolean(table[text])
}
