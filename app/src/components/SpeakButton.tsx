import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { hasAudio, speak } from '../lib/audio'
import { cn } from '../lib/utils'

type Props = {
  text: string
  /** Shown for screen readers and as a hint on hover. */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * A compact speaker for one word or one short sentence. Real sound only: the recorded clip when we
 * have one, otherwise the device voice. It never renders a button that cannot speak.
 */
export function SpeakButton({ text, label, size = 'md', className }: Props) {
  const [busy, setBusy] = useState(false)

  // Stops the highlight if this line unmounts mid-sentence.
  useEffect(() => () => setBusy(false), [])

  const tap = () => {
    setBusy(true)
    const ok = speak(text, () => setBusy(false))
    if (!ok) setBusy(false)
    window.setTimeout(() => setBusy(false), 2500)
  }

  const box = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      onClick={tap}
      aria-label={label ?? `Listen to ${text.slice(0, 40)}`}
      title={hasAudio(text) ? 'Recorded audio' : 'Device voice'}
      className={cn(
        'grid shrink-0 place-items-center rounded-lg border border-line bg-surface/70 text-primary transition hover:bg-primary-soft',
        box,
        busy && 'bg-primary-soft',
        className,
      )}
    >
      <Volume2 className={cn(icon, busy && 'animate-pulse')} />
    </button>
  )
}
