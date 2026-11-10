import { LessonView } from './LessonView'
import { L10_META, L10_LEVEL1_VOCAB, L10_LEVEL2_VOCAB, L10_LEVEL1_EXERCISES, L10_LEVEL2_EXERCISES, L10_LEVEL1_DICTATION, L10_LEVEL2_DICTATION, L10_LEVEL1_PRONUNCIATION, L10_LEVEL2_PRONUNCIATION } from '../data/l10'
import type { LessonData } from './LessonView'

export function LessonL10({ onBack, initialLevel }: { onBack: () => void; initialLevel?: 1 | 2 }) {
  const data = {
    title: L10_META.title,
    subtitle: L10_META.subtitle,
    description: L10_META.description,
    level1: { vocab: L10_LEVEL1_VOCAB, exercises: L10_LEVEL1_EXERCISES as any, dictation: L10_LEVEL1_DICTATION, pronunciation: L10_LEVEL1_PRONUNCIATION },
    level2: { vocab: L10_LEVEL2_VOCAB, exercises: L10_LEVEL2_EXERCISES as any, dictation: L10_LEVEL2_DICTATION, pronunciation: L10_LEVEL2_PRONUNCIATION },
  } as LessonData
  return <LessonView data={data} onBack={onBack} initialLevel={initialLevel} />
}
