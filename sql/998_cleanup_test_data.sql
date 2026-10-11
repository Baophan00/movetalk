-- ============================================================
-- Removes everything the live test and the demo seeder created.
--
-- Runs as postgres through the Management API, so RLS does not apply.
-- Order matters: the submissions must go first, because the
-- protect_assignment trigger refuses to delete an assignment that still
-- has submissions — including through a cascade.
--
-- Apply with:
--   MT_SQL=sql/998_cleanup_test_data.sql bash tools/apply_migration.sh
-- ============================================================

-- every throwaway account: mt-e2e-* (live test) and demo.* (demo seeder),
-- whichever domain they were created on
create temp table _junk_users on commit drop as
select id from auth.users
 where email like 'mt-e2e-%' or email like 'demo.%';

delete from public.teacher_allowlist
 where email like 'mt-e2e-%' or email like 'demo.%';

-- 1. submissions first (their answers cascade away with them)
delete from public.submissions where student_id in (select id from _junk_users);

-- 2. the accounts themselves. This cascades to profiles, and from there
--    to classes, class_members, assignments, questions, keys and recipients.
delete from auth.users where id in (select id from _junk_users);

select
  (select count(*) from auth.users             where email like 'mt-e2e-%' or email like 'demo.%') as test_users_left,
  (select count(*) from public.profiles)        as profiles_left,
  (select count(*) from public.classes)         as classes_left,
  (select count(*) from public.assignments)     as assignments_left,
  (select count(*) from public.submissions)     as submissions_left,
  (select count(*) from public.assignment_questions) as questions_left;
