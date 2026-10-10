-- ============================================================
-- MoveTalk v2 — Homework & Assignment System
-- Postgres / Supabase migration. Safe to re-run (idempotent).
--
-- Design notes
--  * Existing course content (LESSON_DATA / TRACKS / audio) is NOT
--    touched. Assignments reference lessons by (track, lesson_no)
--    only — a stable reference, never a copy of lesson content.
--  * Answer keys live in a SEPARATE table (question_keys) that
--    students cannot read at all. Grading happens in a
--    SECURITY DEFINER function, never in the browser.
--  * Every student gets an independent submission + progress row.
--  * No existing table is dropped or truncated. No seed over data.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. PROFILES  (role lives here, not in the client)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'student' check (role in ('teacher','student')),
  created_at timestamptz not null default now()
);

-- Role is decided once by the signup payload, then frozen.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,'user'),'@',1)),
    case when new.raw_user_meta_data->>'role' = 'teacher' then 'teacher' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Self-service role change is impossible; only service/admin can flip it.
create or replace function public.freeze_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() = old.id then
    raise exception 'role_change_not_allowed';
  end if;
  return new;
end $$;

drop trigger if exists profiles_freeze_role on public.profiles;
create trigger profiles_freeze_role
  before update on public.profiles
  for each row execute function public.freeze_role();


-- ------------------------------------------------------------
-- 3. CLASSES
-- ------------------------------------------------------------
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 120),
  join_code  text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists classes_teacher_idx on public.classes(teacher_id);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student_idx on public.class_members(student_id);

-- ------------------------------------------------------------
-- 4. ASSIGNMENTS
-- ------------------------------------------------------------
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (length(trim(title)) between 1 and 200),
  instructions text not null default '',
  kind         text not null default 'custom' check (kind in ('lesson','custom')),
  -- stable reference into the existing course, never a content copy
  lesson_track text,
  lesson_no    int,
  assigned_at  date not null default current_date,
  due_at       date,
  status       text not null default 'draft' check (status in ('draft','published','closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint assignment_lesson_ref check (
    kind <> 'lesson' or (lesson_track is not null and lesson_no is not null and lesson_no > 0)
  )
);
create index if not exists assignments_teacher_idx on public.assignments(teacher_id);
create index if not exists assignments_status_idx  on public.assignments(status);

create table if not exists public.assignment_recipients (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  class_id      uuid references public.classes(id) on delete cascade,
  student_id    uuid references public.profiles(id) on delete cascade,
  check ((class_id is null) <> (student_id is null))
);
create unique index if not exists ar_class_uq   on public.assignment_recipients(assignment_id, class_id)   where class_id   is not null;
create unique index if not exists ar_student_uq on public.assignment_recipients(assignment_id, student_id) where student_id is not null;

-- Questions: no answer key column here on purpose.
create table if not exists public.assignment_questions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  ord           int  not null default 1,
  qtype         text not null check (qtype in ('mcq','fill','text')),
  prompt        text not null check (length(trim(prompt)) > 0),
  options       jsonb,
  points        int  not null default 1 check (points between 0 and 100),
  created_at    timestamptz not null default now()
);
create index if not exists aq_assignment_idx on public.assignment_questions(assignment_id, ord);

create table if not exists public.question_keys (
  question_id uuid primary key references public.assignment_questions(id) on delete cascade,
  correct     jsonb not null,
  explanation text
);

-- ------------------------------------------------------------
-- 5. SUBMISSIONS & PROGRESS
-- ------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'in_progress'
                check (status in ('in_progress','submitted','graded','returned')),
  attempt       int  not null default 1 check (attempt > 0),
  score         numeric,
  max_score     numeric,
  feedback      text,
  graded_by     uuid references public.profiles(id) on delete set null,
  submitted_at  timestamptz,
  graded_at     timestamptz,
  updated_at    timestamptz not null default now(),
  unique (assignment_id, student_id, attempt)
);
create index if not exists subs_assignment_idx on public.submissions(assignment_id);
create index if not exists subs_student_idx    on public.submissions(student_id);

-- ON DELETE RESTRICT: deleting a question can never wipe submissions.
create table if not exists public.submission_answers (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  question_id     uuid not null references public.assignment_questions(id) on delete restrict,
  answer          jsonb,
  is_correct      boolean,
  points_awarded  numeric,
  updated_at      timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index if not exists sa_submission_idx on public.submission_answers(submission_id);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  track        text not null,
  lesson_no    int  not null check (lesson_no > 0),
  part         text not null,
  completed_at timestamptz not null default now(),
  unique (student_id, track, lesson_no, part)
);
create index if not exists lp_student_idx on public.lesson_progress(student_id);

-- ------------------------------------------------------------
-- 2. AUTHORIZATION HELPERS  (SECURITY DEFINER => no RLS recursion)
-- ------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_teacher_of_class(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = c and teacher_id = auth.uid())
$$;

create or replace function public.is_member_of_class(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = c and student_id = auth.uid())
$$;

create or replace function public.is_teacher_of_assignment(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.assignments where id = a and teacher_id = auth.uid())
$$;

-- A non-draft assignment is "mine" if I am a direct recipient, or a
-- member of a recipient class. Closed assignments stay visible so a
-- student can review their work and feedback.
create or replace function public.is_assigned(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assignments asg
    join public.assignment_recipients r on r.assignment_id = asg.id
    where asg.id = a
      and asg.status in ('published','closed')
      and (
        r.student_id = auth.uid()
        or (r.class_id is not null and public.is_member_of_class(r.class_id))
      )
  )
$$;

-- "Open" = still accepting submissions. Closing never hides work.
create or replace function public.is_open(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.assignments where id = a and status = 'published')
$$;

create or replace function public.owns_submission(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.submissions where id = s and student_id = auth.uid())
$$;

create or replace function public.assignment_of_submission(s uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select assignment_id from public.submissions where id = s
$$;

-- ------------------------------------------------------------
-- 6. INTEGRITY TRIGGERS
--    "An assignment change must never silently destroy submissions."
-- ------------------------------------------------------------
create or replace function public.protect_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_op = 'DELETE' then
    select count(*) into n from public.submissions where assignment_id = old.id;
    if n > 0 then
      raise exception 'assignment_has_submissions: cannot delete an assignment with % submission(s)', n;
    end if;
    return old;
  end if;

  -- UPDATE
  select count(*) into n from public.submissions where assignment_id = old.id;
  if n > 0 then
    if new.lesson_track is distinct from old.lesson_track
       or new.lesson_no is distinct from old.lesson_no
       or new.kind      is distinct from old.kind then
      raise exception 'assignment_locked: cannot change the lesson reference once students have submitted';
    end if;
    if old.status in ('published','closed') and new.status = 'draft' then
      raise exception 'assignment_locked: cannot revert to draft after publishing';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists assignments_protect on public.assignments;
create trigger assignments_protect
  before update or delete on public.assignments
  for each row execute function public.protect_assignment();

-- Questions are editable only while the assignment is a draft.
create or replace function public.questions_draft_only()
returns trigger language plpgsql security definer set search_path = public as $$
declare st text;
begin
  select status into st from public.assignments where id = coalesce(new.assignment_id, old.assignment_id);
  if st is distinct from 'draft' then
    raise exception 'questions_locked: questions can only change while the assignment is a draft';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists aq_draft_only on public.assignment_questions;
create trigger aq_draft_only
  before insert or update or delete on public.assignment_questions
  for each row execute function public.questions_draft_only();

-- A student can never write their own score, feedback or status.
-- The server-side marking RPCs raise a transaction-local flag so that
-- legitimate marking still works; a browser client cannot set it.
create or replace function public.protect_submission_grades()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('movetalk.marking', true), '') <> 'server'
     and auth.uid() = old.student_id
     and public.my_role() <> 'teacher' then
    if new.score      is distinct from old.score
       or new.feedback   is distinct from old.feedback
       or new.graded_by  is distinct from old.graded_by
       or new.graded_at  is distinct from old.graded_at
       or new.max_score  is distinct from old.max_score
       or new.status     is distinct from old.status then
      raise exception 'students_cannot_grade';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists subs_protect_grades on public.submissions;
create trigger subs_protect_grades
  before update on public.submissions
  for each row execute function public.protect_submission_grades();

-- A student can never write correctness or points on their own answer.
create or replace function public.protect_answer_grading()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('movetalk.marking', true), '') <> 'server'
     and public.owns_submission(new.submission_id)
     and public.my_role() <> 'teacher' then
    new.is_correct     := null;
    new.points_awarded := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists sa_protect_grading on public.submission_answers;
create trigger sa_protect_grading
  before insert or update on public.submission_answers
  for each row execute function public.protect_answer_grading();

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.classes               enable row level security;
alter table public.class_members         enable row level security;
alter table public.assignments           enable row level security;
alter table public.assignment_recipients enable row level security;
alter table public.assignment_questions  enable row level security;
alter table public.question_keys         enable row level security;
alter table public.submissions           enable row level security;
alter table public.submission_answers    enable row level security;
alter table public.lesson_progress       enable row level security;

-- ---- profiles ----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or exists (                       -- my students
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where c.teacher_id = auth.uid() and m.student_id = profiles.id
  )
  or exists (                       -- my teachers
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where m.student_id = auth.uid() and c.teacher_id = profiles.id
  )
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- classes ----
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select using (
  teacher_id = auth.uid() or public.is_member_of_class(id)
);
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes for insert with check (
  teacher_id = auth.uid() and public.my_role() = 'teacher'
);
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes for update
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete using (teacher_id = auth.uid());

-- ---- class_members ----
drop policy if exists cm_select on public.class_members;
create policy cm_select on public.class_members for select using (
  student_id = auth.uid() or public.is_teacher_of_class(class_id)
);
drop policy if exists cm_insert on public.class_members;
create policy cm_insert on public.class_members for insert with check (
  public.is_teacher_of_class(class_id)          -- teacher enrols a student
);
drop policy if exists cm_delete on public.class_members;
create policy cm_delete on public.class_members for delete using (
  public.is_teacher_of_class(class_id) or student_id = auth.uid()
);
-- NOTE: students join a class through public.join_class_by_code(), not by
-- inserting directly, so a guessed class_id is not enough.

-- ---- assignments ----
drop policy if exists asg_select on public.assignments;
create policy asg_select on public.assignments for select using (
  teacher_id = auth.uid() or public.is_assigned(id)
);
drop policy if exists asg_insert on public.assignments;
create policy asg_insert on public.assignments for insert with check (
  teacher_id = auth.uid() and public.my_role() = 'teacher'
);
drop policy if exists asg_update on public.assignments;
create policy asg_update on public.assignments for update
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists asg_delete on public.assignments;
create policy asg_delete on public.assignments for delete using (
  teacher_id = auth.uid() and status = 'draft'
);

-- ---- assignment_recipients ----
drop policy if exists ar_select on public.assignment_recipients;
create policy ar_select on public.assignment_recipients for select using (
  public.is_teacher_of_assignment(assignment_id)
  or student_id = auth.uid()
  or (class_id is not null and public.is_member_of_class(class_id))
     and exists (select 1 from public.assignments a where a.id = assignment_id and a.status <> 'draft')
);
drop policy if exists ar_write on public.assignment_recipients;
create policy ar_write on public.assignment_recipients for all
  using (public.is_teacher_of_assignment(assignment_id))
  with check (public.is_teacher_of_assignment(assignment_id));

-- ---- assignment_questions ----  (no answer key lives here)
drop policy if exists aq_select on public.assignment_questions;
create policy aq_select on public.assignment_questions for select using (
  public.is_teacher_of_assignment(assignment_id) or public.is_assigned(assignment_id)
);
drop policy if exists aq_write on public.assignment_questions;
create policy aq_write on public.assignment_questions for all
  using (public.is_teacher_of_assignment(assignment_id))
  with check (public.is_teacher_of_assignment(assignment_id));

-- ---- question_keys ----  STUDENTS ARE DENIED ENTIRELY
drop policy if exists qk_teacher_only on public.question_keys;
create policy qk_teacher_only on public.question_keys for all
  using (
    exists (
      select 1 from public.assignment_questions q
      where q.id = question_keys.question_id
        and public.is_teacher_of_assignment(q.assignment_id)
    )
  )
  with check (
    exists (
      select 1 from public.assignment_questions q
      where q.id = question_keys.question_id
        and public.is_teacher_of_assignment(q.assignment_id)
    )
  );

-- ---- submissions ----
drop policy if exists subs_select on public.submissions;
create policy subs_select on public.submissions for select using (
  student_id = auth.uid() or public.is_teacher_of_assignment(assignment_id)
);
drop policy if exists subs_insert on public.submissions;
create policy subs_insert on public.submissions for insert with check (
  student_id = auth.uid() and public.is_open(assignment_id)
);
drop policy if exists subs_update_student on public.submissions;
create policy subs_update_student on public.submissions for update
  using (student_id = auth.uid() and status in ('in_progress','returned'))
  with check (student_id = auth.uid());
drop policy if exists subs_update_teacher on public.submissions;
create policy subs_update_teacher on public.submissions for update
  using (public.is_teacher_of_assignment(assignment_id))
  with check (public.is_teacher_of_assignment(assignment_id));

-- ---- submission_answers ----
drop policy if exists sa_select on public.submission_answers;
create policy sa_select on public.submission_answers for select using (
  public.owns_submission(submission_id)
  or public.is_teacher_of_assignment(public.assignment_of_submission(submission_id))
);
drop policy if exists sa_write_student on public.submission_answers;
create policy sa_write_student on public.submission_answers for all
  using (
    public.owns_submission(submission_id)
    and exists (select 1 from public.submissions s
                where s.id = submission_id and s.status in ('in_progress','returned'))
  )
  with check (
    public.owns_submission(submission_id)
    and exists (select 1 from public.submissions s
                where s.id = submission_id and s.status in ('in_progress','returned'))
  );
drop policy if exists sa_write_teacher on public.submission_answers;
create policy sa_write_teacher on public.submission_answers for update
  using (public.is_teacher_of_assignment(public.assignment_of_submission(submission_id)))
  with check (public.is_teacher_of_assignment(public.assignment_of_submission(submission_id)));

-- ---- lesson_progress ----
drop policy if exists lp_select on public.lesson_progress;
create policy lp_select on public.lesson_progress for select using (
  student_id = auth.uid()
  or exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where c.teacher_id = auth.uid() and m.student_id = lesson_progress.student_id
  )
);
drop policy if exists lp_write on public.lesson_progress;
create policy lp_write on public.lesson_progress for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ------------------------------------------------------------
-- 8. SERVER-SIDE RPC  (this is where marking happens)
-- ------------------------------------------------------------

-- One canonical way to turn a stored jsonb answer into comparable text.
-- Handles ["a"], "a" and 0 alike.
create or replace function public.answer_text(a jsonb)
returns text language sql immutable as $$
  select case
    when a is null then null
    when jsonb_typeof(a) = 'array' then a->>0
    else trim(both '"' from a::text)
  end
$$;

-- Student self-enrols with the teacher's join code.
create or replace function public.join_class_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.classes;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into c from public.classes where upper(trim(join_code)) = upper(trim(p_code));
  if not found then raise exception 'invalid_join_code'; end if;
  insert into public.class_members(class_id, student_id)
  values (c.id, auth.uid())
  on conflict do nothing;
  return jsonb_build_object('class_id', c.id, 'name', c.name);
end $$;

-- Get-or-create my open submission for an assignment.
create or replace function public.start_submission(p_assignment uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_assigned(p_assignment) then raise exception 'not_assigned_to_this_assignment'; end if;
  if not public.is_open(p_assignment)    then raise exception 'assignment_closed'; end if;

  select id into sid from public.submissions
   where assignment_id = p_assignment and student_id = auth.uid()
     and status in ('in_progress','returned')
   order by attempt desc limit 1;
  if sid is not null then return sid; end if;

  insert into public.submissions(assignment_id, student_id, attempt, status)
  values (
    p_assignment, auth.uid(),
    coalesce((select max(attempt) from public.submissions
              where assignment_id = p_assignment and student_id = auth.uid()), 0) + 1,
    'in_progress'
  )
  returning id into sid;
  return sid;
end $$;

-- Grade the auto-marked question types and lock the submission.
-- Called by the student on submit; the browser never sees a key.
create or replace function public.submit_assignment(p_assignment uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sid uuid;
  total numeric := 0;
  awarded numeric := 0;
  st text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select id, status into sid, st from public.submissions
   where assignment_id = p_assignment and student_id = auth.uid()
   order by attempt desc limit 1;
  if sid is null then raise exception 'no_submission'; end if;
  if st = 'submitted' or st = 'graded' then raise exception 'already_submitted'; end if;

  -- allow the integrity triggers to see that this marking is server-side
  perform set_config('movetalk.marking', 'server', true);

  -- auto-mark mcq + fill against the private key table
  update public.submission_answers a
     set is_correct = case
           when q.qtype = 'mcq' then
             public.answer_text(k.correct) is not distinct from public.answer_text(a.answer)
           else
             exists (
               select 1 from jsonb_array_elements_text(
                 case when jsonb_typeof(k.correct) = 'array' then k.correct else jsonb_build_array(k.correct) end
               ) as acc(val)
               where lower(trim(val)) = lower(trim(coalesce(public.answer_text(a.answer), '')))
             )
         end
    from public.assignment_questions q
    join public.question_keys k on k.question_id = q.id
   where a.question_id = q.id
     and a.submission_id = sid
     and q.qtype in ('mcq','fill');

  update public.submission_answers a
     set points_awarded = case when a.is_correct then q.points else 0 end
    from public.assignment_questions q
   where a.question_id = q.id
     and a.submission_id = sid
     and q.qtype in ('mcq','fill');

  -- text answers wait for the teacher: points stay null
  select coalesce(sum(q.points),0),
         coalesce(sum(a.points_awarded) filter (where a.points_awarded is not null),0)
    into total, awarded
    from public.assignment_questions q
    left join public.submission_answers a
           on a.question_id = q.id and a.submission_id = sid
   where q.assignment_id = p_assignment;

  update public.submissions
     set status = 'submitted',
         submitted_at = now(),
         score = awarded,
         max_score = total,
         updated_at = now()
   where id = sid;

  perform set_config('movetalk.marking', '', true);

  return jsonb_build_object('submission_id', sid, 'score', awarded, 'max_score', total);
end $$;

-- Teacher: award points on written answers, then publish a grade.
create or replace function public.grade_submission(
  p_submission uuid,
  p_answers    jsonb,          -- {"<question_id>": points, ...}
  p_feedback   text default null,
  p_status     text default 'graded'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  aid uuid; total numeric := 0; awarded numeric := 0;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'teacher' then raise exception 'teacher_only'; end if;

  select assignment_id into aid from public.submissions where id = p_submission;
  if aid is null then raise exception 'no_submission'; end if;
  if not public.is_teacher_of_assignment(aid) then raise exception 'not_your_assignment'; end if;
  if p_status not in ('graded','returned') then raise exception 'bad_status'; end if;

  perform set_config('movetalk.marking', 'server', true);

  if p_answers is not null then
    update public.submission_answers a
       set points_awarded = (x.value)::numeric
      from jsonb_each_text(p_answers) as x(key, value)
      join public.assignment_questions q on q.id = x.key::uuid
     where a.submission_id = p_submission
       and a.question_id   = q.id
       and q.assignment_id = aid;
  end if;

  select coalesce(sum(q.points),0),
         coalesce(sum(a.points_awarded) filter (where a.points_awarded is not null),0)
    into total, awarded
    from public.assignment_questions q
    left join public.submission_answers a
           on a.question_id = q.id and a.submission_id = p_submission
   where q.assignment_id = aid;

  update public.submissions
     set score      = awarded,
         max_score  = total,
         feedback   = coalesce(p_feedback, feedback),
         status     = p_status,
         graded_by  = auth.uid(),
         graded_at  = now(),
         updated_at = now()
   where id = p_submission;

  perform set_config('movetalk.marking', '', true);

  return jsonb_build_object('submission_id', p_submission, 'score', awarded,
                            'max_score', total, 'status', p_status);
end $$;

-- Convenience for the teacher dashboard.
create or replace function public.class_roster(p_class uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'student_id', p.id, 'full_name', p.full_name, 'email', p.email)), '[]'::jsonb)
  from public.class_members m
  join public.profiles p on p.id = m.student_id
  where m.class_id = p_class and public.is_teacher_of_class(p_class)
$$;

grant execute on function public.join_class_by_code(text)      to authenticated;
grant execute on function public.start_submission(uuid)        to authenticated;
grant execute on function public.submit_assignment(uuid)       to authenticated;
grant execute on function public.grade_submission(uuid,jsonb,text,text) to authenticated;
grant execute on function public.class_roster(uuid)            to authenticated;
grant execute on function public.my_role()                     to authenticated, anon;
