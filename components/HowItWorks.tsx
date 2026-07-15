import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Gamepad2, Heart } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    n: '01',
    title: 'Поповни баланс',
    text: 'Обмінюй гроші на ігрові монети. У демо-режимі монети нараховуються миттєво й безкоштовно.',
  },
  {
    icon: Gamepad2,
    n: '02',
    title: 'Зроби ставку в раунді',
    text: 'У кожному раунді - одна ставка: камінь, ножиці чи папір. Усі ставки гравців складаються у спільний банк.',
  },
  {
    icon: Heart,
    n: '03',
    title: 'Забери виграш',
    text: 'Камінь б’є ножиці, ножиці - папір, папір - камінь. Переможці ділять банк битих. Монети потім можна витратити на послуги або підтримати реабілітолога.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how" className="mx-auto max-w-5xl px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <span className="eyebrow">Правила гри</span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-forest-800 md:text-4xl">
          Бонусна гра
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, n, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5 }}
            className="card-glow relative overflow-hidden rounded-3xl p-5 ring-1 ring-forest-800/5 transition hover:shadow-xl hover:shadow-forest-800/10"
          >
            <span className="font-display pointer-events-none absolute -right-1 -top-4 text-[64px] font-semibold italic leading-none text-forest-800/[0.07]">
              {n}
            </span>
            <motion.span
              whileHover={{ rotate: -8, scale: 1.08 }}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-800 text-gold-300 shadow-md shadow-forest-800/20"
            >
              <Icon className="h-4.5 w-4.5" />
            </motion.span>
            <h3 className="mt-4 font-display text-base font-semibold text-forest-900">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-forest-900/55">{text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
