/**
 * One colour per student in the timetable. Twelve earthy tints of the same cream-and-sage family the
 * rest of the app uses, so a roster of twelve never repeats a colour and no block fights the page.
 * Text and the left edge are always a deeper shade of the same family, so a block stays readable.
 */

export type Tone = { bg: string; edge: string; text: string; hover: string }

export const MACARON: Tone[] = [
  { bg: '#DCE7DA', edge: '#8FAE92', text: '#33503C', hover: '#D2DFCF' }, // sage
  { bg: '#EFDCCB', edge: '#C79A73', text: '#6F4A21', hover: '#E6D1BE' }, // clay
  { bg: '#D8E6E4', edge: '#86AAA6', text: '#2C504E', hover: '#CCDFDD' }, // sea
  { bg: '#F3E6C6', edge: '#D6B36A', text: '#6B4E12', hover: '#EDDCB5' }, // honey
  { bg: '#E7E3D8', edge: '#B3AC98', text: '#4C4535', hover: '#DFDACD' }, // stone
  { bg: '#EFD5CB', edge: '#C98872', text: '#7A3F2C', hover: '#E8C9BE' }, // terracotta
  { bg: '#E4E7CE', edge: '#A9AE7C', text: '#4A5327', hover: '#DBDFC1' }, // olive
  { bg: '#DDE4EC', edge: '#93A8C0', text: '#33455C', hover: '#D2DCE7' }, // powder
  { bg: '#F0E9D2', edge: '#C9B98A', text: '#5C4E24', hover: '#E9E0C4' }, // wheat
  { bg: '#ECD8D6', edge: '#C0918C', text: '#6E3A36', hover: '#E4CCCA' }, // rosewood
  { bg: '#D9E4D6', edge: '#8AA585', text: '#36503A', hover: '#CDDBC9' }, // moss
  { bg: '#EAE0CE', edge: '#C0AC8B', text: '#55452A', hover: '#E2D6C0' }, // sand
]

/** One colour per student, decided by their place in the roster, so it never shifts between screens. */
export function toneForIndex(index: number): Tone {
  const n = MACARON.length
  return MACARON[((index % n) + n) % n]
}

export function toneMap(students: { id: string }[]): Record<string, Tone> {
  const map: Record<string, Tone> = {}
  students.forEach((s, i) => {
    map[s.id] = toneForIndex(i)
  })
  return map
}
