import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Menu, X, User, HandHeart, Gamepad2, Gift, Brain, Phone, CalendarCheck, Clock, MapPin, Heart, LogIn, LogOut } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import BrandMark from './BrandMark';
import { HoursPill, SCHEDULE_ROWS } from './Hours';
import { goToBooking, navigate } from '../hooks/useRoute';
import type { Route } from '../hooks/useRoute';

interface Props {
  balance: number;
  route: Route;
  onExchange: () => void;
  account: any;
  onLogin: () => void;
}

const LINKS: { to: Route; label: string; href: string; icon: React.ComponentType<{ className?: string }>; header?: boolean }[] = [
  { to: 'about', label: 'Про мене', href: '/about', icon: User, header: true },
  { to: 'services', label: 'Послуги', href: '/services', icon: HandHeart, header: true },
  { to: 'prices', label: 'Ціни', href: '/prices', icon: Coins, header: true },
  { to: 'game', label: 'Гра', href: '/game', icon: Gamepad2, header: true },
  { to: 'prizes', label: 'Призи', href: '/prizes', icon: Gift, header: true },
  { to: 'philosophy', label: 'Філософія', href: '/philosophy', icon: Brain },
  { to: 'donate', label: 'Підтримати', href: '/donate', icon: Heart },
];

const PHONE = '+380638069916';

const Navbar: React.FC<Props> = ({ balance, route, onExchange, account, onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Блокуємо скрол сторінки, поки відкрите мобільне меню.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Головна відкривається темним forest-hero, що заходить під прозорий navbar —
  // тоді текст світлий; після скролу (або на інших сторінках) вмикається світле скло.
  const onDark = route === 'home' && !scrolled && !open;

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        onDark ? 'bg-transparent' : scrolled || open ? 'glass border-b border-forest-800/10 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <a href="/" onClick={(e) => { e.preventDefault(); setOpen(false); navigate('home'); }} className="flex items-center gap-2.5">
            <motion.span whileHover={{ rotate: -6, scale: 1.06 }}>
              <BrandMark size={38} />
            </motion.span>
            <span className="leading-tight">
              <span className={`font-display block max-w-[46vw] text-[13px] font-bold leading-snug tracking-tight sm:max-w-none sm:text-[15px] lg:text-lg transition-colors ${onDark ? 'text-ivory-50' : 'text-forest-900'}`}>
                Центр розвитку та здоров'я
              </span>
              <span className={`hidden text-[9px] font-medium uppercase tracking-[0.2em] transition-colors sm:block sm:text-[10px] ${onDark ? 'text-gold-300/80' : 'text-gold-600/80'}`}>
                рух · баланс · відновлення
              </span>
            </span>
          </a>
        </div>

        <nav className="hidden items-center gap-4 text-[13px] font-medium xl:gap-6 lg:flex">
          {LINKS.filter(l => l.header).map((l) => (
            <a
              key={l.to}
              href={l.href}
              onClick={(e) => { e.preventDefault(); navigate(l.to); }}
              className={`relative transition ${
                route === l.to
                  ? onDark ? 'font-bold text-gold-300' : 'font-bold text-forest-800'
                  : onDark ? 'text-ivory-50/75 hover:text-gold-300' : 'text-forest-900/60 hover:text-forest-800'
              }`}
            >
              {l.label}
              {route === l.to && (
                <motion.span layoutId="nav-underline" className={`absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full ${onDark ? 'bg-gold-400' : 'bg-gold-500'}`} />
              )}
            </a>
          ))}
          <a
            href="/location"
            onClick={(e) => { e.preventDefault(); navigate('location'); }}
            className={`flex items-center gap-1.5 transition ${
              route === 'location'
                ? onDark ? 'font-bold text-gold-300' : 'font-bold text-forest-800'
                : onDark ? 'text-ivory-50/75 hover:text-gold-300' : 'text-forest-900/60 hover:text-forest-800'
            }`}
          >
            <MapPin className="h-4 w-4" /> Де нас знайти
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => navigate('profile')}
            title="Мій кабінет"
            className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-xs font-bold ring-1 transition sm:gap-1.5 sm:px-3 sm:text-sm ${
              onDark
                ? 'glass-dark text-gold-300 ring-white/15 hover:ring-gold-300/50'
                : `bg-white/70 text-gold-600 hover:ring-gold-500/60 ${route === 'profile' ? 'ring-gold-500/60' : 'ring-gold-500/25'}`
            }`}
          >
            <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <AnimatedNumber value={balance} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onExchange}
            className="btn-gold flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-xs font-bold sm:px-3 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Поповнити</span>
          </motion.button>

          {account.isAccount ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate('profile')}
              className={`hidden cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition sm:flex ${
                route === 'profile'
                  ? 'bg-forest-800 text-ivory-50'
                  : onDark
                  ? 'bg-white/[0.08] text-ivory-50 ring-1 ring-white/15 hover:bg-white/[0.14]'
                  : 'bg-forest-800/5 text-forest-800 hover:bg-forest-800/10'
              }`}
            >
              <User className="h-4 w-4" />
              {account.nickname || 'Кабінет'}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={onLogin}
              className={`hidden cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition sm:flex ${
                onDark
                  ? 'bg-white/[0.08] text-ivory-50 ring-1 ring-white/15 hover:bg-white/[0.14]'
                  : 'bg-white/70 text-forest-700 ring-1 ring-forest-700/20 hover:bg-forest-700/5'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Увійти
            </motion.button>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className={`grid h-9 w-9 cursor-pointer place-items-center rounded-xl ring-1 transition lg:hidden ${
              onDark ? 'bg-white/10 text-ivory-50 ring-white/15' : 'bg-white/70 text-forest-800 ring-forest-800/10'
            }`}
            aria-label="Меню"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu — повноекранна охайна панель */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[60px] z-40 bg-forest-950/25 backdrop-blur-sm lg:hidden"
            />
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full z-50 origin-top border-t border-forest-800/10 bg-ivory-50/95 backdrop-blur-xl shadow-xl lg:hidden max-h-[calc(100dvh-70px)] overflow-y-auto overscroll-contain pb-6"
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
                {LINKS.map((l, i) => {
                  const Icon = l.icon;
                  const active = route === l.to;
                  return (
                    <motion.a
                      key={l.to}
                      href={l.href}
                      onClick={(e) => { e.preventDefault(); setOpen(false); navigate(l.to); }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.3 }}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition ${
                        active ? 'bg-forest-800/[0.06] text-forest-800' : 'text-forest-900/75 hover:bg-forest-800/[0.04]'
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-forest-800 text-gold-300' : 'bg-forest-800/[0.06] text-forest-800/60'}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      {l.label}
                    </motion.a>
                  );
                })}

                <a
                  href="/location"
                  onClick={(e) => { e.preventDefault(); setOpen(false); navigate('location'); }}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition ${
                    route === 'location' ? 'bg-forest-800/[0.06] text-forest-800' : 'text-forest-900/75 hover:bg-forest-800/[0.04]'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${route === 'location' ? 'bg-forest-800 text-gold-300' : 'bg-forest-800/[0.06] text-forest-800/60'}`}>
                    <MapPin className="h-4.5 w-4.5" />
                  </span>
                  Де нас знайти
                </a>

                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-forest-800/10 pt-3">
                  <button
                    onClick={() => {
                      setOpen(false);
                      goToBooking();
                    }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-forest-800 px-4 py-3 text-sm font-bold text-ivory-50 shadow-lg shadow-forest-800/25 transition hover:bg-forest-700"
                  >
                    <CalendarCheck className="h-4 w-4" /> Записатися
                  </button>
                  <a
                    href={`tel:${PHONE}`}
                    onClick={() => setOpen(false)}
                    className="btn-gold flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    <Phone className="h-4 w-4" /> Подзвонити
                  </a>
                </div>

                {/* Графік роботи */}
                <div className="mt-2 rounded-2xl bg-forest-800/[0.04] px-4 py-3 ring-1 ring-forest-800/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
                    <Clock className="h-3.5 w-3.5 text-gold-600" /> Графік роботи
                  </div>
                  <dl className="mt-2 space-y-1 text-xs">
                    {SCHEDULE_ROWS.map((r) => (
                      <div key={r.days} className="flex items-center justify-between">
                        <dt className="text-forest-900/50">{r.days}</dt>
                        <dd className={r.dim ? 'font-medium text-forest-900/35' : 'font-semibold text-forest-900/80'}>{r.time}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Mobile Auth */}
                <div className="mt-2 border-t border-forest-800/10 pt-2">
                  <button
                    onClick={() => { setOpen(false); navigate('profile'); }}
                    className={`mb-1 flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition ${
                      route === 'profile' ? 'bg-forest-800/[0.06] text-forest-800' : 'text-forest-900/75 hover:bg-forest-800/[0.04]'
                    }`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${route === 'profile' ? 'bg-forest-800 text-gold-300' : 'bg-forest-800/[0.06] text-forest-800/60'}`}>
                      <User className="h-4.5 w-4.5" />
                    </span>
                    Мій кабінет
                  </button>
                  {account.isAccount ? (
                    <button
                      onClick={() => { setOpen(false); account.logout(); }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold text-forest-900/75 transition hover:bg-forest-800/[0.04]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-800/[0.06] text-forest-800/60">
                        <LogOut className="h-4.5 w-4.5" />
                      </span>
                      Вийти з кабінету
                    </button>
                  ) : (
                    <button
                      onClick={() => { setOpen(false); onLogin(); }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-forest-800/[0.06] px-3 py-3 text-[15px] font-semibold text-forest-800 transition hover:bg-forest-800/[0.09]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-800 text-gold-300">
                        <LogIn className="h-4.5 w-4.5" />
                      </span>
                      Увійти в кабінет
                    </button>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
