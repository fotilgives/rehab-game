import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, X, Check, Loader2, LogIn, ShieldCheck } from 'lucide-react';
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

type Stage = 'loading' | 'need_auth' | 'consent' | 'joining' | 'done' | 'insufficient' | 'error';

const TournamentJoinModal: React.FC<Props> = ({ tournamentId, account, onClose, onTopUp, onLogin }) => {
  const [info, setInfo] = useState<Info | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('rps_tournament_info', { p_tournament_id: tournamentId });
      if (cancelled) return;
      if (error) {
        // Функція/кеш на сервері (напр. не застосовано міграцію турнірів) —
        // показуємо справжню причину, а не «застаріле посилання».
        setStage('error');
        setErrMsg(`Сервер турнірів недоступний: ${error.message}`);
        return;
      }
      if (!data) { setStage('error'); setErrMsg('Турнір не знайдено або посилання застаріле.'); return; }
      setInfo(data as Info);
      setStage(account.isAccount ? 'consent' : 'need_auth');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  // Коли гравець зайшов в акаунт прямо з цього екрана — переходимо до згоди.
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
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 px-6 py-6 text-white">
            <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"><X className="h-4 w-4" /></button>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30"><Trophy className="h-6 w-6" /></span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-amber-50/80">Турнір</div>
                <div className="text-lg font-black leading-tight">{info?.name || 'Запрошення'}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {stage === 'loading' && (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /><span className="text-sm">Завантаження…</span></div>
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
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-7 w-7" /></span>
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
