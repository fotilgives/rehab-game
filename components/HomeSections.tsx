import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HandHeart, Gift, Brain, Gamepad2 } from 'lucide-react';
import Services from './pages/Services';
import Prizes from './pages/Prizes';
import Philosophy from './pages/Philosophy';
import { navigate } from '../hooks/useRoute';
import type { Account } from '../hooks/useAccount';

interface Props {
  account: Account;
  onExchange: () => void;
}

const HomeSections: React.FC<Props> = ({ account, onExchange }) => {
  // За замовчуванням відкрита перша секція — Послуги.
  const [open, setOpen] = useState<string | null>('services');

  const sections = [
    {
      id: 'services',
      icon: HandHeart,
      title: 'Послуги та запис',
      subtitle: 'Масаж, реабілітація, йога, навчання',
      content: <Services embedded />,
    },
    {
      id: 'prizes',
      icon: Gift,
      title: 'Призи за монети',
      subtitle: 'Обмін ігрових монет на послуги та знижки',
      content: <Prizes account={account} onTopUp={onExchange} embedded />,
    },
    {
      id: 'philosophy',
      icon: Brain,
      title: 'Філософія гри',
      subtitle: 'Камінь · ножиці · папір як шлях балансу',
      content: <Philosophy embedded />,
    },
  ];

  const toggle = (id: string) => {
    setOpen((cur) => {
      const next = cur === id ? null : id;
      if (next) {
        setTimeout(() => {
          const el = document.getElementById(`section-${id}`);
          if (el) {
            const yOffset = -90;
            const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 200);
      }
      return next;
    });
  };

  return (
    <section id="sections" className="mx-auto max-w-4xl px-5 py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <span className="eyebrow">Усе в одному місці</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Послуги, бонуси та філософія
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Оберіть потрібну послугу, дізнайтеся про бонусну програму або почитайте про мій підхід до
          відновлення та балансу.
        </p>
      </motion.div>

      <div className="mt-9 space-y-3">
        {sections.map(({ id, icon: Icon, title, subtitle, content }, i) => {
          const isOpen = open === id;
          return (
            <motion.div
              key={id}
              id={`section-${id}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className={`overflow-hidden rounded-3xl ring-1 transition-all duration-300 ${
                isOpen
                  ? 'bg-white/80 ring-emerald-200 shadow-xl shadow-emerald-900/5'
                  : 'glass ring-white/60 hover:ring-emerald-200 hover:shadow-md'
              }`}
            >
              <button
                onClick={() => toggle(id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition shadow-sm ${
                    isOpen ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-slate-900 sm:text-lg">{title}</span>
                  <span className="block truncate text-xs text-slate-500 sm:text-sm">{subtitle}</span>
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0 text-slate-400"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 px-4 pb-6 pt-5 sm:px-6">{content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Гра — окрема яскрава кнопка */}
        <motion.button
          onClick={() => navigate('game')}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: 0.18 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="shine flex w-full items-center gap-4 rounded-3xl bg-emerald-600 px-5 py-4 text-left text-white shadow-xl shadow-emerald-300/40 transition hover:bg-emerald-700 sm:px-6 sm:py-5"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold sm:text-lg">Грати в гру</span>
            <span className="block text-xs text-emerald-50 sm:text-sm">
              Камінь · ножиці · папір — заробляй монети на послуги
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700">
            Грати →
          </span>
        </motion.button>
      </div>
    </section>
  );
};

export default HomeSections;
