-- =============================================================================
-- 0032_fix_referral_and_starter_settings.sql
-- Фікс подвійного нарахування (200 замість 100) при реєстрації за реферальним посиланням.
-- 1. Скидаємо starter_coins в rps_config до 0 (щоб базовий баланс при реєстрації без реф-посилання був 0, а за рефералкою — строго referral_new_bonus).
-- 2. Оновлюємо rps_admin_get_settings для підтримки starter_coins в адмін-панелі.
-- =============================================================================

UPDATE public.rps_config
   SET data = data || jsonb_build_object(
     'starter_coins', 0,
     'referral_new_bonus', coalesce((data->>'referral_new_bonus')::int, 100),
     'referral_inviter_bonus', coalesce((data->>'referral_inviter_bonus')::int, 100)
   )
 WHERE id = 1;

CREATE OR REPLACE FUNCTION public.rps_admin_get_settings(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE cfg jsonb;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT data INTO cfg FROM rps_config WHERE id = 1;
  RETURN jsonb_build_object(
    'starter_coins',         jsonb_build_object('label', 'Стартові монети новачкам (без рефералки)', 'value', COALESCE(cfg->>'starter_coins', '0')),
    'referral_new_bonus',    jsonb_build_object('label', 'Бонус новачку за реф-посиланням (монети)',   'value', COALESCE(cfg->>'referral_new_bonus', '100')),
    'referral_inviter_bonus',jsonb_build_object('label', 'Бонус реферу за запрошення (монети)',     'value', COALESCE(cfg->>'referral_inviter_bonus', '100')),
    'daily_fund_limit',      jsonb_build_object('label', 'Денний ліміт фонду (монети)',              'value', COALESCE(cfg->>'daily_fund_limit', '5000')),
    'round_seconds',         jsonb_build_object('label', 'Тривалість раунду (секунди)',               'value', COALESCE(cfg->>'round_seconds', '30'))
  );
END; $function$;

GRANT EXECUTE ON FUNCTION public.rps_admin_get_settings(uuid) TO anon, authenticated;
