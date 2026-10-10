-- Supabase grants table privileges to the API roles automatically.
-- On a bare Postgres container we do it by hand, after the migration
-- has created the tables. Replicates Supabase's default: anon and
-- authenticated both hold table grants — RLS is the real gate.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
