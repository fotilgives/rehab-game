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
  return localStorage.getItem(ACCOUNT_KEY) || getGuestId();
}

function initialNick(): string {
  return localStorage.getItem(NICK_KEY) || 'Гравець-' + Math.floor(1000 + Math.random() * 9000);
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
  login: (loginStr: string, password: string) => Promise<string | null>;
  signup: (loginStr: string, password: string, nick: string) => Promise<string | null>;
  logout: () => void;
  redeem: (reward: string, cost: number) => Promise<string | null>;
}

export function useAccount(): Account {
  const [playerId, setPlayerId] = useState(initialId);
  const [isAccount, setIsAccount] = useState(() => !!localStorage.getItem(ACCOUNT_KEY));
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
      if (active) {
        await refresh();
        setReady(true);
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

  const applyAccount = (id: string, nick: string) => {
    localStorage.setItem(ACCOUNT_KEY, id);
    localStorage.setItem(NICK_KEY, nick);
    setNicknameState(nick);
    setIsAccount(true);
    setPlayerId(id); // re-runs the effect -> register + subscribe + refresh
  };

  const login = useCallback(async (loginStr: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('rps_login', { p_login: loginStr, p_password: password });
    if (error || !data) return 'Невірний логін або пароль';
    const d = data as { id: string; nickname: string };
    applyAccount(d.id, d.nickname);
    return null;
  }, []);

  const signup = useCallback(async (loginStr: string, password: string, nick: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('rps_signup', { p_login: loginStr, p_password: password, p_nick: nick });
    if (error) {
      const m = error.message || '';
      if (m.includes('login taken')) return 'Такий логін уже зайнятий';
      if (m.includes('login short')) return 'Логін — мінімум 3 символи';
      if (m.includes('password short')) return 'Пароль — мінімум 4 символи';
      return 'Не вдалося створити акаунт';
    }
    const d = data as { id: string; nickname: string };
    applyAccount(d.id, d.nickname);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCOUNT_KEY);
    setIsAccount(false);
    setPlayerId(getGuestId());
  }, []);

  const redeem = useCallback(
    async (reward: string, cost: number): Promise<string | null> => {
      const { error } = await supabase.rpc('rps_redeem', {
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
  };
}
