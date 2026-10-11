-- ============================================================
-- Puts the "waiting" demo student back in the queue.
--
-- The demo seeder creates demo.waiting@movetalk.test as a student who is
-- NOT accepted yet, so signing in as the teacher shows a request to accept.
-- Once you have clicked Accept (or the browser end-to-end check has), run
-- this to get the request back:
--
--   MT_SQL=sql/997_reset_demo_waiting.sql bash tools/apply_migration.sh
-- ============================================================

update public.profiles
   set status = 'pending'
 where role = 'student'
   and email = 'demo.waiting@movetalk.test';

select email, role, status from public.profiles order by role desc, email;
