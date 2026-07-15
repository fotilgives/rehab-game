import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HandHeart, Activity, Baby, Brain, CalendarCheck } from 'lucide-react';
import { goToBooking } from '../hooks/useRoute';
import { supabase } from '../lib/supabase';

interface Row {
  name: string;
  /** Ціна, грн. Може бути діапазон «200 / 500». */
  price: string;
  /** Дрібний підпис (тривалість тощо). */
  meta?: string;
}

interface Group {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    title: 'Дитячий напрямок',
    icon: Baby,
    rows: [
      { name: 'Консультація дитячого психолога (діагностика)', price: '700' },
      { name: 'Корекційні заняття з психологом', price: '500' },
      { name: 'Логопед', price: '500' },
      { name: 'Дитяча йога', price: '200 / 500', meta: 'групова / індивідуальна' },
      { name: 'Ха-Тха йога', price: '200 / 500', meta: 'групова / сімейна / індивід.' },
    ],
  },
  {
    title: 'Масаж',
    icon: HandHeart,
    rows: [
      { name: 'Загальний масаж', price: '700' },
      { name: 'Масаж спини', price: '500' },
      { name: 'Лімфодренажний', price: '700' },
      { name: 'Антицелюлітний', price: '700' },
      { name: 'Східний масаж', price: '700' },
      { name: 'Масаж обличчя', price: '500' },
    ],
  },
  {
    title: 'Авторські послуги — Володимир Мальцев',
    icon: Sparkles,
    rows: [
      { name: 'Оздоровчий масаж', price: '900' },
      { name: 'Індивідуальне тренування', price: '900' },
      { name: 'Східний масаж', price: '900' },
      { name: 'Індивідуальна / сімейна йога', price: '900' },
    ],
  },
  {
    title: 'Апаратне лікування',
    icon: Activity,
    note: 'Електрофорез, вакуумна електротерапія, фонофорез',
    rows: [
      { name: 'Електрофорез / вакуумна електротерапія', price: '300', meta: '15–20 хв' },
      { name: 'Фонофорез (введення гелевих препаратів)', price: '200', meta: '10 хв' },
      { name: 'Фонофорез — процедура для обличчя', price: '400', meta: '40 хв' },
    ],
  },
];

const ICON_BY_GROUP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Дитячий напрямок': Baby,
  'Масаж': HandHeart,
  'Авторські послуги — Володимир Мальцев': Sparkles,
  'Апаратне лікування': Activity,
};

interface PriceRow { id: number; group_title: string; name: string; price: string; meta: string | null; sort: number }

const PriceList: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>(GROUPS);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('rps_prices_list');
      const rows = (data as PriceRow[] | null) || [];
      if (error || rows.length === 0) return; // фолбек на GROUPS
      const map = new Map<string, Group>();
      for (const r of rows) {
        if (!map.has(r.group_title)) {
          map.set(r.group_title, { title: r.group_title, icon: ICON_BY_GROUP[r.group_title] || Sparkles, rows: [] });
        }
        map.get(r.group_title)!.rows.push({ name: r.name, price: r.price, meta: r.meta || undefined });
      }
      setGroups(Array.from(map.values()));
    })();
  }, []);

  return (
    <section id="price-section" className="mx-auto mt-16 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="eyebrow">Прайс</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Ціни на послуги
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Орієнтовна вартість послуг центру. Точну ціну та формат занять підберемо індивідуально під запит.
        </p>
      </motion.div>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {groups.map(({ title, icon: Icon, note, rows }, gi) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: gi * 0.05 }}
            className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50/60 px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold leading-tight text-slate-900 sm:text-base">{title}</h3>
                {note && <p className="mt-0.5 truncate text-[11px] text-slate-500">{note}</p>}
              </div>
            </div>

            <ul className="flex-1 divide-y divide-slate-100 px-5 py-1.5">
              {rows.map((r) => (
                <li key={r.name} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm leading-snug text-slate-700">{r.name}</span>
                    {r.meta && <span className="text-[11px] text-slate-400">{r.meta}</span>}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-extrabold text-emerald-700">
                    {r.price} <span className="text-[11px] font-semibold text-slate-400">грн</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-3xl bg-slate-50 px-6 py-5 text-center sm:flex-row sm:text-left">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Brain className="h-4 w-4 shrink-0 text-emerald-600" />
          Не знаєте, який напрямок обрати? Залиште заявку — підкажемо та підберемо програму.
        </p>
        <button
          onClick={goToBooking}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
        >
          <CalendarCheck className="h-4 w-4" /> Записатися
        </button>
      </div>
    </section>
  );
};

export default PriceList;
