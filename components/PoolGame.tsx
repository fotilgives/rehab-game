import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Users, Bot, Wifi } from 'lucide-react';
import { supabase, type RoundRow, type BetRow } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';
import AnimatedNumber from './AnimatedNumber';
import Confetti from './Confetti';
import AuthModal from './AuthModal';
import { LogIn } from 'lucide-react';

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

const RING = 46;
const CIRC = 2 * Math.PI * RING;

interface Props {
  account: Account;
  onTopUp: () => void;
}

const PoolGame: React.FC<Props> = ({ account, onTopUp }) => {
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
  const [authOpen, setAuthOpen] = useState(false);
  const [forcing, setForcing] = useState(false);

  const forceNext = async () => {
    if (forcing) return;
    setForcing(true);
    await supabase.rpc('rps_force_tick');
    await loadCurrent();
    setForcing(false);
  };

  // Блеф доступний, лише якщо останній результат — виграш, і пропущено < 2 раундів.
  // Блеф завжди доступний — щоб бачити тип мислення гравця.
  const canBluff = true;

  useEffect(() => {
    if (!canBluff && bluff) setBluff(false);
  }, [canBluff, bluff]);

  const roundIdRef = useRef<number | null>(null);
  const advancing = useRef(false);

  const fetchBets = useCallback(async (rid: number) => {
    const { data } = await supabase.from('rps_bets').select('*').eq('round_id', rid).order('id');
    setBets((data as BetRow[]) || []);
  }, []);

  const loadCurrent = useCallback(async () => {
    const { data, error } = await supabase.rpc('rps_tick');
    if (error || !data) return;
    const r = data as RoundRow;
    roundIdRef.current = r.id;
    setRound(r);
    await fetchBets(r.id);
  }, [fetchBets]);

  // Initial load + realtime subscriptions
  useEffect(() => {
    loadCurrent();
    const ch = supabase
      .channel('rps-game')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        roundIdRef.current = r.id;
        setRound(r);
        setBets([]);
        setMyPlay(null);
        advancing.current = false;
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        if (r.id === roundIdRef.current) {
          setRound(r);
          if (r.status === 'settled' && r.win_move) setLastWin(r.win_move as Move);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_bets' }, (p) => {
        const b = p.new as BetRow;
        if (b.round_id === roundIdRef.current) {
          setBets((prev) => (prev.some((x) => x.id === b.id) ? prev : [...prev, b]));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_bets' }, (p) => {
        const b = p.new as BetRow;
        if (b.player_id === account.playerId) {
          setLastResult({ net: b.payout - b.stake, payout: b.payout, move: b.move as Move, stake: b.stake, isBluff: b.is_bluff });
          if (b.payout > b.stake) {
            setCelebrate(true);
            window.setTimeout(() => setCelebrate(false), 2600);
          }
          account.refresh();
        }
      })
      .subscribe();
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

  const [botBusy, setBotBusy] = useState(false);
  const [autoFill, setAutoFill] = useState(true);
  const filledRef = useRef<number | null>(null);

  const fillRound = useCallback(async () => {
    setBotBusy(true);
    await supabase.rpc('rps_fill', { p_target: 20 });
    if (roundIdRef.current) await fetchBets(roundIdRef.current);
    setBotBusy(false);
  }, [fetchBets]);

  // Auto-fill: боти заходять ПОСТУПОВО протягом раунду (живіше відчуття).
  useEffect(() => {
    if (!autoFill || !round || round.status !== 'betting') return;
    if (filledRef.current === round.id) return;
    filledRef.current = round.id;

    const finalTarget = 14 + Math.floor(Math.random() * 7); // 14–20
    let current = 2 + Math.floor(Math.random() * 3); // старт 2–4
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
  }, [round, autoFill, fetchBets]);

  const myBet = bets.find((b) => b.player_id === account.playerId) || null;
  const potOf = (m: Move) => bets.filter((b) => b.move === m).reduce((s, b) => s + b.stake, 0);
  const bank = bets.reduce((s, b) => s + b.stake, 0);

  const placeBet = async () => {
    if (busy || myBet) return;
    if (account.balance < STAKE) {
      onTopUp();
      return;
    }
    const useBluff = bluff && canBluff && shownMove !== move;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('rps_place_bet', {
      p_id: account.playerId,
      p_nick: account.nickname,
      p_move: move,
      p_stake: STAKE,
      p_shown_move: useBluff ? shownMove : move,
      p_is_bluff: useBluff,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('insufficient')) onTopUp();
      else if (msg.includes('bluff locked')) setErr('Блеф відкриється після першої перемоги 🔒');
      else if (msg.includes('round closed')) {
        setErr('Раунд щойно завершився — зачекай наступний 🙂');
        loadCurrent();
      } else if (msg.includes('already bet')) setErr('Ти вже зробив ставку в цьому раунді');
      else setErr('Не вдалося поставити. Спробуй ще раз.');
    } else {
      setLastResult(null);
      setMyPlay({ real: move, shown: useBluff ? shownMove : move, bluff: useBluff });
      await account.refresh();
      if (roundIdRef.current) await fetchBets(roundIdRef.current);
    }
    setBusy(false);
  };

  const low = remaining <= 5;
  const progress = Math.min(1, Math.max(0, remaining / ROUND_SECONDS));

  return (
    <section id="game" className="mx-auto max-w-3xl px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/5 ring-1 ring-white/60"
      >
        <AnimatePresence>{celebrate && <Confetti />}</AnimatePresence>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 bg-gradient-to-r from-emerald-500/10 via-teal-400/5 to-transparent px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
              Онлайн-раунд
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
                <Wifi className="h-3 w-3" /> наживо
              </span>
            </h2>
            <p className="text-xs text-slate-500">Спільний банк · тестовий режим: переможний хід чергується щораунду 🔄</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-amber-600 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            <AnimatedNumber value={account.balance} />
          </div>
        </div>

        <div className="p-6">
          {/* Nickname + account */}
          <div className="mb-2 flex items-center gap-2">
            <input
              value={account.nickname}
              onChange={(e) => account.setNickname(e.target.value.slice(0, 20))}
              className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Твоє імʼя у грі"
            />
            {account.isAccount ? (
              <button
                onClick={account.logout}
                className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Вийти
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
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

          {/* Timer ring + stats */}
          <div className="mb-6 flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users className="h-3.5 w-3.5" /> Гравців
              </div>
              <div className="mt-1 text-3xl font-extrabold text-slate-900">
                <AnimatedNumber value={bets.length} />
              </div>
            </div>

            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={RING} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r={RING}
                  fill="none"
                  stroke={low ? '#f43f5e' : '#10b981'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  style={{ filter: `drop-shadow(0 0 6px ${low ? 'rgba(244,63,94,.55)' : 'rgba(16,185,129,.5)'})` }}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ ease: 'linear', duration: 0.25 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={remaining}
                  initial={{ scale: low ? 1.3 : 1, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-extrabold tabular-nums ${low ? 'text-rose-500' : 'text-slate-900'}`}
                >
                  {round ? remaining : '…'}
                </motion.span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">секунд</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Банк</div>
              <div className="mt-1 flex items-center justify-center gap-1 text-3xl font-extrabold text-emerald-600">
                <AnimatedNumber value={bank} />
              </div>
              <div className="text-[11px] text-slate-400">монет</div>
            </div>
          </div>

          {/* Controls (top tools) */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={autoFill}
                onChange={(e) => setAutoFill(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-600"
              />
              Авто-боти (до 20 щораунду)
            </label>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fillRound}
              disabled={botBusy || remaining <= 1}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:ring-emerald-300 disabled:opacity-50"
            >
              <Bot className="h-3.5 w-3.5" /> {botBusy ? 'Додаю…' : 'Заповнити до 20'}
            </motion.button>
          </div>

          {/* Pools */}
          <div className="grid grid-cols-3 gap-3">
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
                  className={`relative overflow-hidden rounded-2xl border p-4 text-center transition ${
                    isMine
                      ? 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-200/50'
                      : 'border-slate-200 bg-white/70'
                  }`}
                >
                  <motion.div
                    className="text-4xl"
                    animate={isMine ? { scale: [1, 1.12, 1] } : {}}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    {m.emoji}
                  </motion.div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">{m.label}</div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-emerald-600">
                    <Coins className="h-3.5 w-3.5" /> <AnimatedNumber value={pot} />
                  </div>
                  <div className="text-xs text-slate-400">{cnt} гравц.</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      animate={{ width: `${share * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  {isMine && <div className="mt-1.5 text-[11px] font-bold text-emerald-600">твоя ставка</div>}
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
                className={`relative mt-4 overflow-hidden rounded-2xl p-4 text-center text-sm font-bold ${
                  lastResult.net > 0
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : lastResult.net < 0
                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lastResult.net > 0 &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="pointer-events-none absolute text-lg"
                      style={{ left: `${10 + i * 10}%`, top: '50%' }}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -60 - Math.random() * 30, opacity: 0, rotate: Math.random() * 180 }}
                      transition={{ duration: 1.1, delay: i * 0.05 }}
                    >
                      {i % 2 ? '🪙' : '🎉'}
                    </motion.span>
                  ))}
                Твій хід {emojiOf(lastResult.move)}
                {lastResult.isBluff && <span className="ml-1">🤫 блеф</span>}{' '}
                {lastResult.net > 0
                  ? `· виграш +${lastResult.net} монет 🎉`
                  : lastResult.net < 0
                  ? `· програш ${lastResult.net} монет`
                  : '· ставку повернено'}
                {lastWin && (
                  <div className="mt-1 text-xs font-medium opacity-80">
                    Виграшний хід раунду: {emojiOf(lastWin)} {labelOf(lastWin)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {myBet ? (
                <motion.div
                  key="placed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-100"
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
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={forceNext}
                    disabled={forcing}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {forcing ? 'Розігрую…' : '▶ Розіграти зараз'}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Твій хід</div>
                  <div className="grid grid-cols-3 gap-3">
                    {MOVES.map((m) => (
                      <motion.button
                        key={m.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setMove(m.id);
                          if (bluff && shownMove === m.id) {
                            setShownMove(MOVES.find((x) => x.id !== m.id)!.id);
                          }
                        }}
                        className={`flex flex-col items-center gap-1 rounded-2xl border py-4 transition ${
                          move === m.id
                            ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-200/50'
                            : 'border-slate-200 bg-white/70 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-3xl">{m.emoji}</span>
                        <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Bluff */}
                  <div className="mt-4 rounded-2xl bg-violet-50/80 p-3 ring-1 ring-violet-200">
                    <motion.button
                      type="button"
                      whileTap={{ scale: canBluff ? 0.97 : 1 }}
                      disabled={!canBluff}
                      onClick={() => {
                        const next = !bluff;
                        setBluff(next);
                        if (next && shownMove === move) {
                          setShownMove(MOVES.find((m) => m.id !== move)!.id);
                        }
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                        !canBluff
                          ? 'cursor-not-allowed bg-white/60 text-violet-300 ring-1 ring-violet-100'
                          : bluff
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-300/50'
                          : 'bg-white text-violet-700 ring-1 ring-violet-300 hover:bg-violet-100'
                      }`}
                    >
                      {!canBluff ? '🔒 Блеф (після виграшу)' : bluff ? '🤫 Блеф увімкнено' : '🤫 Блеф'}
                    </motion.button>
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
                                className={`rounded-xl border py-2 text-sm font-semibold transition ${
                                  m.id === move
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                                    : shownMove === m.id
                                    ? 'border-violet-400 bg-violet-100 text-violet-700'
                                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-violet-300'
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

                  <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Ставка</div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-200">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span className="text-lg font-extrabold text-slate-900">{STAKE}</span>
                    <span className="text-sm text-slate-500">монет — фіксована для всіх</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={placeBet}
                    disabled={busy || remaining <= 1}
                    className="shine mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {account.balance < STAKE
                      ? 'Поповнити баланс'
                      : remaining <= 1
                      ? 'Раунд закінчується…'
                      : `Поставити ${STAKE} монет`}
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
                      b.player_id === account.playerId ? 'bg-emerald-600 text-white' : 'bg-white/70 text-slate-600 ring-1 ring-slate-200'
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
            Реальний онлайн: усі гравці грають в одному раунді. Зароблені монети згодом можна буде витратити на послуги
            або вивести. Поки що — демо на віртуальних монетах.
          </p>
        </div>
      </motion.div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} account={account} />
    </section>
  );
};

export default PoolGame;
