-- The study loop behind Today: what the learner did, what they keep getting wrong,
-- the words they chose to keep, and which days they showed up.
-- Run once in the Supabase SQL editor (project fdqjvbarvjrmjlquarva).

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                 -- quiz | listen | build | speak | write | read
  lesson_no int,
  section text,                       -- grammar label, used to name the weak spot
  prompt text,
  correct boolean not null,
  at timestamptz not null default now()
);
create index if not exists attempts_student_idx on public.attempts (student_id, at desc);
create index if not exists attempts_wrong_idx on public.attempts (student_id, correct, at desc);
alter table public.attempts enable row level security;
create policy "at_ins" on public.attempts for insert to authenticated with check (student_id = auth.uid());
create policy "at_sel_own" on public.attempts for select to authenticated using (student_id = auth.uid());
create policy "at_sel_teacher" on public.attempts for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  meaning text,
  level text default 'A1',
  source text,                        -- lesson | reading | speaking | mine
  box int not null default 1,         -- 1..5, spaced repetition stage
  due date not null default current_date,
  lapses int not null default 0,
  created_at timestamptz not null default now(),
  unique (student_id, term)
);
create index if not exists cards_due_idx on public.cards (student_id, due);
alter table public.cards enable row level security;
create policy "cd_ins" on public.cards for insert to authenticated with check (student_id = auth.uid());
create policy "cd_upd" on public.cards for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "cd_del" on public.cards for delete to authenticated using (student_id = auth.uid());
create policy "cd_sel_own" on public.cards for select to authenticated using (student_id = auth.uid());
create policy "cd_sel_teacher" on public.cards for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create table if not exists public.day_log (
  student_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  items int not null default 0,       -- how many things were finished that day
  primary key (student_id, day)
);
alter table public.day_log enable row level security;
create policy "dl_ins" on public.day_log for insert to authenticated with check (student_id = auth.uid());
create policy "dl_upd" on public.day_log for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "dl_sel_own" on public.day_log for select to authenticated using (student_id = auth.uid());
create policy "dl_sel_teacher" on public.day_log for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
