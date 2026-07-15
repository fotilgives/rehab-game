import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const GUEST_KEY = 'rps_player_id';
const ACCOUNT_KEY = 'rps_account_id';
const NICK_KEY = 'rps_nickname';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

function initialId(): string {
  return sessionStorage.getItem(ACCOUNT_KEY) || localStorage.getItem(ACCOUNT_KEY) || getGuestId();
}

function initialNick(): string {
  return sessionStorage.getItem(NICK_KEY) || localStorage.getItem(NICK_KEY) || 'Гравець-' + Math.floor(1000 + Math.random() * 9000);
}

export interface Account {
  playerId: string;
  nickname: string;
  balance: number;
  wins: number;
  bluffReady: boolean;
  lastBetRound: number | null;
  isAccount: boolean;
  ready: boolean;
  setNickname: (n: string) => void;
  refresh: () => Promise<void>;
  topUp: (amount: number) => Promise<void>;
  donate: (amount: number) => Promise<boolean>;
  login: (loginStr: string, password: string, remember?: boolean) => Promise<string | null>;
  signup: (loginStr: string, password: string, nick: string, remember?: boolean, refCode?: string) => Promise<string | null>;
  logout: () => void;
  redeem: (reward: string, cost: number) => Promise<string | null>;
  addReview: (rating: number, text: string) => Promise<string | null>;
}

export function useAccount(): Account {
  const [playerId, setPlayerId] = useState(initialId);
  const [isAccount, setIsAccount] = useState(() => !!(sessionStorage.getItem(ACCOUNT_KEY) || localStorage.getItem(ACCOUNT_KEY)));
  const [nickname, setNicknameState] = useState(initialNick);
  const [balance, setBalance] = useState(0);
  const [wins, setWins] = useState(0);
  const [bluffReady, setBluffReady] = useState(false);
  const [lastBetRound, setLastBetRound] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const nickRef = useRef(nickname);
  nickRef.current = nickname;

  const setNickname = useCallback((n: string) => {
    setNicknameState(n);
    localStorage.setItem(NICK_KEY, n);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('rps_profiles')
      .select('balance,nickname,wins,bluff_ready,last_bet_round_id')
      .eq('id', playerId)
      .maybeSingle();
    if (data) {
      setBalance(data.balance);
      setWins(data.wins ?? 0);
      setBluffReady(!!data.bluff_ready);
      setLastBetRound(data.last_bet_round_id ?? null);
    }
  }, [playerId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await supabase.rpc('rps_register', { p_id: playerId, p_nick: nickRef.current });
      // Реферал: якщо зайшли за посиланням ?ref=<inviterId> — зараховуємо запрошення
      // (скидає таймер «таяння» тому, хто запросив). Спрацьовує один раз.
      try {
        const ref = new URLSearchParams(window.location.search).get('ref');
        if (ref && ref !== playerId && !localStorage.getItem('rps_ref_done')) {
          await supabase.rpc('rps_accept_referral', { p_invitee: playerId, p_inviter: ref });
          localStorage.setItem('rps_ref_done', '1');
        }
      } catch {
        /* ignore */
      }
      // Приєднання до турніру за посиланням ?tournament= більше НЕ автоматичне.
      // Його показує окремий екран згоди (TournamentJoinModal) — зі згодою,
      // попередженням про резерв завдатку і пропозицією поповнити при нестачі.
      if (active) {
        await refresh();
        setReady(true);
      }
      // Страхувальна звірка платежів: перевіряємо статус збережених замовлень
      // у WayForPay і дораховуємо монети, якщо колбек/повернення не спрацювали.
      try {
        const key = 'wfp_pending_refs';
        const refs: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (refs.length > 0) {
          const r = await fetch('/api/wayforpay-reconcile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, refs }),
          });
          const data = await r.json().catch(() => ({}));
          // Прибираємо вже зараховані замовлення з локального списку.
          if (Array.isArray(data?.done) && data.done.length > 0) {
            const left = refs.filter((x) => !data.done.includes(x));
            localStorage.setItem(key, JSON.stringify(left));
          }
          if (active && data && data.credited > 0) await refresh();
        }
      } catch {
        /* ignore */
      }
    })();

    const channel = supabase
      .channel(`profile-${playerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rps_profiles', filter: `id=eq.${playerId}` },
        (payload) => {
          const row = payload.new as {
            balance?: number;
            wins?: number;
            bluff_ready?: boolean;
            last_bet_round_id?: number | null;
          };
          if (typeof row?.balance === 'number') setBalance(row.balance);
          if (typeof row?.wins === 'number') setWins(row.wins);
          if (typeof row?.bluff_ready === 'boolean') setBluffReady(row.bluff_ready);
          if (row && 'last_bet_round_id' in row) setLastBetRound(row.last_bet_round_id ?? null);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [playerId, refresh]);

  const topUp = useCallback(
    async (amount: number) => {
      await supabase.rpc('rps_topup', { p_id: playerId, p_nick: nickRef.current, p_amount: amount });
      await refresh();
    },
    [playerId, refresh]
  );

  const donate = useCallback(
    async (amount: number) => {
      const { error } = await supabase.rpc('rps_donate', {
        p_id: playerId,
        p_nick: nickRef.current,
        p_amount: amount,
      });
      await refresh();
      return !error;
    },
    [playerId, refresh]
  );

  const applyAccount = (id: string, nick: string, remember = true) => {
    if (remember) {
      localStorage.setItem(ACCOUNT_KEY, id);
      localStorage.setItem(NICK_KEY, nick);
      sessionStorage.removeItem(ACCOUNT_KEY);
    } else {
      sessionStorage.setItem(ACCOUNT_KEY, id);
      sessionStorage.setItem(NICK_KEY, nick);
      localStorage.removeItem(ACCOUNT_KEY);
    }
    setNicknameState(nick);
    setIsAccount(true);
    setPlayerId(id); // re-runs the effect -> register + subscribe + refresh
  };

  const login = useCallback(async (loginStr: string, password: string, remember = true): Promise<string | null> => {
    const { data, error } = await supabase.rpc('rps_login', { p_login: loginStr, p_password: password });
    if (error || !data) return 'Невірний логін або пароль';
    const d = data as { id: string; nickname: string };
    applyAccount(d.id, d.nickname, remember);
    return null;
  }, []);

  const signup = useCallback(async (loginStr: string, password: string, nick: string, remember = true, refCode?: string): Promise<string | null> => {
    // Код запрошення: приймаємо як чистий uuid, так і повний лінк ?ref=<uuid>.
    const refRaw = (refCode || '').trim();
    const refMatch = refRaw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const p_ref = refMatch ? refMatch[0] : null;
    const { data, error } = await supabase.rpc('rps_signup', { p_login: loginStr, p_password: password, p_nick: nick, p_ref });
    if (error) {
      const m = error.message || '';
      if (m.includes('login taken')) return 'Ця пошта вже зареєстрована';
      if (m.includes('bad email')) return 'Вкажіть коректну пошту (email)';
      if (m.includes('password short')) return 'Пароль — мінімум 4 символи';
      return 'Не вдалося створити акаунт';
    }
    const d = data as { id: string; nickname: string };
    applyAccount(d.id, d.nickname, remember);
    // Привітальний лист — fire-and-forget, не блокує реєстрацію.
    fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginStr.trim(), name: nick }),
    }).catch(() => {});
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(NICK_KEY);
    sessionStorage.removeItem(ACCOUNT_KEY);
    sessionStorage.removeItem(NICK_KEY);
    setIsAccount(false);
    setPlayerId(getGuestId());
  }, []);

  const redeem = useCallback(
    async (reward: string, cost: number): Promise<string | null> => {
      const { data, error } = await supabase.rpc('rps_redeem', {
        p_id: playerId,
        p_nick: nickRef.current,
        p_reward: reward,
        p_cost: cost,
      });
      await refresh();
      if (error) {
        if ((error.message || '').includes('insufficient')) return 'Недостатньо монет';
        return 'Не вдалося оформити';
      }
      const code = (data as { code?: string } | null)?.code;
      // Лист про оформлення призу клієнту + сповіщення власнику (fire-and-forget).
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'redeem', playerId, reward, cost, nickname: nickRef.current, code }),
      }).catch(() => {});
      return null;
    },
    [playerId, refresh]
  );

  const addReview = useCallback(
    async (rating: number, text: string): Promise<string | null> => {
      const { error } = await supabase.rpc('rps_add_review', {
        p_id: playerId,
        p_nick: nickRef.current,
        p_rating: rating,
        p_text: text,
      });
      await refresh();
      if (error) {
        if ((error.message || '').includes('review short')) return 'Відгук занадто короткий';
        return 'Не вдалося надіслати відгук';
      }
      return null;
    },
    [playerId, refresh]
  );

  return {
    playerId,
    nickname,
    balance,
    wins,
    bluffReady,
    lastBetRound,
    isAccount,
    ready,
    setNickname,
    refresh,
    topUp,
    donate,
    login,
    signup,
    logout,
    redeem,
    addReview,
  };
}
