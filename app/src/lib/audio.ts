import map from '../content/audio-map.json'
import words from '../content/word-audio.json'

// Recorded dialogue lines from the old pass, plus one clip per vocabulary word generated with the
// macOS voice; the sentence table wins if the same key appears in both.
const table = { ...(words as Record<string, string>), ...(map as Record<string, string>) }

let current: HTMLAudioElement | null = null

export function clipFor(text: string): string | undefined {
  const rel = table[text]
  return rel ? '/' + rel : undefined
}

/** One voice at a time: a learner tapping a second line should never hear two. */
/**
 * Recorded clips win; anything without a clip falls back to the browser voice, so a new word is
 * never silent just because the audio pass has not reached it yet.
 */
export function speak(text: string, onDone?: () => void) {
  const src = clipFor(text)
  if (!src) {
    if (!('speechSynthesis' in window)) return false
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 0.95
    utter.onend = () => onDone?.()
    window.speechSynthesis.speak(utter)
    return true
  }
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

/** Play a line at a chosen speed (0.7 = slow). Same one-voice rule as speak(). */
export function playLine(text: string, rate = 1): Promise<void> {
  const src = clipFor(text)
  if (current) {
    current.pause()
    current = null
  }
  if (!src) {
    if (!('speechSynthesis' in window)) return Promise.resolve()
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = Math.max(0.5, rate * 0.95)
    return new Promise((resolve) => {
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      window.speechSynthesis.speak(utter)
    })
  }
  const el = new Audio(src)
  el.playbackRate = rate
  current = el
  return new Promise((resolve) => {
    el.onended = () => {
      current = null
      resolve()
    }
    el.onerror = () => {
      current = null
      resolve()
    }
    void el.play().catch(() => resolve())
  })
}

export function hasAudio(text: string) {
  return Boolean(table[text])
}
