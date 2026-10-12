-- ============================================================
-- Puts the demo DATA back under the one real teacher: one accepted student
-- with work to show (a submission to mark, one already marked, lesson parts
-- opened) and one student deliberately left waiting.
--
--   python3 tests/sql/restore_demo.py
--
-- That helper creates the two accounts through the ordinary public signup
-- path first (a hand-written auth.users row does NOT work: GoTrue answers
-- "Database error querying schema" for a password sign-in), then applies this
-- file as the operator. Use it when sql/998_cleanup_test_data.sql has wiped
-- demo.* — it deletes every demo.% and mt-e2e-% account, which is its job.
--
-- Idempotent. Runs as postgres through the Management API, so RLS does not
-- apply and no teacher password is needed.
-- ============================================================

-- ---- the teacher accepted one of them; the other deliberately waits ----
update public.profiles set status = 'active'  where email = 'demo.student@movetalk.test';
update public.profiles set status = 'pending' where email = 'demo.waiting@movetalk.test';

-- ---- the accepted student has both demo assignments ----
insert into public.assignment_recipients (assignment_id, student_id)
select a.id, p.id
  from public.assignments a
  join public.profiles p on p.email = 'demo.student@movetalk.test'
 where a.title in ('Demo · Lesson A1-3: Build the Message', 'Demo · Custom drill: DO / ARE')
   and not exists (select 1 from public.assignment_recipients r
                    where r.assignment_id = a.id and r.student_id = p.id);

-- ---- work: the drill is marked 6/6, the lesson assignment waits to be marked ----
insert into public.submissions (assignment_id, student_id, status, attempt, score, max_score,
                                feedback, graded_by, submitted_at, graded_at, updated_at)
select a.id, p.id, 'graded', 1, 6, 6,
       'Good work — remember the -s ending on he/she.',
       (select id from public.profiles where role = 'teacher' order by created_at limit 1),
       now() - interval '1 day', now() - interval '20 hours', now()
  from public.assignments a
  join public.profiles p on p.email = 'demo.student@movetalk.test'
 where a.title = 'Demo · Custom drill: DO / ARE'
on conflict (assignment_id, student_id, attempt) do nothing;

insert into public.submissions (assignment_id, student_id, status, attempt, submitted_at, updated_at)
select a.id, p.id, 'submitted', 1, now() - interval '2 hours', now()
  from public.assignments a
  join public.profiles p on p.email = 'demo.student@movetalk.test'
 where a.title = 'Demo · Lesson A1-3: Build the Message'
on conflict (assignment_id, student_id, attempt) do nothing;

insert into public.submission_answers (submission_id, question_id, answer)
select s.id, q.id,
       case q.qtype
         when 'mcq'  then '0'::jsonb
         when 'fill' then '"very reliable"'::jsonb
         else '"I lead a small team and my manager checks in every morning."'::jsonb
       end
  from public.submissions s
  join public.assignment_questions q on q.assignment_id = s.assignment_id
 where s.student_id = (select id from public.profiles where email = 'demo.student@movetalk.test')
on conflict (submission_id, question_id) do nothing;

-- ---- lesson parts opened, so the teacher's progress bar has real numbers ----
insert into public.lesson_progress (student_id, track, lesson_no, part)
select p.id, 'a1', l.lesson_no, part.name
  from public.profiles p
  cross join (values (1), (2), (3)) as l(lesson_no)
  cross join (values ('vocab'), ('grammar'), ('reading'), ('conversations')) as part(name)
 where p.email = 'demo.student@movetalk.test'
on conflict (student_id, track, lesson_no, part) do nothing;

select
  (select count(*)::int from public.profiles where role = 'student')      as students,
  (select count(*)::int from public.profiles where role = 'student' and status = 'pending') as waiting,
  (select count(*)::int from public.assignment_recipients)               as recipients,
  (select count(*)::int from public.submissions)                          as submissions,
  (select count(*)::int from public.lesson_progress)                      as progress_rows;
