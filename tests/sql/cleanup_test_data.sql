-- ============================================================
-- Removes the data created by tests/sql/live_project_test.py
--
-- The run prints the exact ids it created — fill them in below and run
-- this in the Supabase SQL editor. Order matters: submissions must go
-- before the assignment, and questions before question_keys' parents.
--
-- Auth users cannot be deleted with SQL: go to
--   Authentication > Users
-- and delete the mt-e2e-*@example.com rows.
-- ============================================================

\set assignment_id 'PASTE-ASSIGNMENT-ID'
\set submission_id 'PASTE-SUBMISSION-ID'
\set class_id      'PASTE-CLASS-ID'

delete from public.submission_answers   where submission_id = :'submission_id';
delete from public.submissions          where assignment_id = :'assignment_id';
delete from public.question_keys        where question_id in (
        select id from public.assignment_questions where assignment_id = :'assignment_id');
delete from public.assignment_questions where assignment_id = :'assignment_id';
delete from public.assignment_recipients where assignment_id = :'assignment_id';
delete from public.assignments          where id = :'assignment_id';
delete from public.class_members        where class_id = :'class_id';
delete from public.classes              where id = :'class_id';
delete from public.profiles             where email like 'mt-e2e-%@example.com';
