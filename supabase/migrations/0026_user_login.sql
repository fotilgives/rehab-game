-- =============================================================================
-- Функція входу для звичайних користувачів (не адміна)
-- Виправляє: "rps_login" не існувала → невірний логін або пароль
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rps_login(p_login text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_acc  public.rps_accounts;
  v_prof public.rps_profiles;
BEGIN
  SELECT * INTO v_acc
    FROM rps_accounts
   WHERE login = lower(trim(p_login))
     AND NOT is_admin;

  IF v_acc.id IS NULL THEN
    RAISE EXCEPTION 'bad credentials';
  END IF;

  IF v_acc.pass_hash <> md5(p_password || v_acc.id::text) THEN
    RAISE EXCEPTION 'bad credentials';
  END IF;

  SELECT * INTO v_prof FROM rps_profiles WHERE id = v_acc.id;

  RETURN jsonb_build_object(
    'id',       v_acc.id,
    'nickname', coalesce(v_prof.nickname, split_part(v_acc.email, '@', 1)),
    'balance',  coalesce(v_prof.balance, 0)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.rps_login(text, text) TO anon, authenticated;

-- =============================================================================
-- Гарантуємо наявність rps_book (запис на послуги) і надаємо права
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_book(text, text, text, text, text) TO anon, authenticated;

-- =============================================================================
-- Гарантуємо що rps_accept_referral також доступна анонімам (для guest-рефералів)
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.rps_accept_referral(uuid, uuid) TO anon, authenticated;
