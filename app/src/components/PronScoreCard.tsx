import type { PronResult } from '../lib/pronScore'
import { cn } from '../lib/utils'

const LABELS: { key: 'accuracy' | 'completeness' | 'fluency'; label: string }[] = [
  { key: 'accuracy', label: 'Âm' },
  { key: 'completeness', label: 'Đủ từ' },
  { key: 'fluency', label: 'Nhịp' },
]

const verdict = (n: number) => (n >= 88 ? 'Rõ.' : n >= 70 ? 'Gần đúng.' : 'Đọc lại.')

/** Kết quả một lần đọc: điểm tổng, ba chỉ số, từng từ và gợi ý sửa. */
export function PronScoreCard({ result, className }: { result: PronResult; className?: string }) {
  const tone =
    result.overall >= 88 ? 'bg-mint/25 text-[#2F5D45]' : result.overall >= 70 ? 'bg-accent/20 text-[#7a4300]' : 'bg-danger/15 text-danger'

  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-ink">{verdict(result.overall)}</p>
          <p className="text-[11.5px] text-muted">
            {result.wpm ? `${result.wpm} từ/phút` : 'Chưa đo được nhịp'}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-[15px] font-bold tabular-nums', tone)}>{result.overall}%</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {LABELS.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-line bg-bg/50 px-2.5 py-2">
            <p className="text-[15px] font-bold tabular-nums text-ink">{result[key]}</p>
            <p className="text-[11px] text-muted">{label}</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
              <div
                className={cn('h-full rounded-full', result[key] >= 80 ? 'bg-mint' : result[key] >= 60 ? 'bg-accent' : 'bg-danger')}
                style={{ width: `${Math.max(4, result[key])}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.words.map((w, i) => (
          <span
            key={`${w.text}-${i}`}
            title={w.ipa ? `${w.ipa}${w.heard ? ` · nghe: ${w.heard}` : ''}` : undefined}
            className={cn(
              'rounded-md px-2 py-1 text-[13px] font-medium',
              w.status === 'good' && 'bg-mint/20 text-[#2F5D45]',
              w.status === 'close' && 'bg-accent/20 text-[#7a4300]',
              w.status === 'wrong' && 'bg-danger/15 text-danger',
              w.status === 'missing' && 'border border-dashed border-line text-muted line-through',
            )}
          >
            {w.text}
          </span>
        ))}
      </div>

      {result.heard && (
        <p className="mt-2.5 text-[11.5px] text-muted">Máy nghe được: “{result.heard}”</p>
      )}

      <ul className="mt-2.5 space-y-1">
        {result.tips.slice(0, 3).map((t, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed text-ink/85">• {t}</li>
        ))}
      </ul>
    </div>
  )
}
