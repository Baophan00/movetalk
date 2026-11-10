import { LessonView } from './LessonView'
import { L08_META, L08_LEVEL1_VOCAB, L08_LEVEL2_VOCAB, L08_LEVEL1_EXERCISES, L08_LEVEL2_EXERCISES, L08_LEVEL1_DICTATION, L08_LEVEL2_DICTATION, L08_LEVEL1_PRONUNCIATION, L08_LEVEL2_PRONUNCIATION } from '../data/l08'
import type { LessonData } from './LessonView'

export function LessonL08({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L08_META.title,
    subtitle: L08_META.subtitle,
    description: L08_META.description,
    level1: { vocab: L08_LEVEL1_VOCAB, exercises: L08_LEVEL1_EXERCISES as any, dictation: L08_LEVEL1_DICTATION, pronunciation: L08_LEVEL1_PRONUNCIATION },
    level2: { vocab: L08_LEVEL2_VOCAB, exercises: L08_LEVEL2_EXERCISES as any, dictation: L08_LEVEL2_DICTATION, pronunciation: L08_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
