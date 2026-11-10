import { LessonView } from './LessonView'
import { L06_META, L06_LEVEL1_VOCAB, L06_LEVEL2_VOCAB, L06_LEVEL1_EXERCISES, L06_LEVEL2_EXERCISES, L06_LEVEL1_DICTATION, L06_LEVEL2_DICTATION, L06_LEVEL1_PRONUNCIATION, L06_LEVEL2_PRONUNCIATION } from '../data/l06'
import type { LessonData } from './LessonView'

export function LessonL06({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L06_META.title,
    subtitle: L06_META.subtitle,
    description: L06_META.description,
    level1: { vocab: L06_LEVEL1_VOCAB, exercises: L06_LEVEL1_EXERCISES as any, dictation: L06_LEVEL1_DICTATION, pronunciation: L06_LEVEL1_PRONUNCIATION },
    level2: { vocab: L06_LEVEL2_VOCAB, exercises: L06_LEVEL2_EXERCISES as any, dictation: L06_LEVEL2_DICTATION, pronunciation: L06_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
