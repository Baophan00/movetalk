-- ============================================================
-- MoveTalk v2 — homework/assignment RLS + integrity test suite
-- Runs on a plain Postgres container with tests/sql/000_shim.sql
-- providing the Supabase auth() surface.
--
-- Every assertion switches to the `authenticated` role first, so
-- what is tested is the real Row Level Security path, not the
-- superuser path.
-- ============================================================

\set ON_ERROR_STOP on

-- ---------- helpers -----------------------------------------
create table if not exists public.t_results (
  ord    serial primary key,
  name   text,
  ok     boolean,
  detail text
);

create or replace function public.t_rec(n text, ok boolean, d text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.t_results(name, ok, detail) values (n, ok, nullif(d, ''));
end $$;

-- Run a scalar expression AS a given user, under RLS.
create or replace function public.t_val(p_uid text, p_expr text)
returns text language plpgsql as $$
declare got text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid, ''), false);
  execute 'set role authenticated';
  begin
    execute 'select (' || p_expr || ')::text' into got;
  exception when others then
    got := 'ERROR: ' || sqlerrm;
  end;
  execute 'reset role';
  return got;
end $$;

-- Run a statement AS a given user. Returns 'OK' or 'ERROR: ...'.
create or replace function public.t_do(p_uid text, p_sql text)
returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid, ''), false);
  execute 'set role authenticated';
  begin
    execute p_sql;
  exception when others then
    execute 'reset role';
    return 'ERROR: ' || sqlerrm;
  end;
  execute 'reset role';
  return 'OK';
end $$;

create or replace function public.t_eq(name text, got text, want text)
returns void language plpgsql as $$
begin
  perform public.t_rec(name, got is not distinct from want, 'got=' || coalesce(got, 'null') || ' want=' || coalesce(want, 'null'));
end $$;

-- convenience overloads so call sites can pass the raw column type
create or replace function public.t_eq(name text, got boolean, want text)
returns void language plpgsql as $$
begin
  perform public.t_rec(name, got::text is not distinct from want,
                       'got=' || coalesce(got::text, 'null') || ' want=' || coalesce(want, 'null'));
end $$;

create or replace function public.t_eq(name text, got numeric, want text)
returns void language plpgsql as $$
begin
  perform public.t_rec(name, got::text is not distinct from want,
                       'got=' || coalesce(got::text, 'null') || ' want=' || coalesce(want, 'null'));
end $$;

create or replace function public.t_has(name text, got text, needle text)
returns void language plpgsql as $$
begin
  perform public.t_rec(name,
    got is not null and strpos(got, needle) > 0,
    'got=' || coalesce(got, 'null'));
end $$;

-- Same as t_val but for an arbitrary Postgres role (used for anon).
create or replace function public.t_role(p_role text, p_expr text)
returns text language plpgsql as $$
declare got text;
begin
  perform set_config('request.jwt.claim.sub', '', false);
  execute 'set role ' || quote_ident(p_role);
  begin
    execute 'select (' || p_expr || ')::text' into got;
  exception when others then
    got := 'ERROR: ' || sqlerrm;
  end;
  execute 'reset role';
  return got;
end $$;

create or replace function public.t_uuid(name text, got text)
returns void language plpgsql as $$
begin
  perform public.t_rec(name, got ~ '^[0-9a-f]{8}-[0-9a-f]{4}-', 'got=' || coalesce(got, 'null'));
end $$;

-- Resolve a submission id regardless of what the caller is allowed to see,
-- so cross-user assertions can target a row the caller cannot read.
create or replace function public.sub_id(p_student text, p_assignment text)
returns text language sql stable security definer set search_path = public as $$
  select id::text from public.submissions
   where student_id = p_student::uuid and assignment_id = p_assignment::uuid
   order by attempt desc limit 1
$$;

-- ---------- fixed ids --------------------------------------
-- T1/T2 teachers, S1..S4 students
-- C1 = T1's class, C2 = T2's class
-- A_CLASS: lesson -> class C1      A_DIRECT: lesson -> student S4
-- A_DRAFT: custom, stays draft     A_OTHER: T2's lesson -> class C2

-- ---------- fixture: sign-ups (fires handle_new_user) -------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','t1@mt.test','{"role":"teacher","full_name":"Teacher One"}'),
  ('22222222-2222-2222-2222-222222222222','t2@mt.test','{"role":"teacher","full_name":"Teacher Two"}'),
  ('aaaaaaaa-0000-0000-0000-000000000001','s1@mt.test','{"role":"student","full_name":"Student One"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002','s2@mt.test','{"role":"student","full_name":"Student Two"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003','s3@mt.test','{"role":"student","full_name":"Student Three"}'),
  ('aaaaaaaa-0000-0000-0000-000000000004','s4@mt.test','{"role":"student","full_name":"Student Four"}')
on conflict (id) do nothing;

select t_eq('signup creates profiles with server-side role',
  (select string_agg(role, ',' order by email) from public.profiles), 'student,student,student,student,teacher,teacher');

-- ---------- fixture: classes (as teachers, via RLS) ---------
select t_has('T1 can create a class',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.classes(id,teacher_id,name,join_code)
       values ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Class One','MT-C1')$q$),
  'OK');

select t_has('T2 can create a class',
  t_do('22222222-2222-2222-2222-222222222222',
    $q$insert into public.classes(id,teacher_id,name,join_code)
       values ('cccccccc-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Class Two','MT-C2')$q$),
  'OK');

select t_has('teacher can enrol a student directly',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.class_members(class_id,student_id)
       values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001')$q$),
  'OK');

select t_has('S2 self-enrols with a valid join code',
  t_do('aaaaaaaa-0000-0000-0000-000000000002',
    $q$select public.join_class_by_code('MT-C1')$q$),
  'OK');

select t_has('an invalid join code is rejected',
  t_do('aaaaaaaa-0000-0000-0000-000000000003',
    $q$select public.join_class_by_code('NOPE')$q$),
  'ERROR: invalid_join_code');

select t_has('S3 joins the other teacher''s class',
  t_do('aaaaaaaa-0000-0000-0000-000000000003',
    $q$select public.join_class_by_code('MT-C2')$q$),
  'OK');

-- ---------- fixture: assignments ---------------------------
select t_has('T1 creates a lesson assignment as a draft',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignments(id,teacher_id,title,instructions,kind,lesson_track,lesson_no,due_at,status)
       values ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
               'Homework: Build the Message','Do lesson 3, then answer the questions.',
               'lesson','a1',3,current_date + 7,'draft')$q$),
  'OK');

select t_has('T1 attaches the class as recipient',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_recipients(assignment_id,class_id)
       values ('dddddddd-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001')$q$),
  'OK');

select t_has('T1 adds an mcq question',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_questions(id,assignment_id,ord,qtype,prompt,options,points)
       values ('eeeeeeee-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001',1,'mcq',
               '___ you work nearby?','["Do","Are","Is","Does"]'::jsonb,1)$q$),
  'OK');

select t_has('T1 adds a fill-in question',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_questions(id,assignment_id,ord,qtype,prompt,points)
       values ('eeeeeeee-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000001',2,'fill',
               'Mai always keeps her promises. She is very ______.',2)$q$),
  'OK');

select t_has('T1 adds a written question',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_questions(id,assignment_id,ord,qtype,prompt,points)
       values ('eeeeeeee-0000-0000-0000-000000000003','dddddddd-0000-0000-0000-000000000001',3,'text',
               'Write three sentences about a colleague.',3)$q$),
  'OK');

select t_has('T1 stores the answer key for the mcq',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.question_keys(question_id,correct,explanation)
       values ('eeeeeeee-0000-0000-0000-000000000001','[0]'::jsonb,'action verb -> DO')$q$),
  'OK');

select t_has('T1 stores the answer key for the fill-in (two accepted forms)',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.question_keys(question_id,correct,explanation)
       values ('eeeeeeee-0000-0000-0000-000000000002','["reliable","very reliable"]'::jsonb,'reliable = dependable')$q$),
  'OK');

select t_has('students cannot insert questions',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.assignment_questions(assignment_id,ord,qtype,prompt)
       values ('dddddddd-0000-0000-0000-000000000001',9,'text','sneaky')$q$),
  'ERROR');

select t_eq('student cannot read the answer key while the assignment is a draft',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.question_keys)$q$), '0');

select t_has('T1 publishes the assignment',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$update public.assignments set status = 'published'
       where id = 'dddddddd-0000-0000-0000-000000000001'$q$),
  'OK');

select t_has('questions are locked once published',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_questions(assignment_id,ord,qtype,prompt)
       values ('dddddddd-0000-0000-0000-000000000001',9,'text','late edit')$q$),
  'ERROR: questions_locked');

select t_has('T1 creates a second assignment for ONE student only',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignments(id,teacher_id,title,kind,lesson_track,lesson_no,status)
       values ('dddddddd-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
               'Extra speaking drill','lesson','e2',1,'published')$q$),
  'OK');

select t_has('T1 targets S4 directly',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_recipients(assignment_id,student_id)
       values ('dddddddd-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000004')$q$),
  'OK');

select t_has('T1 creates a custom assignment that stays a draft',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignments(id,teacher_id,title,kind,status)
       values ('dddddddd-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
               'Unpublished draft','custom','draft')$q$),
  'OK');

select t_has('T1 (draft) attaches the class as recipient',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$insert into public.assignment_recipients(assignment_id,class_id)
       values ('dddddddd-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000001')$q$),
  'OK');

select t_has('T2 creates their own assignment for class C2',
  t_do('22222222-2222-2222-2222-222222222222',
    $q$insert into public.assignments(id,teacher_id,title,kind,lesson_track,lesson_no,status)
       values ('dddddddd-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222',
               'Class Two homework','lesson','a1',1,'published')$q$),
  'OK');

select t_has('T2 targets class C2',
  t_do('22222222-2222-2222-2222-222222222222',
    $q$insert into public.assignment_recipients(assignment_id,class_id)
       values ('dddddddd-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000002')$q$),
  'OK');

-- ============================================================
-- STEP 7.1 / 7.2 — assigning an existing lesson
-- ============================================================
select t_eq('S1 (class C1) sees the lesson assignment',
  t_val('aaaaaaaa-0000-0000-0000-000000000001', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000001')$q$), '1');
select t_eq('S2 (class C1) sees the lesson assignment',
  t_val('aaaaaaaa-0000-0000-0000-000000000002', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000001')$q$), '1');
select t_eq('S4 (not in C1) does NOT see it',
  t_val('aaaaaaaa-0000-0000-0000-000000000004', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000001')$q$), '0');
select t_eq('S3 (other teacher) does NOT see it',
  t_val('aaaaaaaa-0000-0000-0000-000000000003', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000001')$q$), '0');
select t_eq('S4 sees the individually assigned lesson',
  t_val('aaaaaaaa-0000-0000-0000-000000000004', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000002')$q$), '1');
select t_eq('S1 does NOT see S4''s individual assignment',
  t_val('aaaaaaaa-0000-0000-0000-000000000001', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000002')$q$), '0');
select t_eq('the lesson reference points at the existing course content',
  (select lesson_track from public.assignments where id='dddddddd-0000-0000-0000-000000000001'), 'a1');

-- ============================================================
-- STEP 7.3 — publishing gate
-- ============================================================
select t_eq('a draft assignment is invisible to its recipients',
  t_val('aaaaaaaa-0000-0000-0000-000000000001', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000003')$q$), '0');
select t_eq('the teacher still sees their own draft',
  t_val('11111111-1111-1111-1111-111111111111', $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000003')$q$), '1');
select t_eq('other teachers cannot see T1''s assignments',
  t_val('22222222-2222-2222-2222-222222222222', $q$(select count(*) from public.assignments where teacher_id='11111111-1111-1111-1111-111111111111')$q$), '0');
select t_eq('T1 sees only their own assignments',
  t_val('11111111-1111-1111-1111-111111111111', $q$(select count(*) from public.assignments)$q$), '3');

-- ============================================================
-- STEP 7.8 — answer keys are protected
-- ============================================================
select t_eq('S1 can read the published questions',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.assignment_questions where assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '3');
select t_eq('S1 still cannot read ANY answer key',
  t_val('aaaaaaaa-0000-0000-0000-000000000001', $q$(select count(*) from public.question_keys)$q$), '0');
select t_eq('S1 sees no correct/points columns leaking through questions',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from information_schema.columns
              where table_schema='public' and table_name='assignment_questions'
                and column_name in ('correct','answer_key','correct_answer'))$q$), '0');
select t_eq('the teacher can read their own keys',
  t_val('11111111-1111-1111-1111-111111111111', $q$(select count(*) from public.question_keys)$q$), '2');
select t_eq('another teacher cannot read those keys',
  t_val('22222222-2222-2222-2222-222222222222', $q$(select count(*) from public.question_keys)$q$), '0');

-- ============================================================
-- STEP 7.4 / 7.5 — answering, submitting, independent records
-- ============================================================
select t_has('S3 cannot start a submission for an assignment they do not have',
  t_val('aaaaaaaa-0000-0000-0000-000000000003',
        $q$public.start_submission('dddddddd-0000-0000-0000-000000000001')$q$),
  'ERROR: not_assigned_to_this_assignment');

select t_uuid('S1 can start a submission',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$public.start_submission('dddddddd-0000-0000-0000-000000000001')$q$));

select t_uuid('starting again returns the same open submission (no duplicate)',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$public.start_submission('dddddddd-0000-0000-0000-000000000001')$q$));

select t_eq('S1 has exactly one submission row',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$(select count(*) from public.submissions where student_id='aaaaaaaa-0000-0000-0000-000000000001')$q$), '1');

select t_uuid('S2 can start their own submission',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$public.start_submission('dddddddd-0000-0000-0000-000000000001')$q$));

select t_eq('two students => two independent submission rows',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$(select count(*) from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '2');

select t_has('S1 saves answer 1',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.submission_answers(submission_id,question_id,answer)
       values ((select id from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
                and student_id='aaaaaaaa-0000-0000-0000-000000000001'),
               'eeeeeeee-0000-0000-0000-000000000001','0'::jsonb)$q$), 'OK');
select t_has('S1 saves answer 2',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.submission_answers(submission_id,question_id,answer)
       values ((select id from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
                and student_id='aaaaaaaa-0000-0000-0000-000000000001'),
               'eeeeeeee-0000-0000-0000-000000000002','"Very Reliable"'::jsonb)$q$), 'OK');
select t_has('S1 saves answer 3 (written)',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.submission_answers(submission_id,question_id,answer)
       values ((select id from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
                and student_id='aaaaaaaa-0000-0000-0000-000000000001'),
               'eeeeeeee-0000-0000-0000-000000000003','"My colleague is very reliable."'::jsonb)$q$), 'OK');

select t_has('S2 saves deliberately wrong answers',
  t_do('aaaaaaaa-0000-0000-0000-000000000002',
    $q$insert into public.submission_answers(submission_id,question_id,answer)
       values ((select id from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
                and student_id='aaaaaaaa-0000-0000-0000-000000000002'),
               'eeeeeeee-0000-0000-0000-000000000001','2'::jsonb),
              ((select id from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
                and student_id='aaaaaaaa-0000-0000-0000-000000000002'),
               'eeeeeeee-0000-0000-0000-000000000002','"wrong"'::jsonb)$q$), 'OK');

select t_eq('S1 cannot see S2''s answers',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.submission_answers
             where submission_id = public.sub_id('aaaaaaaa-0000-0000-0000-000000000002',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid)$q$), '0');

select t_eq('S1 CAN see their own answers',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.submission_answers
             where submission_id = public.sub_id('aaaaaaaa-0000-0000-0000-000000000001',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid)$q$), '3');

select t_eq('S1 cannot see S2''s submission row',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.submissions where student_id='aaaaaaaa-0000-0000-0000-000000000002')$q$), '0');

select t_eq('S1 submits and the server auto-marks mcq + fill (3 of 6)',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$public.submit_assignment('dddddddd-0000-0000-0000-000000000001')->>'score'$q$), '3');

select t_eq('S2 submits (0 of 6)',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$public.submit_assignment('dddddddd-0000-0000-0000-000000000001')->>'score'$q$), '0');

select t_eq('S1 auto-marked 3 of 6 (mcq + fill correct, text pending)',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select score::text || '/' || max_score::text from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '3/6');

select t_eq('S2 auto-marked 0 of 6',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$(select score::text || '/' || max_score::text from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000002'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '0/6');

select t_eq('accepts the second accepted spelling, case-insensitively',
  (select a.is_correct from public.submission_answers a
    where a.submission_id = (select id from public.submissions
                             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
                               and assignment_id='dddddddd-0000-0000-0000-000000000001')
      and a.question_id='eeeeeeee-0000-0000-0000-000000000002'), 'true');

select t_eq('written answers are left for the teacher (points null)',
  (select a.points_awarded from public.submission_answers a
    where a.submission_id = (select id from public.submissions
                             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
                               and assignment_id='dddddddd-0000-0000-0000-000000000001')
      and a.question_id='eeeeeeee-0000-0000-0000-000000000003'), null);

select t_has('a student cannot submit twice',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$public.submit_assignment('dddddddd-0000-0000-0000-000000000001')$q$),
  'ERROR: already_submitted');

-- ============================================================
-- STEP 7.7 — grading & feedback permissions
-- ============================================================
select t_eq('once submitted, a client can no longer write to their own row (RLS)',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001'
               and status in ('in_progress','returned'))$q$), '0');

select t_eq('the score the student sees is the server-computed one',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select (score=3 and max_score=6)::text from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), 'true');

select t_eq('feedback is not visible before the teacher grades',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select coalesce(feedback,'<none>') from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '<none>');

select t_has('a student cannot call the grading RPC',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$public.grade_submission((select id from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001'), '{}'::jsonb, 'x', 'graded')$q$),
  'ERROR: teacher_only');

select t_has('another teacher cannot grade T1''s students',
  t_val('22222222-2222-2222-2222-222222222222',
        $q$public.grade_submission(public.sub_id('aaaaaaaa-0000-0000-0000-000000000001',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid,
                                   '{}'::jsonb, 'x', 'graded')$q$),
  'ERROR: not_your_assignment');

select t_eq('T1 grades the written answer (3 bonus points) and publishes the grade',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$public.grade_submission(public.sub_id('aaaaaaaa-0000-0000-0000-000000000001',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid,
             '{"eeeeeeee-0000-0000-0000-000000000003":3}'::jsonb,
             'Good work - watch the article before colleague.','graded')->>'score'$q$), '6');

select t_eq('... and the returned status is graded',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$public.grade_submission(public.sub_id('aaaaaaaa-0000-0000-0000-000000000001',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid,
             '{}'::jsonb, null, 'graded')->>'status'$q$), 'graded');

select t_eq('S1 total is now 6/6 and status graded',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select score::text || '/' || max_score::text || ' ' || status from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '6/6 graded');

select t_eq('S1 can now read the teacher feedback',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select feedback from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000001'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$),
  'Good work - watch the article before colleague.');

select t_eq('grading S1 did not touch S2''s record',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$(select score::text || '/' || max_score::text || ' ' || status || ' ' || coalesce(feedback,'<none>')
             from public.submissions where student_id='aaaaaaaa-0000-0000-0000-000000000002'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '0/6 submitted <none>');

select t_eq('the teacher can request another attempt',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$public.grade_submission(public.sub_id('aaaaaaaa-0000-0000-0000-000000000002',
                                                 'dddddddd-0000-0000-0000-000000000001')::uuid,
             '{}'::jsonb, 'Please try question 2 again.','returned')->>'status'$q$), 'returned');

select t_has('a returned submission is writable again but the score is still off limits',
  t_do('aaaaaaaa-0000-0000-0000-000000000002',
    $q$update public.submissions set score = 99, feedback = 'I graded myself'
       where student_id='aaaaaaaa-0000-0000-0000-000000000002'
         and assignment_id='dddddddd-0000-0000-0000-000000000001'$q$),
  'ERROR: students_cannot_grade');

select t_eq('S2 sees the returned status and the note',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$(select status || ' | ' || feedback from public.submissions
             where student_id='aaaaaaaa-0000-0000-0000-000000000002'
               and assignment_id='dddddddd-0000-0000-0000-000000000001')$q$),
  'returned | Please try question 2 again.');

select t_eq('the teacher sees both students with their own scores',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$(select string_agg(score::text || '/' || max_score::text, ',' order by student_id)
             from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001')$q$), '6/6,0/6');

select t_has('a student whose work was returned can edit their answers again',
  t_do('aaaaaaaa-0000-0000-0000-000000000002',
    $q$update public.submission_answers
          set answer = '"reliable"'::jsonb, is_correct = true, points_awarded = 99
        where submission_id = (select id from public.submissions
                                where student_id='aaaaaaaa-0000-0000-0000-000000000002'
                                  and assignment_id='dddddddd-0000-0000-0000-000000000001')
          and question_id = 'eeeeeeee-0000-0000-0000-000000000002'$q$), 'OK');

select t_eq('the database refused the student-supplied is_correct / points',
  (select (is_correct is null and points_awarded is null)::text
     from public.submission_answers
    where submission_id = (select id from public.submissions
                            where student_id='aaaaaaaa-0000-0000-0000-000000000002'
                              and assignment_id='dddddddd-0000-0000-0000-000000000001')
      and question_id = 'eeeeeeee-0000-0000-0000-000000000002'), 'true');

-- ============================================================
-- STEP 7.6 — due dates, statuses, closing
-- ============================================================
select t_eq('the due date is stored and readable by the student',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select (due_at = current_date + 7)::text from public.assignments
             where id='dddddddd-0000-0000-0000-000000000001')$q$), 'true');

select t_has('T1 closes the assignment',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$update public.assignments set status='closed'
       where id='dddddddd-0000-0000-0000-000000000001'$q$), 'OK');

select t_eq('a closed assignment stays visible so work can be reviewed',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000001')$q$), '1');

select t_eq('graded work is still readable after closing',
  t_val('aaaaaaaa-0000-0000-0000-000000000001',
        $q$(select count(*) from public.submissions where assignment_id='dddddddd-0000-0000-0000-000000000001'
             and status='graded')$q$), '1');

select t_has('a closed assignment refuses a NEW attempt',
  t_val('aaaaaaaa-0000-0000-0000-000000000002',
        $q$public.start_submission('dddddddd-0000-0000-0000-000000000001')$q$),
  'ERROR: assignment_closed');

-- ============================================================
-- STEP 7.8 / 7.10 — destructive-change guards
-- ============================================================
select t_has('a published assignment cannot be reverted to draft once submitted',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$update public.assignments set status='draft'
       where id='dddddddd-0000-0000-0000-000000000001'$q$), 'ERROR: assignment_locked');

select t_has('a student cannot delete an assignment (RLS matches no row)',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$delete from public.assignments where id='dddddddd-0000-0000-0000-000000000001'$q$), 'OK');

select t_eq('... and it is still there',
  (select count(*)::text from public.assignments where id='dddddddd-0000-0000-0000-000000000001'), '1');

do $$ declare msg text; begin
  begin
    delete from public.assignments where id = 'dddddddd-0000-0000-0000-000000000001';
    msg := 'NO ERROR';
  exception when others then msg := 'ERROR: ' || sqlerrm; end;
  perform public.t_has('even the table owner cannot delete an assignment that has submissions',
                       msg, 'ERROR: assignment_has_submissions');
end $$;

select t_has('a question with answers cannot be deleted',
  t_do('11111111-1111-1111-1111-111111111111',
    $q$delete from public.assignment_questions where id='eeeeeeee-0000-0000-0000-000000000001'$q$),
  'ERROR');

select t_eq('submissions survived all of the above',
  t_val('11111111-1111-1111-1111-111111111111', $q$(select count(*) from public.submissions)$q$), '2');

select t_has('a student cannot delete an assignment',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$delete from public.assignments where id='dddddddd-0000-0000-0000-000000000002'$q$), 'OK');
select t_eq('... and it survived (RLS matched no row)',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$(select count(*) from public.assignments where id='dddddddd-0000-0000-0000-000000000002')$q$), '1');

select t_has('a student cannot promote themselves to teacher',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$update public.profiles set role='teacher'
       where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), 'ERROR: role_change_not_allowed');

select t_has('a student cannot create a class',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.classes(teacher_id,name,join_code)
       values ('aaaaaaaa-0000-0000-0000-000000000001','Fake Class','FAKE')$q$), 'ERROR');

select t_has('a student cannot create an assignment',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.assignments(teacher_id,title,status)
       values ('aaaaaaaa-0000-0000-0000-000000000001','Fake','published')$q$), 'ERROR');

select t_has('a student cannot enrol someone else in a class',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.class_members(class_id,student_id)
       values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000004')$q$), 'ERROR');

select t_has('a student cannot write progress for another student',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.lesson_progress(student_id,track,lesson_no,part)
       values ('aaaaaaaa-0000-0000-0000-000000000002','a1',1,'vocab')$q$), 'ERROR');

select t_has('a student CAN write their own progress',
  t_do('aaaaaaaa-0000-0000-0000-000000000001',
    $q$insert into public.lesson_progress(student_id,track,lesson_no,part)
       values ('aaaaaaaa-0000-0000-0000-000000000001','a1',1,'vocab')$q$), 'OK');

select t_eq('the teacher sees their own student''s progress',
  t_val('11111111-1111-1111-1111-111111111111', $q$(select count(*) from public.lesson_progress)$q$), '1');
select t_eq('another teacher sees none of it',
  t_val('22222222-2222-2222-2222-222222222222', $q$(select count(*) from public.lesson_progress)$q$), '0');

select t_eq('class_roster returns the class members to their teacher',
  t_val('11111111-1111-1111-1111-111111111111',
        $q$(select jsonb_array_length(public.class_roster('cccccccc-0000-0000-0000-000000000001'))::text)$q$), '2');
select t_eq('class_roster returns nothing to a different teacher',
  t_val('22222222-2222-2222-2222-222222222222',
        $q$(select jsonb_array_length(public.class_roster('cccccccc-0000-0000-0000-000000000001'))::text)$q$), '0');

select t_eq('anon sees no assignments at all',
  t_role('anon', $q$(select count(*) from public.assignments)$q$), '0');
select t_eq('anon sees no profiles at all',
  t_role('anon', $q$(select count(*) from public.profiles)$q$), '0');
select t_eq('anon cannot read answer keys',
  t_role('anon', $q$(select count(*) from public.question_keys)$q$), '0');

-- ---------- report ------------------------------------------
\echo ''
\echo '=== FAILURES ==='
select name, detail from public.t_results where ok is not true order by ord;
\echo ''
select count(*) filter (where ok) as passed,
       count(*) filter (where ok is not true) as failed,
       count(*) as total
from public.t_results;
