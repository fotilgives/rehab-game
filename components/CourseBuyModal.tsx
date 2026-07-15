import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, Mail, Phone, User, Coins, CreditCard, CheckCircle2 } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

const COURSE_BOT_URL = 'https://t.me/+o9i9tJpoj4A3MTcy';
const COURSE_PRICE_UAH = 2500;
const COURSE_PRICE_COINS = 12500;

type Mode = 'choose' | 'money' | 'done';

const CourseBuyModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setBusy(false); setErr(null); setMode('choose'); }
  }, [open]);

  // Оплата бонусами: списуємо монети й одразу ведемо в Telegram-бот курсу.
  const payWithCoins = async () => {
    setErr(null);
    if (account.balance < COURSE_PRICE_COINS) {
      setErr(`Недостатньо монет: потрібно ${COURSE_PRICE_COINS.toLocaleString('uk-UA')}, у вас ${account.balance.toLocaleString('uk-UA')}.`);
      return;
    }
    setBusy(true);
    const error = await account.redeem('Курс з йоги (онлайн)', COURSE_PRICE_COINS);
    if (error) {
      setErr(error === 'Недостатньо монет'
        ? `Недостатньо монет: потрібно ${COURSE_PRICE_COINS.toLocaleString('uk-UA')}.`
        : error);
      setBusy(false);
      return;
    }
    // Лист доступу до курсу на пошту (fire-and-forget). Email візьметься з акаунта.
    fetch('/api/send-course-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: account.playerId, name: account.nickname, courseName: 'Курс з йоги (онлайн)' }),
    }).catch(() => {});
    // Успіх — показуємо екран з кнопкою-посиланням. НЕ викликаємо window.open
    // (його блокує браузер після await) — користувач тисне кнопку сам.
    setBusy(false);
    setMode('done');
  };

  // Оплата грошима: створюємо платіж у WayForPay і редіректимо на оплату.
  const payWithMoney = async () => {
    setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr('Вкажіть коректний e-mail — на нього надійде квитанція.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setErr('Вкажіть коректний номер телефону.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/wayforpay-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, playerId: account.playerId }),
      });
      const data = await r.json();
      if (!r.ok || !data.fields) throw new Error(data.error || 'Не вдалося створити платіж.');

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
      setBusy(false);
    }
  };

  const enough = account.balance >= COURSE_PRICE_COINS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
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
                <h3 className="text-xl font-extrabold text-slate-900">Придбати курс з йоги</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {mode === 'choose'
                    ? 'Оберіть спосіб оплати — доступ відкриється в Telegram-боті курсу.'
                    : 'Доступ і квитанцію надішлемо після оплати.'}
                </p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {mode === 'choose' && (
              <div className="mt-5 space-y-3">
                {/* Оплата бонусами */}
                <button
                  onClick={payWithCoins}
                  disabled={busy || !enough}
                  className="group flex w-full items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-4 text-left transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Coins className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">
                      Оплатити бонусами · {COURSE_PRICE_COINS.toLocaleString('uk-UA')} монет
                    </span>
                    <span className="block text-xs text-slate-500">
                      {enough
                        ? 'Спишемо монети — і одразу відкриємо курс.'
                        : `У вас ${account.balance.toLocaleString('uk-UA')} монет — поки недостатньо.`}
                    </span>
                  </span>
                </button>

                {/* Оплата грошима */}
                <button
                  onClick={() => { setErr(null); setMode('money'); }}
                  disabled={busy}
                  className="group flex w-full items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">Оплатити грошима · {COURSE_PRICE_UAH} грн</span>
                    <span className="block text-xs text-slate-500">Картка · Apple/Google Pay через WayForPay.</span>
                  </span>
                </button>

                {err && <p className="text-center text-xs font-semibold text-rose-600">{err}</p>}

                <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Безпечна оплата · доступ у Telegram-боті курсу
                </p>
              </div>
            )}

            {mode === 'money' && (
              <>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ім'я (необов'язково)"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      inputMode="email"
                      placeholder="E-mail для квитанції"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      inputMode="tel"
                      placeholder="Телефон"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>

                {err && <p className="mt-3 text-center text-xs font-semibold text-rose-600">{err}</p>}

                <button
                  onClick={payWithMoney}
                  disabled={busy}
                  className="shine mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Переходимо до оплати…</>
                  ) : (
                    <>Оплатити {COURSE_PRICE_UAH} грн</>
                  )}
                </button>

                <button
                  onClick={() => { setErr(null); setMode('choose'); }}
                  disabled={busy}
                  className="mt-2 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-60"
                >
                  ← Інший спосіб оплати
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Безпечна оплата через WayForPay · Visa · Mastercard · Apple/Google Pay
                </p>
              </>
            )}

            {mode === 'done' && (
              <div className="mt-5 flex flex-col items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <p className="text-lg font-bold text-slate-900">Курс відкрито! 🎉</p>
                <p className="text-sm text-slate-500">Натисни кнопку — і переходь у Telegram-групу курсу.</p>
                <a
                  href={COURSE_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shine mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700"
                >
                  Відкрити курс у Telegram →
                </a>
              </div>
            )}

            {mode !== 'done' && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Після оплати курс відкриється у Telegram
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseBuyModal;
