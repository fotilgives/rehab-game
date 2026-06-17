import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Gamepad2, Heart } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: '1. Поповни баланс',
    text: 'Обмінюй гроші на ігрові монети. У демо-режимі монети нараховуються миттєво й безкоштовно.',
  },
  {
    icon: Gamepad2,
    title: '2. Зроби ставку в раунді',
    text: 'У кожному раунді — одна ставка: камінь, ножиці чи папір. Усі ставки гравців складаються у спільний банк.',
  },
  {
    icon: Heart,
    title: '3. Забери виграш',
    text: 'Камінь б’є ножиці, ножиці — папір, папір — камінь. Переможці ділять банк битих. Монети потім можна витратити на послуги або підтримати реабілітолога.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <span className="eyebrow">✨ Як це працює</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Три кроки до гри
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="glass rounded-3xl p-6 shadow-sm ring-1 ring-white/60 transition hover:shadow-xl hover:shadow-emerald-900/5"
          >
            <motion.span
              whileHover={{ rotate: -8, scale: 1.08 }}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"
            >
              <Icon className="h-5 w-5" />
            </motion.span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
