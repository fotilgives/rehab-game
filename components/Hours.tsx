import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Графік роботи центру. Один спільний джерело-правди для навбару та футера.
 * Індекси відповідають Date.getDay(): 0 — неділя ... 6 — субота.
 */
export const SCHEDULE: { label: string; open: number | null; close: number | null }[] = [
  { label: 'Нд', open: null, close: null }, // 0 - вихідний
  { label: 'Пн', open: 9, close: 18 },
  { label: 'Вт', open: 9, close: 18 },
  { label: 'Ср', open: 9, close: 18 },
  { label: 'Чт', open: 9, close: 18 },
  { label: 'Пт', open: 9, close: 18 },
  { label: 'Сб', open: 9, close: 13 }, // 6
];

/** Згруповані рядки для відображення «Пн – Пт / Сб / Нд». */
export const SCHEDULE_ROWS = [
  { days: 'Пн – Пт', time: '9:00 – 18:00', dim: false },
  { days: 'Сб', time: '9:00 – 13:00', dim: false },
  { days: 'Нд', time: 'вихідний', dim: true },
];

export interface OpenStatus {
  open: boolean;
  /** Короткий статус: «Відчинено» / «Зачинено». */
  label: string;
  /** Підказка: до котрої працює або коли відкриється. */
  hint: string;
}

export function getOpenStatus(now = new Date()): OpenStatus {
  const day = now.getDay();
  const hourFloat = now.getHours() + now.getMinutes() / 60;
  const today = SCHEDULE[day];

  if (today.open !== null && today.close !== null && hourFloat >= today.open && hourFloat < today.close) {
    return { open: true, label: 'Відчинено', hint: `сьогодні до ${today.close}:00` };
  }

  // Шукаємо найближчий робочий день (включно з сьогоднішнім, якщо ще не відкрилися).
  for (let i = 0; i < 7; i++) {
    const idx = (day + i) % 7;
    const d = SCHEDULE[idx];
    if (d.open === null) continue;
    if (i === 0 && hourFloat >= d.open) continue; // сьогодні вже зачинено
    const when = i === 0 ? 'сьогодні' : i === 1 ? 'завтра' : d.label;
    return { open: false, label: 'Зачинено', hint: `відкриється ${when} о ${d.open}:00` };
  }
  return { open: false, label: 'Зачинено', hint: '' };
}

/** Хук, що оновлює статус щохвилини. */
export function useOpenStatus(): OpenStatus {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => getOpenStatus(now), [now]);
}

/**
 * Компактна «пігулка» з графіком для навбару (десктоп).
 * Показує живий статус «Відчинено/Зачинено» + години, з тултіпом на повний графік.
 */
export const HoursPill: React.FC<{ className?: string }> = ({ className = '' }) => {
  const status = useOpenStatus();
  return (
    <div className={`group relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        <Clock className="h-3.5 w-3.5 text-emerald-600" />
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
          />
          <span className={status.open ? 'text-emerald-700' : 'text-slate-500'}>{status.label}</span>
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">Пн–Пт 9–18</span>
      </div>

      {/* Тултіп з повним графіком */}
      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-52 origin-top-right scale-95 rounded-2xl border border-slate-100 bg-white p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Clock className="h-3.5 w-3.5 text-emerald-600" /> Графік роботи
        </div>
        <dl className="space-y-1 text-xs">
          {SCHEDULE_ROWS.map((r) => (
            <div key={r.days} className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{r.days}</dt>
              <dd className={r.dim ? 'font-medium text-slate-400' : 'font-semibold text-slate-800'}>{r.time}</dd>
            </div>
          ))}
        </dl>
        {status.hint && <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">{status.hint}</p>}
      </div>
    </div>
  );
};
