-- =============================================================================
-- BASE SCHEMA — таблиці що існували до першої міграції (створені вручну)
-- =============================================================================

-- Профілі гравців (гості та акаунти)
CREATE TABLE IF NOT EXISTS public.rps_profiles (
  id                   uuid        PRIMARY KEY,
  nickname             text        NOT NULL DEFAULT 'Гравець',
  balance              integer     NOT NULL DEFAULT 0,
  wins                 integer     NOT NULL DEFAULT 0,
  donated              integer     NOT NULL DEFAULT 0,
  bluff_ready          boolean     NOT NULL DEFAULT false,
  last_bet_round_id    bigint,
  last_activity_at     timestamptz NOT NULL DEFAULT now(),
  decays_applied       integer     NOT NULL DEFAULT 0,
  rounds_since_activity integer    NOT NULL DEFAULT 0,
  last_decay_at        timestamptz,
  referred_by          uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Акаунти (реєстрація з логіном/паролем)
CREATE TABLE IF NOT EXISTS public.rps_accounts (
  id        uuid    PRIMARY KEY REFERENCES public.rps_profiles(id) ON DELETE CASCADE,
  login     text    NOT NULL UNIQUE,
  email     text,
  pass_hash text    NOT NULL,
  is_admin  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Раунди гри
CREATE TABLE IF NOT EXISTS public.rps_rounds (
  id         bigserial   PRIMARY KEY,
  status     text        NOT NULL DEFAULT 'open',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at    timestamptz,
  win_move   text,
  result     jsonb
);

-- Ставки гравців у раунді
CREATE TABLE IF NOT EXISTS public.rps_bets (
  id         bigserial   PRIMARY KEY,
  round_id   bigint      NOT NULL REFERENCES public.rps_rounds(id) ON DELETE CASCADE,
  player_id  uuid        NOT NULL,
  nickname   text        NOT NULL DEFAULT 'Гравець',
  move       text        NOT NULL,
  stake      integer     NOT NULL,
  is_bluff   boolean     NOT NULL DEFAULT false,
  payout     integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Секретні ходи (реальні ходи при блефі)
CREATE TABLE IF NOT EXISTS public.rps_secret (
  round_id  bigint NOT NULL REFERENCES public.rps_rounds(id) ON DELETE CASCADE,
  player_id uuid   NOT NULL,
  real_move text   NOT NULL,
  PRIMARY KEY (round_id, player_id)
);

-- Записи на послуги
CREATE TABLE IF NOT EXISTS public.rps_bookings (
  id         bigserial   PRIMARY KEY,
  name       text        NOT NULL,
  phone      text        NOT NULL,
  service    text        NOT NULL,
  note       text,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Викупи призів/курсів
CREATE TABLE IF NOT EXISTS public.rps_redemptions (
  id         bigserial   PRIMARY KEY,
  player_id  uuid        REFERENCES public.rps_profiles(id) ON DELETE SET NULL,
  nickname   text,
  reward     text        NOT NULL,
  cost       integer     NOT NULL DEFAULT 0,
  status     text        NOT NULL DEFAULT 'pending',
  code       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Поповнення балансу через WayForPay
CREATE TABLE IF NOT EXISTS public.rps_wfp_orders (
  id         bigserial   PRIMARY KEY,
  order_ref  text        NOT NULL UNIQUE,
  player_id  uuid        REFERENCES public.rps_profiles(id) ON DELETE SET NULL,
  coins      integer     NOT NULL,
  amount     numeric,
  status     text        NOT NULL DEFAULT 'pending',
  source     text,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Фонд центру (singleton, id=1)
CREATE TABLE IF NOT EXISTS public.rps_center_bonus (
  id            integer     PRIMARY KEY DEFAULT 1,
  amount        integer     NOT NULL DEFAULT 0,
  cycle_day     integer     NOT NULL DEFAULT 1,
  last_accrual  date,
  last_claim_at timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Права для анонімних та авторизованих (функції SECURITY DEFINER потребують доступу)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
