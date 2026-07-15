-- =============================================================================
-- FIX: game showed 0 players / 0 bank in client (RLS enabled, no SELECT policy)
--   New DB has RLS on by default; old DB's read policies were never captured in
--   migrations. Bots exist server-side but anon/authenticated SELECT returned [].
-- Also: restore bot bluff values (0015 had zeroed them) so Блеф table matches doc.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Public-read RLS policies (anon + authenticated). Writes still go only through
-- SECURITY DEFINER RPC functions, which bypass RLS — so read-only is enough.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rps_rounds', 'rps_bets', 'rps_profiles',
    'rps_config', 'rps_prizes', 'rps_reviews',
    'rps_services', 'rps_prices', 'rps_center_bonus'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read_anon', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      t || '_read_anon', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Realtime: client subscribes to INSERT/UPDATE on rps_rounds and rps_bets.
-- Add them to the supabase_realtime publication if not already present.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rps_rounds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rps_rounds;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rps_bets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rps_bets;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Restore bot bluff distribution (r2s..p2s) per game_mechanics doc.
-- 0015_zero_bot_transitions had set all to 0. rps_admin_set_script preserves
-- these now, so admin edits keep them.
-- ---------------------------------------------------------------------------
UPDATE public.rps_bot_script s SET
  r2s = v.r2s, r2p = v.r2p, s2r = v.s2r, s2p = v.s2p, p2r = v.p2r, p2s = v.p2s
FROM (VALUES
  ( 1, 1,0, 2,0, 0,0),
  ( 2, 0,5, 3,0, 0,4),
  ( 3, 0,0, 0,2, 3,0),
  ( 4, 0,2, 0,0, 3,2),
  ( 5, 0,0, 2,0, 0,2),
  ( 6, 0,0, 0,0, 0,0),
  ( 7, 0,0, 1,0, 0,2),
  ( 8, 0,4, 1,0, 0,2),
  ( 9, 0,0, 0,0, 0,0),
  (10, 0,0, 0,2, 0,5),
  (11, 0,0, 0,0, 2,0),
  (12, 0,0, 0,0, 2,0),
  (13, 0,3, 0,0, 0,0),
  (14, 0,0, 0,0, 3,0),
  (15, 0,0, 3,0, 0,3),
  (16, 0,0, 3,0, 0,3),
  (17, 2,2, 0,0, 0,0),
  (18, 0,2, 0,2, 0,0),
  (19, 0,0, 0,0, 0,0),
  (20, 1,1, 0,2, 0,0),
  (21, 1,1, 0,2, 0,0),
  (22, 1,1, 0,2, 0,0),
  (23, 0,0, 0,4, 0,0),
  (24, 0,1, 0,3, 0,0),
  (25, 0,1, 0,3, 0,0),
  (26, 0,0, 0,0, 0,0),
  (27, 0,0, 3,0, 0,0),
  (28, 0,0, 3,0, 0,0),
  (29, 0,0, 2,0, 0,0),
  (30, 0,1, 2,0, 0,0),
  (31, 0,1, 0,0, 0,0),
  (32, 0,1, 0,0, 0,0),
  (33, 0,1, 0,0, 0,0),
  (34, 0,0, 0,0, 0,0),
  (35, 0,0, 0,2, 1,0)
) v(rno, r2s, r2p, s2r, s2p, p2r, p2s)
WHERE s.round_no = v.rno;
