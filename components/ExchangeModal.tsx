import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Check } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

// 1 грн = 1 монета (демо-курс).
const PACKS = [
  { uah: 50, coins: 50 },
  { uah: 100, coins: 110, bonus: '+10%' },
  { uah: 250, coins: 290, bonus: '+16%' },
  { uah: 500, coins: 600, bonus: '+20%' },
];

const ExchangeModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    if (!open) setDone(null);
  }, [open]);

  const buy = async (coins: number) => {
    await account.topUp(coins);
    setDone(coins);
    window.setTimeout(onClose, 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Поповнення балансу</h3>
                <p className="mt-1 text-sm text-slate-500">Обмін гривень на ігрові монети</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done !== null ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-7 w-7" />
                </span>
                <p className="text-lg font-bold text-slate-900">Зараховано {done} монет</p>
                <p className="text-sm text-slate-500">Новий баланс: {account.balance}</p>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {PACKS.map((p) => (
                    <button
                      key={p.uah}
                      onClick={() => buy(p.coins)}
                      className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      {p.bonus && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {p.bonus}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                        <Coins className="h-4 w-4 text-amber-500" />
                        {p.coins}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{p.uah} грн</div>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Демо-режим: оплата не стягується, монети нараховуються одразу.
                  Реальну платіжну систему (LiqPay / Stripe) можна під'єднати пізніше.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExchangeModal;
