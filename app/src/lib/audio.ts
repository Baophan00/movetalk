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

export function hasAudio(text: string) {
  return Boolean(table[text])
}
