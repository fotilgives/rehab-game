import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Loader2, CreditCard } from 'lucide-react';
import { navigate } from '../../hooks/useRoute';

const PRESETS = [100, 200, 500, 1000];

const Support: React.FC = () => {
  const [amount, setAmount] = useState<number>(200);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const finalAmount = custom.trim() ? Math.round(Number(custom)) : amount;

  const pay = async () => {
    setErr(null);
    if (!Number.isFinite(finalAmount) || finalAmount < 1) {
      setErr('Вкажіть коректну суму внеску.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/wayforpay-donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, name, email }),
      });
      const data = await r.json();
      if (!r.ok || !data.fields) throw new Error(data.error || 'Не вдалося створити платіж.');

      // Будуємо приховану форму та надсилаємо на безпечну сторінку WayForPay.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.acceptCharset = 'utf-8';
      const add = (k: string, v: string | number) => {
        const i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = String(v);
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

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-12 sm:pt-16">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
        <span className="eyebrow">Підтримка</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Підтримати центр</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
          Ваш добровільний внесок допомагає розвивати центр, оновлювати обладнання та робити заняття
          доступнішими для дітей і дорослих. Дякуємо за підтримку! 🙏
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card-glow mx-auto mt-8 rounded-3xl p-6 ring-1 ring-white/60 shadow-xl sm:p-8"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PRESETS.map((a) => (
            <button
              key={a}
              onClick={() => {
                setAmount(a);
                setCustom('');
              }}
              className={`rounded-2xl py-3 text-sm font-bold transition ${
                !custom && amount === a
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300'
              }`}
            >
              {a} ₴
            </button>
          ))}
        </div>

        <div className="mt-3">
          <div className="relative">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="Інша сума"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₴</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ім'я (необов'язково)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail (для квитанції)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {err && <p className="mt-4 text-xs font-semibold text-rose-600">{err}</p>}

        <button
          onClick={pay}
          disabled={busy}
          className="shine mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Переходимо до оплати…
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" /> Підтримати на {finalAmount > 0 ? finalAmount : 0} ₴
            </>
          )}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Безпечна оплата через WayForPay
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> Visa · Mastercard · Apple/Google Pay
          </span>
        </div>
      </motion.div>

      <p className="mx-auto mt-5 max-w-lg text-center text-[11px] leading-relaxed text-slate-400">
        Натискаючи «Підтримати», ви погоджуєтеся з{' '}
        <button onClick={() => navigate('legal')} className="font-semibold text-emerald-600 hover:underline">
          Публічною офертою та Політикою конфіденційності
        </button>
        . Внесок є добровільним і безповоротним пожертвуванням.
      </p>
    </main>
  );
};

export default Support;
