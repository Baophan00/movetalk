import { useEffect, useMemo, useRef, useState } from 'react'

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
type Shape = {
  type: 'text' | 'image' | 'box' | 'table'
  x: number; y: number; w: number; h: number
  fill?: string | null
  line?: { color: string; w: number } | null
  radius?: number
  src?: string
  paras?: Para[]
  rows?: { h: number; cells: { paras: Para[]; fill?: string | null; span?: number }[] }[]
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

type Item = { x: number; y: number; w: number; h: number; paras: Para[]; sz: number; text: string; align: string }

function textOf(p: Para[]) {
  return p.map((x) => x.runs.map((r) => r.t).join('')).join(' ').trim()
}
function sizeOf(p: Para[]) {
  let m = 0
  for (const para of p) for (const r of para.runs) m = Math.max(m, r.sz || para.defSz || 18)
  return m
}

function palette(c?: string | null) {
  if (!c) return '#173F50'
  const m = /^#([0-9a-f]{6})$/i.exec(c)
  if (!m) return c
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  if (b > r + 18 && b > g - 10) return '#2D7894'
  if (r > b + 30 && r > g + 10) return '#B86C4C'
  return '#173F50'
}

const pxSize = (pt: number) => (pt >= 24 ? 26 : pt >= 20 ? 19 : pt >= 17 ? 16.5 : pt >= 14 ? 15.5 : pt >= 12 ? 13.5 : 12.5)
function isVeryLight(c?: string | null) {
  if (!c) return false
  const m = /^#([0-9a-f]{6})$/i.exec(c)
  if (!m) return false
  const n = parseInt(m[1], 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 205
}

function isDark(c?: string | null) {
  if (!c) return false
  const m = /^#([0-9a-f]{6})$/i.exec(c)
  if (!m) return false
  const n = parseInt(m[1], 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 130
}

const accentOf = (c?: string | null) => {
  const p = palette(c)
  return p === '#2D7894' ? { bg: '#FFFFFF', border: '#E7DED2', bar: '#2D7894' } : p === '#B86C4C' ? { bg: '#FFFFFF', border: '#E7DED2', bar: '#B86C4C' } : { bg: '#FFFFFF', border: '#E7DED2', bar: '#CFC5B6' }
}

const isNearWhite = (c?: string | null) => !c || /^#(F[0-9A-F]|E[F8])/i.test(c)

function RunText({ paras, size, light, plain }: { paras: Para[]; size: number; light?: boolean; plain?: boolean }) {
  return (
    <>
      {paras.map((p, i) => (
        <span key={i} className="block" style={{ textAlign: (p.algn as 'left' | 'center' | 'right') || 'left' }}>
          {p.runs.map((r, k) => (
            <span
              key={k}
              style={{
                fontSize: plain ? 16 : pxSize(r.sz || p.defSz || size),
                color: light ? '#FFFFFF' : plain ? 'inherit' : palette(isVeryLight(r.color) ? null : r.color),
                fontWeight: r.b ? 700 : 400,
                fontStyle: r.i ? 'italic' : 'normal',
              }}
            >
              {r.t}
            </span>
          ))}
        </span>
      ))}
    </>
  )
}

function TableBlock({ s }: { s: Shape }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[14.5px]" style={{ tableLayout: 'fixed' }}>
        <colgroup>{(s.cols || []).map((c, i) => <col key={i} style={{ width: c }} />)}</colgroup>
        <tbody>
          {(s.rows || []).map((row, ri) => (
            <tr key={ri}>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  colSpan={cell.span || 1}
                  className="border border-line/70 p-2.5 align-top"
                  style={{ background: isDark(cell.fill) ? cell.fill! : cell.fill && !isNearWhite(cell.fill) ? cell.fill : undefined }}
                >
                  <RunText light={isDark(cell.fill)} plain={!isDark(cell.fill)} paras={cell.paras} size={12} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DeckFlow({ lesson, num, edits = [] }: { lesson: number; num: number; edits?: { from: string; to: string; i?: number }[] }) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const host = useRef<HTMLDivElement | null>(null)

  useEffect(() => { let live = true; load(lesson).then((d) => live && setDeck(d)); return () => { live = false } }, [lesson])

  const model = useMemo(() => {
    const s = deck?.slides[String(num)]
    if (!s) return null
    const boxes = s.shapes.filter((x) => x.type === 'box' && x.h > 40 && x.w > 120 && (x.fill || x.line)).sort((a, b) => a.w * a.h - b.w * b.h)
    const items: Item[] = []
    const images: Shape[] = []
    const tables: Shape[] = []
    for (const sh of s.shapes) {
      if (sh.type === 'image') images.push(sh)
      else if (sh.type === 'table') tables.push(sh)
      else if (sh.type === 'text') {
        if (sh.y > 660 || sh.h < 8) continue
        const text = textOf(sh.paras || [])
        if (!text) continue
        items.push({ x: sh.x, y: sh.y, w: sh.w, h: sh.h, paras: sh.paras || [], sz: sizeOf(sh.paras || []), text, align: (sh.paras?.[0]?.algn as string) || 'left' })
      }
    }
    const norm = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase()
    const flat = items.flatMap((it) => it.paras)
    const taken = new Set<Para>()
    for (const e of edits) {
      const want = norm(e.from)
      let target: Para | null = null
      for (const it of items) {
        for (const para of it.paras) {
          if (taken.has(para)) continue
          const pt = norm(para.runs.map((r) => r.t).join(''))
          if (pt && (pt === want || pt.includes(want) || want.includes(pt))) { target = para; break }
        }
        if (target) break
      }
      if (!target && typeof e.i === 'number') {
        const cand = flat[e.i]
        if (cand && !taken.has(cand)) target = cand
      }
      if (!target) continue
      const first = target.runs[0]
      target.runs = [{ t: e.to, sz: first?.sz, b: first?.b, i: first?.i, color: first?.color }]
      taken.add(target)
    }
    for (const it of items) it.text = it.paras.map((pp) => pp.runs.map((r) => r.t).join('')).join(' ')

    // deck chrome
    const label = items.filter((i) => i.y < 55 && i.text === i.text.toUpperCase() && i.text.length < 60).sort((a, b) => a.y - b.y)[0]
    const rest = items.filter((i) => i !== label)
    const title = rest.slice().sort((a, b) => b.sz - a.sz || a.y - b.y)[0]
    const subtitle = rest.filter((i) => i !== title && i.y < 180 && i.sz <= 14 && i.text.length < 40).sort((a, b) => a.y - b.y)[0]
    const body = rest.filter((i) => i !== title && i !== subtitle)

    // text that sits inside a panel belongs to that panel
    const panels = boxes.map((b) => ({ box: b, items: [] as Item[] }))
    const loose: Item[] = []
    for (const it of body) {
      const cx = it.x + it.w / 2, cy = it.y + it.h / 2
      const host = panels.find((p) => cx >= p.box.x - 2 && cx <= p.box.x + p.box.w + 2 && cy >= p.box.y - 2 && cy <= p.box.y + p.box.h + 2)
      if (host) host.items.push(it)
      else loose.push(it)
    }
    type Block = { y: number; kind: 'panel' | 'row' | 'grid' | 'image' | 'table' | 'pair'; panel?: typeof panels[number]; group?: { box: Shape; items: Item[] }[]; items?: Item[]; shape?: Shape; image?: Shape; table?: Shape }
    const blocks: Block[] = []
    const panelBlocks: { box: Shape; items: Item[] }[] = panels.filter((p) => p.items.length)
    for (const sh of images) blocks.push({ y: sh.y, kind: 'image', shape: sh, image: sh })
    for (const sh of tables) blocks.push({ y: sh.y, kind: 'table', shape: sh, table: sh })

    // loose text groups into visual rows by vertical overlap
    const used = new Set<Item>()
    for (const it of loose) {
      if (used.has(it)) continue
      const group = [it]
      used.add(it)
      let changed = true
      while (changed) {
        changed = false
        for (const other of loose) {
          if (used.has(other)) continue
          const near = group.some((g) => !(other.y > g.y + g.h + 14 || other.y + other.h + 14 < g.y))
          if (near) { group.push(other); used.add(other); changed = true }
        }
      }
      group.sort((a, b) => a.y - b.y || a.x - b.x)
      blocks.push({ y: Math.min(...group.map((g) => g.y)), kind: 'row', items: group })
    }
    // panels that sit side by side share a row
    const rows: { box: Shape; items: Item[] }[][] = []
    for (const pb of panelBlocks.slice().sort((a, b) => a.box.y - b.box.y)) {
      const last = rows[rows.length - 1]
      if (last && Math.abs(pb.box.y - last[0].box.y) < 24) last.push(pb)
      else rows.push([pb])
    }
    for (const row of rows) blocks.push({ y: row[0].box.y, kind: 'grid', group: row })
    blocks.sort((a, b) => a.y - b.y)
    // pair an image with a table that sits beside it
    for (let i = 0; i < blocks.length; i++) {
      const im = blocks[i]
      if (im.kind !== 'image') continue
      const j = blocks.findIndex((b, k) => k !== i && b.kind === 'table' && Math.abs(b.y - im.y) < 90)
      if (j >= 0) {
        const tb = blocks[j]
        const pair: Block = { y: im.y, kind: 'pair', image: im.image, table: tb.table }
        blocks.splice(Math.max(i, j), 1)
        blocks.splice(Math.min(i, j), 1, pair)
        break
      }
    }
    return { label, title, subtitle, blocks, images, tables, rowPanels: rows }
  }, [deck, num])

  if (!deck) return <div className="h-[280px] animate-pulse rounded-2xl border border-line bg-bg/40" />
  if (!model) return <div className="rounded-2xl border border-dashed border-line bg-bg/40 p-6 text-[14px] text-muted">Slide này chưa có nội dung.</div>

  return (
    <div ref={host} className="space-y-5">

      {model.blocks.map((b, i) => {
        if (b.kind === 'image' && b.shape) {
          return (
            <figure key={i} className="overflow-hidden rounded-xl border border-line bg-white">
              <img src={b.shape.src} alt="" className="mx-auto max-h-[420px] w-auto max-w-full object-contain" />
            </figure>
          )
        }
        if (b.kind === 'pair' && b.image && b.table) {
          return (
            <section key={i} className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
              <figure className="overflow-hidden rounded-xl border border-line bg-white">
                <img src={b.image.src} alt="" className="w-full object-contain" />
              </figure>
              <TableBlock s={b.table} />
            </section>
          )
        }
        if (b.kind === 'table' && b.shape) return <TableBlock key={i} s={b.shape} />
        if (b.kind === 'grid' && b.group) {
          const row = b.group
          return (
            <section key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${row.length > 2 ? 220 : 280}px, 1fr))` }}>
              {row.map((pb, k) => {
                const { box, items } = pb
                const head = items.find((it) => it.text === it.text.toUpperCase() && it.text.length < 70 && !it.text.includes('?') && !it.text.includes('___'))
                const bodyItems = items.filter((it) => it !== head)
                const accent = accentOf(head?.paras[0]?.runs[0]?.color || bodyItems[0]?.paras[0]?.runs[0]?.color || items[0]?.paras[0]?.runs[0]?.color)
                const note = box.h < 74 && !isDark(box.fill)
                if (note) {
                  return (
                    <div key={k} className="rounded-xl border border-primary/20 bg-primary-soft/50 px-4 py-3">
                      {items.map((it, j) => <p key={j} className="text-[14.5px] leading-relaxed text-ink/80"><RunText plain paras={it.paras} size={14.5} /></p>)}
                    </div>
                  )
                }
                return (
                  <div key={k} className="rounded-2xl border border-line bg-surface p-5">
                    {head && <p className="text-[14.5px] font-extrabold uppercase tracking-wide" style={{ color: accent.bar }}>{head.text}</p>}
                    <ul className="mt-3 space-y-2">
                      {bodyItems.map((it, j) => (
                        <li key={j} className="break-words border-l-2 pl-3 text-[16px] leading-relaxed text-ink/90" style={{ borderColor: accent.bar + '66' }}>
                          <RunText plain paras={it.paras} size={it.sz} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </section>
          )
        }
        const items = b.items || []
        // split into visual columns when there is a wide gutter and both sides carry real text
        const sorted = items.slice().sort((x, y) => x.x - y.x)
        const cols: Item[][] = []
        for (const it of sorted) {
          const last = cols[cols.length - 1]
          if (last && it.x - Math.max(...last.map((l) => l.x + l.w)) > 110) cols.push([it])
          else if (last) last.push(it)
          else cols.push([it])
        }
        const twoCol = cols.length === 2 && cols.every((c) => c.reduce((m, i2) => Math.max(m, i2.w), 0) > 240)
        if (twoCol) {
          return (
            <section key={i} className="grid gap-4 sm:grid-cols-2 sm:gap-8">
              {cols.map((col, k) => (
                <div key={k} className="space-y-2">
                  {col.sort((x, y) => x.y - y.y).map((it, j) => <p key={j} className="text-[16px] leading-relaxed text-ink/90"><RunText plain paras={it.paras} size={16} /></p>)}
                </div>
              ))}
            </section>
          )
        }
        return (
          <section key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
            {items.map((it, k) => {
              const prev = items[k - 1]
              const gap = prev ? it.x - (prev.x + prev.w) : 0
              return (
                <span key={k} className="inline-flex items-baseline gap-3">
                  {prev && gap > 55 && Math.abs(it.y - prev.y) < 30 && (
                    <span className="inline-block w-16 border-b-2 border-ink/25 align-baseline" />
                  )}
                  <span className="text-[16px] leading-relaxed text-ink/90"><RunText plain paras={it.paras} size={16} /></span>
                </span>
              )
            })}
          </section>
        )
      })}

    </div>
  )
}
