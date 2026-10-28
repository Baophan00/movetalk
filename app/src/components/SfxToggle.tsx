import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sfxEnabled, toggleSfx } from '../lib/sfx'
import { cn } from '../lib/utils'

/** One switch for interface sounds. The English audio has its own controls and is never touched here. */
export function SfxToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(sfxEnabled)

  return (
    <button
      type="button"
      onClick={() => setOn(toggleSfx())}
      aria-pressed={on}
      aria-label={on ? 'Turn answer sounds off' : 'Turn answer sounds on'}
      title={on ? 'Answer sounds on' : 'Answer sounds off'}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-xl border transition',
        on
          ? 'border-primary/30 bg-primary-soft text-primary'
          : 'border-line/80 bg-surface/70 text-muted hover:text-ink',
        className,
      )}
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}
