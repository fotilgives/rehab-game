import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Users, Wifi, Trophy, X, Lock } from 'lucide-react';
import { supabase, type RoundRow, type BetRow } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';
import AnimatedNumber from './AnimatedNumber';
import Confetti from './Confetti';
import { LogIn } from 'lucide-react';

interface TournamentInvite {
  invite_id: number;
  tournament_id: number;
  name: string;
  description: string;
  date: string | null;
  prepay_coins: number;
  status: string;
}

interface TournamentStatus {
  active: boolean;
  tournament_id?: number;
  name?: string;
  stake?: number;
  round_seconds?: number;
  prepay_coins?: number;
  participant?: boolean;
  tournament_balance?: number;
}

interface LeaderRow {
  rank: number;
  nickname: string;
  tournament_balance: number;
  wins: number;
}

type Move = 'rock' | 'scissors' | 'paper';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: 'Камінь', emoji: '✊' },
  { id: 'scissors', label: 'Ножиці', emoji: '✌️' },
  { id: 'paper', label: 'Папір', emoji: '✋' },
];
const STAKE = 100; // фіксована ставка раунду
const ROUND_SECONDS = 30;

const emojiOf = (m: Move) => MOVES.find((x) => x.id === m)!.emoji;
const labelOf = (m: Move) => MOVES.find((x) => x.id === m)!.label;

const MOVE_IMG: Record<Move, string> = {
  rock: '/images/game/rock.png',
  scissors: '/images/game/scissors.png',
  paper: '/images/game/paper.png',
};

const RING = 46;
const CIRC = 2 * Math.PI * RING;

interface Props {
  account: Account;
  onTopUp: () => void;
  onLogin: () => void;
}

const PoolGame: React.FC<Props> = ({ account, onTopUp, onLogin }) => {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [move, setMove] = useState<Move>('rock');
  const [bluff, setBluff] = useState(false);
  const [shownMove, setShownMove] = useState<Move>('paper');
  const [myPlay, setMyPlay] = useState<{ real: Move; shown: Move; bluff: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ net: number; payout: number; move: Move; stake: number; isBluff: boolean } | null>(null);
  const [lastWin, setLastWin] = useState<Move | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [bonus, setBonus] = useState<{ amount: number; cycle_day: number; max_day: number } | null>(null);
  // Ставка й тривалість раунду керуються з адмінки (rps_config). Дефолти 100/30.
  const [stake, setStake] = useState(STAKE);
  const [roundSeconds, setRoundSeconds] = useState(ROUND_SECONDS);
  const [invites, setInvites] = useState<TournamentInvite[]>([]);
  const [currentInviteIdx, setCurrentInviteIdx] = useState(0);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  // Активний турнір: якщо є — гра йде за його ставкою/тривалістю раунду й
  // окремим ізольованим турнірним балансом (не чіпає основний рахунок).
  const [tstatus, setTstatus] = useState<TournamentStatus | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [upcomingTournament, setUpcomingTournament] = useState<{ id: number; name: string; date: string } | null>(null);


  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('rps_config').select('data').eq('id', 1).single();
      const cfg = (data as { data?: Record<string, number> } | null)?.data;
      const st = Number(cfg?.stake);
      const rs = Number(cfg?.round_seconds);
      if (Number.isFinite(st) && st >= 1) setStake(Math.floor(st));
      if (Number.isFinite(rs) && rs >= 5) setRoundSeconds(Math.floor(rs));
    })();
  }, []);

  // Екран правил при вході в гру (показуємо, поки гравець не погодиться).
  const [rulesOk, setRulesOk] = useState(() => {
    try { return localStorage.getItem('rps_rules_accepted') === '1'; } catch { return false; }
  });
  const acceptRules = () => {
    try { localStorage.setItem('rps_rules_accepted', '1'); } catch { /* ignore */ }
    setRulesOk(true);
  };

  // Блеф завжди доступний (не прив'язаний до попередньої перемоги).
  const canBluff = true;

  useEffect(() => {
    if (!canBluff && bluff) setBluff(false);
  }, [canBluff, bluff]);

  const roundIdRef = useRef<number | null>(null);
  const advancing = useRef(false);
  // Ref для playerId — уникаємо stale closure в loadCurrent
  const playerIdRef = useRef(account.playerId);
  useEffect(() => { playerIdRef.current = account.playerId; }, [account.playerId]);


  const fetchBets = useCallback(async (rid: number) => {
    const { data } = await supabase.from('rps_bets').select('*').eq('round_id', rid).order('id');
    setBets((data as BetRow[]) || []);
  }, []);

  const fetchBonus = useCallback(async () => {
    const { data } = await supabase.rpc('rps_bonus');
    if (data) setBonus(data as { amount: number; cycle_day: number; max_day: number });
  }, []);

  const fetchTournamentStatus = useCallback(async () => {
    const { data } = await supabase.rpc('rps_my_tournament_status', { p_player_id: account.playerId });
    if (data) setTstatus(data as TournamentStatus);
  }, [account.playerId]);

  const openLeaderboard = useCallback(async () => {
    if (!tstatus?.tournament_id) return;
    const { data } = await supabase.rpc('rps_tournament_leaderboard', { p_tournament_id: tstatus.tournament_id });
    setLeaderboard((data as LeaderRow[]) || []);
    setLeaderboardOpen(true);
  }, [tstatus?.tournament_id]);

  const fetchInvites = useCallback(async () => {
    if (!account.isAccount) return;
    const { data } = await supabase.rpc('rps_my_invites', { p_player_id: account.playerId });
    if (data) { setInvites(data as TournamentInvite[]); setCurrentInviteIdx(0); }
  }, [account.isAccount, account.playerId]);

  const fetchUpcomingTournament = useCallback(async () => {
    if (!account.playerId) return;
    const { data } = await supabase
      .from('rps_tournament_invites')
      .select(`
        status,
        rps_tournaments!inner (
          id,
          name,
          status,
          date
        )
      `)
      .eq('player_id', account.playerId)
      .eq('status', 'yes')
      .eq('rps_tournaments.status', 'scheduled')
      .maybeSingle();

    if (data && data.rps_tournaments) {
      const t = data.rps_tournaments as any;
      setUpcomingTournament({
        id: t.id,
        name: t.name,
        date: t.date,
      });
    } else {
      setUpcomingTournament(null);
    }
  }, [account.playerId]);


  const respondInvite = async (inviteId: number, status: 'yes' | 'no' | 'later') => {
    setInviteBusy(true); setInviteMsg(null);
    const { data } = await supabase.rpc('rps_tournament_respond', {
      p_player_id: account.playerId,
      p_invite_id: inviteId,
      p_status:    status,
    });
    setInviteBusy(false);
    if (data === 'ok') {
      if (status === 'yes') {
        account.refresh();
        fetchUpcomingTournament();
      }
      // прибрати поточне запрошення

      setInvites((prev) => prev.filter((i) => i.invite_id !== inviteId));
      setCurrentInviteIdx(0);
    } else if (data === 'insufficient') {
      setInviteMsg('Недостатньо монет для передоплати 😕');
    } else {
      setInviteMsg('Помилка. Спробуй ще раз.');
    }
  };

  const loadCurrent = useCallback(async () => {
    // ⚠️ Зберігаємо prevRoundId ДО await — щоб realtime event INSERT rps_rounds
    // не встиг оновити roundIdRef.current раніше ніж ми перевіримо ставку.
    const prevRoundId = roundIdRef.current;

    const { data, error } = await supabase.rpc('rps_tick');
    if (error || !data) return;
    const r = data as RoundRow;

    // Якщо раунд змінився — перевіряємо ставку гравця в попередньому раунді
    if (prevRoundId && prevRoundId !== r.id) {
      if (playerIdRef.current) {
        const { data: bet } = await supabase
          .from('rps_bets')
          .select('*')
          .eq('round_id', prevRoundId)
          .eq('player_id', playerIdRef.current)
          .maybeSingle();
        if (bet) {
          setLastResult({ net: bet.payout - bet.stake, payout: bet.payout, move: bet.move as Move, stake: bet.stake, isBluff: bet.is_bluff });
          if (bet.payout > bet.stake) {
            setCelebrate(true);
            window.setTimeout(() => setCelebrate(false), 2600);
          }
        }
      }
      // Оновлюємо баланси та статуси турнірів на клієнті
      account.refresh();
      fetchBonus();
      fetchTournamentStatus();
      fetchUpcomingTournament();
    }

    roundIdRef.current = r.id;
    setRound(r);
    await fetchBets(r.id);
  }, [fetchBets, account, fetchBonus, fetchTournamentStatus, fetchUpcomingTournament]);



  // Initial load + realtime subscriptions
  useEffect(() => {
    loadCurrent();
    fetchBonus();
    fetchInvites();
    fetchTournamentStatus();
    fetchUpcomingTournament();
    const ch = supabase
      .channel('rps-game')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rps_tournaments' }, (p) => {
        console.log('Realtime rps_tournaments:', p);
        fetchTournamentStatus();
        fetchUpcomingTournament();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_tournament_invites', filter: `player_id=eq.${account.playerId}` }, (p) => {
        console.log('Realtime rps_tournament_invites:', p);
        fetchTournamentStatus();
        fetchUpcomingTournament();
      })

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_rounds' }, (p) => {
        console.log('Realtime rps_rounds INSERT:', p);
        const r = p.new as RoundRow;
        roundIdRef.current = r.id;
        setRound(r);
        setBets([]);
        setMyPlay(null);
        advancing.current = false;
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_rounds' }, (p) => {
        console.log('Realtime rps_rounds UPDATE:', p);
        const r = p.new as RoundRow;
        if (r.id === roundIdRef.current) {
          setRound(r);
          if (r.status === 'settled' && r.win_move) {
            setLastWin(r.win_move as Move);
            fetchBonus();
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_bets' }, (p) => {
        console.log('Realtime rps_bets INSERT:', p);
        const b = p.new as BetRow;
        if (b.round_id === roundIdRef.current) {
          setBets((prev) => (prev.some((x) => x.id === b.id) ? prev : [...prev, b]));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_bets' }, (p) => {
        console.log('Realtime rps_bets UPDATE:', p);
        const b = p.new as BetRow;
        if (b.player_id === account.playerId) {
          console.log('Match found for current player bet update:', b);
          setLastResult({ net: b.payout - b.stake, payout: b.payout, move: b.move as Move, stake: b.stake, isBluff: b.is_bluff });
          if (b.payout > b.stake) {
            setCelebrate(true);
            window.setTimeout(() => setCelebrate(false), 2600);
          }
          account.refresh();
          fetchBonus();
          fetchTournamentStatus(); // оновлюємо турнірний баланс після кожного раунду
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.playerId]);

  // Synced countdown from server ends_at; advance when expired.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!round) return;
      const ms = new Date(round.ends_at).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0 && round.status === 'betting' && !advancing.current) {
        advancing.current = true;
        loadCurrent().finally(() => window.setTimeout(() => (advancing.current = false), 2000));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [round, loadCurrent]);

  const filledRef = useRef<number | null>(null);

  // Auto-fill: боти заходять автоматично й ПОСТУПОВО протягом раунду (за сценарієм).
  useEffect(() => {
    if (!round || round.status !== 'betting') return;
    if (filledRef.current === round.id) return;
    filledRef.current = round.id;

    const finalTarget = 14 + Math.floor(Math.random() * 7); // 14-20
    let current = 2 + Math.floor(Math.random() * 3); // старт 2-4
    let cancelled = false;
    let timer = 0;

    const step = async () => {
      if (cancelled) return;
      const t = Math.min(finalTarget, current);
      await supabase.rpc('rps_fill', { p_target: t });
      if (!cancelled && roundIdRef.current === round.id) fetchBets(round.id);
      if (!cancelled && t < finalTarget) {
        current += 2 + Math.floor(Math.random() * 3); // +2..4 щокроку
        timer = window.setTimeout(step, 1500 + Math.random() * 1800);
      }
    };

    timer = window.setTimeout(step, 500 + Math.random() * 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [round, fetchBets]);

  const myBet = bets.find((b) => b.player_id === account.playerId) || null;
  const potOf = (m: Move) => bets.filter((b) => b.move === m).reduce((s, b) => s + b.stake, 0);
  const bank = bets.reduce((s, b) => s + b.stake, 0);

  // Під час активного турніру гра йде за його параметрами й ізольованим балансом.
  const tournamentActive = !!tstatus?.active;
  const isParticipant = tournamentActive && !!tstatus?.participant;
  const effectiveStake = tournamentActive && isParticipant ? (tstatus?.stake ?? stake) : stake;
  const effectiveRoundSeconds = tournamentActive ? (tstatus?.round_seconds ?? roundSeconds) : roundSeconds;
  const displayBalance = isParticipant ? (tstatus?.tournament_balance ?? 0) : account.balance;

  const placeBet = async () => {
    if (busy || myBet) return;
    if (tournamentActive && !isParticipant) return; // не учасник — гра заблокована в UI нижче
    if (displayBalance < effectiveStake) {
      if (tournamentActive) setErr('Недостатньо монет турнірного балансу для цієї ставки.');
      else onTopUp();
      return;
    }
    const useBluff = bluff && canBluff && shownMove !== move;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('rps_place_bet', {
      p_id: account.playerId,
      p_nick: account.nickname,
      p_move: move,
      p_stake: effectiveStake,
      p_shown_move: useBluff ? shownMove : move,
      p_is_bluff: useBluff,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('tournament_locked')) { setErr('Триває турнір — гра доступна лише учасникам.'); fetchTournamentStatus(); }
      else if (msg.includes('insufficient_tournament')) setErr('Недостатньо монет турнірного балансу.');
      else if (msg.includes('insufficient')) { if (tournamentActive) setErr('Недостатньо турнірного балансу.'); else onTopUp(); }
      else if (msg.includes('bluff locked')) setErr('Блеф відкриється після першої перемоги 🔒');
      else if (msg.includes('round closed')) {
        setErr('Раунд щойно завершився - зачекай наступний 🙂');
        loadCurrent();
      } else if (msg.includes('already bet')) setErr('Ти вже зробив ставку в цьому раунді');
      else setErr('Не вдалося поставити. Спробуй ще раз.');
    } else {
      setLastResult(null);
      setMyPlay({ real: move, shown: useBluff ? shownMove : move, bluff: useBluff });
      await account.refresh();
      await fetchTournamentStatus();
      if (roundIdRef.current) await fetchBets(roundIdRef.current);
    }
    setBusy(false);
  };

  const low = remaining <= 5;
  const progress = Math.min(1, Math.max(0, remaining / effectiveRoundSeconds));

  return (
    <section id="game" className="mx-auto max-w-3xl px-3 py-10 sm:px-5 sm:py-16">
      {!rulesOk ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[2.25rem] bg-white shadow-[0_30px_80px_-25px_rgba(6,78,59,0.4)] ring-1 ring-emerald-100/70"
        >
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-6 py-7 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="relative">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">Інструкція</span>
              <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Як грати 🎮</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-50/90">
                Камінь-ножиці-папір на монети — у реальному часі з іншими гравцями. Прочитай коротко правила, і вперед 🌿
              </p>
            </div>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-8">
            {/* Хто кого б'є */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Хто кого перемагає</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  ['✊', '✌️', 'Камінь б’є ножиці'],
                  ['✌️', '✋', 'Ножиці ріжуть папір'],
                  ['✋', '✊', 'Папір обгортає камінь'],
                ].map(([a, b, t]) => (
                  <div key={t} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <div className="text-lg">{a} <span className="text-slate-300">›</span> {b}</div>
                    <div className="mt-1 text-[11px] leading-tight text-slate-500">{t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Кроки */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Як зіграти раунд</h3>
              <div className="mt-2 space-y-2">
                {[
                  ['1', 'Обери хід', 'Камінь ✊, ножиці ✌️ або папір ✋.'],
                  ['2', 'Постав ставку', `${stake} монет — однакова для всіх. Монети спишуться з балансу.`],
                  ['3', 'Дочекайся кінця раунду', `Раунд триває ${roundSeconds} сек. Усі грають одночасно у спільний банк.`],
                  ['4', 'Отримай монети', 'Після раунду нараховуємо виграш за твій хід — він зʼявиться на балансі.'],
                ].map(([n, title, desc]) => (
                  <div key={n} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-black text-white">{n}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Особливості */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Корисно знати</h3>
              <div className="mt-2 space-y-2">
                {[
                  ['🎁', 'Завжди є виграш', 'За кожен раунд отримуєш монети. Що вдаліший хід саме в цьому раунді — то більший виграш.'],
                  ['🤫', 'Блеф', 'Можеш показати суперникам один хід, а зіграти інший — заплутай їх та зіграй несподівано.'],
                  ['🏆', 'Банк центру', 'Спеціальний денний фонд, з якого гравці отримують бонусні бали. Оновлюється щодня.'],
                  ['⚡', 'Грай регулярно', 'Без активності кілька днів бонуси поступово «тануть». Заходь частіше — тримай форму та баланс.'],
                  ['💎', 'Монети — ігрові', 'Це демо-режим. Монети не виводяться у гроші, а використовуються в грі та на призи.'],
                ].map(([emoji, title, desc]) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <span className="text-2xl leading-none">{emoji}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white p-4 sm:px-8 sm:pb-7">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={acceptRules}
              className="shine w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:from-emerald-700 hover:to-teal-600"
            >
              Погоджуюсь — грати →
            </motion.button>
            <p className="mt-2 text-center text-[11px] text-slate-400">Натискаючи «Грати», ти приймаєш правила гри</p>
          </div>
        </motion.div>
      ) : tournamentActive && !isParticipant ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[2.25rem] bg-white p-8 text-center shadow-[0_30px_80px_-25px_rgba(6,78,59,0.4)] ring-1 ring-emerald-100/70"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-xl font-black text-slate-900">Триває турнір «{tstatus?.name}» 🏆</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Зараз гра доступна лише зареєстрованим учасникам цього турніру. Загальна гра для всіх повернеться одразу після його завершення.
          </p>
          <button
            onClick={openLeaderboard}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
          >
            🏆 Переглянути рейтинг турніру
          </button>
        </motion.div>
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-[0_30px_80px_-25px_rgba(6,78,59,0.4)] ring-1 ring-emerald-100/70"
      >
        <AnimatePresence>{celebrate && <Confetti />}</AnimatePresence>

        {/* ── Hero header (rich gradient) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-5 pb-6 pt-5 text-white sm:px-7 sm:pt-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-teal-300/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">Онлайн-раунд</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">
                  <motion.span
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-200"
                  />
                  <Wifi className="h-3 w-3" /> наживо
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-50/80">Камінь · ножиці · папір · спільний банк</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/15 px-3.5 py-2 text-sm font-black ring-1 ring-white/25 backdrop-blur-sm">
              <Coins className="h-4 w-4 text-amber-300" />
              <AnimatedNumber value={displayBalance} />
            </div>
          </div>

          {isParticipant && (
            <div className="relative mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 px-3 py-1 text-[11px] font-bold text-amber-100">
                <Trophy className="h-3.5 w-3.5" /> Турнір «{tstatus?.name}» · турнірний баланс
              </span>
              <button
                onClick={openLeaderboard}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-white/25"
              >
                🏆 Рейтинг
              </button>
            </div>
          )}

          {/* Timer + stats — hero */}
          <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-50/70">
                <Users className="h-3.5 w-3.5" /> Гравців
              </div>
              <div className="mt-0.5 text-3xl font-black tabular-nums sm:text-4xl">
                <AnimatedNumber value={bets.length} />
              </div>
            </div>

            <div className="relative mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <circle cx="55" cy="55" r={RING} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r={RING}
                  fill="none"
                  stroke={low ? '#fda4af' : 'url(#ringGrad)'}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  style={{ filter: `drop-shadow(0 0 8px ${low ? 'rgba(244,63,94,.55)' : 'rgba(52,211,153,.55)'})` }}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ ease: 'linear', duration: 0.25 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={remaining}
                  initial={{ scale: low ? 1.35 : 1, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-black tabular-nums sm:text-4xl ${low ? 'text-rose-200' : 'text-white'}`}
                >
                  {round ? remaining : '…'}
                </motion.span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-50/70">секунд</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/70">Банк</div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-3xl font-black text-amber-200 tabular-nums sm:text-4xl">
                <AnimatedNumber value={bank} />
              </div>
              <div className="text-[10px] font-medium text-emerald-50/60">монет</div>
            </div>
          </div>
        </div>

        {/* ── Банк центру (gold strip) ── */}
        {bonus && (
          <div className="relative flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-100 via-amber-50 to-transparent px-5 py-3 sm:px-7">
            <div
              className="h-11 w-11 shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-200/80 sm:h-12 sm:w-12"
              dangerouslySetInnerHTML={{
                __html: `<video src="/images/game/bank.mp4" poster="/images/game/bank.png" autoplay loop muted playsinline preload="auto" class="h-full w-full object-cover"></video>`
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-black text-amber-900">Банк центру</span>
                <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700">
                  <Coins className="h-4 w-4" /><AnimatedNumber value={bonus.amount} />
                </span>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">ліміт на день</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-amber-700/70">
                {bonus.amount > 0
                  ? 'Звідси гравці виграють бали · оновлюється щодня 🏆'
                  : 'Ліміт на сьогодні вичерпано — гравці грають між собою'}
              </p>
            </div>
          </div>
        )}

        {/* ── Банер турнірного запрошення ── */}
        <AnimatePresence>
          {invites.length > 0 && invites[currentInviteIdx] && (() => {
            const inv = invites[currentInviteIdx];
            return (
              <motion.div
                key={inv.invite_id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 text-white shadow-xl shadow-violet-300/40 sm:mx-7"
              >
                {/* Фонова декорація */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-indigo-300/20 blur-2xl" />

                {/* Кнопка закрити */}
                <button
                  onClick={() => setInvites((p) => p.filter((i) => i.invite_id !== inv.invite_id))}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/30"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                      <Trophy className="h-4 w-4 text-amber-300" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">Запрошення на турнір</p>
                      <p className="font-black text-base leading-tight">{inv.name}</p>
                    </div>
                  </div>

                  {inv.description && (
                    <p className="mb-2 text-xs text-violet-100/80 leading-relaxed">{inv.description}</p>
                  )}

                  <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                    {inv.date && (
                      <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">
                        📅 {new Date(inv.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                    {inv.prepay_coins > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-1 font-semibold text-amber-200">
                        <Lock className="h-3 w-3" /> Передоплата: {inv.prepay_coins} монет
                      </span>
                    )}
                  </div>

                  {inviteMsg && (
                    <p className="mb-2 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-rose-200">{inviteMsg}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => respondInvite(inv.invite_id, 'yes')}
                      disabled={inviteBusy}
                      className="flex flex-col items-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white shadow transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <span className="text-lg">✅</span> Так
                    </button>
                    <button
                      onClick={() => respondInvite(inv.invite_id, 'later')}
                      disabled={inviteBusy}
                      className="flex flex-col items-center gap-1 rounded-xl bg-white/20 py-2.5 text-xs font-bold text-white transition hover:bg-white/30 disabled:opacity-50"
                    >
                      <span className="text-lg">🔔</span> Пізніше
                    </button>
                    <button
                      onClick={() => respondInvite(inv.invite_id, 'no')}
                      disabled={inviteBusy}
                      className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/20 disabled:opacity-50"
                    >
                      <span className="text-lg">❌</span> Ні
                    </button>
                  </div>

                  {invites.length > 1 && (
                    <p className="mt-2 text-center text-[10px] text-violet-200/60">
                      {currentInviteIdx + 1} з {invites.length} запрошень
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        <div className="p-4 sm:p-6">
          {/* Nickname + account */}
          <div className="mb-2 flex items-center gap-2">
            <input
              value={account.nickname}
              onChange={(e) => account.setNickname(e.target.value.slice(0, 20))}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="Твоє імʼя у грі"
            />
            {account.isAccount ? (
              <button
                onClick={account.logout}
                className="shrink-0 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Вийти
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex shrink-0 items-center gap-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <LogIn className="h-3.5 w-3.5" /> Увійти
              </button>
            )}
          </div>
          <p className="mb-5 text-[11px] text-slate-400">
            {account.isAccount
              ? '✓ Ти в акаунті — баланс зберігається на будь-якому пристрої.'
              : 'Граєш як гість (баланс лише в цьому браузері). Увійди, щоб зберігати скрізь.'}
          </p>

          {/* Pools */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {MOVES.map((m, i) => {
              const pot = potOf(m.id);
              const cnt = bets.filter((b) => b.move === m.id).length;
              const isMine = myBet?.move === m.id;
              const share = bank > 0 ? pot / bank : 0;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative overflow-hidden rounded-3xl border p-3 text-center transition sm:p-4 ${
                    isMine
                      ? 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-200/50'
                      : 'border-slate-100 bg-gradient-to-b from-slate-50/80 to-white shadow-sm'
                  }`}
                >
                  {isMine && (
                    <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">ти</div>
                  )}
                  <motion.img
                    src={MOVE_IMG[m.id]}
                    alt={m.label}
                    className="mx-auto h-14 w-14 object-contain drop-shadow-md sm:h-[68px] sm:w-[68px]"
                    animate={isMine ? { scale: [1, 1.12, 1], y: [0, -3, 0] } : { y: [0, -2, 0] }}
                    transition={{ duration: isMine ? 1.6 : 3, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <div className="mt-1 text-sm font-bold text-slate-800">{m.label}</div>
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-sm font-black text-emerald-600">
                    <Coins className="h-3.5 w-3.5 text-amber-500" /> <AnimatedNumber value={pot} />
                  </div>
                  <div className="text-[11px] text-slate-400">{cnt} гравц.</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      animate={{ width: `${share * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Last result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-4 text-center text-sm font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <img src={MOVE_IMG[lastResult.move]} alt="" className="h-7 w-7 object-contain" />
                    <span>Твій хід{lastResult.isBluff && <span className="ml-1">🤫 блеф</span>}</span>
                  </span>
                  <span className="opacity-40">·</span>
                  <span>{`виграш ${lastResult.payout} монет 🎉`}</span>
                </div>
                {lastWin && (
                  <div className="mt-1 text-xs font-medium opacity-80">
                    Виграшний хід раунду: {emojiOf(lastWin)} {labelOf(lastWin)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming registered tournament info */}
          {upcomingTournament && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4 text-left text-sm font-semibold text-violet-850 ring-1 ring-violet-100"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200">
                  <Trophy className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Зареєстрований у турнірі</div>
                  <div className="text-sm font-black text-slate-800">«{upcomingTournament.name}»</div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">
                    Початок: {new Date(upcomingTournament.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {myBet ? (
                <motion.div
                  key="placed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100"
                >
                  {myPlay?.bluff ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        Ставку прийнято 🤫 Блеф · {myBet.stake} монет
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        Суперники бачать {emojiOf(myPlay.shown)} {labelOf(myPlay.shown)}, а зіграє твій справжній{' '}
                        {emojiOf(myPlay.real)} {labelOf(myPlay.real)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        Ставку прийнято: {emojiOf(myBet.move as Move)} {labelOf(myBet.move as Move)} · {myBet.stake} монет
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">Чекаємо завершення раунду… результат прийде автоматично.</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Твій хід</div>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {MOVES.map((m) => {
                      const sel = move === m.id;
                      return (
                        <motion.button
                          key={m.id}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setMove(m.id);
                            if (bluff && shownMove === m.id) {
                              setShownMove(MOVES.find((x) => x.id !== m.id)!.id);
                            }
                          }}
                          className={`relative flex flex-col items-center gap-1.5 rounded-3xl border-2 py-4 transition sm:py-5 ${
                            sel
                              ? 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-200/60 ring-2 ring-emerald-200'
                              : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md'
                          }`}
                        >
                          {sel && (
                            <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px] text-white">✓</span>
                          )}
                          <img src={MOVE_IMG[m.id]} alt={m.label} className="h-12 w-12 object-contain drop-shadow-md sm:h-16 sm:w-16" />
                          <span className={`text-xs font-bold sm:text-sm ${sel ? 'text-emerald-700' : 'text-slate-700'}`}>{m.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Bluff */}
                  <div className="mt-4">
                    <div className="flex justify-center">
                      <motion.button
                        type="button"
                        whileHover={{ scale: canBluff ? 1.03 : 1, y: canBluff ? -2 : 0 }}
                        whileTap={{ scale: canBluff ? 0.96 : 1 }}
                        disabled={!canBluff}
                        onClick={() => {
                          const next = !bluff;
                          setBluff(next);
                          if (next && shownMove === move) {
                            setShownMove(MOVES.find((m) => m.id !== move)!.id);
                          }
                        }}
                        className={`flex w-full flex-col items-center gap-1 rounded-2xl border py-3.5 transition ${
                          !canBluff
                            ? 'cursor-not-allowed border-slate-100 bg-slate-50'
                            : bluff
                            ? 'border-violet-400 bg-violet-50 shadow-lg shadow-violet-200/50'
                            : 'border-slate-200 bg-white hover:border-violet-300'
                        }`}
                      >
                        <span className="text-3xl">🤫</span>
                        <span className={`text-sm font-semibold ${!canBluff ? 'text-slate-300' : bluff ? 'text-violet-700' : 'text-slate-700'}`}>
                          {!canBluff ? 'Блеф 🔒' : bluff ? 'Блеф увімкнено' : 'Блеф'}
                        </span>
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {canBluff && bluff && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-400">
                            Показати суперникам як
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {MOVES.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setShownMove(m.id)}
                                disabled={m.id === move}
                                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                                  m.id === move
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                                    : shownMove === m.id
                                    ? 'border-violet-400 bg-violet-100 text-violet-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                                }`}
                              >
                                {m.emoji} {m.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] text-violet-500">
                            Усі бачитимуть {emojiOf(shownMove)}, а зіграє твій справжній {emojiOf(move)} 🤫
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!canBluff && (
                      <p className="mt-2 text-center text-[11px] text-violet-400">
                        Виграй раунд, щоб розблокувати блеф (програш або 2+ пропуски знімають доступ)
                      </p>
                    )}
                  </div>

                  <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ставка</div>
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/90 text-white">
                      <Coins className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-xl font-black text-slate-900">{effectiveStake}</span>
                    <span className="text-sm font-medium text-slate-500">монет — фіксована для всіх</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={placeBet}
                    disabled={busy || remaining <= 1 || (tournamentActive && displayBalance < effectiveStake)}
                    className="shine mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50"
                  >
                    {displayBalance < effectiveStake
                      ? tournamentActive
                        ? '⚠️ Недостатньо турнірного балансу'
                        : '💰 Поповнити баланс'
                      : remaining <= 1
                      ? 'Раунд закінчується…'
                      : `Поставити ${effectiveStake} монет`}
                  </motion.button>
                  {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Who's in */}
          {bets.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {bets.slice(0, 14).map((b) => (
                  <motion.span
                    key={b.id}
                    layout
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      b.player_id === account.playerId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {emojiOf(b.move as Move)} {b.nickname}
                    {b.is_bluff && round?.status === 'settled' && <span className="ml-0.5">🤫</span>}
                  </motion.span>
                ))}
              </AnimatePresence>
              {bets.length > 14 && <span className="px-1 text-xs text-slate-400">+{bets.length - 14}</span>}
            </div>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            Реальний онлайн: усі гравці грають в одному раунді. Виграєш — отримуєш payout з реального банку раунду.
          </p>

          {/* Опис «таяння бонусів» */}
          <div className="mt-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-700">
              ⚡ Що таке «таяння бонусів»
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Бонуси — це як <b>енергія</b>. Займатися собою потрібно щодня. Якщо нічого не практикувати
              3 дні, рівень енергії поступово спадає — і з кожним тижнем стаєш трохи слабшим. Тому гра —
              це <b>тренажер самоконтролю й дисципліни</b>: коли ми втрачаємо енергію, це помітно лише з часом,
              а коли втрачаємо бали — помітно одразу. Тож починай з малого ☺️👍
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              <b>Як це працює:</b> після 3 днів без активності баланс зменшується на <b>1%</b>, далі — ще
              по <b>1% щотижня</b>, поки не виконаєш хоча б одну умову.
            </p>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-700">Як уникнути (таймер скидається на 3 дні):</div>
              <ul className="mt-1.5 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
                <li>🎮 зіграти 5 раундів</li>
                <li>💳 оплатити щось на сайті</li>
                <li>🤝 запросити учасника</li>
                <li>➕ поповнити рахунок</li>
                <li>🎁 розрахуватися бонусами</li>
                <li>⭐ написати відгук</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
      )}

      {/* Рейтинг турніру */}
      <AnimatePresence>
        {leaderboardOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLeaderboardOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"
              initial={{ scale: 0.94, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-5 text-white">
                <button onClick={() => setLeaderboardOpen(false)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"><X className="h-4 w-4" /></button>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <h3 className="text-lg font-black">Рейтинг турніру</h3>
                </div>
                <p className="mt-1 text-xs text-amber-50/90">{tstatus?.name}</p>
              </div>
              <div className="max-h-[60vh] space-y-1.5 overflow-y-auto px-4 py-4">
                {leaderboard.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">Поки що немає результатів.</p>
                )}
                {leaderboard.map((row) => {
                  const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`;
                  return (
                    <div key={row.rank} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${row.rank <= 3 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      <span className="w-7 shrink-0 text-center text-lg font-black">{medal}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{row.nickname}</span>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-black text-emerald-700">
                        <Coins className="h-3.5 w-3.5 text-amber-500" /> {row.tournament_balance.toLocaleString('uk-UA')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PoolGame;
