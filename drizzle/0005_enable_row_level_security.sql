-- Row Level Security on every Questly table.
--
-- Supabase exposes the public schema through its Data API to anyone holding
-- the project's anon key. With RLS on and no policies, those API roles can
-- neither read nor write anything. The app's own server connection (the
-- table owner) bypasses RLS, so Questly itself is unaffected.
--
-- New tables must enable RLS in their own migration (a test enforces it).
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
