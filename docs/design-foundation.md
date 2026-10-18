# MoveTalk — design foundation (pre-build spec)

Status: **proposal, nothing implemented.** Created before the restructure prompt, per the brief that
asks for the system to be defined before any page is built. No code in `index.html` was touched.

---

## 0. Stack check (read, not assumed)

| What | Current | Verdict |
|---|---|---|
| Markup | one `index.html`, `<html data-theme="light">` | keep |
| CSS | `<style>` block with ~90 CSS vars + Tailwind **Play CDN** | keep vars, keep CDN |
| JS | one inline `<script>`, plus `config.js` and supabase-js as `<script src>` | keep |
| Framework | none. No React, no bundler, no TS | **do not add** |
| Fonts | Inter 400-700 + Inter Tight 500-700 (Google Fonts) | keep, extend usage |
| Tests | `npm test` = 5 node files, 828 assertions, extracting the inline script with a regex | **a second inline script breaks them** |
| Deploy | `bash tools/deploy.sh` → Surge, single artifact | a build step would break the artifact |

**Decision:** React + TypeScript + shadcn/ui are the wrong move here. They would require a bundler, a
second JS artifact, and would invalidate the regex the 828 assertions run on. The brief's own rule
("don't change technology just to use a library") applies. What we take from those stacks instead:
their *discipline* — a token layer, one component vocabulary, one icon set, motion as a system.

Substitutes:
- **Lucide icons** → inline SVG sprite (same 24px grid, 1.5px stroke), no runtime dependency.
- **Motion** → CSS transitions with two named durations; no JS animation library.
- **shadcn/ui** → a documented local vocabulary of `.btn`, `.card`, `.field`, `.table`, `.badge`,
  already half-present in the stylesheet; this spec finishes the set.

Measured inconsistency worth fixing first: `border-radius` is currently 8px (16 uses), 12px (15),
14px (12), 10px (12), 9px (6), 50% (11), plus `--radius-card` / `--radius-sm`. Six radii is why the
UI reads as assembled rather than designed.

---

## 1. What the research actually says (and what we take)

**Role separation is the product, not a feature.** EdTech UX reviews keep landing on the same failure:
one interface serving student, teacher and admin, so none of them gets what it came for
(thefinch.design, 2026). MoveTalk already has three real surfaces — landing, teacher, student. The
system must make them *feel* different while sharing one language.

**The teacher's screen answers one question in the first five minutes: "is anyone in trouble?"**
Classroom observation studies (adaptcourse, 2025) found the daily scan is binary — most students are
fine, a few need something different today. Two things they got wrong and we should avoid: a dense
per-student grid with a cumulative mastery % as the loudest element, and a filter panel nobody opens.
Per-student history belongs to weekly planning, not the dashboard.

**Students want deadlines, not dashboards.** The student surface earns its keep by answering "what do
I do now, and how long will it take", then getting out of the way.

**A shape language is what makes a product recognisable.** Duolingo's illustration system is built
from three primitives (rounded rectangle, circle, rounded triangle) applied consistently. We adopt
the *method* — a small set of primitives used everywhere — with our own geometry, not their owl.

**Anti-template rules from the brief, restated as tests we can fail:** white page + identical cards =
fail. Decorative gradient = fail. Colour change without layout change = fail. Empty space with no job
= fail.

---

## 2. Brand idea

MoveTalk teaches workplace English to Vietnamese adults who lost the basics. The emotional target is
not "playful kid app" and not "enterprise LMS". It is **the evening desk**: one lamp, one lesson, one
page of notes — plus the feeling that this is the English you will actually use at work tomorrow.

Signature elements (each must survive being seen in greyscale):

1. **Ink + paper, one signal.** Warm paper canvas, deep navy ink, and a single saturated signal that
   only ever marks *the one thing to do next*. Everything else is neutral.
2. **The marker stroke.** Headings sit on a hand-drawn highlighter bar (SVG, 6px, offset), not a
   gradient. It is the one ornament; it appears on the landing hero and on section titles, nowhere else.
3. **Programme spines.** Every course card carries a 3px coloured spine (A1 / E2 / F1) and a mono code
   chip. Cards are therefore not interchangeable — they are labelled objects.
4. **Geometric spot art.** Four primitives: rounded square, circle, half-circle, rounded triangle.
   Composed into 4 spot illustrations (desk, path, chat bubble, checkmark stack). No stock people, no
   emoji, no mascot.
5. **Numbers are data, so numbers are mono.** Lesson numbers, part counters, marks, percentages and
   dates use the mono face with tabular figures.

---

## 3. Colour

Keep the existing token names — they are the contract with ~90 rules already in the stylesheet. Only
values and *usage rules* change. Light is default; dark is a full peer, not an afterthought.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FBFAF7` warm paper | `#0F1729` | page |
| `--surface` | `#FFFFFF` | `#161F33` | cards, sheets |
| `--surface2` | `#F5F7FA` | `#1D2841` | inset rows, table head |
| `--surface3` | `#EDF1F7` | `#243049` | pressed, tracks |
| `--text` | `#0F1B2D` | `#F2F5FA` | headings, body |
| `--text2` | `#5B6B7F` | `#9BAAC4` | secondary, meta |
| `--border` | `rgba(15,27,45,.10)` | `rgba(255,255,255,.09)` | hairline, always 1px |
| `--accent` | `#2563EB` | `#6C9BF2` | primary action, links, focus |
| `--signal` | `#E8890C` | `#F2A93B` | **only** the next action, streak, "due today" |
| `--ok` | `#0E9F6E` | `#34D399` | correct, accepted, handed in |
| `--warn` | `#B45309` | `#FBBF24` | due soon, pending |
| `--err` | `#DC2626` | `#F87171` | wrong, blocked, rejected |
| `--lav` | `#6D5BD0` | `#C3B8FB` | teacher-side marker only |

Rules:
- Signal amber appears **at most once per screen**. If two things compete for it, one is not actually
  the next action.
- No colour carries meaning alone: every state pairs with an icon or a word.
- Dark mode is not "light with inverted greys": surfaces step up in lightness (`bg` → `surface` →
  `surface2`), borders get thinner in contrast, and the accent desaturates (blue → `#6C9BF2`).
- No gradients except the 2px hero hairline. Any `linear-gradient` in the new work must be a hairline
  or the marker stroke, nothing else.

---

## 4. Typography

Faces already loaded: **Inter Tight** (display), **Inter** (text), plus a mono face for data.
Add one weight only: Inter 400 stays the body default; do not introduce a third family.

| Role | Face | Size / line-height | Tracking |
|---|---|---|---|
| Hero H1 | Inter Tight 700 | 44 / 48 (mobile 32 / 36) | -0.03em |
| H2 section | Inter Tight 600 | 28 / 34 (mobile 24 / 30) | -0.02em |
| H3 card title | Inter Tight 600 | 19 / 26 | -0.01em |
| Body | Inter 400 | 16 / 26 | 0 |
| Body small | Inter 400 | 14 / 22 | 0 |
| Meta / label | Inter 500 | 12 / 16, uppercase | 0.06em |
| Data / numerals | mono 500 | 14 / 20 | tabular |
| Code chip | mono 600 | 12 / 16 | 0.02em |

Rules:
- Max measure 68 characters for prose blocks; lesson body text 15-17px, never below 15 in content.
- One `h1` per view. Section titles are `h2` + optional marker stroke.
- Vietnamese diacritics: never set body below 15px, never use `text-transform: uppercase` on Vietnamese
  words with diacritics at small size (they collide). Uppercase is for Latin-only meta labels.
- Numbers in tables, marks and progress: mono, tabular, right-aligned.

---

## 5. Space, size, border, shadow, radius

**Spacing** — 4px base. Allowed steps only: 4, 8, 12, 16, 24, 32, 48, 64.
- Section vertical rhythm: 48 desktop / 32 mobile.
- Card padding: 20 (default), 16 (compact rows), 24 (hero/feature cards only).
- Dense data areas (tables, record rows): 8 vertical, 12 horizontal.

**Radius** — three values, no exceptions:

| Token | Value | Applies to |
|---|---|---|
| `--r-sm` | 6px | inputs, chips, small buttons, code chips |
| `--r-md` | 10px | cards, panels, modals, table wrappers |
| `--r-pill` | 999px | badges, pills, nav items, audio buttons |

**Border** — 1px hairline only. Emphasis is *not* a thicker border; it is a 3px left spine (cards) or
a 2px bottom rule (active tab).

**Shadow** — one elevation, used only for things that float above the page (modal, toast, dropdown):

    --shadow-float: 0 1px 2px rgba(15,27,45,.06), 0 12px 32px -16px rgba(15,27,45,.24);

Cards are **not** shadowed. They are separated by the hairline and the canvas colour. This is the
single biggest visual difference from an AI-template layout.

**Motion** — two durations, one curve:
- `--t-fast: 120ms` (hover, press, toggle)
- `--t-base: 180ms` (panel, modal, view change)
- `--ease: cubic-bezier(.2,.7,.3,1)`
- Only `opacity` and `translateY(4px)` animate on entry. No scale-in on cards, no bounce.
- `@media (prefers-reduced-motion: reduce)` → all transitions to 0ms.

---

## 6. Component vocabulary

One class per job, all theme-var driven, all already partially present:

**Buttons** — `.btn` + `.btn-primary` (accent fill, 1px darker bottom edge, no glow),
`.btn-secondary` (surface + hairline), `.btn-quiet` (text only, hover surface2), `.btn-danger`
(err text + err-tinted surface), `.btn-sm` (32px), default 40px, mobile tap target ≥ 44px.
States: hover (8% darker), active (translateY 1px), `:focus-visible` (2px `--accent` ring, 2px offset),
`.is-loading` (spinner + label unchanged, `aria-busy`).

**Cards** — three real variants, not one box reused:
1. `.card` — plain panel, hairline, radius 10, no shadow.
2. `.card-spine` — adds the 3px programme spine + mono chip; used for course/programme objects.
3. `.stat` — label (meta), value (mono 28-32), hint (body small), optional 3px trend bar.
Lesson content inside a card is not a card: use `.block` with a heading and a hairline divider.

**Forms** — `.field` (label 12 uppercase Latin / input 40px / hint 14), `.input` (hairline, radius 6,
focus = accent ring 2px), `.input.invalid` (err border + `.field-error` text with icon).
Error text always below the field, never a toast alone.

**Navigation** — sidebar: 264px, one active item = surface2 fill + 2px accent bar on the left, icons
Lucide 20px, labels 14. Groups get a meta label, not a divider. Phone: 4 tabs, active = accent icon +
accent label + 2px top rule. No hamburger on phone.

**Table / record rows** — `.table` header meta 12 uppercase on surface2; rows 44px, hairline between,
numbers mono right-aligned. Under 640px each row becomes a stacked block with `data-label` prefixes.

**Feedback** — `.badge-*` (ok / warn / err / pending, each `-bg`/`-fg` pair), `.toast` (bottom-centre
desktop, bottom-above-tabbar mobile), `.empty` (spot art + one sentence + one action, never a dead
end), `.sk` skeletons for anything that awaits Supabase.

**Lesson-specific** — `.fc-card` flashcard (front word + phonetic, back meaning + 2 examples),
`.audio-pill` (Lucide volume + 8 waveform ticks, no emoji), `.part-row` (mono index + title + state),
`.path-node` (student path: done / current / locked), `.progress-track` (6px, radius pill).

---

## 7. The three surfaces

### Landing
Job: explain the promise in six seconds and show that real lessons exist behind it.
- Hero: paper canvas, marker stroke behind two words of the H1, one anchor object on the right — a
  real lesson card at a slight rotation showing actual A1 content and the 🔊 pill. Not a screenshot
  collage, not a gradient blob, not a stock photo.
- Immediately under it: three proof numbers read from the product (lessons, parts, words), mono face.
- Programme rows: `.card-spine` × 3, each with real lesson count; a programme with no content is a
  dim row that says so in words, no CTA.
- One closing action. No testimonial carousel, no logo wall, no feature grid of six equal cards.

### Teacher workspace
Job: answer "who needs me today" then get out of the way. Desktop-first, dense, quiet.
- Top: 4 `.stat` counters (students / waiting / to mark / next session) then **the waiting-work
  table** — the binary scan. Per-student history stays one level down, behind the student row.
- No filter panel. Sorting is in the table header; search is a single input in the section bar.
- Mono numerals everywhere, so columns line up and rows can be scanned fast.
- Five sections stay (Dashboard · Courses · Students · Materials · Chat). Materials keeps saying in
  words that there is no storage bucket.

### Student workspace
Job: "what now", visible progress, and a reason to come back tomorrow.
- One hero action: today's lesson, its next part, and the time it takes.
- The path replaces the 50-button grid: 10 nodes per programme, states as done / current / locked,
  the current node is the only one with signal amber.
- Satellites, small and factual: words learned, words to review, streak — each opens the vocabulary
  hub or the review list. No invented minutes, no fake activity calendar.
- Homework: two groups only, "To do" and "Handed in", with the next action in words on every card.

---

## 8. Accessibility and quality gates

- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 24px). Check `--text2` on `--surface2` before shipping.
- `:focus-visible` visible on every interactive element; keyboard order matches visual order.
- Tap targets ≥ 44px on phone; phone nav never hides behind a scroll.
- No state conveyed by colour alone.
- Vietnamese strings: never truncate mid-diacritic; test the longest label per component.
- Every screen must survive 360px, 390px, 768px, 1280px and 1440px without horizontal scroll.

## 9. Build order for the next prompt (not started)

1. Tokens + type scale + radius/space/shadow consolidation (one pass, no visual surprises).
2. Shared components (button, card 3 variants, field, badge, table, empty, toast, audio pill).
3. Landing (it defines the brand), verified in browser at 390 and 1440.
4. Student workspace (path + dashboard + homework).
5. Teacher workspace (dense pass last, it depends on the components being final).
6. Responsive/QA sweep + screenshot review desktop/phone, fix, then deploy.

Verification constraints to be honest about: `browser_exec` hung twice on this machine (known daemon
issue), so the fallback is a puppeteer pass against the exact live artifact plus `ui_shots.js`-style
screenshots. Screenshots of the signed-in teacher area need the teacher credential (not stored here);
the student and landing surfaces can be verified through the guest path and the `USER` fixture.
