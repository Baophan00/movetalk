# MoveTalk UI/UX plan

Written 2026-10-13. Source of truth for the design pass. Scope: presentation, states and
interaction. Lesson content, lesson data and the Supabase schema for homework stay as they are
unless a workflow below needs a new table.

## 1. Audit summary (measured, not assumed)

Already in place:

- 141 design tokens in two blocks, `:root,[data-theme="dark"]` and `[data-theme="light"]`.
  Light is the default (`--bg #FBFAF7`, `--surface #FFFFFF`, `--text #0F1B2D`, `--accent #2563EB`),
  dark stays on the sidebar toggle.
- A shared component layer: `.stat`, `.badge-*`, `.btn-quiet`, `.btn-sm`, `.row-list`, `.avatar`,
  `.progress-track`, `.empty`, `.sk`, `.table-wrap`, `.chip`.
- 10 views (`v-home`, `v-f1`, `v-f2`, `v-a1`, `v-a2`, `v-e1`, `v-e2`, `v-dashboard`, `v-homework`,
  `v-teacher`), all reachable, no JS errors on the live site, no dead `onclick` target (86 of 86
  resolve to a defined function).
- Role gating: `teacher-only` nav hidden from students, sign-in gates on dashboard and homework.
- Teacher module (`src/homework.js`, 1284 lines): overview, students with accept/decline,
  assignment builder, submissions, grading, lesson progress.
- `classes` and `class_members` tables exist in `sql/001_homework.sql` and the teacher module
  already loads classes and rosters.

Gaps against the brief:

- No Teaching Studio (no dedicated teaching layout, no prev/next, no keyboard control).
- No class scheduling anywhere: no session table, no date/time UI, no "today" or "upcoming".
- No Vocabulary Hub: no search, no saved words, no word-detail view.
- Tables are almost unused (one `<table>` in the whole app) even where records are compared.
- State coverage is thin: no `:focus-visible`, no `.field-error`, no confirm dialog for
  destructive actions, toast exists but is only wired to a few paths.
- Iconography is mixed: 31 emoji used as icons next to 44 inline SVGs.
- Landing is 10 stacked sections inside the app shell (sidebar always visible), so it is not a
  public landing page and the narrative is not a single story.
- No keyboard navigation anywhere (0 `keydown` listeners, 0 `tabindex` in the app).
- Naming: the brief says "Explane"; the code says `Expand` (E1, E2). Not renamed until confirmed.

## 2. Design tokens and reusable components (step 4)

Keep the existing token names, add only what the brief needs:

- Focus: `--focus-ring` plus one global `:focus-visible` rule for every interactive element.
- States: `.is-loading`, `.is-disabled`, `.field-error`, `.field-hint`, `.form-note`,
  `.state-ok`, `.state-warn`.
- Density: `--space-*` scale is already implicit in the utility classes; add `--row-h` for tables.
- Components to standardise and reuse everywhere: button (`btn-primary`, `btn-secondary`,
  `btn-quiet`, `btn-sm`, `btn-danger`), input group (`.field` with label, hint, error), select,
  tabs (`.pill` group), badge, table (`.table` inside `.table-wrap`), card, dialog
  (`.modal-overlay`), confirm dialog, toast, empty state, skeleton, progress bar, avatar.

Rules: no page-specific one-off colours, no second implementation of the same control, every
control has hover, focus, active, disabled and (where it saves) loading and saved states.

## 3. Screens

Landing (public, no sidebar): hero with English-learning message and one primary CTA, how the
method works, the three tracks (Foundation, Activation, Explane/Expand), the placement entry,
and a single closing action. One narrative, not sections stacked for their own sake.

Teacher workspace: compact persistent sidebar, content area with Today and Upcoming sessions,
students needing attention, submissions to grade, and quick links. Tables for students,
assignments and submissions. Cards only for the summary band.

Teaching Studio: dedicated full-width teaching view. Lesson content is the largest element,
prev/next controls, part list, audio control that stays visible but out of the way, keyboard
(ArrowLeft/ArrowRight part, Space play, Esc back), large type, works on a projector.

Student workspace: answers what to do today, what is due, where to continue, which words to
review. No teacher navigation, no admin data.

Vocabulary Hub: search across the words that exist in the lesson data, word detail (word, IPA,
meaning, part of speech when the data has it, audio when a clip exists, examples), saved words
per account backed by localStorage when signed out and Supabase when signed in. Nothing
fabricated: no IPA, audio or progress that the data does not contain.

## 4. Workflows to make work end to end (each tested, not just rendered)

1. Teacher opens and teaches a lesson (Teaching Studio).
2. Teacher manages a student and reads their progress.
3. Teacher schedules a class (new: session table, create with validation, list, cancel with
   confirmation, student sees their own upcoming sessions).
4. Teacher creates and assigns an exercise.
5. Student opens, completes and submits an exercise.
6. Teacher grades and leaves feedback.
7. Student reads feedback and reviews vocabulary.

## 5. Order of work

1. Shared layer: focus, states, table, field validation, confirm dialog, toast wiring. (this pass)
2. Teacher workspace: tables, states, scheduling, Today/Upcoming.
3. Teaching Studio.
4. Student workspace + Vocabulary Hub.
5. Landing narrative.
6. Responsive and accessibility pass on desktop, tablet and mobile, keyboard only walkthrough.
7. Deploy, then re-verify on the live URL, and report what is still open.

## 6. Constraints

Reuse the existing single-file architecture, `src/homework.js` plus its build script, and the
existing Supabase project. No framework migration, no new backend or auth provider. Lesson data
and existing user data are protected. A feature is only called done after its workflow has been
walked through on the live site.
