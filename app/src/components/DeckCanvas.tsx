import { useEffect, useRef, useState } from 'react'

type Run = { t: string; sz?: number | null; b?: boolean; i?: boolean; color?: string | null }
type Para = {
  algn?: string | null
  marL?: number
  indent?: number
  bullet?: string | null
  space?: { before?: number; after?: number; line?: number }
  defSz?: number | null
  runs: Run[]
}
type Cell = { paras: Para[]; fill?: string | null; span?: number }
type Shape = {
  type: 'text' | 'image' | 'box' | 'table'
  x: number; y: number; w: number; h: number; rot?: number
  anchor?: string | null
  ins?: { lIns: number; rIns: number; tIns: number; bIns: number }
  fill?: string | null
  line?: { color: string; w: number } | null
  paras?: Para[]
  scale?: number
  src?: string
  radius?: number
  rows?: { h: number; cells: Cell[] }[]
  cols?: number[]
  border?: string
}
type Slide = { bg?: string | null; shapes: Shape[] }
type Deck = { w: number; h: number; slides: Record<string, Slide> }

const cache = new Map<number, Promise<Deck>>()

function load(lesson: number): Promise<Deck> {
  if (!cache.has(lesson)) {
    const url = `/teach/l${String(lesson).padStart(2, '0')}/canvas.json?v=3`
    cache.set(lesson, fetch(url).then((r) => (r.ok ? r.json() : { w: 1280, h: 720, slides: {} })).catch(() => ({ w: 1280, h: 720, slides: {} })))
  }
  return cache.get(lesson)!
}

const PT = 96 / 72

function Paras({ paras, scale = 1 }: { paras: Para[]; scale?: number }) {
  return (
    <>
      {paras.map((p, j) => {
        const space = p.space || {}
        return (
          <p
            key={j}
            style={{
              margin: `${(space.before || 0) * PT}px 0 ${(space.after || 0) * PT}px`,
              paddingLeft: p.marL ? p.marL : undefined,
              textIndent: p.indent ? p.indent : undefined,
              textAlign: (p.algn as 'left' | 'center' | 'right' | 'justify') || 'left',
              lineHeight: space.line || 1.2,
              whiteSpace: 'pre-wrap',
              fontSize: 18 * PT,
            }}
          >
            {p.bullet && <span style={{ marginRight: 6 }}>{p.bullet === 'auto' ? '•' : p.bullet}</span>}
            {p.runs.map((r, k) => (
              <span
                key={k}
                style={{
                  fontSize: (r.sz || p.defSz || 18) * PT * scale,
                  color: r.color || '#173F50',
                  fontWeight: r.b ? 700 : 400,
                  fontStyle: r.i ? 'italic' : 'normal',
                }}
              >
                {r.t}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}

export function DeckCanvas({ lesson, num }: { lesson: number; num: number }) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [scale, setScale] = useState(1)
  const wrap = useRef<HTMLDivElement | null>(null)

  useEffect(() => { let live = true; load(lesson).then((d) => live && setDeck(d)); return () => { live = false } }, [lesson])
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / 1280)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [deck])

  if (!deck) return <div className="h-[320px] animate-pulse rounded-2xl border border-line bg-bg/40" />
  const slide = deck.slides[String(num)]
  if (!slide) return <div className="rounded-2xl border border-dashed border-line bg-bg/40 p-6 text-[14px] text-muted">Slide này chưa có bản deck.</div>

  return (
    <div ref={wrap} className="w-full overflow-hidden rounded-2xl border border-line shadow-card" style={{ background: slide.bg || '#FFFDFC' }}>
      <div style={{ height: 720 * scale, position: 'relative' }}>
        <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, background: slide.bg || '#FFFDFC' }}>
          {slide.shapes.map((s, i) => {
            if (s.type === 'box') {
              return (
                <div key={i} style={{
                  position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h,
                  background: s.fill || undefined,
                  border: s.line ? `${Math.max(1, s.line.w)}px solid ${s.line.color}` : undefined,
                  borderRadius: s.radius || 0,
                }} />
              )
            }
            if (s.type === 'table') {
              return (
                <table key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.w, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>{(s.cols || []).map((c, ci) => <col key={ci} style={{ width: c }} />)}</colgroup>
                  <tbody>
                    {(s.rows || []).map((row, ri) => (
                      <tr key={ri} style={{ height: row.h }}>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} colSpan={cell.span || 1} style={{ border: `1px solid ${s.border || '#D8CEC0'}`, background: cell.fill || undefined, verticalAlign: 'top', padding: 3, overflow: 'hidden' }}>
                            <Paras paras={cell.paras} scale={s.scale} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
            if (s.type === 'image') {
              return <img key={i} src={s.src} alt="" style={{ position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, objectFit: 'fill' }} />
            }
            const anchor = s.anchor === 'ctr' ? 'center' : s.anchor === 'b' ? 'flex-end' : 'flex-start'
            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h,
                  transform: s.rot ? `rotate(${s.rot}deg)` : undefined,
                  display: 'flex', flexDirection: 'column', justifyContent: anchor,
                  background: s.fill || undefined,
                  border: s.line ? `${Math.max(1, s.line.w)}px solid ${s.line.color}` : undefined,
                  padding: s.ins ? `${s.ins.tIns}px ${s.ins.rIns}px ${s.ins.bIns}px ${s.ins.lIns}px` : undefined,
                  overflow: 'visible',
                }}
              >
                <Paras paras={s.paras || []} scale={s.scale} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
