# MoveTalk — block-based UI pass

Brief: content reads like a document (consecutive text, simple line breaks) instead
of a management/learning app. Move the right screens to a block-based UI: grids,
sections with real headings, status as badges, one clear action per row.

This file is the audit (step 1 of the brief's workflow) plus the new layout per
screen. Written from the live DOM and the render functions, not from memory.

## What each screen renders today (audited)

| Screen | Where it renders | Today | Verdict |
|---|---|---|---|
| Landing | `renderHome`, static `<section id="v-home">` | 12 stacked `.scroll-section` blocks, each a paragraph of prose | Section order was rewritten in an earlier pass; still text-first, no course cards |
| Dashboard / Learning path | `renderDashboard` | 4 stat cards, then Continue learning + Your progress in a 2-col grid, then My homework and Latest feedback each full width | Closest to an app already. Missing: courses, today, vocabulary. Homework and feedback stacked full width leaves the right half of the page empty and the page very tall |
| Lessons (F1 F2 A1 A2 E1 E2) | `renderTrackInner`, `trackGrid` | Part list is a card grid (good). The lesson list is a flat 50-button numbered rail with no grouping, no state, and no action beyond a number | Wall of numbers. Needs modules, done/current/not-started, and a real action per row |
| Student homework | `renderHomework`, `hwRenderList`, `hwRenderDetail` | Header, then a list of rows; sessions card on top | Rows carry title + status; needs due/next action made explicit per card |
| Teacher workspace | `renderTeacher`, `tcRenderOverview`, `tcRenderStudents`, `tcRenderAssignments`, `tcRenderSchedule` | Tabs; students and assignments are real tables now; overview is stat cards + Today + lists | Tables are right. Student *detail* still renders as consecutive lines (`tcStudentWork`, `tcWorkLine`, `tcPartLine`) |
| Teaching Studio | `renderTrack` + `studioBar` | Full-width lesson, sticky control bar, keyboard, rail and sidebar hidden | Deliberately content-first, stays that way. No card grid in the lesson body |
| Vocabulary Hub | does not exist | — | Not built. Student dashboard must not fake it |

## New layout per screen

**Dashboard** (grid, sections, real data only)
1. Page head: identity, homework / password / sign out.
2. Stat cards: lessons done, words learned, streak, level. Unchanged.
3. Grid 3-up on wide, 2-up on tablet, 1 on phone: **Today** (next class + what is due), **Continue learning**, **Your progress**.
4. **Your courses**: one card per track with programme heading, lesson count opened out of the lessons that have content, a progress bar, a status badge and one action (Start / Continue / Open). Programmes: Foundation, Activation, Expand.
5. **My homework** and **Latest feedback** side by side instead of stacked, so the page is two columns and not one long strip.
6. Empty states stay honest: no session, no homework, no feedback each say so.

**Lessons**: lesson list grouped by module (5 per module) with a state per lesson
(open/current/not started) and a state legend, instead of a flat 50-number rail.

**Teacher student detail**: progress as blocks per track with part counts and
status badges, not a paragraph of lines.

**Homework**: task cards with due, status, owner and the next action.

## Rules held throughout

- Reuse the tokens and the components that already exist (`.stat`, `.card`, `.table`,
  `.badge-*`, `.progress-track`, `.empty`); no new page-specific styling.
- No card-in-card nesting, no block where a line is clearer.
- No fabricated numbers: every block is fed by data the app already has, and shows
  an honest empty state when there is none.
- Lesson content, order and pedagogy untouched. One render path for lesson bodies.
- Backend, schema and auth unchanged.
