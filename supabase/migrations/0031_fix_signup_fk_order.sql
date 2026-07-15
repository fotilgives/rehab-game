-- =============================================================================
-- FIX: реєстрація мовчки падала → логін «невірний логін або пароль».
--   rps_accounts.id має FK на rps_profiles.id, а rps_signup вставляв СПОЧАТКУ
--   в rps_accounts (FK-порушення), тож акаунт не створювався взагалі.
-- Рішення: створюємо профіль ПЕРШИМ, потім акаунт.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rps_signup(
  p_login    text,
  p_password text,
  p_nick     text,
  p_ref      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_email         text := lower(trim(p_login));
  v_id            uuid := gen_random_uuid();
  v_nick          text;
  v_ref           uuid;
  v_new_bonus     int;
  v_inviter_bonus int;
  v_referred      boolean := false;
  v_start         int;
BEGIN
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'bad email';
  END IF;
  IF length(p_password) < 4 THEN RAISE EXCEPTION 'password short'; END IF;
  IF EXISTS (SELECT 1 FROM rps_accounts WHERE login = v_email) THEN
    RAISE EXCEPTION 'login taken';
  END IF;

  v_nick := coalesce(nullif(trim(p_nick), ''), split_part(v_email, '@', 1));
  v_start := rps_cfg('starter_coins', 0)::int;
  v_new_bonus := rps_cfg('referral_new_bonus', 100)::int;
  v_inviter_bonus := rps_cfg('referral_inviter_bonus', 100)::int;

  -- ПРОФІЛЬ ПЕРШИМ (rps_accounts.id → rps_profiles.id).
  INSERT INTO rps_profiles(id, nickname, balance)
    VALUES (v_id, v_nick, v_start)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO rps_accounts(id, login, email, pass_hash)
    VALUES (v_id, v_email, v_email, md5(p_password || v_id::text));

  BEGIN
    v_ref := nullif(trim(p_ref), '')::uuid;
  EXCEPTION WHEN others THEN
    v_ref := null;
  END;

  IF v_ref IS NOT NULL AND v_ref <> v_id
    AND EXISTS (SELECT 1 FROM rps_profiles WHERE id = v_ref)
  THEN
    UPDATE rps_profiles
      SET referred_by = v_ref, balance = balance + v_new_bonus
      WHERE id = v_id AND referred_by IS NULL;
    IF found THEN
      UPDATE rps_profiles SET balance = balance + v_inviter_bonus WHERE id = v_ref;
      PERFORM rps_touch_activity(v_ref);
      v_referred := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id',       v_id,
    'nickname', v_nick,
    'referred', v_referred,
    'bonus',    case when v_referred then v_new_bonus else 0 end
  );
END; $function$;
