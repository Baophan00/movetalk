import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Mic, Square, Send, ChevronLeft, Volume2, Star, Clock, Eye, EyeOff } from 'lucide-react'
import { cn } from '../lib/utils'
import { clipFor } from '../lib/audio'

type Mode = 'repeat' | 'answer' | 'test'
type Attempt = { blob: Blob; url: string; ts: number; score?: number }

const repeatSentences: { en: string; vi: string }[] = [
  { en: 'Do you usually wake up early?', vi: 'Bạn có thường dậy sớm không?' },
  { en: 'Are you free tonight?', vi: 'Bạn có rảnh tối nay không?' },
  { en: 'Do you usually eat out?', vi: 'Bạn có thường ăn ngoài không?' },
  { en: 'Do you cook at home?', vi: 'Bạn có nấu ăn ở nhà không?' },
  { en: 'Are you a little tired after work?', vi: 'Bạn có hơi mệt sau giờ làm không?' },
  { en: 'Are you busy right now?', vi: 'Bạn có bận ngay bây giờ không?' },
  { en: 'Do you work near here?', vi: 'Bạn có làm việc gần đây không?' },
  { en: 'Are you new here?', vi: 'Bạn mới đến đây phải không?' },
  { en: 'Do you like coffee?', vi: 'Bạn có thích cà phê không?' },
  { en: 'Are you ready for class?', vi: 'Bạn đã sẵn sàng vào lớp chưa?' },
  { en: 'Do you go to bed late?', vi: 'Bạn có đi ngủ muộn không?' },
  { en: 'Do you need any help?', vi: 'Bạn có cần giúp đỡ không?' },
]

const answerPairs: { q: string; qVi: string; hint: string }[] = [
  { q: 'Are you new here?', qVi: 'Bạn mới đến đây phải không?', hint: 'Yes, I am.' },
  { q: 'Do you work nearby?', qVi: 'Bạn có làm việc gần đây không?', hint: 'Yes, I do. I work in sales.' },
  { q: 'Are you free after six?', qVi: 'Bạn có rảnh sau sáu giờ không?', hint: 'Yes, I am.' },
  { q: 'Do you like coffee?', qVi: 'Bạn có thích cà phê không?', hint: 'Yes, I do. I like this cafe.' },
  { q: 'Are you busy now?', qVi: 'Bạn có bận bây giờ không?', hint: "Yes, I am. I'm busy until three." },
  { q: 'Do you want some coffee?', qVi: 'Bạn có muốn cà phê không?', hint: "Yes, please. I'm a little tired." },
  { q: 'Do you need milk?', qVi: 'Bạn có cần sữa không?', hint: 'No, thanks. Black coffee is fine.' },
  { q: 'Do you practice English at home?', qVi: 'Bạn có luyện tiếng Anh ở nhà không?', hint: 'Yes, I do. I practice after work.' },
  { q: 'Are you ready for class?', qVi: 'Bạn đã sẵn sàng vào lớp chưa?', hint: "Yes, I am. Let's go." },
  { q: 'Do you live near here?', qVi: 'Bạn có sống gần đây không?', hint: "No, I don't. I live near the beach." },
]

const testItems: { prompt: string; promptVi: string; expected: string; time: number }[] = [
  { prompt: '[Dịch] Bạn có thường dậy sớm không?', promptVi: 'Dịch sang tiếng Anh', expected: 'Do you usually wake up early?', time: 10 },
  { prompt: '[Hỏi đáp] Do you usually eat out?', promptVi: 'Trả lời Yes/No', expected: 'Yes, I do. / No, I don\'t.', time: 10 },
  { prompt: '[Dịch] Tôi thường nấu ăn ở nhà.', promptVi: 'Dịch sang tiếng Anh', expected: 'I usually cook at home.', time: 10 },
  { prompt: '[Tình huống] Hỏi xem ai đó có rảnh tối nay không.', promptVi: 'Tạo câu hỏi', expected: 'Are you free tonight?', time: 10 },
  { prompt: '[Dịch] Bạn có bận ngay bây giờ không?', promptVi: 'Dịch sang tiếng Anh', expected: 'Are you busy right now?', time: 10 },
  { prompt: '[Hỏi đáp] Are you a little tired?', promptVi: 'Trả lời Yes/No', expected: 'Yes, I am. / No, I\'m not.', time: 10 },
  { prompt: '[Tình huống] Hỏi xem người mới quen có sống gần đây không.', promptVi: 'Tạo câu hỏi', expected: 'Do you live near here?', time: 10 },
  { prompt: '[Dịch] Họ có làm việc ở đây không?', promptVi: 'Dịch sang tiếng Anh', expected: 'Do they work here?', time: 10 },
  { prompt: '[Tình huống] Mời ai đó uống cà phê, hỏi họ có muốn không.', promptVi: 'Tạo câu hỏi', expected: 'Do you want some coffee?', time: 10 },
  { prompt: '[Dịch] Cô ấy có rảnh vào cuối tuần không?', promptVi: 'Dịch sang tiếng Anh', expected: 'Is she free this weekend?', time: 10 },
  { prompt: '[Hỏi đáp] Do you go to bed late?', promptVi: 'Trả lời Yes/No', expected: 'Yes, I do. / No, I don\'t.', time: 10 },
  { prompt: '[Tình huống] Hỏi xem họ đã sẵn sàng gọi món chưa.', promptVi: 'Tạo câu hỏi', expected: 'Are you ready to order?', time: 10 },
  { prompt: '[Dịch] Bạn có cần giúp đỡ không?', promptVi: 'Dịch sang tiếng Anh', expected: 'Do you need any help?', time: 10 },
  { prompt: '[Hỏi đáp] Do you drink tea?', promptVi: 'Trả lời Yes/No', expected: 'Yes, I do. / No, I don\'t.', time: 10 },
  { prompt: '[Tình huống] Hỏi xem quán cafe này có ngon không.', promptVi: 'Tạo câu hỏi', expected: 'Is this cafe good?', time: 10 },
]

function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => { streamRef.current = stream })
      .catch(() => {})
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const start = useCallback(async (maxSec: number) => {
    try {
      let stream = streamRef.current
      if (!stream || stream.getTracks().every((t) => t.readyState === 'ended')) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      }
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const type = mr.mimeType || 'audio/webm'
        const b = new Blob(chunksRef.current, { type })
        setBlob(b)
        setUrl(URL.createObjectURL(b))
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
      }
      mr.onerror = (e) => {
        console.error('MediaRecorder error:', e)
        setRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }
      mediaRef.current = mr
      mr.start(100)
      setRecording(true)
      setTimeLeft(maxSec)
      try {
        const audioCtx = new AudioContext()
        audioCtxRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        source.connect(analyser)
        analyserRef.current = analyser
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateWaveform = () => {
          analyser.getByteFrequencyData(dataArray)
          setWaveformData(Array.from(dataArray).slice(0, 16).map((v) => v / 255))
          animFrameRef.current = requestAnimationFrame(updateWaveform)
        }
        updateWaveform()
      } catch { }
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { mr.stop(); setRecording(false); if (timerRef.current) clearInterval(timerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền microphone.')
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [])

  const reset = useCallback(() => {
    setBlob(null); setUrl(null); setTimeLeft(0); setRecording(false); setWaveformData([])
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return { recording, timeLeft, blob, url, waveformData, start, stop, reset }
}

function SentencePlayer({ text, speed }: { text: string; speed: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const src = clipFor(text)

  // Reset cached audio element when text changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
  }, [text])

  const play = () => {
    if (src) {
      if (!audioRef.current) {
        const el = new Audio(src)
        el.setAttribute('playsinline', '')
        el.volume = 1
        audioRef.current = el
      }
      audioRef.current.playbackRate = speed
      audioRef.current.onended = () => setPlaying(false)
      void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.95 * speed
      u.onend = () => setPlaying(false)
      window.speechSynthesis.speak(u)
      setPlaying(true)
    }
  }

  const pause = () => {
    if (audioRef.current) audioRef.current.pause()
    else window.speechSynthesis.cancel()
    setPlaying(false)
  }

  return (
    <button
      onClick={playing ? pause : play}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary/20"
    >
      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      Phát câu mẫu
    </button>
  )
}

async function scorePronunciation(blob: Blob, text: string): Promise<number> {
  try {
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('text', text)
    formData.append('language', 'en')
    const res = await fetch('https://fdqjvbarvjrmjlquarva.supabase.co/functions/v1/assess-pronunciation', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer sb_publishable__IxBBWQ6scn7W4rO--TeyQ_lLjnPhDW', 'apikey': 'sb_publishable__IxBBWQ6scn7W4rO--TeyQ_lLjnPhDW' },
      body: formData,
    })
    if (!res.ok) return -1
    const data = await res.json()
    return Math.round(data.score ?? data.overall_score ?? 0)
  } catch { return -1 }
}

export function SpeakLessonL01({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('repeat')
  const [idx, setIdx] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [selfScore, setSelfScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [scoring, setScoring] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [comparePlaying, setComparePlaying] = useState(false)
  const rec = useRecorder()

  const lastProcessedUrl = useRef<string | null>(null)
  useEffect(() => {
    if (rec.url && rec.url !== lastProcessedUrl.current) {
      lastProcessedUrl.current = rec.url
      setAttempts((prev) => [...prev, { blob: rec.blob!, url: rec.url!, ts: Date.now() }])
      setStreak((s) => s + 1)
    }
  }, [rec.url, rec.blob])

  useEffect(() => { setAttempts([]); setSelfScore(0); setShowHint(false); lastProcessedUrl.current = null; rec.reset() }, [idx, mode])

  const handleScore = async (i: number) => {
    const a = attempts[i]
    if (!a || a.score !== undefined) return
    setScoring(true)
    const score = await scorePronunciation(a.blob, getCurrentPrompt())
    setAttempts((prev) => { const n = [...prev]; n[i] = { ...n[i], score }; return n })
    setScoring(false)
  }

  // Auto-score in repeat mode when a new attempt is added
  useEffect(() => {
    if (mode !== 'repeat') return
    const unscoredIdx = attempts.findIndex((a) => a.score === undefined)
    if (unscoredIdx === -1) return
    if (scoring) return
    let cancelled = false
    const a = attempts[unscoredIdx]
    setScoring(true)
    scorePronunciation(a.blob, getCurrentPrompt()).then((score) => {
      if (cancelled) return
      setAttempts((prev) => {
        const n = [...prev]
        if (n[unscoredIdx]) n[unscoredIdx] = { ...n[unscoredIdx], score }
        return n
      })
      setScoring(false)
    })
    return () => { cancelled = true }
  }, [attempts, mode, scoring])

  const handleSend = (i?: number) => {
    const toSend = i !== undefined ? [attempts[i]] : attempts
    const submission = { mode, idx, prompt: getCurrentPrompt(), attempts: toSend.map((a) => ({ url: a.url, ts: a.ts, score: a.score })), selfScore, sent: true, sentAt: Date.now() }
    const key = 'speak_submissions_l01'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push(submission)
    localStorage.setItem(key, JSON.stringify(existing))
  }

  function getCurrentPrompt(): string {
    if (mode === 'repeat') return repeatSentences[idx]?.en || ''
    if (mode === 'answer') return answerPairs[idx]?.q || ''
    return testItems[idx]?.prompt || ''
  }

  const totalItems = mode === 'repeat' ? repeatSentences.length : mode === 'answer' ? answerPairs.length : testItems.length

  const handleCompare = (url: string) => {
    setComparePlaying(true)
    const src = clipFor(getCurrentPrompt())
    const playOwn = () => { const own = new Audio(url); own.onended = () => setComparePlaying(false); void own.play() }
    if (src) {
      const el = new Audio(src)
      el.onended = playOwn
      void el.play()
    } else {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(getCurrentPrompt())
      u.lang = 'en-US'
      u.rate = 0.95 * speed
      u.onend = playOwn
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface transition hover:bg-bg">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Lesson 01 — Level 3</p>
          <h2 className="text-[20px] font-semibold tracking-tight">Nói câu (Speak sentences)</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Streak: {streak}</span>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {([
          { key: 'repeat' as Mode, label: 'Phần 1: Nói lại', desc: `${repeatSentences.length} câu` },
          { key: 'answer' as Mode, label: 'Phần 2: Nghe hỏi', desc: `${answerPairs.length} câu` },
          { key: 'test' as Mode, label: 'Phần 3: Kiểm tra', desc: `${testItems.length} câu` },
        ]).map((m) => (
          <button key={m.key} onClick={() => { setMode(m.key); setIdx(0) }}
            className={cn('flex-1 rounded-xl border px-3 py-2 text-center transition', mode === m.key ? 'border-primary bg-primary/10 text-primary' : 'border-line bg-surface hover:border-primary/40')}>
            <span className="block text-[12px] font-semibold">{m.label}</span>
            <span className="block text-[10px] text-muted">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Volume2 className="h-3.5 w-3.5 text-muted" />
        <span className="text-[11px] text-muted">Tốc độ phát:</span>
        {[0.75, 1, 1.25].map((s) => (
          <button key={s} onClick={() => setSpeed(s)} className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold transition', speed === s ? 'bg-primary text-white' : 'text-muted hover:bg-bg')}>{s}x</button>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-muted mb-1">
          <span>Câu {idx + 1} / {totalItems}</span>
          <span>{attempts.length} bản thu</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-line">
          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(idx / totalItems) * 100}%` }} />
        </div>
      </div>

      {mode === 'repeat' && (
        <div className="rounded-xl border border-line bg-bg/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted mb-2">Phần 1 — Nói lại câu</p>
          <p className="text-[11px] text-muted mb-3">Tối đa 20s/câu. Nghe mẫu → nói lại → chấm phát âm.</p>
          <p className="text-[18px] font-semibold text-ink mb-1">{repeatSentences[idx]?.en}</p>
          <p className="text-[13px] text-muted mb-3">{repeatSentences[idx]?.vi}</p>
          <div className="flex items-center gap-2 mb-4">
            <SentencePlayer text={repeatSentences[idx]?.en || ''} speed={speed} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            {!rec.recording ? (
              <button onClick={() => rec.start(20)} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-600">
                <Mic className="h-4 w-4" /> Ghi âm
              </button>
            ) : (
              <button onClick={rec.stop} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition">
                <Square className="h-4 w-4" /> Dừng
              </button>
            )}
            {rec.recording && <span className="text-[12px] text-red-500 font-semibold">{rec.timeLeft}s</span>}
          </div>
          {attempts.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted">Bản thu ({attempts.length}):</p>
              {attempts.map((a, i) => (
                <div key={i} className="rounded-lg bg-bg/60 px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted">Lần {i + 1}</span>
                    <audio controls src={a.url} className="h-8 flex-1" />
                    {scoring && a.score === undefined ? (
                      <span className="text-[10px] font-semibold text-blue-600">Chấm...</span>
                    ) : a.score !== undefined ? (
                      <span className={cn('text-[10px] font-semibold', a.score >= 80 ? 'text-green-600' : 'text-red-600')}>
                        {a.score >= 80 ? '✓ Đạt' : '✗ Chưa đạt'} ({a.score}/100)
                      </span>
                    ) : null}
                    <button onClick={() => handleCompare(a.url)} disabled={comparePlaying} className="rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-600 transition hover:bg-purple-100 disabled:opacity-40">
                      So sánh
                    </button>
                  </div>
                  {a.score !== undefined && a.score >= 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-line">
                        <div className={cn('h-1.5 rounded-full transition-all', a.score >= 80 ? 'bg-green-500' : a.score >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${a.score}%` }} />
                      </div>
                      <span className={cn('text-[11px] font-semibold', a.score >= 80 ? 'text-green-600' : a.score >= 50 ? 'text-yellow-600' : 'text-red-600')}>{a.score}/100</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {attempts.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] text-muted mb-1">Tự chấm (1-5 sao):</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setSelfScore(s)} className="transition">
                    <Star className={cn('h-5 w-5', s <= selfScore ? 'fill-yellow-400 text-yellow-400' : 'text-muted/40')} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="ml-auto flex gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">← Trước</button>
              <button onClick={() => setIdx((i) => Math.min(totalItems - 1, i + 1))} disabled={idx === totalItems - 1 || (attempts.length > 0 && (attempts[attempts.length - 1]?.score === undefined || (attempts[attempts.length - 1]?.score ?? 0) < 80))} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">Sau →</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'answer' && (
        <div className="rounded-xl border border-line bg-bg/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted mb-2">Phần 2 — Nghe hỏi - Trả lời</p>
          <p className="text-[11px] text-muted mb-3">Nghe audio → trả lời trong 10s. Bấm "Xem gợi ý" nếu cần.</p>
          <div className="rounded-xl bg-bg/60 p-4 mb-3 text-center">
            <p className="text-[11px] text-muted mb-2">Câu hỏi:</p>
            <SentencePlayer text={answerPairs[idx]?.q || ''} speed={speed} />
            {showHint && (
              <>
                <p className="text-[16px] font-semibold text-ink mt-2">{answerPairs[idx]?.q}</p>
                <p className="text-[12px] text-muted">{answerPairs[idx]?.qVi}</p>
                <p className="text-[11px] text-primary mt-1">Gợi ý: {answerPairs[idx]?.hint}</p>
              </>
            )}
          </div>
          <button onClick={() => setShowHint(!showHint)} className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-bg/60 px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:bg-bg">
            {showHint ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          </button>
          <div className="flex items-center gap-3 mb-4">
            {!rec.recording ? (
              <button onClick={() => rec.start(10)} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-600">
                <Mic className="h-4 w-4" /> Trả lời
              </button>
            ) : (
              <button onClick={rec.stop} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition">
                <Square className="h-4 w-4" /> Dừng
              </button>
            )}
            {rec.recording && <span className="text-[12px] text-red-500 font-semibold">{rec.timeLeft}s</span>}
          </div>
          {attempts.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted">Bản thu ({attempts.length}):</p>
              {attempts.map((a, i) => (
                <div key={i} className="rounded-lg bg-bg/60 px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted">Lần {i + 1}</span>
                    <audio controls src={a.url} className="h-8 flex-1" />
                    <button onClick={() => handleScore(i)} disabled={scoring || a.score !== undefined} className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-40">
                      {a.score !== undefined ? `Điểm: ${a.score}` : scoring ? 'Chấm...' : 'Chấm phát âm'}
                    </button>
                  </div>
                  {a.score !== undefined && a.score >= 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-line">
                        <div className={cn('h-1.5 rounded-full transition-all', a.score >= 80 ? 'bg-green-500' : a.score >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${a.score}%` }} />
                      </div>
                      <span className={cn('text-[11px] font-semibold', a.score >= 80 ? 'text-green-600' : a.score >= 50 ? 'text-yellow-600' : 'text-red-600')}>{a.score}/100</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {attempts.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] text-muted mb-1">Tự chấm (1-5 sao):</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setSelfScore(s)} className="transition">
                    <Star className={cn('h-5 w-5', s <= selfScore ? 'fill-yellow-400 text-yellow-400' : 'text-muted/40')} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="ml-auto flex gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">← Trước</button>
              <button onClick={() => setIdx((i) => Math.min(totalItems - 1, i + 1))} disabled={idx === totalItems - 1} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">Sau →</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'test' && (
        <div className="rounded-xl border border-line bg-bg/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted mb-2">Phần 3 — Kiểm tra phản xạ Nói</p>
          <p className="text-[11px] text-muted mb-3">Nhìn prompt → nói trong {testItems[idx]?.time || 10}s → ghi âm gửi GV chấm</p>
          {rec.recording && (
            <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-[20px] font-bold text-red-500">{rec.timeLeft}s</span>
            </div>
          )}
          <div className="rounded-xl bg-bg/60 p-4 mb-3">
            <p className="text-[15px] font-semibold text-ink mb-1">{testItems[idx]?.prompt}</p>
            <p className="text-[12px] text-muted">{testItems[idx]?.promptVi}</p>
          </div>
          {rec.recording && (
            <div className="mb-4 flex items-end justify-center gap-1 h-16 rounded-xl bg-bg/40 px-4 py-2">
              {rec.waveformData.map((v, i) => (
                <div key={i} className="w-2 rounded-full bg-red-500 transition-all duration-75" style={{ height: `${Math.max(4, v * 60)}px` }} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            {!rec.recording ? (
              <button onClick={() => rec.start(testItems[idx]?.time || 10)} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-600">
                <Mic className="h-4 w-4" /> Ghi âm
              </button>
            ) : (
              <button onClick={rec.stop} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition">
                <Square className="h-4 w-4" /> Dừng
              </button>
            )}
          </div>
          {attempts.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted">Bản thu ({attempts.length}):</p>
              {attempts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-bg/60 px-3 py-2">
                  <span className="text-[11px] font-semibold text-muted">Lần {i + 1}</span>
                  <audio controls src={a.url} className="h-8 flex-1" />
                  <button onClick={() => handleSend(i)} className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition hover:bg-primary/20">
                    Gửi
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => handleSend()} disabled={attempts.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-40">
              <Send className="h-4 w-4" /> Gửi GV chấm
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">← Trước</button>
              <button onClick={() => setIdx((i) => Math.min(totalItems - 1, i + 1))} disabled={idx === totalItems - 1} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40">Sau →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
