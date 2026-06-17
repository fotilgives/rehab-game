import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  Heart,
  Flame,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Send,
  Check,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Specializations ────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  {
    icon: Brain,
    title: 'Інсульт',
    desc: 'Нейрореабілітація, відновлення рухових функцій та чутливості, соціально-побутова адаптація.',
    ring: 'ring-blue-100 hover:ring-blue-300',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    icon: ShieldAlert,
    title: 'Черепно-мозкова травма',
    desc: 'Комплексне відновлення координації, рівноваги, м'язового тонусу та когнітивних навичок.',
    ring: 'ring-amber-100 hover:ring-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  {
    icon: Activity,
    title: 'Розсіяний склероз',
    desc: 'Підтримка та відновлення рухової активності, мінімізація спастики, покращення якості життя.',
    ring: 'ring-emerald-100 hover:ring-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    icon: Flame,
    title: 'Травма хребта',
    desc: 'Спеціалізовані тренування для зміцнення м'язового корсета та покращення пропріоцепції.',
    ring: 'ring-rose-100 hover:ring-rose-300',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: Zap,
    title: 'Ендопротезування',
    desc: 'Рання та пізня розробка суглобів після заміни, відновлення стереотипу ходьби.',
    ring: 'ring-cyan-100 hover:ring-cyan-300',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
  },
  {
    icon: Heart,
    title: 'Онкологія',
    desc: 'М'яка відновлювальна терапія, лімфодренаж, підтримання загального фізичного тонусу.',
    ring: 'ring-violet-100 hover:ring-violet-300',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
];

// ─── Patient Success Stories — real Unsplash portraits ──────────────────────
// All photos: professional-looking, warm, realistic individuals from Unsplash
const STORIES = [
  {
    name: 'Олександр, 34 роки',
    condition: 'Реабілітація після ЧМТ',
    // Real man portrait from Unsplash - Foto de Michael Dam
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=320&fit=crop&crop=face&q=80',
    before: 'Залежав від сторонньої допомоги. Сильна спастика правої сторони, порушення мовлення.',
    after: 'Почав самостійно ходити без опори. Відновив базову дрібну моторику та комунікацію.',
    quote: '«Кожне маленьке досягнення — це перемога. Дякую за терпіння та справжній професіоналізм.»',
  },
  {
    name: 'Олена, 58 років',
    condition: 'Інсульт, реабілітація',
    // Real woman portrait — photo by Michael Dam on Unsplash
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=320&h=320&fit=crop&crop=face&q=80',
    before: 'Втрата рухливості правої сторони тіла. Порушення мовлення та рівноваги. Не могла вставати.',
    after: 'Повне відновлення побутових навичок та мовлення. Впевнено пересувається самостійно.',
    quote: '«Я знову відчула себе собою. Підхід був таким уважним — мені ніколи не було страшно.»',
  },
  {
    name: 'Михайло, 47 років',
    condition: 'Травма хребта',
    // Real man portrait — photo by Joseph Gonzalez on Unsplash
    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=320&h=320&fit=crop&crop=face&q=80',
    before: 'Парез нижніх кінцівок. Постійний больовий синдром. Пересування лише у кріслі-колісному.',
    after: 'Здатність стояти біля опори. Значне зменшення болю. Переміщення на милицях без підтримки.',
    quote: '«Я знову повірив, що зможу ходити. Це справжнє диво — повернутись до активного життя.»',
  },
];

// ─── Consultation Form Steps ─────────────────────────────────────────────────
const RehabDetails: React.FC = () => {
  const [activeStory, setActiveStory] = useState(0);
  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nextStory = () => setActiveStory((p) => (p + 1) % STORIES.length);
  const prevStory = () => setActiveStory((p) => (p - 1 + STORIES.length) % STORIES.length);

  const handleNext = () => {
    if (condition.trim().length < 5) {
      setErr('Будь ласка, опишіть детальніше (мінімум 5 символів)');
      return;
    }
    setErr(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setErr('Вкажіть коректне ім'я та номер телефону');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc('rps_book', {
        p_name: name,
        p_phone: phone,
        p_service: 'Безкоштовна консультація',
        p_note: `Стан: ${condition}`,
      });
      if (error) throw error;
      setStep(3);
    } catch {
      setErr('Не вдалося надіслати. Спробуйте пізніше або зателефонуйте нам.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-20 py-8">

      {/* ── SECTION 1: Specializations Grid ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-5xl px-5"
      >
        <div className="mb-10 text-center">
          <span className="eyebrow">Спеціалізації</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Проводимо реабілітацію після:
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500">
            Індивідуальні програми фізичного та нейрологічного відновлення для різних діагнозів.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALIZATIONS.map(({ icon: Icon, title, desc, ring, bg, text }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ring-1 transition-all hover:shadow-md ${ring}`}
            >
              <span className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${text}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 2: Patient Success Stories ──────────────────────── */}
      <section className="bg-gradient-to-b from-slate-50/70 to-white py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-4xl px-5"
        >
          <div className="mb-10 text-center">
            <span className="eyebrow">Результати</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Історії наших пацієнтів
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStory}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.32 }}
                className="grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:gap-8 sm:p-8"
              >
                {/* Portrait */}
                <div className="flex flex-col items-center">
                  <div className="h-36 w-36 overflow-hidden rounded-2xl bg-slate-100 shadow-md ring-1 ring-slate-100 sm:h-40 sm:w-40">
                    <img
                      src={STORIES[activeStory].photo}
                      alt={STORIES[activeStory].name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-3 text-center text-sm font-extrabold text-slate-900">
                    {STORIES[activeStory].name}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                    {STORIES[activeStory].condition}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-100">
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-600">До:</p>
                      <p className="text-xs leading-relaxed text-slate-600">{STORIES[activeStory].before}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Після:</p>
                      <p className="text-xs leading-relaxed text-slate-600">{STORIES[activeStory].after}</p>
                    </div>
                  </div>

                  <blockquote className="relative rounded-xl bg-slate-50 px-5 py-4 text-sm italic text-slate-600 ring-1 ring-slate-100">
                    <span className="absolute -top-3 left-3 text-3xl leading-none text-slate-200 select-none">"</span>
                    {STORIES[activeStory].quote}
                  </blockquote>

                  {/* Dots + arrows */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1.5">
                      {STORIES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveStory(i)}
                          aria-label={`Історія ${i + 1}`}
                          className={`h-2 rounded-full transition-all ${i === activeStory ? 'w-5 bg-emerald-600' : 'w-2 bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={prevStory} aria-label="Попередня" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={nextStory} aria-label="Наступна" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 3: Multi-step Consultation Form ─────────────────── */}
      <motion.section
        id="consultation-section"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-lg px-5"
      >
        <div className="card-glow rounded-3xl p-6 ring-1 ring-white/60 shadow-xl sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <span className="eyebrow mb-3 inline-block">Безкоштовно</span>
            <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Консультація реабілітолога
            </h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Опишіть стан пацієнта — підберемо індивідуальну програму відновлення.
            </p>
          </div>

          {/* Step indicator */}
          {step < 3 && (
            <div className="mb-5 flex items-center gap-2">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`h-px flex-1 transition-colors ${step > s ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <textarea
                  placeholder="Наприклад: вік 55 р., переніс інсульт 3 місяці тому, права рука погано рухається, є порушення мовлення..."
                  rows={5}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
                <button
                  onClick={handleNext}
                  className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Далі <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text" placeholder="Ваше ім'я" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="tel" placeholder="+380..." required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setErr(null); setStep(1); }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      Назад
                    </button>
                    <button type="submit" disabled={busy}
                      className="shine flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
                      {busy ? 'Надсилаємо...' : <><Send className="h-4 w-4" /> Надіслати</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3 — Success */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-8 w-8" />
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">Заявку отримано!</h4>
                <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                  Наш спеціаліст ознайомиться з описом та зв'яжеться з вами протягом робочого дня.
                </p>
                <button onClick={() => { setStep(1); setCondition(''); setName(''); setPhone(''); }}
                  className="text-xs font-bold text-emerald-600 hover:underline">
                  Надіслати ще одну заявку
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
};

export default RehabDetails;
