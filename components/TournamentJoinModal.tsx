import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, X, Check, Loader2, LogIn, ShieldCheck, Timer, Zap, PartyPopper } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';
import { navigate } from '../hooks/useRoute';

interface Info {
  id: number;
  name: string;
  description: string | null;
  prepay_coins: number;
  date: string | null;
  end_date: string | null;
  status: 'scheduled' | 'active' | 'finished';
}

interface Props {
  tournamentId: number;
  account: Account;
  onClose: () => void;
  onTopUp: () => void;
  onLogin: () => void;
}

type Stage = 'loading' | 'need_auth' | 'already_joined' | 'consent' | 'joining' | 'done' | 'insufficient' | 'error';

function useCountdown(targetDate: string | null | undefined) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!targetDate) { setText(''); return; }
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setText('Вже починається!'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setText(
        h > 0
          ? `${h} год ${String(m).padStart(2, '0')} хв ${String(s).padStart(2, '0')} сек`
          : m > 0
          ? `${m} хв ${String(s).padStart(2, '0')} сек`
          : `${s} сек`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return text;
}

const TournamentJoinModal: React.FC<Props> = ({ tournamentId, account, onClose, onTopUp, onLogin }) => {
  const [info, setInfo] = useState<Info | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [errMsg, setErrMsg] = useState('');
  const countdown = useCountdown(stage === 'already_joined' && info?.status === 'scheduled' ? info.date : null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Завантажуємо інфо про турнір
      const { data, error } = await supabase.rpc('rps_tournament_info', { p_tournament_id: tournamentId });
      if (cancelled) return;
      if (error) {
        setStage('error');
        setErrMsg(`Сервер турнірів недоступний: ${error.message}`);
        return;
      }
      if (!data) { setStage('error'); setErrMsg('Турнір не знайдено або посилання застаріле.'); return; }
      setInfo(data as Info);

      if (!account.isAccount) {
        setStage('need_auth');
        return;
      }

      // Перевіряємо чи вже зареєстрований
      const { data: invite } = await supabase
        .from('rps_tournament_invites')
        .select('status')
        .eq('player_id', account.playerId)
        .eq('tournament_id', tournamentId)
        .eq('status', 'yes')
        .maybeSingle();
      if (cancelled) return;

      if (invite) {
        setStage('already_joined');
      } else {
        setStage('consent');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  // Коли гравець зайшов в акаунт прямо з цього екрана
  useEffect(() => {
    if (stage === 'need_auth' && account.isAccount) setStage('consent');
  }, [account.isAccount, stage]);

  const prepay = info?.prepay_coins ?? 0;
  const enough = account.balance >= prepay;

  const join = async () => {
    if (!info) return;
    if (prepay > 0 && !enough) { setStage('insufficient'); return; }
    setStage('joining');
    const { data } = await supabase.rpc('rps_tournament_join', { p_player_id: account.playerId, p_tournament_id: tournamentId });
    if (data === 'ok' || data === 'already_joined') {
      try { localStorage.setItem(`rps_tournament_joined_${tournamentId}`, '1'); } catch { /* ignore */ }
      await account.refresh();
      setStage('done');
    } else if (data === 'insufficient') {
      setStage('insufficient');
    } else {
      setStage('error');
      setErrMsg('Не вдалося приєднатися. Спробуйте ще раз.');
    }
  };

  const goPlay = () => { onClose(); navigate('game'); };

  // Колір шапки залежно від статусу
  const headerGradient = stage === 'already_joined'
    ? 'from-violet-600 via-purple-600 to-indigo-700'
    : 'from-amber-500 via-amber-500 to-orange-500';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"
          initial={{ scale: 0.94, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Шапка */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${headerGradient} px-6 py-6 text-white`}>
            {/* Декоративні кулі */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <X className="h-4 w-4" />
            </button>
            <div className="relative flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 text-2xl">
                {stage === 'already_joined' ? '🏆' : <Trophy className="h-6 w-6" />}
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-white/75">Турнір</div>
                <div className="text-lg font-black leading-tight">{info?.name || 'Запрошення'}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {stage === 'loading' && (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span className="text-sm">Завантаження…</span>
              </div>
            )}

            {stage === 'need_auth' && (
              <div className="text-center">
                <p className="text-sm leading-relaxed text-slate-600">Щоб брати участь у турнірі, потрібен акаунт. Зареєструйся або увійди — це швидко.</p>
                <button onClick={onLogin} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                  <LogIn className="h-5 w-5" /> Увійти / Зареєструватися
                </button>
                <button onClick={onClose} className="mt-2 w-full text-xs font-semibold text-slate-400 hover:text-slate-600">Пізніше</button>
              </div>
            )}

            {/* ✅ ВЖЕ ЗАРЕЄСТРОВАНИЙ */}
            {stage === 'already_joined' && (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                {/* Іконка */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-3xl shadow-inner"
                >
                  🎟️
                </motion.div>

                {/* Заголовок */}
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <PartyPopper className="h-4 w-4 text-violet-600" />
                    <span className="text-base font-black text-slate-900">Ти вже зареєстрований!</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">«{info?.name}»</p>
                </div>

                {/* Інфо блок */}
                <div className="w-full rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 ring-1 ring-violet-100">
                  {info?.status === 'active' ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                        <Zap className="h-3 w-3" /> Турнір вже йде!
                      </span>
                      <p className="text-xs text-slate-600">Переходь до гри та борись за перемогу 🎮</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {info?.date && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Початок турніру</span>
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(info.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      )}
                      {countdown && (
                        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-violet-100/60">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">До початку</div>
                          <div className="mt-0.5 font-mono text-xl font-extrabold text-violet-700">{countdown}</div>
                        </div>
                      )}
                      {info?.end_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Закінчення</span>
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(info.end_date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Timer className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-[11px] text-violet-500 font-medium">Очікуй старту — і приходь грати!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Кнопки */}
                {info?.status === 'active' ? (
                  <button onClick={goPlay} className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 active:scale-95">
                    <Zap className="h-5 w-5" /> Грати зараз!
                  </button>
                ) : (
                  <button onClick={onClose} className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3.5 font-bold text-white transition hover:bg-slate-700 active:scale-95">
                    <Check className="h-5 w-5" /> Зрозуміло, чекатиму!
                  </button>
                )}
                <p className="text-[11px] text-slate-400">Нагадування також є у твоєму Профілі</p>
              </div>
            )}

            {stage === 'consent' && (
              <div>
                {info?.description && <p className="mb-3 text-sm leading-relaxed text-slate-600">{info.description}</p>}
                {(info?.date || info?.end_date) && (
                  <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                    {info.date && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Час початку:</span>
                        <span className="font-bold text-slate-800">{new Date(info.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    )}
                    {info.end_date && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Час закінчення:</span>
                        <span className="font-bold text-slate-800">{new Date(info.end_date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-800">Завдаток за участь</span>
                    <span className="flex items-center gap-1 text-lg font-black text-amber-700"><Coins className="h-4 w-4" /> {prepay.toLocaleString('uk-UA')}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-amber-700/90">
                    Ця сума буде <b>зарезервована</b> з твого балансу для участі в турнірі. Твій баланс: <b>{account.balance.toLocaleString('uk-UA')}</b> монет.
                  </p>
                </div>
                <button onClick={join} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                  <Check className="h-5 w-5" /> Погоджуюсь — взяти участь
                </button>
                <button onClick={onClose} className="mt-2 w-full text-xs font-semibold text-slate-400 hover:text-slate-600">Скасувати</button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Без твоєї згоди нічого не списується</p>
              </div>
            )}

            {stage === 'joining' && (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /><span className="text-sm">Приєднуємо…</span></div>
            )}

            {stage === 'insufficient' && (
              <div className="text-center">
                <p className="text-sm leading-relaxed text-slate-600">
                  Недостатньо монет для участі. Потрібно <b>{prepay.toLocaleString('uk-UA')}</b>, у тебе <b>{account.balance.toLocaleString('uk-UA')}</b>. Поповни баланс — і повертайся до турніру.
                </p>
                <button onClick={() => { onClose(); onTopUp(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                  <Coins className="h-5 w-5" /> Поповнити баланс
                </button>
                <button onClick={onClose} className="mt-2 w-full text-xs font-semibold text-slate-400 hover:text-slate-600">Пізніше</button>
              </div>
            )}

            {stage === 'done' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"
                >
                  <Check className="h-7 w-7" />
                </motion.span>
                <p className="text-lg font-bold text-slate-900">Ти в турнірі! 🏆</p>
                <p className="text-sm text-slate-500">
                  {info?.status === 'active'
                    ? 'Завдаток зарезервовано. Турнір вже розпочався, переходь до гри!'
                    : 'Завдаток зарезервовано. Турнір розпочнеться у запланований час. Чекаємо на старт!'}
                </p>
                {info?.status === 'active' ? (
                  <button onClick={goPlay} className="shine mt-1 w-full rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">Грати →</button>
                ) : (
                  <button onClick={onClose} className="mt-1 w-full rounded-2xl bg-slate-800 py-3.5 font-bold text-white transition hover:bg-slate-700">Очікувати старту (Закрити)</button>
                )}
              </div>
            )}

            {stage === 'error' && (
              <div className="text-center">
                <p className="text-sm text-rose-600">{errMsg || 'Сталася помилка.'}</p>
                <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-slate-100 py-3 font-semibold text-slate-600 transition hover:bg-slate-200">Закрити</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TournamentJoinModal;
