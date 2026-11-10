// iOS/Safari requires audio to be "unlocked" by a user gesture before it can play.
// Without this, play() silently fails on mobile (especially in PWA/standalone mode).
// Call unlockAudio() once on first user interaction.
let unlocked = false

export function unlockAudio() {
  if (unlocked) return
  try {
    const a = new Audio()
    a.setAttribute('playsinline', '')
    a.volume = 0.01
    const p = a.play()
    if (p && typeof p.then === 'function') {
      p.then(() => { a.pause(); a.remove(); unlocked = true })
       .catch(() => {})
    } else {
      unlocked = true
    }
    // Also unlock AudioContext
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (AC) {
      const ctx = new AC()
      if (ctx.state === 'suspended') void ctx.resume()
      ctx.close().catch(() => {})
    }
  } catch {
    // ignore
  }
}
