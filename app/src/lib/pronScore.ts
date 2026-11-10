/**
 * Chấm phát âm ngay trong trình duyệt, không gọi dịch vụ ngoài.
 *
 * Cách làm: lấy câu người học đọc từ Web Speech API, đổi từng từ sang chuỗi âm vị
 * (CMUdict cho từ thông dụng, luật đọc cho từ lạ), rồi so chuỗi âm với câu mẫu.
 * Kết quả gồm 4 điểm giống thang của Azure: accuracy, fluency, completeness, overall,
 * kèm danh sách từ đọc sai để tô màu.
 */

import RAW from '../data/phonemes.json'

type Dict = Record<string, string[]>
const DICT = RAW as Dict

const IPA: Record<string, string> = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', B: 'b', CH: 'tʃ', D: 'd',
  DH: 'ð', EH: 'e', ER: 'ɝ', EY: 'eɪ', F: 'f', G: 'ɡ', HH: 'h', IH: 'ɪ', IY: 'i',
  JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', OW: 'oʊ', OY: 'ɔɪ', P: 'p',
  R: 'ɹ', S: 's', SH: 'ʃ', T: 't', TH: 'θ', UH: 'ʊ', UW: 'u', V: 'v', W: 'w',
  Y: 'j', Z: 'z', ZH: 'ʒ',
}

const base = (p: string) => p.replace(/[0-2]/g, '')
const isVowel = (p: string) => /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(base(p))

function ipaPhoneme(p: string): string {
  const b = base(p)
  if (b === 'AH' && p.endsWith('0')) return 'ə'
  if (b === 'ER' && p.endsWith('0')) return 'ɚ'
  return IPA[b] ?? b.toLowerCase()
}

export function ipaOf(word: string): string {
  const ph = phonemes(word)
  if (!ph.length) return ''
  const parts = ph.map(ipaPhoneme)
  return `/${parts.join('')}/`
}

/** Đổi chữ sang âm vị. Có trong CMUdict thì dùng, không thì đoán theo mặt chữ. */
export function phonemes(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z']/g, '')
  if (!w) return []
  const hit = DICT[w]
  if (hit) return hit
  return guess(w)
}

/** Luật đọc thô cho từ ngoài từ điển. Chỉ để so âm, không phải phiên âm chuẩn. */
function guess(w: string): string[] {
  const out: string[] = []
  const map: [RegExp, string[]][] = [
    [/^kn/, ['N']], [/^wr/, ['R']], [/^ps/, ['S']],
    [/ough$/, ['AH0']], [/tion$/, ['SH', 'AH0', 'N']], [/sion$/, ['ZH', 'AH0', 'N']],
    [/ture$/, ['CH', 'ER0']], [/ight/, ['AY1', 'T']], [/ing$/, ['IH0', 'NG']],
    [/ed$/, ['D']], [/th/, ['TH']], [/sh/, ['SH']], [/ch/, ['CH']], [/ph/, ['F']],
    [/wh/, ['W']], [/ck/, ['K']], [/ng/, ['NG']], [/qu/, ['K', 'W']],
    [/ee/, ['IY1']], [/ea/, ['IY1']], [/oo/, ['UW1']], [/ou/, ['AW1']],
    [/ow/, ['AW1']], [/ai/, ['EY1']], [/ay/, ['EY1']], [/oa/, ['OW1']],
    [/oi|oy/, ['OY1']], [/ar/, ['AA1', 'R']], [/or/, ['AO1', 'R']],
    [/er|ir|ur/, ['ER0']], [/a/, ['AE1']], [/e/, ['EH1']], [/i/, ['IH1']],
    [/o/, ['AA1']], [/u/, ['AH1']], [/y/, ['IY1']],
    [/b/, ['B']], [/c/, ['K']], [/d/, ['D']], [/f/, ['F']], [/g/, ['G']],
    [/h/, ['HH']], [/j/, ['JH']], [/k/, ['K']], [/l/, ['L']], [/m/, ['M']],
    [/n/, ['N']], [/p/, ['P']], [/r/, ['R']], [/s/, ['S']], [/t/, ['T']],
    [/v/, ['V']], [/w/, ['W']], [/x/, ['K', 'S']], [/z/, ['Z']],
  ]
  let rest = w
  while (rest) {
    let matched = false
    for (const [re, ph] of map) {
      const m = re.exec(rest)
      if (m && m.index === 0) {
        out.push(...ph)
        rest = rest.slice(m[0].length)
        matched = true
        break
      }
    }
    if (!matched) rest = rest.slice(1)
  }
  return out
}

const NEAR: [string, string][] = [
  ['P', 'B'], ['T', 'D'], ['K', 'G'], ['F', 'V'], ['S', 'Z'], ['SH', 'ZH'],
  ['TH', 'DH'], ['CH', 'JH'], ['M', 'N'], ['L', 'R'], ['W', 'V'], ['IH', 'IY'],
  ['EH', 'AE'], ['UH', 'UW'], ['AO', 'OW'], ['AH', 'ER'],
]

function phonemeCost(a: string, b: string): number {
  const x = base(a)
  const y = base(b)
  if (x === y) return 0
  if (NEAR.some(([p, q]) => (p === x && q === y) || (p === y && q === x))) return 0.5
  if (isVowel(x) && isVowel(y)) return 0.6
  return 1
}

/** 0..1 — hai chuỗi âm giống nhau tới đâu. */
function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 0; i <= n; i += 1) dp[i][0] = i
  for (let j = 0; j <= m; j += 1) dp[0][j] = j
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + phonemeCost(a[i - 1], b[j - 1]),
      )
    }
  }
  return Math.max(0, 1 - dp[n][m] / Math.max(n, m))
}

export type PronWord = {
  text: string
  ipa: string
  heard?: string
  score: number
  status: 'good' | 'close' | 'wrong' | 'missing'
}

export type PronResult = {
  overall: number
  accuracy: number
  completeness: number
  fluency: number
  words: PronWord[]
  heard: string
  extra: string[]
  tips: string[]
  wpm?: number
}

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function tokens(s: string): string[] {
  const t = clean(s)
  return t ? t.split(' ') : []
}

function fluencyScore(heardWords: number, durationSec?: number, targetWords?: number): number {
  if (!durationSec || durationSec <= 0 || heardWords < 2) return 60
  const wpm = (heardWords / durationSec) * 60
  let s = 95
  if (wpm < 90) s = 95 - (90 - wpm) * 1.4
  else if (wpm > 155) s = 95 - (wpm - 155) * 1.1
  if (targetWords && heardWords > targetWords * 1.6) s -= 10
  return Math.round(Math.max(30, Math.min(100, s)))
}

/**
 * Chấm một lần đọc.
 * @param target câu mẫu
 * @param heard  những gì trình duyệt nghe được
 * @param durationSec thời gian học sinh nói (để tính nhịp)
 */
export function scoreAttempt(target: string, heard: string, durationSec?: number): PronResult {
  const T = tokens(target)
  const H = tokens(heard)
  const tp = T.map(phonemes)
  const hp = H.map(phonemes)

  const n = T.length
  const m = H.length
  // ghép cặp từ mẫu với từ nghe được sao cho tổng điểm giống âm cao nhất
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      const sim = similarity(tp[i], hp[j])
      dp[i][j] = Math.max(sim + dp[i + 1][j + 1], dp[i + 1][j], dp[i][j + 1])
    }
  }

  const words: PronWord[] = []
  const extra: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    const sim = similarity(tp[i], hp[j])
    if (sim >= 0.45 && sim + dp[i + 1][j + 1] >= dp[i + 1][j] && sim + dp[i + 1][j + 1] >= dp[i][j + 1]) {
      const score = Math.round(sim * 100)
      words.push({
        text: T[i],
        ipa: ipaOf(T[i]),
        heard: H[j],
        score,
        status: score >= 88 ? 'good' : score >= 65 ? 'close' : 'wrong',
      })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      words.push({ text: T[i], ipa: ipaOf(T[i]), score: 0, status: 'missing' })
      i += 1
    } else {
      extra.push(H[j])
      j += 1
    }
  }
  while (i < n) {
    words.push({ text: T[i], ipa: ipaOf(T[i]), score: 0, status: 'missing' })
    i += 1
  }
  while (j < m) {
    extra.push(H[j])
    j += 1
  }

  const said = words.filter((w) => w.status !== 'missing')
  const accuracy = said.length ? Math.round(said.reduce((s, w) => s + w.score, 0) / said.length) : 0
  const completeness = n ? Math.round((said.length / n) * 100) : 0
  const fluency = fluencyScore(m, durationSec, n)
  const overall = Math.round(accuracy * 0.55 + completeness * 0.25 + fluency * 0.2)

  const tips: string[] = []
  const bad = words.filter((w) => w.status === 'wrong').slice(0, 2)
  for (const w of bad) {
    tips.push(`"${w.text}" ${w.ipa}: nghe thành "${w.heard}" — đọc chậm lại và rõ âm cuối.`)
  }
  const miss = words.filter((w) => w.status === 'missing').slice(0, 2)
  if (miss.length) tips.push(`Còn thiếu: ${miss.map((w) => `"${w.text}" ${w.ipa}`).join(', ')}.`)
  if (extra.length) tips.push(`Bạn nói thêm từ không có trong câu: "${extra.slice(0, 3).join('", "')}".`)
  if (fluency < 60) tips.push('Câu bị ngắt quãng, thử nói liền mạch một hơi.')
  if (!tips.length) tips.push('Rõ và đủ từ. Giữ nhịp này khi nói với người thật.')

  return {
    overall,
    accuracy,
    completeness,
    fluency,
    words,
    heard,
    extra,
    tips,
    wpm: durationSec && durationSec > 0 ? Math.round((m / durationSec) * 60) : undefined,
  }
}

/** Chấm một từ, dùng cho thẻ từ vựng. */
export function scoreWord(target: string, heard: string): PronResult {
  return scoreAttempt(target, heard)
}
