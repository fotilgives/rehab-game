-- 0010 — Синхронізація з живою базою: налаштування гри, призи-каталог, відгуки,
-- реферали, таяння (energy), адмін-панель, бали без мінусів (+win/+lose).
-- Ідемпотентно та БЕЗ деструктивних операцій (жодних TRUNCATE/DELETE даних).

-- ============ КОЛОНКИ ============
ALTER TABLE public.rps_profiles ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.rps_profiles ADD COLUMN IF NOT EXISTS decays_applied integer NOT NULL DEFAULT 0;
ALTER TABLE public.rps_profiles ADD COLUMN IF NOT EXISTS rounds_since_activity integer NOT NULL DEFAULT 0;
ALTER TABLE public.rps_profiles ADD COLUMN IF NOT EXISTS last_decay_at timestamptz;
ALTER TABLE public.rps_profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
ALTER TABLE public.rps_accounts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.rps_accounts ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ============ ТАБЛИЦІ ============
CREATE TABLE IF NOT EXISTS public.rps_config (
  id int PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT rps_config_single CHECK (id = 1)
);
INSERT INTO public.rps_config(id, data) VALUES (1, jsonb_build_object(
  'win_points', 150, 'lose_points', 80, 'stake', 100, 'round_seconds', 30,
  'decay_start_days', 3, 'decay_period_days', 7, 'decay_pct', 1, 'starter_coins', 0
)) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.rps_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config readable" ON public.rps_config;
CREATE POLICY "config readable" ON public.rps_config FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.rps_prizes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emoji text DEFAULT '🎁',
  title text NOT NULL,
  cost int NOT NULL DEFAULT 0,
  image_url text,
  delivery_type text NOT NULL DEFAULT 'contact',
  delivery_url text,
  delivery_label text,
  active boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rps_prizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prizes public" ON public.rps_prizes;
CREATE POLICY "prizes public" ON public.rps_prizes FOR SELECT USING (active = true);
INSERT INTO public.rps_prizes (emoji, title, cost, delivery_type, delivery_url, delivery_label, sort)
SELECT * FROM (VALUES
  ('🧘','Доступ до курсу з йоги', 12500, 'link', 'https://t.me/+o9i9tJpoj4A3MTcy', 'Відкрити курс у Telegram', 1),
  ('💆','Сеанс масажу', 6000, 'contact', NULL, NULL, 2),
  ('📜','Сертифікат на послуги 1000 грн', 6000, 'contact', NULL, NULL, 3),
  ('🎁','Подарунковий сертифікат 500 грн', 3000, 'contact', NULL, NULL, 4),
  ('🎟️','Знижка 20% на масаж', 1500, 'contact', NULL, NULL, 5),
  ('✨','Знижка 10% на будь-яку послугу', 800, 'contact', NULL, NULL, 6)
) AS v(emoji,title,cost,delivery_type,delivery_url,delivery_label,sort)
WHERE NOT EXISTS (SELECT 1 FROM public.rps_prizes);

CREATE TABLE IF NOT EXISTS public.rps_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id uuid,
  nickname text,
  rating int,
  text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  hidden boolean NOT NULL DEFAULT false
);
ALTER TABLE public.rps_reviews ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.rps_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews readable" ON public.rps_reviews;
CREATE POLICY "reviews readable" ON public.rps_reviews FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.rps_admin_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rps_admin_sessions ENABLE ROW LEVEL SECURITY;

-- ============ СХОВИЩЕ КАРТИНОК ПРИЗІВ ============
INSERT INTO storage.buckets (id, name, public) VALUES ('prizes', 'prizes', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "prizes read" ON storage.objects;
DROP POLICY IF EXISTS "prizes insert" ON storage.objects;
DROP POLICY IF EXISTS "prizes update" ON storage.objects;
DROP POLICY IF EXISTS "prizes delete" ON storage.objects;
CREATE POLICY "prizes read"   ON storage.objects FOR SELECT USING (bucket_id = 'prizes');
CREATE POLICY "prizes insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prizes');
CREATE POLICY "prizes update" ON storage.objects FOR UPDATE USING (bucket_id = 'prizes');
CREATE POLICY "prizes delete" ON storage.objects FOR DELETE USING (bucket_id = 'prizes');

-- ============ ФУНКЦІЇ ============
CREATE OR REPLACE FUNCTION public.rps_cfg(p_key text, p_default numeric)
 RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT (data->>p_key)::numeric FROM rps_config WHERE id = 1), p_default);
$function$;

CREATE OR REPLACE FUNCTION public.rps_stake()
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT rps_cfg('stake', 100)::int $function$;

CREATE OR REPLACE FUNCTION public.rps_round_seconds()
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT rps_cfg('round_seconds', 30)::int $function$;

CREATE OR REPLACE FUNCTION public.rps_touch_activity(p_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE rps_profiles
     SET last_activity_at = now(), decays_applied = 0, rounds_since_activity = 0
   WHERE id = p_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_apply_decay(p_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_bal int; v_last timestamptz; v_applied int; v_days numeric; v_due int; v_n int; v_new int;
  c_start numeric; c_period numeric; c_pct numeric; c_factor numeric;
BEGIN
  SELECT balance, last_activity_at, decays_applied INTO v_bal, v_last, v_applied
    FROM rps_profiles WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_last IS NULL THEN RETURN; END IF;

  c_start  := rps_cfg('decay_start_days', 3);
  c_period := greatest(1, rps_cfg('decay_period_days', 7));
  c_pct    := rps_cfg('decay_pct', 1);
  c_factor := (100 - c_pct) / 100.0;

  v_days := EXTRACT(EPOCH FROM (now() - v_last)) / 86400.0;
  IF v_days < c_start THEN RETURN; END IF;

  v_due := 1 + FLOOR((v_days - c_start) / c_period)::int;
  IF v_due <= COALESCE(v_applied, 0) THEN RETURN; END IF;

  v_n := v_due - COALESCE(v_applied, 0);
  v_new := GREATEST(0, ROUND(v_bal * power(c_factor, v_n))::int);

  UPDATE rps_profiles SET balance = v_new, decays_applied = v_due, last_decay_at = now() WHERE id = p_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_register(p_id uuid, p_nick text)
 RETURNS rps_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE prof public.rps_profiles;
BEGIN
  INSERT INTO rps_profiles(id, nickname)
    VALUES (p_id, COALESCE(NULLIF(TRIM(p_nick), ''), 'Гравець'))
    ON CONFLICT (id) DO UPDATE
      SET nickname = COALESCE(NULLIF(TRIM(EXCLUDED.nickname), ''), rps_profiles.nickname);
  PERFORM rps_apply_decay(p_id);
  SELECT * INTO prof FROM rps_profiles WHERE id = p_id;
  RETURN prof;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_topup(p_id uuid, p_nick text, p_amount integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bal int;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'bad amount'; END IF;
  PERFORM rps_register(p_id, p_nick);
  UPDATE rps_profiles SET balance = balance + p_amount WHERE id = p_id RETURNING balance INTO bal;
  PERFORM rps_touch_activity(p_id);
  RETURN bal;
END; $function$;

DROP FUNCTION IF EXISTS public.rps_redeem(uuid, text, text, integer);
CREATE OR REPLACE FUNCTION public.rps_redeem(p_id uuid, p_nick text, p_reward text, p_cost integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bal int;
BEGIN
  IF p_cost <= 0 THEN RAISE EXCEPTION 'bad cost'; END IF;
  PERFORM rps_register(p_id, p_nick);
  SELECT balance INTO bal FROM rps_profiles WHERE id = p_id FOR UPDATE;
  IF bal < p_cost THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE rps_profiles SET balance = balance - p_cost WHERE id = p_id;
  INSERT INTO rps_redemptions(player_id, nickname, reward, cost) VALUES (p_id, p_nick, p_reward, p_cost);
  PERFORM rps_touch_activity(p_id);
  RETURN bal - p_cost;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_donate(p_id uuid, p_nick text, p_amount integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bal int;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'bad amount'; END IF;
  PERFORM rps_register(p_id, p_nick);
  SELECT balance INTO bal FROM rps_profiles WHERE id = p_id FOR UPDATE;
  IF bal < p_amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE rps_profiles SET balance = balance - p_amount, donated = donated + p_amount WHERE id = p_id RETURNING balance INTO bal;
  PERFORM rps_touch_activity(p_id);
  RETURN bal;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_wfp_credit(p_order_ref text, p_player uuid, p_coins integer, p_amount integer DEFAULT NULL::integer, p_source text DEFAULT NULL::text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bal int; inserted int := 0;
BEGIN
  IF p_coins <= 0 THEN RAISE EXCEPTION 'bad amount'; END IF;
  INSERT INTO rps_wfp_orders(order_ref, player_id, coins, amount, status, source)
  VALUES (p_order_ref, p_player, p_coins, p_amount, 'credited', p_source)
  ON CONFLICT (order_ref) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    SELECT balance INTO bal FROM rps_profiles WHERE id = p_player;
    RETURN bal;
  END IF;
  INSERT INTO rps_profiles(id, nickname) VALUES (p_player, 'Гравець') ON CONFLICT (id) DO NOTHING;
  UPDATE rps_profiles SET balance = balance + p_coins WHERE id = p_player RETURNING balance INTO bal;
  PERFORM rps_touch_activity(p_player);
  RETURN bal;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_accept_referral(p_invitee uuid, p_inviter uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF p_inviter IS NULL OR p_invitee = p_inviter THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM rps_profiles WHERE id = p_inviter) THEN RETURN false; END IF;
  INSERT INTO rps_profiles(id, nickname) VALUES (p_invitee, 'Гравець') ON CONFLICT (id) DO NOTHING;
  UPDATE rps_profiles SET referred_by = p_inviter WHERE id = p_invitee AND referred_by IS NULL;
  IF FOUND THEN
    PERFORM rps_touch_activity(p_inviter);
    RETURN true;
  END IF;
  RETURN false;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_add_review(p_id uuid, p_nick text, p_rating integer, p_text text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF p_text IS NULL OR length(trim(p_text)) < 3 THEN RAISE EXCEPTION 'review short'; END IF;
  PERFORM rps_register(p_id, p_nick);
  INSERT INTO rps_reviews(player_id, nickname, rating, text)
  VALUES (p_id, COALESCE(NULLIF(TRIM(p_nick), ''), 'Гравець'),
          GREATEST(1, LEAST(5, COALESCE(p_rating, 5))), left(trim(p_text), 1000));
  PERFORM rps_touch_activity(p_id);
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_signup(p_login text, p_password text, p_nick text, p_ref text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := lower(trim(p_login));
  v_id uuid := gen_random_uuid();
  v_nick text; v_ref uuid; v_bonus int := 500; v_referred boolean := false; v_start int;
BEGIN
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' THEN RAISE EXCEPTION 'bad email'; END IF;
  IF length(p_password) < 4 THEN RAISE EXCEPTION 'password short'; END IF;
  IF EXISTS (SELECT 1 FROM rps_accounts WHERE login = v_email) THEN RAISE EXCEPTION 'login taken'; END IF;
  v_nick := COALESCE(NULLIF(trim(p_nick), ''), split_part(v_email, '@', 1));
  v_start := rps_cfg('starter_coins', 0)::int;
  INSERT INTO rps_accounts(id, login, email, pass_hash) VALUES (v_id, v_email, v_email, md5(p_password || v_id::text));
  INSERT INTO rps_profiles(id, nickname, balance) VALUES (v_id, v_nick, v_start) ON CONFLICT (id) DO NOTHING;
  BEGIN v_ref := nullif(trim(p_ref), '')::uuid; EXCEPTION WHEN others THEN v_ref := null; END;
  IF v_ref IS NOT NULL AND v_ref <> v_id AND EXISTS (SELECT 1 FROM rps_profiles WHERE id = v_ref) THEN
    UPDATE rps_profiles SET referred_by = v_ref, balance = balance + v_bonus WHERE id = v_id AND referred_by IS NULL;
    IF FOUND THEN
      UPDATE rps_profiles SET balance = balance + v_bonus WHERE id = v_ref;
      PERFORM rps_touch_activity(v_ref);
      v_referred := true;
    END IF;
  END IF;
  RETURN jsonb_build_object('id', v_id, 'nickname', v_nick, 'referred', v_referred, 'bonus', CASE WHEN v_referred THEN v_bonus ELSE 0 END);
END; $function$;

-- Нарахування раунду: без мінусів (переможний хід +win, інакше +lose).
CREATE OR REPLACE FUNCTION public.rps_settle_round(p_round_id bigint)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  rno int; rk int; sc int; pp int; mx int; cos text;
  r record; v_win int; v_lose int;
BEGIN
  rno := ((p_round_id - 1) % 35) + 1;
  SELECT res_rock, res_scissors, res_paper INTO rk, sc, pp FROM rps_bot_script WHERE round_no = rno;
  IF rk IS NULL THEN RETURN; END IF;
  mx := greatest(rk, sc, pp);
  cos := CASE WHEN rk = mx THEN 'rock' WHEN sc = mx THEN 'scissors' ELSE 'paper' END;
  UPDATE rps_rounds SET win_move = cos WHERE id = p_round_id;
  v_win  := rps_cfg('win_points', 150)::int;
  v_lose := rps_cfg('lose_points', 80)::int;
  FOR r IN
    SELECT b.id, b.stake, s.real_move
    FROM rps_secret s
    JOIN rps_bets b ON b.round_id = s.round_id AND b.player_id = s.player_id
    WHERE s.round_id = p_round_id
    ORDER BY b.id
  LOOP
    UPDATE rps_bets
       SET move = r.real_move,
           payout = r.stake + (CASE WHEN r.real_move = cos THEN v_win ELSE v_lose END)
     WHERE id = r.id;
  END LOOP;
  UPDATE rps_profiles p
     SET balance = balance + b.payout,
         wins = wins + (CASE WHEN b.move = cos THEN 1 ELSE 0 END),
         bluff_ready = (b.move = cos)
    FROM rps_bets b
    WHERE b.round_id = p_round_id AND b.player_id = p.id;
END; $function$;

-- ============ АДМІН ============
CREATE OR REPLACE FUNCTION public.rps_is_admin_token(p_token uuid)
 RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM rps_admin_sessions s JOIN rps_accounts a ON a.id = s.account_id
    WHERE s.token = p_token AND a.is_admin AND s.created_at > now() - interval '30 days'
  );
$function$;

CREATE OR REPLACE FUNCTION public.rps_admin_login(p_login text, p_password text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE acc public.rps_accounts; v_token uuid;
BEGIN
  SELECT * INTO acc FROM rps_accounts WHERE login = lower(trim(p_login)) AND is_admin;
  IF acc.id IS NULL OR acc.pass_hash <> md5(p_password || acc.id::text) THEN RAISE EXCEPTION 'bad credentials'; END IF;
  INSERT INTO rps_admin_sessions(account_id) VALUES (acc.id) RETURNING token INTO v_token;
  RETURN jsonb_build_object('token', v_token, 'login', acc.login);
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_logout(p_token uuid)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DELETE FROM rps_admin_sessions WHERE token = p_token; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_users(p_token uuid)
 RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT jsonb_build_object(
      'id', p.id, 'nick', p.nickname, 'email', a.email, 'login', a.login,
      'balance', p.balance, 'wins', p.wins, 'donated', p.donated,
      'created', p.created_at, 'last_activity', p.last_activity_at,
      'is_account', (a.id IS NOT NULL), 'is_admin', COALESCE(a.is_admin, false),
      'referred_by', p.referred_by
    )
    FROM rps_profiles p LEFT JOIN rps_accounts a ON a.id = p.id
    ORDER BY (a.id IS NOT NULL) DESC, p.created_at DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_grant(p_token uuid, p_player uuid, p_delta integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bal int;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE rps_profiles SET balance = GREATEST(0, balance + p_delta) WHERE id = p_player RETURNING balance INTO bal;
  RETURN bal;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_redemptions(p_token uuid)
 RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT jsonb_build_object(
      'id', r.id, 'nick', r.nickname, 'reward', r.reward, 'cost', r.cost,
      'status', COALESCE(r.status, 'pending'), 'created', r.created_at, 'email', a.email
    )
    FROM rps_redemptions r LEFT JOIN rps_accounts a ON a.id = r.player_id
    ORDER BY r.created_at DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_set_redemption(p_token uuid, p_id bigint, p_status text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE rps_redemptions SET status = p_status WHERE id = p_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_reviews(p_token uuid)
 RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT jsonb_build_object('id', id, 'nick', nickname, 'rating', rating, 'text', text, 'hidden', hidden, 'created', created_at)
    FROM rps_reviews ORDER BY created_at DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_set_review(p_token uuid, p_id bigint, p_hidden boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE rps_reviews SET hidden = p_hidden WHERE id = p_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_stats(p_token uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE res jsonb;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'players', (SELECT count(*) FROM rps_profiles),
    'accounts', (SELECT count(*) FROM rps_accounts WHERE NOT is_admin),
    'coins', (SELECT COALESCE(sum(balance), 0) FROM rps_profiles),
    'redemptions_pending', (SELECT count(*) FROM rps_redemptions WHERE COALESCE(status,'pending') <> 'issued'),
    'redemptions_total', (SELECT count(*) FROM rps_redemptions),
    'reviews', (SELECT count(*) FROM rps_reviews),
    'bookings', (SELECT count(*) FROM rps_bookings)
  ) INTO res;
  RETURN res;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_get_config(p_token uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN (SELECT data FROM rps_config WHERE id = 1);
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_set_config(p_token uuid, p_data jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE res jsonb;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE rps_config SET data = data || p_data WHERE id = 1 RETURNING data INTO res;
  RETURN res;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_prizes(p_token uuid)
 RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT to_jsonb(p) FROM rps_prizes p ORDER BY p.sort, p.id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_prize_upsert(p_token uuid, p_id bigint, p_emoji text, p_title text, p_cost integer, p_image_url text, p_delivery_type text, p_delivery_url text, p_delivery_label text, p_active boolean, p_sort integer)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_id bigint;
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN RAISE EXCEPTION 'title required'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO rps_prizes(emoji, title, cost, image_url, delivery_type, delivery_url, delivery_label, active, sort)
    VALUES (COALESCE(NULLIF(trim(p_emoji),''),'🎁'), trim(p_title), GREATEST(0,COALESCE(p_cost,0)),
            NULLIF(trim(p_image_url),''), COALESCE(p_delivery_type,'contact'),
            NULLIF(trim(p_delivery_url),''), NULLIF(trim(p_delivery_label),''),
            COALESCE(p_active,true), COALESCE(p_sort,0))
    RETURNING id INTO v_id;
  ELSE
    UPDATE rps_prizes SET
      emoji = COALESCE(NULLIF(trim(p_emoji),''),'🎁'), title = trim(p_title),
      cost = GREATEST(0,COALESCE(p_cost,0)), image_url = NULLIF(trim(p_image_url),''),
      delivery_type = COALESCE(p_delivery_type,'contact'), delivery_url = NULLIF(trim(p_delivery_url),''),
      delivery_label = NULLIF(trim(p_delivery_label),''), active = COALESCE(p_active,true), sort = COALESCE(p_sort,0)
    WHERE id = p_id RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.rps_admin_prize_delete(p_token uuid, p_id bigint)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT rps_is_admin_token(p_token) THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM rps_prizes WHERE id = p_id;
END; $function$;

-- ============ СІД АДМІНА (login: admin) — лише якщо ще немає жодного адміна ============
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rps_accounts WHERE is_admin) THEN
    INSERT INTO rps_profiles(id, nickname) VALUES (v_id, 'admin') ON CONFLICT (id) DO NOTHING;
    INSERT INTO rps_accounts(id, login, email, pass_hash, is_admin)
    VALUES (v_id, 'admin', NULL, md5('Maltsev-Yoga-2026' || v_id::text), true);
  END IF;
END $$;
