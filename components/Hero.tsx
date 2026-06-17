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
  ImageIcon,
  User,
  Users,
  ShieldCheck,
  Globe,
  Lightbulb,
  Zap,
  Sparkle
} from 'lucide-react';
import ZoomImage from './ZoomImage';
import SmartImage from './SmartImage';

// --- Scrolling ticker ---
const TICKER = [
  'Лікувальний масаж',
  'Йога',
  'ЛФК',
  'DNS-терапія',
  'Redcord',
  'Тайський масаж',
  'Реабілітація',
  'Юмейхо-терапія',
  'Blomberg Therapy',
  'Фасціальні техніки',
  'Пресролінг',
  'Вакуумні банки',
];

// --- Stats ---
const STATS = [
  { v: '15+', l: 'років\nдосвіду', icon: Award },
  { v: '1000+', l: 'клієнтів', icon: Users },
  { v: '11', l: 'методик', icon: ShieldCheck },
];

// --- Expandable cards ---
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
      'Redcord-терапія - Blomberg Therapy',
      'Йога та тілесні практики',
    ],
  },
  {
    id: 'education',
    icon: BookOpen,
    color: 'teal' as const,
    title: 'Навчання та курси',
    items: [
      'Курси йоги для всіх рівнів',
      'Навчальні курси масажу',
      'Тайський масаж - повний курс',
      'Онлайн-програми самостійної практики',
    ],
  },
  {
    id: 'approach',
    icon: Award,
    color: 'sky' as const,
    title: 'Мій підхід',
    items: [
      'Індивідуальна програма відновлення',
      'Поєднання сучасних методик',
      'Робота з тілом через рух та баланс',
      'Підтримка на кожному етапі',
    ],
  },
];

// --- Credential badges ---
const BADGES = [
  { icon: ShieldCheck, label: 'Сертифікований спеціаліст' },
  { icon: Globe, label: 'Міжнародні курси' },
  { icon: BookOpen, label: 'Інструктор йоги' },
  { icon: Lightbulb, label: 'Постійне навчання' },
];

// --- Why choose me ---
const REASONS = [
  { icon: Award, title: '15+ років досвіду', desc: 'Глибока практика реабілітації та мануальних технік' },
  { icon: CheckCircle2, title: 'Індивідуальний підхід', desc: 'Програма відновлення підбирається особисто для вас' },
  { icon: Zap, title: 'Сучасні методики', desc: 'DNS, Redcord, Blomberg Therapy та фасціальні техніки' },
  { icon: Sparkles, title: 'Комплексне відновлення', desc: 'Масаж + ЛФК + йога - єдина система оздоровлення' },
];

// --- Color map ---
const colorMap = {
  emerald: { active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  teal:    { active: 'bg-teal-600 text-white',    idle: 'bg-teal-50 text-teal-600',       dot: 'bg-teal-500'    },
  sky:     { active: 'bg-sky-600 text-white',     idle: 'bg-sky-50 text-sky-600',         dot: 'bg-sky-500'     },
};

// --- Mobile card floating elements (abstract particles) ---
const MOBILE_FLOATS = [
  { style: { top: '10%', left: '6%', opacity: 0.15 } },
  { style: { top: '14%', right: '8%', opacity: 0.2 } },
  { style: { bottom: '18%', left: '5%', opacity: 0.15 } },
  { style: { bottom: '22%', right: '6%', opacity: 0.15 } },
];

// --- Desktop floating elements ---
const DESKTOP_FLOATS = [
  { x: '3%', y: '20%', d: 0 },
  { x: '91%', y: '18%', d: 0.5 },
  { x: '4%', y: '68%', d: 1.0 },
  { x: '92%', y: '65%', d: 0.3 },
];

// --- Shared expandable card component ---
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

interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

const Hero: React.FC<Props> = ({ onPlay }) => {
  const [openCard, setOpenCard] = useState<string | null>('directions');
  const toggle = (id: string) => setOpenCard((c) => (c === id ? null : id));

  // Shared CTA buttons
  const CTAs = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <motion.a
        href="tel:+380638069916"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="shine flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-300/50 hover:bg-emerald-700 transition"
      >
        <Phone className="h-4 w-4" />
        Записатися на прийом
      </motion.a>
      <motion.button
        onClick={onPlay}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="glass flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300 hover:shadow-md transition"
      >
        <Gamepad2 className="h-4 w-4 text-emerald-600" />
        Грати - заробляти бонуси
      </motion.button>
    </div>
  );

  return (
    <section id="top" className="relative overflow-x-hidden">

      {/* -- Background (shared) -- */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(16,185,129,0.09) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at 50% 40%, #000 20%, transparent 70%)',
        }}
      />

      {/* -- Desktop floating abstract particles -- */}
      {DESKTOP_FLOATS.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute hidden text-emerald-500/25 lg:block"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.25, scale: 1, y: [0, -12, 0], rotate: [0, 15, -15, 0] }}
          transition={{
            opacity: { delay: 0.7 + f.d, duration: 0.5 },
            scale: { delay: 0.7 + f.d, duration: 0.5 },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 7 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Sparkle className="h-6 w-6" />
        </motion.div>
      ))}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ====================================================
            MOBILE layout (hidden on lg+)
        ===================================================== */}
        <div className="lg:hidden pt-6 pb-10 space-y-5">

          {/* -- Profile banner card -- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white shadow-2xl shadow-emerald-900/25"
          >
            {/* Floating decorative elements inside card */}
            {MOBILE_FLOATS.map((f, i) => (
              <span
                key={i}
                className="pointer-events-none absolute text-white/10 select-none"
                style={f.style}
              >
                <Sparkle className="h-5 w-5" />
              </span>
            ))}

            {/* Soft glow blob */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-teal-400/20 blur-2xl" />

            {/* Availability badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-emerald-50 ring-1 ring-white/20">
                <CalendarCheck className="h-3 w-3" />
                Запис відкритий
              </span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            </div>

            {/* Photo + Name row */}
            <div className="flex items-center gap-4">
              {/* Circular photo */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-white/30 shadow-xl">
                <SmartImage
                  src="/images/about.jpg"
                  alt="Володимир Мальцев"
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-white/20 text-white">
                      <User className="h-8 w-8" />
                    </div>
                  }
                />
              </div>
              <div>
                <h1 className="text-xl font-black leading-tight">
                  Володимир
                  <br />
                  Мальцев
                </h1>
                <div className="mt-1 text-sm font-semibold text-emerald-200">
                  Масажист-реабілітолог
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-200/80">
                  <MapPin className="h-3 w-3" />
                  Вінниця, Україна
                </div>
              </div>
            </div>

            {/* Sub-label */}
            <div className="mt-4 text-[11px] font-semibold text-emerald-200/80 uppercase tracking-wider">
              ✦ Реабілітація - відновлення - баланс ✦
            </div>
          </motion.div>

          {/* -- Stats row -- */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {STATS.map((s) => {
              const StatIcon = s.icon;
              return (
                <div key={s.l} className="card-glow rounded-2xl px-2 py-3 text-center ring-1 ring-white/60">
                  <StatIcon className="h-5 w-5 mx-auto text-emerald-600" />
                  <div className="mt-1 text-lg font-extrabold text-emerald-700">{s.v}</div>
                  <div className="mt-0.5 whitespace-pre-line text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">
                    {s.l}
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* -- Bio text -- */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm leading-relaxed text-slate-600"
          >
            Масажист-реабілітолог із понад{' '}
            <b className="text-slate-800">15 роками досвіду</b>. Допомагаю тілу знайти{' '}
            <b className="text-slate-800">баланс, стабільність і свободу руху</b> - не просто знімаю
            біль, а відновлюю причину.
          </motion.p>

          {/* -- Credential badges -- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="flex flex-wrap gap-2"
          >
            {BADGES.map((b) => {
              const BadgeIcon = b.icon;
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                >
                  <BadgeIcon className="h-3.5 w-3.5 text-emerald-600" /> {b.label}
                </span>
              );
            })}
          </motion.div>

          {/* -- Expandable cards -- */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-2"
          >
            {CARDS.map((card) => (
              <ExpandCard
                key={card.id}
                card={card}
                isOpen={openCard === card.id}
                onToggle={() => toggle(card.id)}
              />
            ))}
          </motion.div>

          {/* -- CTAs -- */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {CTAs}
          </motion.div>
        </div>

        {/* ====================================================
            DESKTOP layout (hidden below lg)
        ===================================================== */}
        <div className="hidden lg:block py-20 xl:py-28">

          {/* Availability badge */}
          <div className="mb-6 flex justify-center">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 shadow-sm"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Запис відкритий - є вільні місця цього тижня
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
            </motion.span>
          </div>

          <div className="grid items-center gap-14 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">

            {/* -- Photo column -- */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Glow */}
              <motion.div
                className="pointer-events-none absolute -inset-3 -z-0 rounded-[2.25rem] bg-gradient-to-br from-emerald-300/35 via-teal-200/25 to-sky-200/15 blur-2xl"
                animate={{ opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Photo */}
              <div className="relative z-10 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-emerald-900/15 ring-1 ring-white/80">
                <ZoomImage
                  src="/images/about.jpg"
                  alt="Володимир Мальцев - масажист-реабілітолог"
                  caption="Фото Володимира Мальцева"
                  ratio="aspect-[3/4]"
                />
                {/* Name badge */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl px-4 py-2.5 ring-1 ring-white/60 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 leading-tight">
                          Володимир Мальцев
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
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
                className="absolute -right-3 -top-3 z-20 glass rounded-2xl px-3 py-2.5 text-center shadow-xl ring-1 ring-white/70"
              >
                <div className="text-2xl font-black leading-none text-emerald-700">15+</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  років
                  <br />
                  досвіду
                </div>
              </motion.div>
            </motion.div>

            {/* -- Info column -- */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex flex-col gap-5"
            >
              {/* Eyebrow */}
              <span className="eyebrow self-start gap-1.5">
                <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                Реабілітація - відновлення - баланс
              </span>

              {/* Headline */}
              <div>
                <h1 className="font-black leading-[1.06] tracking-tight text-slate-900"
                    style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}>
                  Про мене -{' '}
                  <span className="text-gradient">Володимир</span>
                  <br />
                  <span className="text-gradient">Мальцев</span>
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate-600 xl:text-[17px]">
                  Масажист-реабілітолог із понад{' '}
                  <b className="text-slate-800">15 роками досвіду</b>. Допомагаю тілу знайти{' '}
                  <b className="text-slate-800">баланс, стабільність і свободу руху</b> - не просто
                  знімаю біль, а відновлюю причину.
                </p>
              </div>

              {/* Credential badges */}
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => {
                  const BadgeIcon = b.icon;
                  return (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                    >
                      <BadgeIcon className="h-3.5 w-3.5 text-emerald-600" /> {b.label}
                    </span>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2.5">
                {STATS.map((s) => {
                  const StatIcon = s.icon;
                  return (
                    <div key={s.l} className="card-glow rounded-2xl px-2 py-3 text-center ring-1 ring-white/60">
                      <StatIcon className="h-5 w-5 mx-auto text-emerald-600" />
                      <div className="mt-1 text-xl font-extrabold tracking-tight text-emerald-700 xl:text-2xl">{s.v}</div>
                      <div className="mt-1 whitespace-pre-line text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">{s.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Expandable cards */}
              <div className="space-y-2">
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
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                Вінниця, Україна
              </div>
            </motion.div>
          </div>
        </div>

        {/* ====================================================
            SCROLLING TICKER (all screens)
        ===================================================== */}
        <div className="relative overflow-hidden border-y border-emerald-100/80 bg-white/60 py-3 backdrop-blur-sm">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {/* Doubled for seamless loop */}
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="shrink-0 text-sm font-semibold text-slate-600">
                {item}
                <span className="mx-4 text-emerald-300">·</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ====================================================
            WHY CHOOSE ME (all screens)
        ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16"
        >
          <div className="mb-6 text-center">
            <span className="eyebrow">Чому обирають мене</span>
            <p className="mt-3 text-sm text-slate-500">
              Понад 1000 клієнтів довіряють мені своє здоров'я та відновлення
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {REASONS.map((r, i) => {
              const ReasonIcon = r.icon;
              return (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="glass rounded-3xl p-4 ring-1 ring-white/60 transition-all hover:shadow-lg hover:shadow-emerald-900/5 sm:p-5"
                >
                  <div className="mb-2.5 text-2xl sm:text-3xl text-emerald-600">
                    <ReasonIcon className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 sm:text-[15px]">{r.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-[13px]">{r.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
