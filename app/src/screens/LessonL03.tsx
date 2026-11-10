import { LessonView } from './LessonView'
import { L03_META, L03_LEVEL1_VOCAB, L03_LEVEL2_VOCAB, L03_LEVEL1_EXERCISES, L03_LEVEL2_EXERCISES, L03_LEVEL1_DICTATION, L03_LEVEL2_DICTATION, L03_LEVEL1_PRONUNCIATION, L03_LEVEL2_PRONUNCIATION } from '../data/l03'
import type { LessonData } from './LessonView'

export function LessonL03({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L03_META.title,
    subtitle: L03_META.subtitle,
    description: L03_META.description,
    level1: { vocab: L03_LEVEL1_VOCAB, exercises: L03_LEVEL1_EXERCISES as any, dictation: L03_LEVEL1_DICTATION, pronunciation: L03_LEVEL1_PRONUNCIATION },
    level2: { vocab: L03_LEVEL2_VOCAB, exercises: L03_LEVEL2_EXERCISES as any, dictation: L03_LEVEL2_DICTATION, pronunciation: L03_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
