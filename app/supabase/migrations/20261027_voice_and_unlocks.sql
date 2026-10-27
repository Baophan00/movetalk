-- Voice answers and lesson unlocks live on the server, so a teacher on another
-- device can hear a learner and a learner keeps their open lessons.
-- Run once in the Supabase SQL editor (project fdqjvbarvjrmjlquarva).

-- ---------------------------------------------------------------- voice
create table if not exists public.voice_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  track text not null default 'A1',
  lesson_no integer not null,
  storage_path text not null,
  duration_ms integer,
  heard boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists voice_answers_student_idx on public.voice_answers (student_id, lesson_no);
create index if not exists voice_answers_recent_idx on public.voice_answers (created_at desc);

alter table public.voice_answers enable row level security;

drop policy if exists "voice: student writes own" on public.voice_answers;
create policy "voice: student writes own"
  on public.voice_answers for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "voice: student reads own" on public.voice_answers;
create policy "voice: student reads own"
  on public.voice_answers for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "voice: teacher reads all" on public.voice_answers;
create policy "voice: teacher reads all"
  on public.voice_answers for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

drop policy if exists "voice: teacher marks heard" on public.voice_answers;
create policy "voice: teacher marks heard"
  on public.voice_answers for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

drop policy if exists "voice: owner deletes" on public.voice_answers;
create policy "voice: owner deletes"
  on public.voice_answers for delete to authenticated
  using (student_id = auth.uid());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('voice', 'voice', false)
on conflict (id) do nothing;

drop policy if exists "voice files: student uploads own folder" on storage.objects;
create policy "voice files: student uploads own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "voice files: owner or teacher reads" on storage.objects;
create policy "voice files: owner or teacher reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'voice'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
    )
  );

drop policy if exists "voice files: owner deletes" on storage.objects;
create policy "voice files: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- unlocks
create table if not exists public.lesson_unlocks (
  student_id uuid not null references auth.users (id) on delete cascade,
  track text not null default 'A1',
  lesson_no integer not null,
  unlocked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (student_id, track, lesson_no)
);

alter table public.lesson_unlocks enable row level security;

drop policy if exists "unlocks: student reads own" on public.lesson_unlocks;
create policy "unlocks: student reads own"
  on public.lesson_unlocks for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "unlocks: teacher reads all" on public.lesson_unlocks;
create policy "unlocks: teacher reads all"
  on public.lesson_unlocks for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

drop policy if exists "unlocks: teacher writes" on public.lesson_unlocks;
create policy "unlocks: teacher writes"
  on public.lesson_unlocks for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

drop policy if exists "unlocks: teacher deletes" on public.lesson_unlocks;
create policy "unlocks: teacher deletes"
  on public.lesson_unlocks for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
