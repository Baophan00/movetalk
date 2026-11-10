import { LessonView } from './LessonView'
import { L07_META, L07_LEVEL1_VOCAB, L07_LEVEL2_VOCAB, L07_LEVEL1_EXERCISES, L07_LEVEL2_EXERCISES, L07_LEVEL1_DICTATION, L07_LEVEL2_DICTATION, L07_LEVEL1_PRONUNCIATION, L07_LEVEL2_PRONUNCIATION } from '../data/l07'
import type { LessonData } from './LessonView'

export function LessonL07({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L07_META.title,
    subtitle: L07_META.subtitle,
    description: L07_META.description,
    level1: { vocab: L07_LEVEL1_VOCAB, exercises: L07_LEVEL1_EXERCISES as any, dictation: L07_LEVEL1_DICTATION, pronunciation: L07_LEVEL1_PRONUNCIATION },
    level2: { vocab: L07_LEVEL2_VOCAB, exercises: L07_LEVEL2_EXERCISES as any, dictation: L07_LEVEL2_DICTATION, pronunciation: L07_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
