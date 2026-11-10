import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic, Clock, Check } from 'lucide-react'
import { SPEAKING_30_DAYS } from '../data/speaking30days'
import { loadProgress, saveProgress, loadStreak, completeDay, isMilestone, getMilestoneLabel, getStreakMessage, type DayProgress, type StreakData } from '../lib/speakingStreak'
import { uploadVoice, type ServerVoice } from '../lib/voiceSync'

function speak(text: string) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }
}

type View = 'landing' | 'progress' | 'day' | 'reflection'

export function Speaking30Days({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>('landing')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [progress, setProgress] = useState<DayProgress[]>(loadProgress())
  const [streak, setStreak] = useState<StreakData>(loadStreak())
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [justCompleted, setJustCompleted] = useState(false)
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedVoice, setUploadedVoice] = useState<ServerVoice | null>(null)
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>(['', '', ''])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const day = selectedDay ? SPEAKING_30_DAYS.find(d => d.day === selectedDay) : null
  const dayProgress = selectedDay ? progress.find(p => p.day === selectedDay) : null
  const completedCount = progress.filter(p => p.completed).length

  useEffect(() => {
    if (!timerRunning || timer <= 0) {
      if (timer === 0 && timerRunning) setTimerRunning(false)
      return
    }
    const t = setTimeout(() => setTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timerRunning, timer])

  const startTimer = (duration: number) => { setTimer(duration); setTimerRunning(true) }
  const stopTimer = () => setTimerRunning(false)

  const markComplete = (dur: number) => {
    if (!selectedDay) return
    const newStreak = completeDay(selectedDay, dur)
    setStreak(newStreak)
    const newProgress = loadProgress()
    setProgress(newProgress)
    setJustCompleted(true)
    if (isMilestone(selectedDay)) setView('reflection')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedBlobUrl(url)
        if (selectedDay) {
          setUploading(true)
          uploadVoice(200 + selectedDay, blob, recordedDuration * 1000).then(v => {
            setUploading(false)
            if (v) setUploadedVoice(v)
          })
          markComplete(recordedDuration)
        }
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
      setRecordedDuration(0)
      timerRef.current = setInterval(() => setRecordedDuration(p => p + 1), 1000)
    } catch {
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền micro.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const saveReflection = () => {
    if (!selectedDay) return
    const p = progress.map(pp => pp.day === selectedDay ? { ...pp, reflection: reflectionAnswers.join(' | ') } : pp)
    setProgress(p)
    saveProgress(p)
    setSelectedDay(null)
    setView('landing')
    setJustCompleted(false)
    setReflectionAnswers(['', '', ''])
  }

  const badges = [
    { day: 3, label: '3 ngày', icon: '🥉' },
    { day: 7, label: '1 tuần', icon: '🥈' },
    { day: 14, label: '2 tuần', icon: '🥇' },
    { day: 21, label: '3 tuần', icon: '🏆' },
    { day: 30, label: '30 ngày', icon: '👑' },
  ]

  // ── LANDING ──
  if (view === 'landing') {
    return (
      <div className="bg-bg text-ink min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="text-[13px] font-semibold text-primary">← Quay lại</button>
            <h1 className="text-[16px] font-bold">30 Days Speaking</h1>
            <button onClick={() => setView('progress')} className="text-[12px] text-primary font-semibold">Tiến độ</button>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 mb-4">
            <h2 className="text-[18px] font-bold mb-2">Thử thách nói tiếng Anh 30 ngày</h2>
            <p className="text-[13px] text-muted mb-3">
              10–15 phút mỗi ngày. Từ câu đơn → đoạn nói 90–120 giây. Không nhàm chán, không áp lực.
            </p>
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">A1 → A2</span>
              <span className="rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">30 ngày</span>
              <span className="rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">10–15 phút/ngày</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">🔥</span>
                <span className="text-[16px] font-bold">{streak.currentStreak}</span>
                <span className="text-[12px] text-muted">ngày liên tiếp</span>
              </div>
              <div className="text-[12px] text-muted">Kỷ lục: {streak.longestStreak}</div>
            </div>
            <p className="text-[12px] text-muted mb-2">{getStreakMessage(streak)}</p>
            <div className="h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / 30) * 100}%` }} />
            </div>
            <p className="text-[11px] text-muted mt-1">{completedCount}/30 ngày hoàn thành</p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-4">
            {SPEAKING_30_DAYS.map(d => {
              const p = progress.find(pp => pp.day === d.day)
              const done = p?.completed ?? false
              const milestone = isMilestone(d.day)
              return (
                <button
                  key={d.day}
                  onClick={() => { setSelectedDay(d.day); setView('day'); setRecordedBlobUrl(null); setUploadedVoice(null); setJustCompleted(false) }}
                  className={`aspect-square rounded-xl border text-[12px] font-bold flex items-center justify-center transition ${done ? 'bg-green-500 text-white border-green-500' : milestone ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface hover:border-primary/40'}`}
                >
                  {done ? '✓' : d.day}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => {
              const nextDay = progress.find(p => !p.completed)?.day || 1
              setSelectedDay(nextDay)
              setView('day')
              setRecordedBlobUrl(null)
              setUploadedVoice(null)
              setJustCompleted(false)
            }}
            className="w-full rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-white"
          >
            Bắt đầu nói →
          </button>
        </div>
      </div>
    )
  }

  // ── PROGRESS ──
  if (view === 'progress') {
    return (
      <div className="bg-bg text-ink min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('landing')} className="text-[13px] font-semibold text-primary">← Quay lại</button>
            <h1 className="text-[16px] font-bold">Tiến độ</h1>
            <div />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[28px]">🔥</span>
              <div>
                <p className="text-[20px] font-bold">{streak.currentStreak} ngày</p>
                <p className="text-[12px] text-muted">Chuỗi hiện tại • Kỷ lục: {streak.longestStreak}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted">{getStreakMessage(streak)}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-3">Huy hiệu</p>
            <div className="flex gap-4 flex-wrap">
              {badges.map(b => {
                const earned = completedCount >= b.day
                return (
                  <div key={b.day} className={`flex flex-col items-center gap-1 ${earned ? '' : 'opacity-40'}`}>
                    <span className="text-[28px]">{b.icon}</span>
                    <span className="text-[10px] font-semibold">{b.label}</span>
                    {earned && <Check className="h-3 w-3 text-green-500" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-3">30 ngày</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {SPEAKING_30_DAYS.map(d => {
                const p = progress.find(pp => pp.day === d.day)
                const done = p?.completed ?? false
                return (
                  <button
                    key={d.day}
                    onClick={() => { setSelectedDay(d.day); setView('day'); setRecordedBlobUrl(null); setUploadedVoice(null); setJustCompleted(false) }}
                    className={`aspect-square rounded-xl border text-[12px] font-bold flex items-center justify-center transition ${done ? 'bg-green-500 text-white border-green-500' : 'border-line bg-surface hover:border-primary/40'}`}
                  >
                    {done ? '✓' : d.day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-3">Bản ghi mốc</p>
            <div className="space-y-2">
              {[1, 7, 14, 21, 30].map(d => {
                const p = progress.find(pp => pp.day === d)
                return (
                  <div key={d} className="flex items-center justify-between py-1">
                    <span className="text-[13px]">Ngày {d}</span>
                    <span className={`text-[12px] ${p?.completed ? 'text-green-600' : 'text-muted'}`}>
                      {p?.completed ? `✓ ${p.recordingDuration || 0}s` : 'Chưa hoàn thành'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── REFLECTION ──
  if (view === 'reflection' && day) {
    const questions = ['Hôm nay bạn học được gì mới?', 'Điều gì còn khó? Bạn sẽ luyện thêm gì?', 'Bạn cảm thấy thế nào về tiến bộ của mình?']
    return (
      <div className="bg-bg text-ink min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-[18px] font-bold mb-2">🎉 {getMilestoneLabel(day.day)}</h1>
          <p className="text-[13px] text-muted mb-4">Bạn đã hoàn thành Ngày {day.day}! Hãy suy ngẫm:</p>

          <div className="rounded-2xl border border-line bg-surface p-5 mb-4 space-y-4">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="text-[13px] font-semibold mb-1">{i + 1}. {q}</p>
                <textarea
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary"
                  rows={2}
                  value={reflectionAnswers[i]}
                  onChange={(e) => {
                    const newAnswers = [...reflectionAnswers]
                    newAnswers[i] = e.target.value
                    setReflectionAnswers(newAnswers)
                  }}
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-green-500/30 bg-green-50 p-4 mb-4">
            <p className="text-[13px] font-semibold text-green-600">
              🎉 Hôm nay bạn đã nói được {day.speaking_task.duration_sec} giây về "{day.title}"!
            </p>
          </div>

          <button
            onClick={saveReflection}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Hoàn thành →
          </button>
        </div>
      </div>
    )
  }

  // ── DAY DETAIL ──
  if (!day) return null

  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setSelectedDay(null); setView('landing'); setJustCompleted(false) }} className="text-[13px] font-semibold text-primary">← Quay lại</button>
          <h1 className="text-[15px] font-bold">Ngày {day.day}: {day.title}</h1>
          <div className="text-[12px] text-muted">{day.estimated_minutes} phút</div>
        </div>

        <p className="text-[13px] text-muted mb-4">{day.goal}</p>

        <div className="rounded-2xl border border-line bg-surface p-4 mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-2">Từ vựng</p>
          <div className="space-y-1">
            {day.vocabulary.map((v, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{v.word}</span>
                  <span className="text-[11px] text-muted">{v.ipa}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted">{v.vi}</span>
                  <button onClick={() => speak(v.word)} className="text-primary"><Volume2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-2">Khung câu</p>
          <ul className="space-y-1">
            {day.sentence_frames.map((f, i) => (
              <li key={i} className="text-[13px]">• {f}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-2">Hội thoại mẫu</p>
          <div className="space-y-1">
            {day.sample_dialogue.map((d, i) => (
              <p key={i} className="text-[13px]">{d}</p>
            ))}
          </div>
          <button onClick={() => speak(day.sample_dialogue.join(' '))} className="mt-2 text-[12px] text-primary font-semibold">
            <Volume2 className="inline h-3.5 w-3.5" /> Nghe mẫu
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-muted mb-2">Nhiệm vụ nói</p>
          <p className="text-[13px] mb-3">{day.speaking_task.prompt}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => startTimer(day.speaking_task.duration_sec)}
              disabled={timerRunning}
              className="rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              Bắt đầu nói
            </button>
            {timer > 0 && (
              <span className={`text-[14px] font-bold ${timer <= 5 ? 'text-red-500' : 'text-primary'}`}>
                <Clock className="inline h-4 w-4" /> {timer}s
              </span>
            )}
            {timerRunning && (
              <button onClick={stopTimer} className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold">
                Dừng
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-line bg-bg/60 p-4 mb-3">
          <p className="text-[12px] font-semibold text-muted mb-1">Thử thách nhỏ</p>
          <p className="text-[13px]">{day.mini_challenge}</p>
        </div>

        {justCompleted && (
          <div className="rounded-2xl border border-green-500/30 bg-green-50 p-4 mb-3">
            <p className="text-[13px] font-semibold text-green-600">
              🎉 Hôm nay bạn đã nói được {day.speaking_task.duration_sec} giây về "{day.title}"!
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white ${recording ? 'bg-red-500' : 'bg-primary'}`}
          >
            <Mic className="inline h-4 w-4" /> {recording ? `Đang ghi... ${recordedDuration}s` : 'Ghi âm'}
          </button>
          <button
            onClick={() => markComplete(0)}
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold"
          >
            <Check className="inline h-4 w-4" /> Đánh dấu hoàn thành
          </button>
        </div>

        {recordedBlobUrl && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
            <p className="text-[12px] font-semibold text-muted mb-2">Bản ghi của bạn:</p>
            <audio controls src={recordedBlobUrl} className="w-full" />
            {uploading && <p className="text-[11px] text-muted mt-1">Đang gửi cho giáo viên...</p>}
            {uploadedVoice && <p className="text-[11px] text-green-600 mt-1">✓ Đã gửi cho giáo viên</p>}
          </div>
        )}

        {dayProgress?.completed && !justCompleted && (
          <div className="mt-3 text-center text-[12px] text-green-600 font-semibold">
            ✓ Đã hoàn thành Ngày {day.day}
          </div>
        )}
      </div>
    </div>
  )
}
