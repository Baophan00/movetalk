import { LessonView } from './LessonView'
import { L05_META, L05_LEVEL1_VOCAB, L05_LEVEL2_VOCAB, L05_LEVEL1_EXERCISES, L05_LEVEL2_EXERCISES, L05_LEVEL1_DICTATION, L05_LEVEL2_DICTATION, L05_LEVEL1_PRONUNCIATION, L05_LEVEL2_PRONUNCIATION } from '../data/l05'
import type { LessonData } from './LessonView'

export function LessonL05({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L05_META.title,
    subtitle: L05_META.subtitle,
    description: L05_META.description,
    level1: { vocab: L05_LEVEL1_VOCAB, exercises: L05_LEVEL1_EXERCISES as any, dictation: L05_LEVEL1_DICTATION, pronunciation: L05_LEVEL1_PRONUNCIATION },
    level2: { vocab: L05_LEVEL2_VOCAB, exercises: L05_LEVEL2_EXERCISES as any, dictation: L05_LEVEL2_DICTATION, pronunciation: L05_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
