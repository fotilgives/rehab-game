import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Menu, X } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import BrandMark from './BrandMark';
import type { Route } from '../hooks/useRoute';

interface Props {
  balance: number;
  route: Route;
  onExchange: () => void;
}

const LINKS: { to: Route; label: string; href: string }[] = [
  { to: 'about', label: 'Про мене', href: '#/about' },
  { to: 'services', label: 'Послуги', href: '#/services' },
  { to: 'game', label: 'Гра', href: '#/game' },
  { to: 'prizes', label: 'Призи', href: '#/prizes' },
  { to: 'philosophy', label: 'Філософія', href: '#/philosophy' },
];

const Navbar: React.FC<Props> = ({ balance, route, onExchange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-40 transition-all ${scrolled || open ? 'glass border-b border-white/50 shadow-sm' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <motion.span whileHover={{ rotate: -6, scale: 1.06 }}>
            <BrandMark size={38} />
          </motion.span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight sm:text-lg">Центр розвитку та здоров'я</span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block">рух · баланс · відновлення</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <a
              key={l.to}
              href={l.href}
              className={`transition hover:text-emerald-700 ${route === l.to ? 'font-bold text-emerald-700' : 'text-slate-600'}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-amber-600 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            <AnimatedNumber value={balance} />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onExchange}
            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Поповнити</span>
          </motion.button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-slate-600 ring-1 ring-slate-200 md:hidden"
            aria-label="Меню"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/50 md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col px-5 py-2">
              {LINKS.map((l) => (
                <a
                  key={l.to}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    route === l.to ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
