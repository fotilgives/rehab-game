import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, Check } from 'lucide-react';
import type { Account } from '../../hooks/useAccount';
import AnimatedNumber from '../AnimatedNumber';

interface Props {
  account: Account;
  onTopUp: () => void;
}

const REWARDS = [
  { emoji: '🎟️', title: 'Знижка 50% на масаж', cost: 500 },
  { emoji: '💆', title: 'Сеанс масажу', cost: 1500 },
  { emoji: '🎁', title: 'Подарунковий сертифікат', cost: 1000 },
  { emoji: '🧘', title: 'Підписка на курс з йоги', cost: 2000 },
  { emoji: '📜', title: 'Сертифікат на послуги', cost: 1200 },
  { emoji: '✨', title: 'Корисний бонус / товар', cost: 300 },
];

const Prizes: React.FC<Props> = ({ account, onTopUp }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const redeem = async (title: string, cost: number) => {
    setErr(null);
    if (account.balance < cost) {
      onTopUp();
      return;
    }
    setBusy(title);
    const e = await account.redeem(title, cost);
    setBusy(null);
    if (e) setErr(e);
    else {
      setClaimed(title);
      window.setTimeout(() => setClaimed(null), 3500);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <div className="text-center">
        <span className="eyebrow">🎁 Призи</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Обмін монет на призи</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Зароблені у грі монети можна обміняти на послуги, знижки, сертифікати та курси. Без виводу коштів — лише корисні нагороди.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-base font-bold text-amber-600 ring-1 ring-amber-200">
          <Coins className="h-5 w-5" /> Твій баланс: <AnimatedNumber value={account.balance} />
        </div>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS.map((r, i) => {
          const enough = account.balance >= r.cost;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="card-glow flex flex-col rounded-3xl p-6 ring-1 ring-white/60"
            >
              <div className="text-4xl">{r.emoji}</div>
              <h2 className="mt-3 flex-1 text-lg font-bold text-slate-900">{r.title}</h2>
              <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                <Coins className="h-4 w-4" />
                <span className="text-xl font-extrabold">{r.cost}</span>
                <span className="text-sm text-slate-400">монет</span>
              </div>
              <button
                onClick={() => redeem(r.title, r.cost)}
                disabled={busy === r.title}
                className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  enough
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {busy === r.title ? 'Оформлюю…' : enough ? 'Обміняти' : 'Поповнити баланс'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Список призів регулярно оновлюється. Після обміну спеціаліст звʼяжеться з вами, щоб видати нагороду.
      </p>

      {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

      {/* Toast */}
      <AnimatePresence>
        {claimed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          >
            <Check className="h-5 w-5" />
            Готово! «{claimed}» — заявку прийнято <Gift className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Prizes;
