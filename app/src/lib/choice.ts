/**
 * One vocabulary of states for every answer control in the app: a quiz option, a matching tile,
 * a self-check button. Screens keep their own layout classes, but the colour meaning never drifts.
 */
export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted'

const ring = 'ring-1 ring-inset'

export const CHOICE: Record<ChoiceState, string> = {
  idle: 'border-line bg-surface text-ink hover:border-primary/45 hover:bg-primary-soft/40',
  selected: `border-primary bg-primary-soft text-ink ${ring} ring-primary/35`,
  correct: `border-ok bg-ok/10 text-ink ${ring} ring-ok/30`,
  wrong: `border-danger bg-danger/10 text-ink ${ring} ring-danger/35`,
  muted: 'border-line bg-surface text-muted opacity-60',
}

/** Picks the state from the answer result so a screen cannot show "selected" and "wrong" at once. */
export function choiceState({
  isChosen,
  isCorrect,
  revealed,
  locked,
}: {
  isChosen: boolean
  isCorrect: boolean
  revealed: boolean
  locked?: boolean
}): ChoiceState {
  if (revealed && isCorrect) return 'correct'
  if (revealed && isChosen) return 'wrong'
  if (isChosen) return 'selected'
  if (locked) return 'muted'
  return 'idle'
}
