/**
 * Interface sounds: a short chime when an answer is right, a soft one when it is not, and a longer
 * flourish when a set is finished. Synthesised with Web Audio, so nothing is downloaded, nothing
 * plays before the learner acts, and the same code is the single source of truth for every screen.
 *
 * This is NOT the English audio (see lib/audio.ts). Two systems, two switches.
 */

type Ctx = AudioContext | null

let ctx: Ctx = null
let master: GainNode | null = null
let lastAt = 0
let lastFinish = 0
let muted = readMuted()

const KEY = 'mt2_sfx'

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'off'
  } catch {
    return false
  }
}

export function sfxEnabled(): boolean {
  return !muted
}

/** Returns the new state, so a button can flip its own icon from the return value. */
export function toggleSfx(): boolean {
  muted = !muted
  try {
    localStorage.setItem(KEY, muted ? 'off' : 'on')
  } catch {
    /* private mode: keep the in-memory choice for this session */
  }
  if (muted) stopAll()
  return !muted
}

function ensure(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.16
    master.connect(ctx.destination)
  }
  // Safari and Chrome both start suspended until a gesture; every caller here is a gesture.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

let live: OscillatorNode[] = []

function stopAll() {
  for (const osc of live) {
    try {
      osc.stop()
    } catch {
      /* already stopped */
    }
  }
  live = []
}

/** One note. `at` is seconds from now so notes can be sequenced without timers. */
function note(freq: number, at: number, dur: number, type: OscillatorType = 'sine', level = 1) {
  const c = ensure()
  if (!c || !master) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + at
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(level, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
  osc.connect(gain).connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
  live.push(osc)
  osc.onended = () => {
    live = live.filter((o) => o !== osc)
  }
}

/** Blocks a burst of clicks from stacking sounds on top of each other. */
function ready(gap = 180): boolean {
  const now = Date.now()
  if (now - lastAt < gap) return false
  lastAt = now
  stopAll()
  return true
}

export function playCorrect() {
  if (muted || !ready()) return
  note(784, 0, 0.16, 'sine', 0.9) // G5
  note(1046.5, 0.1, 0.24, 'sine', 0.8) // C6
}

export function playWrong() {
  if (muted || !ready(220)) return
  // Two soft low notes, no buzz: a nudge, not a buzzer.
  note(311.1, 0, 0.16, 'triangle', 0.42) // Eb4
  note(246.9, 0.09, 0.2, 'triangle', 0.34) // B3
}

export function playFinish() {
  // Not gated by `ready`: the last answer often sounds a moment earlier, and the finish chord must
  // still play. Its own timestamp stops a double fire if a screen re-renders.
  if (muted) return
  if (Date.now() - lastFinish < 900) return
  lastFinish = Date.now()
  stopAll()
  note(523.25, 0, 0.18, 'sine', 0.75) // C5
  note(659.25, 0.11, 0.18, 'sine', 0.75) // E5
  note(783.99, 0.22, 0.2, 'sine', 0.8) // G5
  note(1046.5, 0.34, 0.34, 'sine', 0.85) // C6
}
