import { LessonView } from './LessonView'
import { L04_META, L04_LEVEL1_VOCAB, L04_LEVEL2_VOCAB, L04_LEVEL1_EXERCISES, L04_LEVEL2_EXERCISES, L04_LEVEL1_DICTATION, L04_LEVEL2_DICTATION, L04_LEVEL1_PRONUNCIATION, L04_LEVEL2_PRONUNCIATION } from '../data/l04'
import type { LessonData } from './LessonView'

export function LessonL04({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L04_META.title,
    subtitle: L04_META.subtitle,
    description: L04_META.description,
    level1: { vocab: L04_LEVEL1_VOCAB, exercises: L04_LEVEL1_EXERCISES as any, dictation: L04_LEVEL1_DICTATION, pronunciation: L04_LEVEL1_PRONUNCIATION },
    level2: { vocab: L04_LEVEL2_VOCAB, exercises: L04_LEVEL2_EXERCISES as any, dictation: L04_LEVEL2_DICTATION, pronunciation: L04_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
