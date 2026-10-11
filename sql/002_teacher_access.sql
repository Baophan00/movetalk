-- ============================================================
-- MoveTalk — teacher access control
--
-- Before this, the role came straight from the signup payload, so any
-- visitor could register themselves as a teacher and create classes.
-- Now a teacher account needs one of:
--   * to be the very first account (the owner bootstraps the school), or
--   * an email on the operator allowlist, or
--   * a valid, unused invite code.
-- Anything else is silently created as a student.
--
-- Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. THE TWO LISTS
-- ------------------------------------------------------------
create table if not exists public.teacher_allowlist (
  email      text primary key,
  note       text,
  added_by   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_invites (
  code       text primary key,
  note       text,
  created_by uuid references public.profiles(id) on delete set null,
  used_by    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

-- ------------------------------------------------------------
-- 2. SIGNUP NOW DECIDES THE ROLE FROM PROOF, NOT FROM A CLAIM
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

  -- consume a valid invite (only ever relevant for a teacher claim)
  if v_wants_teacher and v_code is not null and not v_first then
    update public.teacher_invites i
       set used_at = now()
     where i.code = v_code
       and i.used_at is null
    returning true into v_invited;
    v_invited := coalesce(v_invited, false);
  end if;

  v_role := case
              when not v_wants_teacher then 'student'
              when v_first             then 'teacher'   -- the owner bootstraps
              when v_allowed           then 'teacher'
              when v_invited           then 'teacher'
              else 'student'                            -- claim refused
            end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    v_role
  )
  on conflict (id) do nothing;

  if v_invited then
    update public.teacher_invites set used_by = new.id where code = v_code;
  end if;

  return new;
end $$;

-- ------------------------------------------------------------
-- 3. TEACHERS CAN INVITE AND ALLOWLIST MORE TEACHERS
-- ------------------------------------------------------------
create or replace function public.make_teacher_invite(p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'teacher' then raise exception 'teacher_only'; end if;
  c := 'MT-T-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.teacher_invites(code, note, created_by) values (c, p_note, auth.uid());
  return c;
end $$;

-- ------------------------------------------------------------
-- 4. RLS + GRANTS
-- ------------------------------------------------------------
alter table public.teacher_allowlist enable row level security;
alter table public.teacher_invites   enable row level security;

drop policy if exists allowlist_teacher_all on public.teacher_allowlist;
create policy allowlist_teacher_all on public.teacher_allowlist for all
  using (public.my_role() = 'teacher')
  with check (public.my_role() = 'teacher');

-- invites are readable by teachers, but only the RPC writes them
drop policy if exists invites_teacher_read on public.teacher_invites;
create policy invites_teacher_read on public.teacher_invites for select
  using (public.my_role() = 'teacher');

grant select, insert, update, delete on public.teacher_allowlist to authenticated;
grant select on public.teacher_invites to authenticated;

revoke all on public.teacher_allowlist from anon;
revoke all on public.teacher_invites   from anon;

grant execute on function public.make_teacher_invite(text) to authenticated;
