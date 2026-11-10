/* auto-generated index for teacher lessons */
export type { TeachTurn } from './l01'
export type { TeachSlide } from './l01'
export type { TeachSection } from './l01'
import { TEACH_L01 } from './l01'
import { TEACH_L02 } from './l02'
import { TEACH_L03 } from './l03'
import { TEACH_L04 } from './l04'
import { TEACH_L05 } from './l05'
import { TEACH_L06 } from './l06'
import { TEACH_L07 } from './l07'
import { TEACH_L08 } from './l08'
import { TEACH_L09 } from './l09'
import { TEACH_L10 } from './l10'

export const TEACH_LESSONS = [
  TEACH_L01,
  TEACH_L02,
  TEACH_L03,
  TEACH_L04,
  TEACH_L05,
  TEACH_L06,
  TEACH_L07,
  TEACH_L08,
  TEACH_L09,
  TEACH_L10,
] as const

export type TeachLessonData = (typeof TEACH_LESSONS)[number]
