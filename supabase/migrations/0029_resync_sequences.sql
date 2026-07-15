-- =============================================================================
-- FIX: "duplicate key value violates unique constraint" on insert
--   Data migration imported rows with explicit ids but never advanced the
--   identity/serial sequences, so nextval() returned an already-used id.
--   (Symptom: bot/site booking failed — rps_bookings_pkey id=2 already exists.)
-- Resync every serial/identity sequence to MAX(id) of its table.
-- =============================================================================
DO $$
DECLARE
  t text;
  seq text;
  maxid bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rps_bookings', 'rps_redemptions', 'rps_services', 'rps_prices',
    'rps_prizes', 'rps_reviews', 'rps_tournaments', 'rps_tournament_invites',
    'rps_course_orders'
  ] LOOP
    -- пропускаємо таблиці без колонки id
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'id'
    );
    seq := pg_get_serial_sequence('public.' || t, 'id');
    CONTINUE WHEN seq IS NULL;                       -- id не serial/identity
    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM public.%I', t) INTO maxid;
    -- is_called=true → наступний nextval поверне maxid+1
    PERFORM setval(seq, GREATEST(maxid, 1), maxid > 0);
  END LOOP;
END $$;
