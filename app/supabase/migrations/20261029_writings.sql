-- Paragraphs written in Practice your way, kept on the server so they survive a new
-- phone and the teacher can read them later.
-- Run once in the Supabase SQL editor (project fdqjvbarvjrmjlquarva).

create table if not exists public.writings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  track text not null default 'A2',
  topic text,
  prompt text,
  body text not null,
  words integer,
  grammar_issues integer,
  created_at timestamptz not null default now()
);

create index if not exists writings_student_idx on public.writings (student_id, created_at desc);
create index if not exists writings_recent_idx on public.writings (created_at desc);

alter table public.writings enable row level security;

drop policy if exists "writings: student writes own" on public.writings;
create policy "writings: student writes own"
  on public.writings for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "writings: student reads own" on public.writings;
create policy "writings: student reads own"
  on public.writings for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "writings: teacher reads all" on public.writings;
create policy "writings: teacher reads all"
  on public.writings for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

drop policy if exists "writings: owner deletes" on public.writings;
create policy "writings: owner deletes"
  on public.writings for delete to authenticated
  using (student_id = auth.uid());
