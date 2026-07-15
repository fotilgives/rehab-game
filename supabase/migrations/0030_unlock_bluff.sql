-- =============================================================================
-- Блеф доступний завжди (прибираємо замок "після першої перемоги").
-- rps_place_bet більше не вимагає bluff_ready.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rps_place_bet(
  p_id         uuid,
  p_nick       text,
  p_move       text,
  p_stake      integer,
  p_shown_move text   DEFAULT NULL,
  p_is_bluff   boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_round_id  bigint;
  v_balance   integer;
  v_real_move text;
  v_shown     text;
BEGIN
  SELECT id INTO v_round_id FROM rps_rounds WHERE status = 'betting' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'round closed'; END IF;

  IF EXISTS (SELECT 1 FROM rps_bets WHERE round_id = v_round_id AND player_id = p_id) THEN
    RAISE EXCEPTION 'already bet';
  END IF;

  SELECT balance INTO v_balance FROM rps_profiles WHERE id = p_id;
  IF v_balance < p_stake THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  v_real_move := p_move;
  v_shown     := COALESCE(p_shown_move, p_move);

  UPDATE rps_profiles SET balance = balance - p_stake, nickname = p_nick,
    last_bet_round_id = v_round_id, last_activity_at = now()
  WHERE id = p_id;

  INSERT INTO rps_bets(round_id, player_id, nickname, move, stake, is_bluff)
  VALUES (v_round_id, p_id, p_nick, v_shown, p_stake, p_is_bluff);

  INSERT INTO rps_secret(round_id, player_id, real_move)
  VALUES (v_round_id, p_id, v_real_move)
  ON CONFLICT (round_id, player_id) DO UPDATE SET real_move = EXCLUDED.real_move;
END; $function$;
