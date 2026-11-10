import { LessonView } from './LessonView'
import { L01_META, L01_LEVEL1_VOCAB, L01_LEVEL2_VOCAB, L01_LEVEL1_EXERCISES, L01_LEVEL2_EXERCISES, L01_LEVEL1_DICTATION, L01_LEVEL2_DICTATION, L01_LEVEL1_PRONUNCIATION, L01_LEVEL2_PRONUNCIATION } from '../data/l01'
import type { LessonData } from './LessonView'

export function LessonL01({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L01_META.title,
    subtitle: L01_META.subtitle,
    description: L01_META.description,
    level1: { vocab: L01_LEVEL1_VOCAB, exercises: L01_LEVEL1_EXERCISES as any, dictation: L01_LEVEL1_DICTATION, pronunciation: L01_LEVEL1_PRONUNCIATION },
    level2: { vocab: L01_LEVEL2_VOCAB, exercises: L01_LEVEL2_EXERCISES as any, dictation: L01_LEVEL2_DICTATION, pronunciation: L01_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
