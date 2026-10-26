/**
 * The pastel palette taken from the macaron reference. Five colours come straight from it, the rest
 * are neighbouring tints of the same five so a roster of twelve never repeats a colour; text and the
 * left edge are always a deeper shade of the same family so a block stays readable.
 */

export type Tone = { bg: string; edge: string; text: string; hover: string }

export const MACARON: Tone[] = [
  { bg: '#F2D5DA', edge: '#D98C9E', text: '#7C3A46', hover: '#EBC7CE' }, // pink
  { bg: '#BFBFE3', edge: '#8C8CCB', text: '#3F3A6E', hover: '#B3B3DC' }, // lavender
  { bg: '#C4E2E4', edge: '#7FB7BB', text: '#2C5A5E', hover: '#B7DADD' }, // mint
  { bg: '#F3D2C9', edge: '#DB9C86', text: '#7A4432', hover: '#EDC5BA' }, // peach
  { bg: '#F8E3D0', edge: '#D9B285', text: '#6F4E2A', hover: '#F2D9C1' }, // cream
  { bg: '#E7D6EC', edge: '#B38FC9', text: '#5A3A66', hover: '#DEC9E4' }, // rose lilac
  { bg: '#D6E4D4', edge: '#93B58F', text: '#3D5C3A', hover: '#C9DBC7' }, // sage
  { bg: '#D3DFF2', edge: '#86A2CE', text: '#33486B', hover: '#C6D5EE' }, // powder blue
  { bg: '#F6DDC8', edge: '#E0AE86', text: '#7A4B2A', hover: '#EFD2B9' }, // apricot
  { bg: '#E6D8CE', edge: '#B79C88', text: '#5E4736', hover: '#DDCCC0' }, // taupe
  { bg: '#F7EBCB', edge: '#DDBE78', text: '#6B5322', hover: '#F1E1B8' }, // butter
  { bg: '#F2DCE2', edge: '#D6A0AE', text: '#6E3F4A', hover: '#EBD0D8' }, // pink beige
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
