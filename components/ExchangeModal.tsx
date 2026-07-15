import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Loader2, ShieldCheck, Check, Receipt } from 'lucide-react';
import type { Account } from '../hooks/useAccount';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
  onHistory?: () => void;
}

// Суми фіксованих пакетів (грн). Монети рахуються з курсу coin_rate (з БД).
const PACK_UAH = [50, 100, 200, 500];
const DEFAULT_COIN_RATE = 5;

const ExchangeModal: React.FC<Props> = ({ open, onClose, account, onHistory }) => {
  const [busy, setBusy]   = useState<string | null>(null);
  const [done, setDone]   = useState<number | null>(null);
  const [err, setErr]     = useState<string | null>(null);
  const [customUah, setCustomUah] = useState('');
  const [rate, setRate]   = useState(DEFAULT_COIN_RATE); // 1 грн = rate балів (налаштовується в адмінці)

  const packs: { id: string; uah: number; coins: number; test?: boolean }[] =
    PACK_UAH.map((uah) => ({ id: `p${uah}`, uah, coins: uah * rate }));
  const customNum = Math.floor(Number(customUah) || 0);
  const customCoins = customNum >= 1 ? customNum * rate : 0;

  useEffect(() => { if (!open) { setBusy(null); setDone(null); setErr(null); setCustomUah(''); } }, [open]);

  // Підтягуємо актуальний курс монет із БД при відкритті.
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('rps_config').select('data').eq('id', 1).single();
      const r = Number((data as { data?: Record<string, number> } | null)?.data?.coin_rate);
      if (Number.isFinite(r) && r >= 1) setRate(Math.floor(r));
    })();
  }, [open]);

  // Слухаємо повернення зі сторінки WayForPay
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wfp') === 'ok') {
      setDone(Number(params.get('coins') ?? 0));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [open]);

  const buy = async (payload: { packageId?: string; amount?: number }, coins: number, key: string) => {
    setErr(null);
    setBusy(key);
    try {
      const res  = await fetch('/api/wayforpay-topup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...payload, playerId: account.playerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.fields) throw new Error(data.error || 'Не вдалося створити платіж.');

      // Запам'ятовуємо кількість монет для показу після повернення
      sessionStorage.setItem('wfp_coins', String(coins));

      // Зберігаємо orderReference локально — страхувальна звірка дорахує монети,
      // навіть якщо колбек/повернення не спрацюють (перевіримо статус при заході).
      try {
        const ref = String(data.fields.orderReference || '');
        if (ref) {
          const key = 'wfp_pending_refs';
          const list: string[] = JSON.parse(localStorage.getItem(key) || '[]');
          if (!list.includes(ref)) list.push(ref);
          localStorage.setItem(key, JSON.stringify(list.slice(-50)));
        }
      } catch {
        /* ignore */
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.acceptCharset = 'utf-8';
      const add = (k: string, v: string | number) => {
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = String(v);
        form.appendChild(i);
      };
      Object.entries(data.fields).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) v.forEach((item) => add(`${k}[]`, item as string | number));
        else add(k, v as string | number);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Сталася помилка. Спробуйте пізніше.');
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Поповнення балансу</h3>
                <p className="mt-1 text-sm text-slate-500">1 грн = {rate} {rate === 1 ? 'монета' : 'монет'} · 100 грн = {(100 * rate).toLocaleString('uk-UA')}</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done !== null && done > 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-7 w-7" />
                </span>
                <p className="text-lg font-bold text-slate-900">Зараховано {done} монет!</p>
                <p className="text-sm text-slate-500">Баланс оновиться автоматично</p>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {packs.map((p) => {
                    const loading = busy === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => buy({ packageId: p.id }, p.coins, p.id)}
                        disabled={!!busy}
                        className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                          {p.uah} <span className="text-base font-bold text-slate-400">грн</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                          {loading
                            ? <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                            : <Coins className="h-3 w-3 text-amber-400" />}
                          {p.coins} монет
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Своя сума */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Своя сума</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-emerald-400">
                      <input
                        value={customUah}
                        onChange={(e) => setCustomUah(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        inputMode="numeric"
                        placeholder="Напр. 250"
                        className="w-full bg-transparent text-lg font-extrabold text-slate-900 outline-none"
                      />
                      <span className="text-sm font-bold text-slate-400">грн</span>
                    </div>
                    <button
                      onClick={() => buy({ amount: customNum }, customCoins, 'custom')}
                      disabled={!!busy || customNum < 1}
                      className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy === 'custom' ? '…' : 'Поповнити'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    {customCoins > 0 ? <> = <b className="text-slate-700">{customCoins.toLocaleString('uk-UA')}</b> монет</> : 'введи суму — покажемо скільки балів'}
                  </div>
                </div>

                {err && <p className="mt-4 text-center text-xs font-semibold text-rose-600">{err}</p>}

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Безпечна оплата через WayForPay · монети зараховуються після оплати
                </p>

                {onHistory && (
                  <button
                    onClick={onHistory}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" /> Історія покупок
                  </button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExchangeModal;
