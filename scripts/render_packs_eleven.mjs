#!/usr/bin/env node
/**
 * Records the A2/B1/B2 practice packs with the same two voices, model and settings as the A1
 * lessons, so a learner hears one course and not two. Writes into the shared audio folder and
 * merges the text→file table the app reads, skipping any clip that is already there.
 *
 *   node --env-file=.env.local scripts/render_packs_eleven.mjs
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APP = resolve(ROOT, 'app')
const CLIPS = resolve(APP, 'public/audio/clips')
const MAP = resolve(APP, 'src/content/audio-map.json')

// Same voices and settings as the A1 pass: consistency beats a newer model here.
const VOICES = {
  A: '4NejU5DwQjevnR6mh3mb', // female
  B: 'UgBBYS2sOqTuMpoF3BR0', // male
}
const MODEL = 'eleven_turbo_v2_5'
const HASH = 'el3'
const SETTINGS = { stability: 0.5, similarityBoost: 0.75, style: 0.2, useSpeakerBoost: true, speed: 0.82 }

const key = (process.env.ELEVENLABS_API_KEY || '').trim()
if (!key) {
  console.error('ELEVENLABS_API_KEY missing — run with: node --env-file=.env.local scripts/render_packs_eleven.mjs')
  process.exit(1)
}

/** packs.ts is data only, so Node can read it directly with type stripping. */
const { PACKS } = await import(`file://${resolve(APP, 'src/content/practice/packs.ts')}`)

/** One job per spoken line: dialogue keeps alternating speakers, the passage gets one voice. */
const only = process.argv[2]
const picked = only ? PACKS.filter((p) => p.id === only) : PACKS
const jobs = []
for (const pack of picked) {
  pack.lines.forEach((text, i) => jobs.push({ text, speaker: i % 2 === 0 ? 'A' : 'B', pack: pack.id }))
  jobs.push({ text: pack.reading.text, speaker: 'A', pack: pack.id })
}

const client = new ElevenLabsClient({ apiKey: key })
const mapping = existsSync(MAP) ? JSON.parse(readFileSync(MAP, 'utf8')) : {}
mkdirSync(CLIPS, { recursive: true })

const name = (voice, text) => createHash('sha1').update(`${HASH}|${voice}|${text}`).digest('hex').slice(0, 12)

let made = 0
let skipped = 0
let chars = 0

for (const [i, job] of jobs.entries()) {
  const voice = VOICES[job.speaker]
  const hash = name(voice, job.text)
  const mp3 = resolve(CLIPS, `${hash}.mp3`)
  const rel = `audio/clips/${hash}.mp3`
  const label = `${String(i + 1).padStart(2, '0')}/${jobs.length} ${job.speaker}`

  if (existsSync(mp3) && statSync(mp3).size >= 800) {
    mapping[job.text] = rel
    skipped += 1
    console.log(`${label} skip`)
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

      // Same short tail of silence as the A1 clips so sentences do not bump into each other.
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', 'apad=pad_dur=0.35', '-c:a', 'libmp3lame', '-b:a', '128k', mp3])
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
  await new Promise((r) => setTimeout(r, 250))
}

writeFileSync(MAP, `${JSON.stringify(mapping, null, 0)}\n`)
console.log(`done: ${made} new, ${skipped} already there, ${chars} characters, ${Object.keys(mapping).length} lines in the table`)
