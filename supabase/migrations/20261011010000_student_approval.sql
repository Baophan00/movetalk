-- ============================================================
-- MoveTalk — student approval
--
-- There is one teacher: the owner. Students sign up themselves and then
-- wait to be accepted; until they are, they see nothing assigned to them.
-- The teacher gets a list of requests and accepts or rejects them.
--
-- Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A STATUS ON EVERY PROFILE
--    'pending'  — signed up, waiting for the teacher
--    'active'   — accepted (and the teacher's own account)
--    'rejected' — turned down
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active';

do $$ begin
  alter table public.profiles
    add constraint profiles_status_check check (status in ('pending','active','rejected'));
exception when duplicate_object then null; end $$;

create index if not exists profiles_status_idx on public.profiles(status);

-- ------------------------------------------------------------
-- 2. NEW STUDENTS START PENDING
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_wants_teacher boolean;
  v_code          text;
  v_invited       boolean := false;
  v_first         boolean;
  v_allowed       boolean;
  v_role          text;
begin
  v_wants_teacher := coalesce(new.raw_user_meta_data->>'role', '') = 'teacher';
  v_code          := nullif(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')), '');
  v_first         := not exists (select 1 from public.profiles);
  v_allowed       := exists (
                       select 1 from public.teacher_allowlist a
                        where lower(a.email) = lower(coalesce(new.email, ''))
                     );

  if v_wants_teacher and v_code is not null and not v_first then
    update public.teacher_invites i
       set used_at = now()
     where i.code = v_code and i.used_at is null
    returning true into v_invited;
    v_invited := coalesce(v_invited, false);
  end if;

  v_role := case
              when not v_wants_teacher then 'student'
              when v_first             then 'teacher'
              when v_allowed           then 'teacher'
              when v_invited           then 'teacher'
              else 'student'
            end;

  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    v_role,
    case when v_role = 'teacher' then 'active' else 'pending' end
  )
  on conflict (id) do nothing;

  if v_invited then
    update public.teacher_invites set used_by = new.id where code = v_code;
  end if;

  return new;
end $$;

-- ------------------------------------------------------------
-- 3. "AM I ACCEPTED?" — the one question the rest of the rules ask
-- ------------------------------------------------------------
create or replace function public.i_am_active()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.status = 'active' from public.profiles p where p.id = auth.uid()), false)
$$;

-- A pending student is not "assigned" anything yet.
create or replace function public.is_assigned(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.i_am_active() and exists (
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

-- ------------------------------------------------------------
-- 4. ROLE IS NEVER CHANGED THROUGH THE API
--    (the operator can still do it with direct SQL)
-- ------------------------------------------------------------
create or replace function public.freeze_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role_change_not_allowed';
  end if;
  return new;
end $$;

-- ------------------------------------------------------------
-- 5. THE TEACHER'S TWO BUTTONS
-- ------------------------------------------------------------
create or replace function public.approve_student(p_student uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'teacher' then raise exception 'teacher_only'; end if;
  update public.profiles set status = 'active'
   where id = p_student and role = 'student';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'no_such_student'; end if;
  return jsonb_build_object('student_id', p_student, 'status', 'active');
end $$;

create or replace function public.reject_student(p_student uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'teacher' then raise exception 'teacher_only'; end if;
  update public.profiles set status = 'rejected'
   where id = p_student and role = 'student';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'no_such_student'; end if;
  return jsonb_build_object('student_id', p_student, 'status', 'rejected');
end $$;

-- The teacher needs to see every student, not only the ones already in a
-- class — a request to join has no class yet.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or (public.my_role() = 'teacher' and role = 'student')
  or exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where c.teacher_id = auth.uid() and m.student_id = profiles.id
  )
  or exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where m.student_id = auth.uid() and c.teacher_id = profiles.id
  )
);

-- ------------------------------------------------------------
-- 6. A PENDING STUDENT CANNOT WRITE PROGRESS YET
-- ------------------------------------------------------------
drop policy if exists lp_write on public.lesson_progress;
create policy lp_write on public.lesson_progress for all
  using (student_id = auth.uid() and public.i_am_active())
  with check (student_id = auth.uid() and public.i_am_active());

-- ------------------------------------------------------------
-- 7. GRANTS
-- ------------------------------------------------------------
grant execute on function
  public.i_am_active(),
  public.approve_student(uuid),
  public.reject_student(uuid)
  to authenticated;
