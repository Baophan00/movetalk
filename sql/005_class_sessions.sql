-- ============================================================
-- MoveTalk — class sessions (the teacher schedules a class)
--
-- The brief asks for a schedule the teacher can plan and the
-- student can see. The product model stays as it is: ONE
-- teacher, students are ACCEPTED (003), and nobody is enrolled
-- into a class any more. So a session is not tied to class
-- membership — there is no membership UI and inventing one here
-- would be a new feature, not a schedule.
--
-- A session belongs to the teacher who created it. The teacher
-- reads and writes their own; an ACTIVE student reads every
-- session, which is the same reach profiles_select already gives
-- the two sides. Pending and rejected students see nothing, so a
-- request that has not been accepted yet learns no timetable.
--
-- Cancelling keeps the row (status) rather than deleting it: the
-- student who already made time for it should see it was called
-- off, and the teacher keeps the record.
--
-- Idempotent, and it grants its own privileges: the test harness
-- applies every sql/0*.sql against a throwaway Postgres that
-- grants nothing to authenticated by itself.
-- ============================================================

create table if not exists public.class_sessions (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (length(trim(title)) between 1 and 120),
  starts_at    timestamptz not null,
  duration_min int not null default 60 check (duration_min between 10 and 480),
  lesson_track text,
  lesson_no    int,
  note         text,
  status       text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at   timestamptz not null default now()
);

create index if not exists class_sessions_starts_idx  on public.class_sessions(starts_at);
create index if not exists class_sessions_teacher_idx on public.class_sessions(teacher_id);

alter table public.class_sessions enable row level security;

drop policy if exists cs_select on public.class_sessions;
create policy cs_select on public.class_sessions for select using (
  teacher_id = auth.uid()
  or (
    public.my_role() = 'student'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student' and p.status = 'active'
    )
  )
);

-- Only the teacher who owns the row may write it, and may not hand it to
-- somebody else. Using and with check are both stated: the check alone would
-- let an owner edit a row they had been given by a previous with check.
drop policy if exists cs_write on public.class_sessions;
create policy cs_write on public.class_sessions for all
  using (public.my_role() = 'teacher' and teacher_id = auth.uid())
  with check (public.my_role() = 'teacher' and teacher_id = auth.uid());

grant select on public.class_sessions to authenticated;
grant insert, update, delete on public.class_sessions to authenticated;
