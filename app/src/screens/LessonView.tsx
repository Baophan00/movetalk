import { useState, useEffect, useRef } from 'react'
import { Save } from 'lucide-react'
import { addCard } from '../lib/study'
import { scoreAttempt } from '../lib/pronScore'

// ── TYPES ──
export interface VocabItem {
  word: string
  ipa: string
  vi: string
  pos: string
  youglish: string
  examples: { sentence: string; answer: string; vi: string }[]
  usage: string
}

export interface Exercise {
  type: 'mc' | 'tf' | 'typing' | 'matching'
  question: string
  options?: string[]
  answer: string
  explanation: string
  instruction: string
  pairs?: { left: string; right: string }[]
}

export interface DictationItem {
  audio: string
  answer: string
  vi: string
}

export interface PronunciationItem {
  word: string
  ipa: string
  vi: string
}

export interface LessonData {
  title: string
  subtitle: string
  description: string
  level1: { vocab: VocabItem[]; exercises: Exercise[]; dictation: DictationItem[]; pronunciation: PronunciationItem[] }
  level2: { vocab: VocabItem[]; exercises: Exercise[]; dictation: DictationItem[]; pronunciation: PronunciationItem[] }
}

type Level = 1 | 2
type Section = 'vocab' | 'review' | 'dictation' | 'pronunciation' | 'done'

// ── COMPONENT ──
export function LessonView({ data, onBack, initialLevel }: { data: LessonData; onBack: () => void; initialLevel?: 1 | 2 }) {
  const [level, setLevel] = useState<Level>(initialLevel || 1)
  const [section, setSection] = useState<Section>('vocab')

  const levelData = level === 1 ? data.level1 : data.level2
  const vocab = levelData.vocab
  const exercises = levelData.exercises
  const dictation = levelData.dictation
  const pron = levelData.pronunciation

  // Vocab
  const [vocabIdx, setVocabIdx] = useState(0)
  const [vocabExIdx, setVocabExIdx] = useState(0)
  const [vocabInput, setVocabInput] = useState('')
  const [vocabFeedback, setVocabFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [vocabDone, setVocabDone] = useState(false)
  const savedWordsKey = 'movetalk_saved_words'
  const [savedWords, setSavedWords] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(savedWordsKey) || '[]') } catch { return [] }
  })
  const recRef = useRef<any>(null)
  const [flipped, setFlipped] = useState(false)
  const [vocabCanAdvance, setVocabCanAdvance] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Review
  const [exIdx, setExIdx] = useState(0)
  const [exSelected, setExSelected] = useState<string | null>(null)
  const [exResult, setExResult] = useState<'correct' | 'wrong' | null>(null)
  const [exTimer, setExTimer] = useState(30)
  const [exScore, setExScore] = useState({ correct: 0, total: 0 })
  const [exDone, setExDone] = useState(false)

  // Dictation
  const [dictIdx, setDictIdx] = useState(0)
  const [dictInput, setDictInput] = useState('')
  const [dictResult, setDictResult] = useState<'correct' | 'wrong' | null>(null)
  const [dictTimer, setDictTimer] = useState(25)
  const [dictListenCount, setDictListenCount] = useState(2)
  const [dictDone, setDictDone] = useState(false)

  // Pronunciation
  const [pronIdx, setPronIdx] = useState(0)
  const [pronScore, setPronScore] = useState<number | null>(null)
  const [pronListening, setPronListening] = useState(false)
  const [pronDone, setPronDone] = useState(false)

  // Review timer
  useEffect(() => {
    if (section !== 'review' || exDone) return
    if (exTimer <= 0) { if (!exResult) setExResult('wrong'); return }
    const t = setTimeout(() => setExTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [section, exTimer, exDone, exResult])

  // Dictation timer
  useEffect(() => {
    if (section !== 'dictation' || dictDone) return
    if (dictTimer <= 0) { if (!dictResult) setDictResult('wrong'); return }
    const t = setTimeout(() => setDictTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [section, dictTimer, dictDone, dictResult])

  const speakWord = (w: string) => {
    const u = new SpeechSynthesisUtterance(w)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  const checkVocabAnswer = () => {
    const item = vocab[vocabIdx]
    const ex = item.examples[vocabExIdx]
    const correct = vocabInput.trim().toLowerCase() === ex.answer.toLowerCase()
    setVocabFeedback(correct ? 'correct' : 'wrong')
    if (correct) setVocabCanAdvance(true)
  }

  const advanceVocab = () => {
    if (vocabExIdx < 1) {
      setVocabExIdx(1); setVocabInput(''); setVocabFeedback(null); setVocabCanAdvance(false); setShowHint(false)
    } else if (vocabIdx < vocab.length - 1) {
      setVocabIdx(p => p + 1); setVocabExIdx(0); setVocabInput(''); setVocabFeedback(null); setVocabCanAdvance(false); setFlipped(false); setShowHint(false)
    } else {
      setVocabDone(true)
    }
  }

  const handleExSubmit = () => {
    const ex = exercises[exIdx]
    const correct = exSelected === ex.answer
    setExResult(correct ? 'correct' : 'wrong')
    setExScore(p => ({ correct: p.correct + (correct ? 1 : 0), total: p.total + 1 }))
  }

  const handleExNext = () => {
    if (exIdx < exercises.length - 1) {
      setExIdx(p => p + 1); setExSelected(null); setExResult(null); setExTimer(30)
    } else { setExDone(true) }
  }

  const handleDictSubmit = () => {
    const correct = dictInput.trim().toLowerCase() === dictation[dictIdx].answer.toLowerCase()
    setDictResult(correct ? 'correct' : 'wrong')
  }

  const handleDictNext = () => {
    if (dictIdx < dictation.length - 1) {
      setDictIdx(p => p + 1); setDictInput(''); setDictResult(null); setDictTimer(25); setDictListenCount(2)
    } else { setDictDone(true) }
  }

  const handleDictListen = () => {
    if (dictListenCount > 0) {
      speakWord(dictation[dictIdx].audio)
      setDictListenCount(p => p - 1)
    }
  }

  const [pronRecording, setPronRecording] = useState(false)
  const mediaRecorderRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handlePronSpeak = async () => {
    // If already recording, stop and process
    if (pronRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      return
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop())
        setPronRecording(false)
        setPronListening(false)

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size < 1000) {
          setPronScore(0)
          return
        }

        // Send to TonePerfect
        setPronListening(true)
        try {
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')
          formData.append('text', pron[pronIdx].word)
          formData.append('language', 'en')

          const supabaseUrl = 'https://fdqjvbarvjrmjlquarva.supabase.co'
          const supabaseAnonKey = 'sb_publishable__IxBBWQ6scn7W4rO--TeyQ_lLjnPhDW'

          const res = await fetch(`${supabaseUrl}/functions/v1/assess-pronunciation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
            },
            body: formData,
          })

          if (!res.ok) {
            const errText = await res.text()
            console.error('TonePerfect error:', res.status, errText)
            // Fallback to Web Speech API scoring
            fallbackSpeechScoring()
            return
          }

          const data = await res.json()
          // TonePerfect returns score 0-100
          const score = Math.round(data.score ?? data.overall_score ?? 0)
          setPronScore(score)
        } catch (err) {
          console.error('TonePerfect fetch error:', err)
          fallbackSpeechScoring()
        } finally {
          setPronListening(false)
        }
      }

      mediaRecorderRef.current = mr
      mr.start()
      setPronRecording(true)
      setPronListening(true)

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mr.state === 'recording') {
          mr.stop()
        }
      }, 5000)
    } catch (err) {
      console.error('MediaRecorder error:', err)
      alert('Không thể truy cập micro. Vui lòng cho phép quyền micro.')
      setPronRecording(false)
      setPronListening(false)
    }
  }

  const fallbackSpeechScoring = () => {
    // Fallback to Web Speech API
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setPronScore(0); return }
    const rec = new SR()
    recRef.current = rec
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      const r = scoreAttempt(pron[pronIdx].word, transcript)
      setPronScore(r.overall)
      recRef.current = null
    }
    rec.onerror = () => { setPronScore(0); recRef.current = null }
    rec.onend = () => { recRef.current = null }
    try { rec.start() } catch { setPronScore(0) }
  }

  const handlePronNext = () => {
    if (pronIdx < pron.length - 1) {
      setPronIdx(p => p + 1); setPronScore(null)
    } else { setPronDone(true) }
  }



  const resetLevel = () => {
    setVocabIdx(0); setVocabExIdx(0); setVocabInput(''); setVocabFeedback(null); setVocabDone(false); setFlipped(false); setVocabCanAdvance(false)
    setExIdx(0); setExSelected(null); setExResult(null); setExTimer(30); setExScore({ correct: 0, total: 0 }); setExDone(false)
    setDictIdx(0); setDictInput(''); setDictResult(null); setDictTimer(25); setDictListenCount(2); setDictDone(false)
    setPronIdx(0); setPronScore(null); setPronListening(false); setPronDone(false)
    setSection('vocab')
  }

  const switchLevel = (l: Level) => {
    setLevel(l)
    // Preserve current section, just reset progress within that section
    setVocabIdx(0); setVocabExIdx(0); setVocabInput(''); setVocabFeedback(null); setVocabDone(false); setFlipped(false); setVocabCanAdvance(false)
    setExIdx(0); setExSelected(null); setExResult(null); setExTimer(30); setExScore({ correct: 0, total: 0 }); setExDone(false)
    setDictIdx(0); setDictInput(''); setDictResult(null); setDictTimer(25); setDictListenCount(2); setDictDone(false)
    setPronIdx(0); setPronScore(null); setPronListening(false); setPronDone(false)
    // Don't reset section - keep user on current section
  }

  const isUnlocked = (_s: Section) => true

  const saveWord = (w: string, vi?: string) => {
    if (!savedWords.includes(w)) {
      const next = [...savedWords, w]
      setSavedWords(next)
      try { localStorage.setItem(savedWordsKey, JSON.stringify(next)) } catch {}
      try { addCard(w, vi, 'A1', 'lesson') } catch {}
    }
  }

  const labels: Record<string, string> = { vocab: 'Từ vựng', review: 'Ôn tập', dictation: 'Nghe viết', pronunciation: 'Phát âm' }

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recRef.current) {
        try { recRef.current.abort() } catch {}
        recRef.current = null
      }
    }
  }, [])

  return (
    <div className="bg-bg text-ink">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[13px] font-semibold text-primary">← Quay lại</button>
          <h1 className="text-[16px] font-bold">{data.title}</h1>
          <div className="flex gap-1">
            <button onClick={() => switchLevel(1)} className={`rounded-lg px-4 py-1.5 text-[13px] font-bold ${level === 1 ? 'bg-primary text-white' : 'bg-surface border border-line'}`}>Level 1</button>
            <button onClick={() => switchLevel(2)} className={`rounded-lg px-4 py-1.5 text-[13px] font-bold ${level === 2 ? 'bg-primary text-white' : 'bg-surface border border-line'}`}>Level 2</button>
          </div>
        </div>
        <p className="mt-1 text-[12px] text-muted">{data.description} · <span className="font-semibold text-primary">Level {level}</span></p>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {(['vocab', 'review', 'dictation', 'pronunciation'] as Section[]).map(s => {
            const unlocked = isUnlocked(s)
            return (
              <button key={s} onClick={() => unlocked && setSection(s)} disabled={!unlocked}
                className={`rounded-xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap ${section === s ? 'bg-primary text-white' : unlocked ? 'bg-surface border border-line hover:border-primary/40' : 'bg-bg/50 text-muted border border-line/50 cursor-not-allowed'}`}>
                {labels[s]} {!unlocked && '🔒'}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          {/* ── VOCAB ── */}
          {section === 'vocab' && !vocabDone && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-muted">{vocabIdx + 1}/{vocab.length}</span>
                <span className="text-[12px] font-semibold text-primary">{vocab[vocabIdx].word} <span className="text-muted font-normal">{vocab[vocabIdx].pos}</span></span>
              </div>

              {/* Card flip */}
              <div className="mb-4 rounded-xl border border-line bg-bg/40 p-4 text-center">
                {!flipped ? (
                  <>
                    <p className="text-[24px] font-bold">{vocab[vocabIdx].word}</p>
                    <p className="text-[14px] text-muted mt-1">{vocab[vocabIdx].ipa}</p>
                    <p className="text-[13px] mt-2">{vocab[vocabIdx].vi}</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button onClick={() => speakWord(vocab[vocabIdx].word)} className="rounded-lg bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary">🔊 Nghe</button>
                      <a href={vocab[vocabIdx].youglish} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary">🎧 YouGlish</a>
                      <button onClick={() => setFlipped(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold">Lật thẻ</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold text-muted mb-2">Cách dùng:</p>
                    <p className="text-[13px] mb-3">{vocab[vocabIdx].usage}</p>
                    <button onClick={() => setFlipped(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold">Quay lại</button>
                  </>
                )}
              </div>

              {/* Example sentence with fill-in */}
              <div className="mb-3">
                <p className="text-[12px] font-semibold text-muted mb-1">Ví dụ {vocabExIdx + 1}/2 — điền từ:</p>
                <p className="text-[14px] mb-2">{vocab[vocabIdx].examples[vocabExIdx].sentence.replace(vocab[vocabIdx].examples[vocabExIdx].answer, '_____')}</p>
                <button onClick={() => setShowHint((s) => !s)} className="text-[11px] font-semibold text-primary mb-2">
                  {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý (VI)'}
                </button>
                {showHint && <p className="text-[11px] text-muted mb-2">({vocab[vocabIdx].examples[vocabExIdx].vi})</p>}
                <div className="flex gap-2">
                  <input value={vocabInput} onChange={e => setVocabInput(e.target.value)}
                    className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-[13px]"
                    placeholder="Điền từ/cụm từ..." onKeyDown={e => e.key === 'Enter' && checkVocabAnswer()} />
                  <button onClick={checkVocabAnswer} className="rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-white">Kiểm tra</button>
                </div>
                {vocabFeedback && (
                  <p className={`mt-2 text-[12px] font-semibold ${vocabFeedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                    {vocabFeedback === 'correct' ? '✓ Đúng!' : `✗ Sai. Đáp án: ${vocab[vocabIdx].examples[vocabExIdx].answer}`}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => saveWord(vocab[vocabIdx].word, vocab[vocabIdx].vi)} className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${savedWords.includes(vocab[vocabIdx].word) ? 'bg-ok/10 text-ok' : 'border border-line'}`}>
                  <Save className="inline h-3.5 w-3.5 mr-1" />{savedWords.includes(vocab[vocabIdx].word) ? 'Đã lưu' : 'Lưu từ'}
                </button>
                {vocabCanAdvance && (
                  <button onClick={advanceVocab} className="rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-white">
                    {vocabExIdx < 1 ? 'Ví dụ tiếp →' : vocabIdx < vocab.length - 1 ? 'Từ tiếp →' : 'Hoàn thành ✓'}
                  </button>
                )}
              </div>
            </div>
          )}

          {section === 'vocab' && vocabDone && (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-[18px] font-bold text-green-600">✓ Hoàn thành từ vựng Level {level}!</p>
              <p className="text-[13px] text-muted mt-2">Đã lưu {savedWords.length} từ vào profile.</p>
              <button onClick={() => setSection('review')} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">Sang ôn tập →</button>
            </div>
          )}

          {/* ── REVIEW ── */}
          {section === 'review' && !exDone && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-muted">Câu {exIdx + 1}/{exercises.length}</span>
                <span className={`text-[14px] font-bold ${exTimer <= 10 ? 'text-red-500' : 'text-primary'}`}>⏱ {exTimer}s</span>
              </div>
              <p className="text-[11px] text-muted mb-1">{exercises[exIdx].instruction}</p>
              <p className="text-[14px] font-semibold mb-3">{exercises[exIdx].question}</p>

              {exercises[exIdx].type === 'mc' && (
                <div className="space-y-2">
                  {exercises[exIdx].options?.map(opt => (
                    <button key={opt} onClick={() => setExSelected(opt)}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left text-[13px] transition ${exSelected === opt ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/40'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {exercises[exIdx].type === 'tf' && (
                <div className="flex gap-3">
                  {['true', 'false'].map(v => (
                    <button key={v} onClick={() => setExSelected(v)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-[13px] font-semibold transition ${exSelected === v ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/40'}`}>
                      {v === 'true' ? 'Đúng' : 'Sai'}
                    </button>
                  ))}
                </div>
              )}

              {exercises[exIdx].type === 'typing' && (
                <input value={exSelected || ''} onChange={e => setExSelected(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-[13px]" placeholder="Gõ đáp án..." />
              )}

              {exercises[exIdx].type === 'matching' && (
                <p className="text-[12px] text-muted">Ghép đôi: {exercises[exIdx].pairs?.map(p => `${p.left}↔${p.right}`).join(', ')}</p>
              )}

              {!exResult && (
                <button onClick={handleExSubmit} disabled={!exSelected}
                  className="mt-3 w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white disabled:opacity-50">
                  Kiểm tra
                </button>
              )}

              {exResult && (
                <div className={`mt-3 rounded-xl p-3 ${exResult === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-[13px] font-semibold ${exResult === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                    {exResult === 'correct' ? '✓ Đúng!' : '✗ Sai'}
                  </p>
                  <p className="text-[12px] text-muted mt-1">{exercises[exIdx].explanation}</p>
                  <button onClick={handleExNext} className="mt-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-white">
                    {exIdx < exercises.length - 1 ? 'Câu tiếp →' : 'Hoàn thành ✓'}
                  </button>
                </div>
              )}
            </div>
          )}

          {section === 'review' && exDone && (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-[18px] font-bold text-green-600">✓ Hoàn thành ôn tập Level {level}!</p>
              <p className="text-[13px] text-muted mt-2">Điểm: {exScore.correct}/{exScore.total}</p>
              <button onClick={() => setSection('dictation')} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">Sang nghe viết →</button>
            </div>
          )}

          {/* ── DICTATION ── */}
          {section === 'dictation' && !dictDone && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-muted">{dictIdx + 1}/{dictation.length}</span>
                <span className={`text-[14px] font-bold ${dictTimer <= 10 ? 'text-red-500' : 'text-primary'}`}>⏱ {dictTimer}s</span>
              </div>
              <p className="text-[13px] mb-3">Nghe và gõ lại từ/cụm từ:</p>
              <button onClick={handleDictListen} disabled={dictListenCount <= 0}
                className="mb-3 rounded-xl bg-primary-soft px-4 py-2 text-[12px] font-semibold text-primary disabled:opacity-50">
                🔊 Nghe ({dictListenCount} lượt còn lại)
              </button>
              <input value={dictInput} onChange={e => setDictInput(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-[13px] mb-2" placeholder="Gõ từ nghe được..."
                onKeyDown={e => e.key === 'Enter' && handleDictSubmit()} />
              <p className="text-[11px] text-muted mb-2">Gợi ý: {dictation[dictIdx].vi}</p>

              {!dictResult && (
                <button onClick={handleDictSubmit} className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white">Kiểm tra</button>
              )}

              {dictResult && (
                <div className={`mt-3 rounded-xl p-3 ${dictResult === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-[13px] font-semibold ${dictResult === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                    {dictResult === 'correct' ? '✓ Đúng!' : `✗ Sai. Đáp án: ${dictation[dictIdx].answer}`}
                  </p>
                  <button onClick={handleDictNext} className="mt-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-white">
                    {dictIdx < dictation.length - 1 ? 'Câu tiếp →' : 'Hoàn thành ✓'}
                  </button>
                </div>
              )}
            </div>
          )}

          {section === 'dictation' && dictDone && (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-[18px] font-bold text-green-600">✓ Hoàn thành nghe viết Level {level}!</p>
              <button onClick={() => setSection('pronunciation')} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">Sang phát âm →</button>
            </div>
          )}

          {/* ── PRONUNCIATION ── */}
          {section === 'pronunciation' && !pronDone && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-muted">{pronIdx + 1}/{pron.length}</span>
              </div>
              <div className="text-center mb-4">
                <p className="text-[24px] font-bold">{pron[pronIdx].word}</p>
                <p className="text-[14px] text-muted mt-1">{pron[pronIdx].ipa}</p>
                <p className="text-[13px] mt-1">{pron[pronIdx].vi}</p>
                <div className="mt-3 flex justify-center gap-2">
                  <button onClick={() => speakWord(pron[pronIdx].word)} className="rounded-lg bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary">🔊 Nghe mẫu</button>
                  <a href={`https://youglish.com/pronounce/${encodeURIComponent(pron[pronIdx].word)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary">🎧 YouGlish</a>
                </div>
              </div>

              <div className="text-center">
                <button onClick={handlePronSpeak} disabled={pronListening && !pronRecording}
                  className={`rounded-xl px-6 py-3 text-[13px] font-semibold text-white ${pronRecording ? 'bg-red-500 animate-pulse' : pronListening ? 'bg-yellow-500' : pronScore !== null ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary'}`}>
                  {pronRecording ? '⏹ Dừng & chấm điểm' : pronListening ? '⏳ Đang chấm...' : '🎤 Nhấn để phát âm'}
                </button>
              </div>

              {pronScore !== null && (
                <div className={`mt-4 rounded-xl p-4 text-center ${pronScore >= 75 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-[20px] font-bold ${pronScore >= 75 ? 'text-green-600' : 'text-red-500'}`}>{pronScore}%</p>
                  <p className="text-[12px] text-muted mt-1">
                    {pronScore >= 75 ? '✓ Đạt! (cần ≥75%)' : '✗ Chưa đạt (cần ≥75%). Hãy thử lại.'}
                  </p>
                  {pronScore >= 75 ? (
                    <button onClick={handlePronNext} className="mt-3 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">
                      {pronIdx < pron.length - 1 ? 'Từ tiếp →' : 'Hoàn thành ✓'}
                    </button>
                  ) : (
                    <button onClick={() => setPronScore(null)} className="mt-3 rounded-xl border border-line px-6 py-2.5 text-[13px] font-semibold">
                      🔄 Nói lại
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {section === 'pronunciation' && pronDone && (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-[18px] font-bold text-green-600">✓ Hoàn thành phát âm Level {level}!</p>
              <button onClick={resetLevel} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">Làm lại Level {level}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
