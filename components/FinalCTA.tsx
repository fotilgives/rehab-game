import React from 'react';
import { motion } from 'framer-motion';
import { Phone, CalendarCheck, Sparkles } from 'lucide-react';
import { goToBooking } from '../hooks/useRoute';
import Reveal from './Reveal';

/**
 * Фінальна преміум-секція із закликом до дії перед футером —
 * темна forest-панель із зернистістю та золотим акцентом.
 */
const FinalCTA: React.FC = () => {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <Reveal
        amount={0.3}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-6 py-14 text-center text-ivory-50 shadow-2xl shadow-forest-900/40 ring-1 ring-gold-300/20 sm:px-12 sm:py-18"
      >
        {/* Декоративні світні плями + зернистість */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="grain" />

        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="eyebrow-dark relative"
        >
          <Sparkles className="h-3.5 w-3.5" /> Перший крок до відновлення
        </motion.span>

        <h2 className="font-display relative mx-auto mt-6 max-w-2xl text-3xl font-semibold leading-tight sm:text-[2.6rem]">
          Готові повернути собі <em className="text-gradient-gold">рух, силу та баланс</em>?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ivory-50/60 sm:text-base">
          Залиште заявку або зателефонуйте — підберемо індивідуальну програму відновлення саме під ваш стан.
        </p>

        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToBooking}
            className="btn-gold shine flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold sm:w-auto"
          >
            <CalendarCheck className="h-5 w-5" /> Записатися на прийом
          </motion.button>
          <motion.a
            href="tel:+380638069916"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-8 py-3.5 text-sm font-bold text-ivory-50 ring-1 ring-white/20 transition hover:bg-white/10 sm:w-auto"
          >
            <Phone className="h-5 w-5" /> +38 (063) 806-99-16
          </motion.a>
        </div>
      </Reveal>
    </section>
  );
};

export default FinalCTA;
