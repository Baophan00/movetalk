#!/usr/bin/env node
/**
 * Records the ten A1 lesson files (dialogue lines, vocabulary words, example sentences) with the
 * same two voices, model and settings as the earlier passes, merging the text→file table the app
 * reads and skipping clips that already exist.
 *
 *   node --env-file=.env.local scripts/render_lessons_eleven.mjs dialog|words|examples|all
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APP = resolve(ROOT, 'app')
const CLIPS = resolve(APP, 'public/audio/clips')
const MAP = resolve(APP, 'src/content/audio-map.json')
const LESSONS = resolve(APP, 'src/content/a1')

const VOICES = { A: '4NejU5DwQjevnR6mh3mb', B: 'UgBBYS2sOqTuMpoF3BR0' }
const MODEL = 'eleven_turbo_v2_5'
const SETTINGS = { stability: 0.5, similarityBoost: 0.75, style: 0.2, useSpeakerBoost: true, speed: 0.82 }

const key = (process.env.ELEVENLABS_API_KEY || '').trim()
if (!key) {
  console.error('ELEVENLABS_API_KEY missing — run with: node --env-file=.env.local scripts/render_lessons_eleven.mjs')
  process.exit(1)
}

const files = readdirSync(LESSONS).filter((f) => /^L\d\d\.json$/.test(f)).sort()
const lessons = files.map((f) => JSON.parse(readFileSync(resolve(LESSONS, f), 'utf8')))

const mode = process.argv[2] || 'all'
const jobs = []
for (const lesson of lessons) {
  const parts = lesson.parts || {}
  if (mode === 'dialog' || mode === 'all') {
    const speakers = [...new Set((parts.dialogue || []).map((l) => l.who))]
    for (const line of parts.dialogue || []) {
      const first = speakers.indexOf(line.who) === 0
      jobs.push({ text: line.line, speaker: first ? 'A' : 'B' })
    }
  }
  if (mode === 'words' || mode === 'all') {
    for (const v of parts.vocab || []) jobs.push({ text: v.word, speaker: 'A' })
  }
  if (mode === 'examples' || mode === 'all') {
    for (const v of parts.vocab || []) if (v.example) jobs.push({ text: v.example, speaker: 'B' })
  }
}

const seen = new Set()
const unique = jobs.filter((j) => {
  const id = `${j.speaker}|${j.text}`
  if (seen.has(id) || !j.text) return false
  seen.add(id)
  return true
})

const client = new ElevenLabsClient({ apiKey: key })
const mapping = existsSync(MAP) ? JSON.parse(readFileSync(MAP, 'utf8')) : {}
mkdirSync(CLIPS, { recursive: true })

const name = (voice, text) => createHash('sha1').update(`el3|${voice}|${text}`).digest('hex').slice(0, 12)

let made = 0
let skipped = 0
let chars = 0

for (const [i, job] of unique.entries()) {
  const voice = VOICES[job.speaker]
  const hash = name(voice, job.text)
  const mp3 = resolve(CLIPS, `${hash}.mp3`)
  const rel = `audio/clips/${hash}.mp3`
  const label = `${String(i + 1).padStart(3, '0')}/${unique.length}`

  if (existsSync(mp3) && statSync(mp3).size >= 800) {
    mapping[job.text] = rel
    skipped += 1
    continue
  }

  let lastError
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const audio = await client.textToSpeech.convert(voice, {
        text: job.text,
        modelId: MODEL,
        outputFormat: 'mp3_44100_128',
        voiceSettings: SETTINGS,
      })
      const raw = resolve(CLIPS, `${hash}.raw.mp3`)
      writeFileSync(raw, Buffer.from(await new Response(audio).arrayBuffer()))
      if (statSync(raw).size < 800) throw new Error('clip too short')
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', 'apad=pad_dur=0.3', '-c:a', 'libmp3lame', '-b:a', '128k', mp3])
      unlinkSync(raw)
      mapping[job.text] = rel
      chars += job.text.length
      made += 1
      console.log(`${label} ${job.text.slice(0, 60)}`)
      break
    } catch (error) {
      lastError = error
      const status = Number(error?.statusCode ?? error?.status ?? 0)
      if ([429, 500, 502, 503].includes(status) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  if (lastError && !mapping[job.text]) throw lastError
  writeFileSync(MAP, `${JSON.stringify(mapping)}\n`)
  await new Promise((r) => setTimeout(r, 250))
}

writeFileSync(MAP, `${JSON.stringify(mapping)}\n`)
console.log(`done: ${made} new, ${skipped} already there, ${chars} characters, ${Object.keys(mapping).length} lines in the table`)
