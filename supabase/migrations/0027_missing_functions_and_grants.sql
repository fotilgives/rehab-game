-- =============================================================================
-- Missing functions (existed in old DB, never captured in migrations)
-- + GRANT EXECUTE on all game/user/admin functions to anon, authenticated
-- =============================================================================

-- ---------------------------------------------------------------------------
-- rps_place_bet: player places a bet in the current round
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rps_place_bet(
  p_id         uuid,
  p_nick       text,
  p_move       text,       -- shown move (may differ from real if bluffing)
  p_stake      integer,
  p_shown_move text   DEFAULT NULL,
  p_is_bluff   boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_round_id  bigint;
  v_balance   integer;
  v_bluff_ok  boolean;
  v_real_move text;
  v_shown     text;
BEGIN
  -- get open round
  SELECT id INTO v_round_id FROM rps_rounds WHERE status = 'betting' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'round closed'; END IF;

  -- already bet?
  IF EXISTS (SELECT 1 FROM rps_bets WHERE round_id = v_round_id AND player_id = p_id) THEN
    RAISE EXCEPTION 'already bet';
  END IF;

  -- balance check
  SELECT balance, bluff_ready INTO v_balance, v_bluff_ok FROM rps_profiles WHERE id = p_id;
  IF v_balance < p_stake THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  -- bluff guard
  IF p_is_bluff AND NOT v_bluff_ok THEN RAISE EXCEPTION 'bluff locked'; END IF;

  v_real_move := p_move;
  v_shown     := COALESCE(p_shown_move, p_move);

  -- deduct stake
  UPDATE rps_profiles SET balance = balance - p_stake, nickname = p_nick,
    last_bet_round_id = v_round_id, last_activity_at = now()
  WHERE id = p_id;

  -- store visible bet
  INSERT INTO rps_bets(round_id, player_id, nickname, move, stake, is_bluff)
  VALUES (v_round_id, p_id, p_nick, v_shown, p_stake, p_is_bluff);

  -- store real move (for settlement)
  INSERT INTO rps_secret(round_id, player_id, real_move)
  VALUES (v_round_id, p_id, v_real_move)
  ON CONFLICT (round_id, player_id) DO UPDATE SET real_move = EXCLUDED.real_move;
END; $function$;

-- ---------------------------------------------------------------------------
-- rps_bonus: return center fund info for display
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rps_bonus()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  r public.rps_center_bonus;
  v_max int;
BEGIN
  PERFORM rps_bonus_accrue();
  SELECT * INTO r FROM rps_center_bonus WHERE id = 1;
  v_max := rps_daily_fund();
  RETURN jsonb_build_object(
    'amount',    COALESCE(r.amount, 0),
    'cycle_day', COALESCE(r.cycle_day, 1),
    'max_day',   v_max
  );
END; $function$;

-- ---------------------------------------------------------------------------
-- rps_admin_get_settings: returns labeled config for admin settings UI
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rps_admin_get_settings(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE cfg jsonb;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT data INTO cfg FROM rps_config WHERE id = 1;
  RETURN jsonb_build_object(
    'referral_new_bonus',    jsonb_build_object('label', 'Бонус новому гравцю (монети)',   'value', COALESCE(cfg->>'referral_new_bonus', '100')),
    'referral_inviter_bonus',jsonb_build_object('label', 'Бонус реферу за запрошення',     'value', COALESCE(cfg->>'referral_inviter_bonus', '100')),
    'daily_fund_limit',      jsonb_build_object('label', 'Денний ліміт фонду (монети)',    'value', COALESCE(cfg->>'daily_fund_limit', '5000')),
    'round_seconds',         jsonb_build_object('label', 'Тривалість раунду (секунди)',     'value', COALESCE(cfg->>'round_seconds', '30'))
  );
END; $function$;

-- ---------------------------------------------------------------------------
-- rps_admin_save_settings: saves config keys from admin settings UI
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rps_admin_save_settings(p_token uuid, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE res jsonb;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE rps_config SET data = data || p_data WHERE id = 1 RETURNING data INTO res;
  RETURN res;
END; $function$;

-- ---------------------------------------------------------------------------
-- rps_tg_change_admin_password: was in 0024 but that migration ran empty
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rps_tg_change_admin_password(p_new_password text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_admin_id uuid;
BEGIN
  IF length(p_new_password) < 4 THEN RETURN 'password_short'; END IF;
  SELECT id INTO v_admin_id FROM rps_accounts WHERE login = 'admin' AND is_admin LIMIT 1;
  IF NOT FOUND THEN SELECT id INTO v_admin_id FROM rps_accounts WHERE is_admin LIMIT 1; END IF;
  IF v_admin_id IS NULL THEN RETURN 'no_admin_found'; END IF;
  UPDATE rps_accounts SET pass_hash = md5(p_new_password || v_admin_id::text) WHERE id = v_admin_id;
  DELETE FROM rps_admin_sessions WHERE account_id = v_admin_id;
  RETURN 'ok';
END; $function$;

-- =============================================================================
-- GRANT EXECUTE — game functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_tick()                              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_fill(integer)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_place_bet(uuid,text,text,integer,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_bonus()                             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_register(uuid, text)                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_my_history(uuid)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_cabinet(uuid)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_my_invites(uuid)                    TO anon, authenticated;

-- =============================================================================
-- GRANT EXECUTE — user account functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_signup(text,text,text,text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_login(text,text)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_topup(uuid,text,integer)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_redeem(uuid,text,text,integer)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_donate(uuid,text,integer)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_add_review(uuid,text,integer,text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_accept_referral(uuid,uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_wfp_credit(text,uuid,integer,integer,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_wfp_claim_email(text)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_player_email(uuid)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_book(text,text,text,text,text)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_prices_list()                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_services_list()                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_touch_activity(uuid)                TO anon, authenticated;

-- =============================================================================
-- GRANT EXECUTE — tournament functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_tournament_join(uuid,bigint)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_tournament_respond(uuid,bigint,text) TO anon, authenticated;

-- =============================================================================
-- GRANT EXECUTE — admin functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_admin_login(text,text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_logout(uuid)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_stats(uuid)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_users(uuid)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_grant(uuid,uuid,integer)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_delete_user(uuid,uuid)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_get_config(uuid)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_set_config(uuid,jsonb)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_get_settings(uuid)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_save_settings(uuid,jsonb)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_prizes(uuid)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_prize_upsert(uuid,bigint,text,text,integer,text,text,text,text,boolean,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_prize_delete(uuid,bigint)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_prices(uuid)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_price_upsert(uuid,bigint,text,text,text,text,int,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_price_delete(uuid,bigint)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_services(uuid)                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_service_upsert(uuid,bigint,text,text,text,text,text,text,text,text,text,int,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_service_delete(uuid,bigint)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_redemptions(uuid)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_set_redemption(uuid,bigint,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_reviews(uuid)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_set_review(uuid,bigint,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_get_script(uuid)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_set_script(uuid,jsonb)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_change_password(uuid,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_get_tournaments(uuid)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_admin_create_tournament(uuid,text,text,text,int,uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rps_tg_change_admin_password(text) TO anon, authenticated;
