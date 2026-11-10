import { LessonView } from './LessonView'
import { L02_META, L02_LEVEL1_VOCAB, L02_LEVEL2_VOCAB, L02_LEVEL1_EXERCISES, L02_LEVEL2_EXERCISES, L02_LEVEL1_DICTATION, L02_LEVEL2_DICTATION, L02_LEVEL1_PRONUNCIATION, L02_LEVEL2_PRONUNCIATION } from '../data/l02'
import type { LessonData } from './LessonView'

export function LessonL02({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L02_META.title,
    subtitle: L02_META.subtitle,
    description: L02_META.description,
    level1: { vocab: L02_LEVEL1_VOCAB, exercises: L02_LEVEL1_EXERCISES as any, dictation: L02_LEVEL1_DICTATION, pronunciation: L02_LEVEL1_PRONUNCIATION },
    level2: { vocab: L02_LEVEL2_VOCAB, exercises: L02_LEVEL2_EXERCISES as any, dictation: L02_LEVEL2_DICTATION, pronunciation: L02_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
