import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Gamepad2,
  Award,
  BookOpen,
  Heart,
  Sparkles,
  Phone,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  Users,
  GraduationCap,
  Activity,
  ShieldCheck
} from 'lucide-react';
import SmartImage from './SmartImage';

// ─── Scrolling ticker ────────────────────────────────────────────────────────
const TICKER = [
  'Лікувальний масаж',
  'Йога та тілесні практики',
  'Фізична терапія',
  'DNS-терапія',
  'Redcord-терапія',
  'Тайський масаж',
  'Фізична реабілітація',
  'Юмейхо-терапія',
  'Blomberg Therapy',
  'Фасціальні техніки',
  'Пресролінг',
  'Вакуумні банки',
];

// ─── Stats ───────────────────────────────────────────────────────────────────
const STATS = [
  { v: '15+', l: 'років\nдосвіду', icon: Award },
  { v: '1000+', l: 'клієнтів', icon: Users },
  { v: '11', l: 'методик', icon: GraduationCap },
];

// ─── Expandable cards ─────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'directions',
    icon: Heart,
    color: 'emerald' as const,
    title: 'Напрямки роботи',
    items: [
      'Лікувальний та оздоровчий масаж',
      'Тайський масаж',
      'Юмейхо-терапія та фасціальні техніки',
      'Лікувальна фізкультура (ЛФК)',
      "Динамічна нейром'язова стабілізація (DNS)",
      'Redcord-терапія та Blomberg Therapy',
      'Йога та тілесні практики',
    ],
  },
  {
    id: 'education',
    icon: BookOpen,
    color: 'teal' as const,
    title: 'Навчання та курси',
    items: [
      'Курси йоги для всіх рівнів підготовки',
      'Навчальні курси професійного масажу',
      'Тайський масаж — повний теоретичний та практичний курс',
      'Онлайн-програми для самостійної домашньої практики',
    ],
  },
  {
    id: 'approach',
    icon: ShieldCheck,
    color: 'sky' as const,
    title: 'Мій професійний підхід',
    items: [
      'Складання індивідуальної програми відновлення',
      'Поєднання сучасних доказових методик реабілітації',
      'Робота з тілом через рух, усвідомленість та баланс',
      'Клінічний контроль на кожному етапі прогресу',
    ],
  },
];

// ─── Credential badges ────────────────────────────────────────────────────────
const BADGES = [
  { icon: ShieldCheck, label: 'Сертифікований спеціаліст' },
  { icon: GraduationCap, label: 'Міжнародні курси' },
  { icon: BookOpen, label: 'Інструктор йоги' },
  { icon: Sparkles, label: 'Постійний розвиток' },
];

// ─── Why choose me ────────────────────────────────────────────────────────────
const REASONS = [
  { icon: Award, title: '15+ років досвіду', desc: 'Глибока практика реабілітації та мануальних технік.' },
  { icon: Users, title: 'Індивідуальний підхід', desc: 'Програма відновлення підбирається особисто під ваші скарги.' },
  { icon: Activity, title: 'Сучасні методики', desc: 'Застосування DNS, Redcord, Blomberg Therapy та фасціальних технік.' },
  { icon: Sparkles, title: 'Комплексна система', desc: 'Масаж + ЛФК + йога — єдина система відновлення здоров’я.' },
];

// ─── Color map ────────────────────────────────────────────────────────────────
const colorMap = {
  emerald: { active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  teal:    { active: 'bg-teal-600 text-white',    idle: 'bg-teal-50 text-teal-600',       dot: 'bg-teal-500'    },
  sky:     { active: 'bg-sky-600 text-white',     idle: 'bg-sky-50 text-sky-600',         dot: 'bg-sky-500'     },
};

// ─── Shared expandable card component ────────────────────────────────────────
const ExpandCard: React.FC<{
  card: (typeof CARDS)[0];
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, isOpen, onToggle }) => {
  const c = colorMap[card.color];
  const Icon = card.icon;
  return (
    <div
      className={`overflow-hidden rounded-2xl ring-1 transition-all duration-300 ${
        isOpen ? 'bg-white/90 ring-emerald-200 shadow-lg' : 'glass ring-white/60 hover:ring-emerald-200 hover:shadow-md'
      }`}
    >
      <button onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${isOpen ? c.active : c.idle}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-slate-900">{card.title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="shrink-0 text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3">
              <ul className="space-y-1.5">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Hero: React.FC<Props> = ({ onPlay }) => {
  const [openCard, setOpenCard] = useState<string | null>('directions');
  const toggle = (id: string) => setOpenCard((c) => (c === id ? null : id));

  // Shared CTA buttons
  const CTAs = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <motion.a
        href="tel:+380638069916"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="shine flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-300/40 hover:bg-emerald-700 transition"
      >
        <Phone className="h-4 w-4" />
        Записатися на прийом
      </motion.a>
      <motion.button
        onClick={onPlay}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300 hover:shadow-md transition"
      >
        <Gamepad2 className="h-4 w-4 text-emerald-600" />
        Бонусна гра
      </motion.button>
    </div>
  );

  return (
    <section id="top" className="relative">

      {/* ── Background (shared) ───────────────────────────── */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(16,185,129,0.06) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at 50% 40%, #000 20%, transparent 70%)',
        }}
      />

      {/* Soft Ambient Glow Orbs */}
      <div className="pointer-events-none absolute left-0 top-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-96 w-96 rounded-full bg-teal-100/20 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ════════════════════════════════════════════════════
            MOBILE layout (hidden on lg+)
        ═════════════════════════════════════════════════════ */}
        <div className="lg:hidden pt-6 pb-10 space-y-6" style={{ touchAction: 'pan-y' }}>

          {/* ── Profile banner card: Large premium portrait (identical to PC style) ── */}
          <div className="relative overflow-hidden rounded-[1.75rem] shadow-2xl shadow-emerald-950/10 ring-1 ring-white/80">
            <SmartImage
              src="/images/about.jpg"
              alt="Володимир Мальцев — масажист-реабілітолог"
              className="w-full aspect-[4/5] object-cover"
              fallback={
                <div className="flex h-[320px] w-full items-center justify-center bg-slate-100 text-6xl">
                  👨‍⚕️
                </div>
              }
            />

            {/* Availability badge (Top Left) */}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Запис відкрито
              </span>
            </div>

            {/* Stat pill (Top Right) */}
            <div className="absolute -right-1 -top-1 z-20 scale-85 origin-top-right glass rounded-2xl px-4 py-3 text-center shadow-xl ring-1 ring-white/80">
              <div className="text-2xl font-black leading-none text-emerald-600">15+</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                років
                <br />
                досвіду
              </div>
            </div>

            {/* Name + Title overlay at bottom (identical to PC card) */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
              <div className="glass rounded-2xl px-4 py-3 ring-1 ring-white/70 shadow-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 leading-tight">
                      Володимир Мальцев
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Масажист-реабілітолог
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-3"
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="card-glow rounded-2xl p-3 text-center ring-1 ring-slate-100 bg-white">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-slate-800 leading-none">{s.v}</div>
                  <div className="mt-1 whitespace-pre-line text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                    {s.l}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bio text ── */}
          <p className="text-sm leading-relaxed text-slate-600">
            Спеціаліст із фізичної реабілітації з понад{' '}
            <b className="text-slate-800">15 роками практичного досвіду</b>. Допомагаю відновити{' '}
            <b className="text-slate-800">свободу руху та баланс всього тіла</b>, працюючи з першопричиною больового синдрому.
          </p>

          {/* ── Credential badges ── */}
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-100"
                >
                  <Icon className="h-3.5 w-3.5 text-emerald-600" />
                  {b.label}
                </span>
              );
            })}
          </div>

          {/* ── Expandable cards ── */}
          <div className="space-y-2.5">
            {CARDS.map((card) => (
              <ExpandCard
                key={card.id}
                card={card}
                isOpen={openCard === card.id}
                onToggle={() => toggle(card.id)}
              />
            ))}
          </div>

          {/* ── CTAs ── */}
          <div>
            {CTAs}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            DESKTOP layout (hidden below lg)
        ═════════════════════════════════════════════════════ */}
        <div className="hidden lg:block py-20 xl:py-24">

          {/* Availability badge */}
          <div className="mb-8 flex justify-center">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80 shadow-sm bg-white/50 backdrop-blur-sm"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Запис відкрито — є вільні місця на консультацію цього тижня
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
            </motion.span>
          </div>

          <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">

            {/* ── Photo column ── */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Glow */}
              <motion.div
                className="pointer-events-none absolute -inset-3 -z-0 rounded-[2.25rem] bg-gradient-to-br from-emerald-300/20 via-teal-200/15 to-sky-200/10 blur-2xl"
                animate={{ opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Photo */}
              <div className="relative z-10 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-emerald-950/10 ring-1 ring-white/80">
                <SmartImage
                  src="/images/about.jpg"
                  alt="Володимир Мальцев — масажист-реабілітолог"
                  className="w-full aspect-[3/4] object-cover"
                  fallback={
                    <div className="flex h-[400px] w-full items-center justify-center bg-slate-100 text-6xl">
                      👨‍⚕️
                    </div>
                  }
                />
                {/* Name badge */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl px-4 py-3 ring-1 ring-white/70 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 leading-tight">
                          Володимир Мальцев
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Масажист-реабілітолог
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Stat pill (desktop only) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
                className="absolute -right-3 -top-3 z-20 glass rounded-2xl px-4 py-3 text-center shadow-xl ring-1 ring-white/80"
              >
                <div className="text-2xl font-black leading-none text-emerald-600">15+</div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  років
                  <br />
                  досвіду
                </div>
              </motion.div>
            </motion.div>

            {/* ── Info column ── */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              {/* Eyebrow */}
              <span className="eyebrow self-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Реабілітація · відновлення · баланс
              </span>

              {/* Headline */}
              <div>
                <h1 className="font-black leading-[1.08] tracking-tight text-slate-900"
                    style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
                  Професійна реабілітація та масаж
                  <br />
                  <span className="text-gradient">Володимир Мальцев</span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-500 xl:text-[17px]">
                  Спеціаліст із фізичного відновлення з понад <b className="text-slate-700">15-річним досвідом</b>.
                  Поєдную доказові методики терапії, ЛФК та масажу для відновлення рухливості без болю.
                </p>
              </div>

              {/* Credential badges */}
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => {
                  const Icon = b.icon;
                  return (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-100 transition hover:bg-slate-100"
                    >
                      <Icon className="h-3.5 w-3.5 text-emerald-600" />
                      {b.label}
                    </span>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.l} className="card-glow rounded-2xl p-3.5 text-center ring-1 ring-slate-100 bg-white">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-xl font-extrabold tracking-tight text-slate-800 xl:text-2xl">{s.v}</div>
                      <div className="mt-1 whitespace-pre-line text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{s.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Expandable cards */}
              <div className="space-y-2.5">
                {CARDS.map((card) => (
                  <ExpandCard
                    key={card.id}
                    card={card}
                    isOpen={openCard === card.id}
                    onToggle={() => toggle(card.id)}
                  />
                ))}
              </div>

              {/* CTAs */}
              {CTAs}

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Вінниця, Україна — запис онлайн та за телефоном
              </div>
            </motion.div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SCROLLING TICKER (all screens)
        ═════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden border-y border-slate-100 bg-white py-3">
          <div className="ticker-container flex gap-8 whitespace-nowrap">
            {/* Doubled for seamless loop */}
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                {item}
                <span className="mx-4 text-emerald-300 font-bold">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            WHY CHOOSE ME (all screens)
        ═════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16"
        >
          <div className="mb-8 text-center">
            <span className="eyebrow">📋 Переваги роботи</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Чому обирають мій кабінет
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Поєднання перевірених міжнародних протоколів та індивідуального плану супроводу
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="glass rounded-3xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:shadow-emerald-900/5 bg-white/60"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold text-slate-900">{title}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
