import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Check, Sparkles, Hand, Activity, Flower2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ZoomImage from '../ZoomImage';

const services = [
  { icon: Hand, title: 'Масаж', items: ['Лікувальний та оздоровчий', 'Тайський масаж', 'Фасціальні техніки', 'Вакуумні банки'] },
  { icon: Activity, title: 'Реабілітація', items: ['Юмейхо-терапія', 'DNS — нейром’язова стабілізація', 'Redcord-терапія', 'Blomberg Therapy', 'Лікувальна фізкультура'] },
  { icon: Flower2, title: 'Йога та практики', items: ['Індивідуальні заняття', 'Тілесні практики', 'Пресролінг'] },
  { icon: Sparkles, title: 'Навчання', items: ['Курси з йоги', 'Курси масажу', 'Онлайн-курси та програми'] },
];

const SERVICE_OPTIONS = [
  'Лікувальний масаж',
  'Тайський масаж',
  'Реабілітаційна сесія',
  'Заняття з йоги',
  'Консультація',
  'Курс / навчання',
  'Подарунковий сертифікат',
  'Інше',
];

const Services: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setErr("Вкажіть ім'я та телефон");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('rps_book', {
      p_name: name,
      p_phone: phone,
      p_service: service,
      p_note: note,
    });
    setBusy(false);
    if (error) setErr('Не вдалося відправити. Спробуйте ще раз.');
    else setDone(true);
  };

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <div className="text-center">
        <span className="eyebrow">🤲 Послуги</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Послуги та курси</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Оберіть напрямок і запишіться - підберемо зручний час.</p>
      </div>

      {/* Банер курсу з йоги */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        transition={{ duration: 0.55 }}
        className="mt-6 grid items-stretch gap-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
      >
        <div className="flex flex-col justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-7 text-white shadow-xl shadow-emerald-300/40">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Flower2 className="h-3.5 w-3.5" /> Йога
          </span>
          <h2 className="mt-3 text-2xl font-extrabold">Курс з йоги та тілесних практик</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50">
            М'яко, усвідомлено та з турботою про тіло. Підходить як початківцям, так і тим, хто хоче поглибити практику.
          </p>
        </div>
        <div className="relative w-full overflow-hidden rounded-3xl aspect-[3/4] sm:aspect-auto">
          <ZoomImage
            src="/images/yoga.jpg"
            alt="Курс з йоги"
            className="absolute inset-0 h-full w-full shadow-xl shadow-emerald-900/10 ring-1 ring-white/60"
          />
        </div>
      </motion.div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        {services.map(({ icon: Icon, title, items }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="glass rounded-3xl p-6 ring-1 ring-white/60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
            <ul className="mt-3 space-y-1.5">
              {items.map((it) => (
                <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {it}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Booking */}
      <motion.div
        id="book"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        className="card-glow mx-auto mt-10 max-w-xl rounded-3xl p-7 ring-1 ring-white/60"
      >
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <CalendarCheck className="h-6 w-6 text-emerald-600" /> Запис на сесію
        </h2>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </span>
            <p className="text-lg font-bold text-slate-900">Дякуємо! Заявку отримано.</p>
            <p className="text-sm text-slate-500">Я зв'яжуся з вами найближчим часом, щоб узгодити час.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше ім'я"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
              inputMode="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Коментар (необов'язково)"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
            {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="shine w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Відправляю…' : 'Записатися'}
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
};

export default Services;
