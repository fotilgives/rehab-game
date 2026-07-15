import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  ChevronDown,
  Gamepad2,
  Award,
  BookOpen,
  Heart,
  Sparkles,
  CheckCircle2,
  MapPin,
  Users,
  Activity,
  ShieldCheck,
  GraduationCap,
  Phone,
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
  { v: '15+', l: 'років досвіду' },
  { v: '1000+', l: 'вдячних клієнтів' },
  { v: '11', l: 'методик відновлення' },
];

// ─── Expandable cards ─────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'directions',
    icon: Heart,
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
  { icon: BookOpen, label: 'Інструктор йоги' },
  { icon: Sparkles, label: 'Постійний розвиток' },
];

// ─── Why choose me ────────────────────────────────────────────────────────────
const REASONS = [
  { icon: Award, title: '15+ років досвіду', desc: 'Глибока практика реабілітації та масажних технік.' },
  { icon: Users, title: 'Індивідуальний підхід', desc: 'Програма відновлення підбирається особисто під ваші скарги.' },
  { icon: Activity, title: 'Сучасні методики', desc: 'Застосування DNS, Redcord, Blomberg Therapy та фасціальних технік.' },
  { icon: Sparkles, title: 'Комплексна система', desc: 'Масаж + ЛФК + йога — єдина система відновлення здоров’я.' },
];

// ─── Reveal variants (узгоджена плавна поява без ривків) ───────────────────────
const groupV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const itemV = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Shared expandable card (темна версія для forest-hero) ────────────────────
const ExpandCard: React.FC<{
  card: (typeof CARDS)[0];
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, isOpen, onToggle }) => {
  const Icon = card.icon;
  return (
    <div
      className={`overflow-hidden rounded-2xl ring-1 transition-all duration-300 ${
        isOpen ? 'bg-white/[0.07] ring-gold-400/40' : 'bg-white/[0.04] ring-white/10 hover:ring-gold-400/30 hover:bg-white/[0.06]'
      }`}
    >
      <button onClick={onToggle} aria-expanded={isOpen} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${
            isOpen ? 'bg-gold-400 text-forest-900' : 'bg-white/10 text-gold-300'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-ivory-50">{card.title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="shrink-0 text-ivory-50/40">
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
            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              <ul className="space-y-1.5">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-ivory-50/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
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

// ─── Portrait card (спільний для mobile/desktop) ──────────────────────────────
const ArchPortrait: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative ${className}`}>
    {/* Світіння за карткою */}
    <div className="pointer-events-none absolute -inset-4 -z-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(212,175,106,0.22),transparent_70%)] blur-2xl" />

    <div className="relative z-10 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/40 ring-1 ring-gold-300/30">
      <SmartImage
        src="/images/about.jpg"
        alt="Володимир Мальцев — масажист-реабілітолог"
        className="w-full aspect-[3/4] object-cover"
        fallback={<div className="flex aspect-[3/4] w-full items-center justify-center bg-forest-700 text-6xl">👨‍⚕️</div>}
      />
      {/* Затемнення знизу для читабельності бейджа */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-forest-950/85 to-transparent" />

      {/* Ім'я поверх фото */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-center">
        <div className="font-display text-lg font-semibold text-ivory-50">Володимир Мальцев</div>
        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Масажист-реабілітолог
        </div>
      </div>
    </div>

    {/* Бейдж «Запис відкрито» — над карткою, не на обличчі */}
    <div className="absolute left-1/2 -top-4 z-20 -translate-x-1/2">
      <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-ivory-50 ring-1 ring-white/15 whitespace-nowrap">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Запис відкрито
      </span>
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Hero: React.FC<Props> = ({ onPlay }) => {
  const [openCard, setOpenCard] = useState<string | null>('directions');
  const toggle = (id: string) => setOpenCard((c) => (c === id ? null : id));

  // 3D Tilt Effect (делікатний)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Shared CTA buttons
  const CTAs = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <motion.a
        href="tel:+380638069916"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-gold shine flex cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
      >
        <Phone className="h-4 w-4" />
        +38 (063) 806-99-16
      </motion.a>
      <motion.button
        onClick={onPlay}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-7 py-3.5 text-sm font-bold text-ivory-50 ring-1 ring-white/15 transition hover:bg-white/10 hover:ring-gold-400/40"
      >
        <Gamepad2 className="h-4 w-4 text-gold-300" />
        Бонусна гра
      </motion.button>
    </div>
  );

  const Eyebrow = (
    <span className="eyebrow-dark self-start">
      <Sparkles className="h-3.5 w-3.5" />
      Масаж · Реабілітація · Йога — Вінниця
    </span>
  );

  const Headline = (
    <h1 className="font-display font-semibold leading-[1.06] text-ivory-50" style={{ fontSize: 'clamp(2.35rem, 5vw, 4rem)' }}>
      Мистецтво повернути тілу{' '}
      <em className="text-gradient-gold font-medium not-italic sm:italic">свободу руху</em>
    </h1>
  );

  const Sub = (
    <p className="max-w-xl text-[15px] leading-relaxed text-ivory-50/65 sm:text-base">
      Володимир Мальцев — масажист-реабілітолог із понад{' '}
      <b className="font-semibold text-ivory-50">15 роками практики</b>. Доказові методики терапії, ЛФК та масажу,
      що працюють із першопричиною болю — індивідуально під ваш стан.
    </p>
  );

  const Badges = (
    <div className="flex flex-wrap gap-2">
      {BADGES.map((b) => {
        const Icon = b.icon;
        return (
          <span
            key={b.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ivory-50/80 ring-1 ring-white/10"
          >
            <Icon className="h-3.5 w-3.5 text-gold-300" />
            {b.label}
          </span>
        );
      })}
    </div>
  );

  const StatsRow = (
    <div className="grid grid-cols-3">
      {STATS.map((s, i) => (
        <div key={s.l} className={`px-3 py-1 text-center sm:text-left sm:px-5 ${i > 0 ? 'border-l border-white/10' : 'sm:pl-0'}`}>
          <div className="font-display text-3xl font-semibold text-gold-300 sm:text-4xl">{s.v}</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ivory-50/45 leading-tight">{s.l}</div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="top" className="relative">
      {/* ════════════════════════════════════════════════════
          DARK FOREST EDITORIAL CANVAS
          (-mt компенсує прозорий navbar, що висить зверху)
      ═════════════════════════════════════════════════════ */}
      <div className="relative -mt-16 overflow-hidden bg-gradient-to-b from-forest-900 via-forest-800 to-forest-950 pt-16 text-ivory-50">
        {/* Aurora-світіння */}
        <div className="aurora left-[-15%] top-[-10%] h-[520px] w-[520px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45), transparent 70%)' }} />
        <div className="aurora right-[-12%] top-[30%] h-[440px] w-[440px]" style={{ background: 'radial-gradient(circle, rgba(193,154,75,0.28), transparent 70%)', animationDelay: '-8s' }} />
        <div className="aurora bottom-[-20%] left-[30%] h-[400px] w-[400px]" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.45), transparent 70%)', animationDelay: '-4s' }} />
        {/* Кінозернистість */}
        <div className="grain" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">

          {/* ── MOBILE layout (hidden on lg+) ── */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={groupV}
            className="space-y-7 pb-12 pt-8 lg:hidden"
            style={{ touchAction: 'pan-y' }}
          >
            <motion.div variants={itemV} className="flex flex-col items-start gap-4">
              {Eyebrow}
              {Headline}
              {Sub}
            </motion.div>

            <motion.div variants={itemV}>
              <ArchPortrait className="mx-auto w-full max-w-[19rem]" />
            </motion.div>

            <motion.div variants={itemV}>{StatsRow}</motion.div>

            <motion.div variants={itemV}>{Badges}</motion.div>

            <motion.div variants={itemV} className="space-y-2.5">
              {CARDS.map((card) => (
                <ExpandCard key={card.id} card={card} isOpen={openCard === card.id} onToggle={() => toggle(card.id)} />
              ))}
            </motion.div>

            <motion.div variants={itemV}>{CTAs}</motion.div>
          </motion.div>

          {/* ── DESKTOP layout (hidden below lg) ── */}
          <div className="hidden py-20 lg:block xl:py-24">
            <div className="grid items-center gap-14 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">

              {/* Info column */}
              <motion.div
                initial={{ opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-7"
              >
                <span className="glass-dark inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-bold text-ivory-50/90 ring-1 ring-white/15">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Запис відкрито — є вільні місця на цей тиждень
                </span>

                {Eyebrow}
                {Headline}
                {Sub}
                {Badges}
                {CTAs}

                <div className="mt-2 border-t border-white/10 pt-6">{StatsRow}</div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-ivory-50/45">
                  <MapPin className="h-4 w-4 text-gold-300" />
                  Вінниця, Україна — запис онлайн та за телефоном
                </div>
              </motion.div>

              {/* Portrait column */}
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
                className="relative"
              >
                <ArchPortrait className="mx-auto w-full max-w-[24rem]" />

                {/* Плаваючі акордеони праворуч від фото — на xl і ширше */}
                <div className="mt-8 hidden 2xl:block" />
              </motion.div>
            </div>

            {/* Expandable cards — на всю ширину під гридом */}
            <div className="mt-14 grid items-start gap-3 lg:grid-cols-3">
              {CARDS.map((card) => (
                <ExpandCard key={card.id} card={card} isOpen={openCard === card.id} onToggle={() => toggle(card.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── SCROLLING TICKER (у темній смузі знизу) ── */}
        <div className="relative overflow-hidden border-t border-white/10 bg-forest-950/60 py-3.5">
          <div className="ticker-container flex gap-10 whitespace-nowrap">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="font-display flex shrink-0 items-center text-sm italic text-ivory-50/60">
                {item}
                <span className="ml-10 text-gold-400 not-italic">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          WHY CHOOSE ME (світла ivory-секція)
      ═════════════════════════════════════════════════════ */}
      <motion.div
        variants={groupV}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      >
        <motion.div variants={itemV} className="mb-10 text-center">
          <span className="eyebrow">Переваги роботи</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-forest-800 md:text-4xl">
            Чому обирають мій кабінет
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-forest-800/55">
            Поєднання перевірених міжнародних протоколів та індивідуального плану супроводу
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={itemV}
              whileHover={{ y: -4 }}
              className="lift card-glow rounded-3xl p-5 ring-1 ring-forest-800/5 transition-shadow hover:shadow-xl hover:shadow-forest-800/10"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 text-gold-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-[15px] font-semibold text-forest-900">{title}</div>
              <p className="mt-2 text-xs leading-relaxed text-forest-900/55">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
