-- ============================================================
-- MoveTalk — who may read a student's lesson-part progress
--
-- 001 scoped the teacher's read of lesson_progress through a
-- class (class_members > classes). The product model dropped
-- classes: students are ACCEPTED by the teacher, not enrolled,
-- and nothing in the app can create a class or a membership any
-- more. So that arm always evaluated to false and the Teaching
-- view showed no progress at all, while the student's own
-- dashboard showed real numbers.
--
-- The relationship the model actually has: a teacher may read the
-- progress of an ACTIVE student. This is the same rule
-- profiles_select already uses (003: the teacher may read every
-- student profile), so it grants no reach the teacher did not
-- already have. Pending and rejected students stay invisible,
-- matching is_assigned().
--
-- Idempotent. Nothing is granted here that 001 did not grant.
-- ============================================================

drop policy if exists lp_select on public.lesson_progress;
create policy lp_select on public.lesson_progress for select using (
  student_id = auth.uid()
  or (
    public.my_role() = 'teacher'
    and exists (
      select 1
      from public.profiles p
      where p.id = lesson_progress.student_id
        and p.role = 'student'
        and p.status = 'active'
    )
  )
);

-- lp_write is deliberately untouched: a student writes their own rows, and only
-- while the teacher has accepted them (003).
grant select on public.lesson_progress to authenticated;
