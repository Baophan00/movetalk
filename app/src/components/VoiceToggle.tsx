import { useEffect, useState } from 'react'
import { getVoice, setVoice, subscribeVoice, type VoiceMode } from '../lib/audio'
import { cn } from '../lib/utils'

/** Switch the American vocabulary voice; the choice persists and affects every speaker. */
export function VoiceToggle() {
  const [voice, setLocal] = useState<VoiceMode>(getVoice())
  useEffect(() => subscribeVoice(() => setLocal(getVoice())), [])

  return (
    <div className="flex items-center rounded-lg border border-line bg-surface/70 p-0.5" title="Vocabulary voice">
      {(['female', 'male'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setVoice(mode)}
          title={mode === 'female' ? 'US female voice' : 'US male voice'}
          className={cn(
            'rounded-md px-2 py-1 text-[11px] font-semibold transition',
            voice === mode ? 'bg-primary-soft text-primary' : 'text-muted hover:text-primary',
          )}
        >
          {mode === 'female' ? 'US F' : 'US M'}
        </button>
      ))}
    </div>
  )
}
