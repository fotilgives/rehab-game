import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Wallet } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

const stats = [
  { v: '30с', l: 'раунд' },
  { v: 'до 20', l: 'гравців' },
  { v: '🪙 100', l: 'ставка' },
];

// Декоративні емодзі по кутах — лише на десктопі (sm+).
const floats = [
  { e: '✊', x: '6%', y: '20%', d: 0 },
  { e: '✌️', x: '88%', y: '24%', d: 0.6 },
  { e: '✋', x: '12%', y: '70%', d: 1.2 },
  { e: '🪙', x: '85%', y: '66%', d: 0.3 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Hero: React.FC<Props> = ({ onPlay, onExchange }) => {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* М'яке світіння за заголовком */}
      <div className="pointer-events-none absolute left-1/2 top-20 -z-0 h-72 w-[40rem] max-w-[92vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-200/45 via-teal-200/35 to-sky-200/45 blur-3xl" />

      {floats.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute hidden text-4xl sm:block md:text-5xl"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, -16, 0], rotate: [0, 8, -8, 0] }}
          transition={{
            opacity: { delay: 0.4 + f.d, duration: 0.5 },
            scale: { delay: 0.4 + f.d, duration: 0.5 },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 7 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <span className="drop-shadow-sm">{f.e}</span>
        </motion.div>
      ))}

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-12 sm:pb-16 sm:pt-24 md:pt-28">
        <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl text-center">
          {/* Фокусний блок з емодзі — головна окраса на мобільному */}
          <motion.div variants={item} className="mx-auto mb-7 flex w-fit justify-center sm:hidden">
            <div className="relative">
              <motion.div
                className="absolute inset-0 -z-10 rounded-full bg-emerald-300/40 blur-2xl"
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="glass flex items-end gap-2.5 rounded-[1.75rem] px-6 py-4 shadow-xl shadow-emerald-200/50 ring-1 ring-white/60">
                {['✊', '✌️', '✋'].map((e, i) => (
                  <motion.span
                    key={i}
                    className="text-5xl"
                    animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 10 : -10, 0] }}
                    transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                  >
                    {e}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.span
            variants={item}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
          >
            <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Sparkles className="h-3.5 w-3.5" />
            </motion.span>
            Реабілітація - підтримка - трохи азарту
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-5 text-[2rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:mt-6 sm:text-5xl md:text-6xl"
          >
            Грай у <span className="text-gradient">камінь-ножиці-папір</span> та розвивай мислення
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
            Заходь в онлайн-раунд, став монети разом з іншими гравцями та забирай спільний банк. Просто, живо й красиво.
          </motion.p>

          <motion.div variants={item} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
            <motion.button
              onClick={onPlay}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="shine flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-300/50 transition hover:bg-emerald-700 sm:w-auto sm:py-3.5"
            >
              <Gamepad2 className="h-5 w-5" />
              Грати зараз
            </motion.button>
            <motion.button
              onClick={onExchange}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glass flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 sm:w-auto sm:py-3.5"
            >
              <Wallet className="h-5 w-5" />
              Поповнити баланс
            </motion.button>
          </motion.div>

          <motion.div variants={item} className="mx-auto mt-9 grid max-w-md grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.l} className="card-glow rounded-2xl px-2 py-3 text-center ring-1 ring-white/60">
                <div className="text-lg font-extrabold tracking-tight text-slate-900">{s.v}</div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.l}</div>
              </div>
            ))}
          </motion.div>

          <motion.p variants={item} className="mt-6 text-xs text-slate-400">
            Демо-режим на віртуальних монетах. Реальні гроші не стягуються.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
