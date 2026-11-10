import { LessonView } from './LessonView'
import { L09_META, L09_LEVEL1_VOCAB, L09_LEVEL2_VOCAB, L09_LEVEL1_EXERCISES, L09_LEVEL2_EXERCISES, L09_LEVEL1_DICTATION, L09_LEVEL2_DICTATION, L09_LEVEL1_PRONUNCIATION, L09_LEVEL2_PRONUNCIATION } from '../data/l09'
import type { LessonData } from './LessonView'

export function LessonL09({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L09_META.title,
    subtitle: L09_META.subtitle,
    description: L09_META.description,
    level1: { vocab: L09_LEVEL1_VOCAB, exercises: L09_LEVEL1_EXERCISES as any, dictation: L09_LEVEL1_DICTATION, pronunciation: L09_LEVEL1_PRONUNCIATION },
    level2: { vocab: L09_LEVEL2_VOCAB, exercises: L09_LEVEL2_EXERCISES as any, dictation: L09_LEVEL2_DICTATION, pronunciation: L09_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
