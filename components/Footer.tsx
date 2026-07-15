import React from 'react';
import { Instagram, Send, Phone, MapPin, Heart, Clock } from 'lucide-react';
import BrandMark from './BrandMark';
import { goToBooking, navigate } from '../hooks/useRoute';

const navLinks: { label: string; route: 'about' | 'services' | 'game' | 'prizes' | 'philosophy' | 'prices' | 'location' | 'donate' | 'legal' }[] = [
  { label: 'Про мене', route: 'about' },
  { label: 'Послуги', route: 'services' },
  { label: 'Ціни', route: 'prices' },
  { label: 'Підтримати ❤️', route: 'donate' },
  { label: 'Документи', route: 'legal' },
];

const services = ['Лікувальний масаж', 'Реабілітація', 'Йога та практики', 'Курси й навчання'];

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-10 overflow-hidden bg-forest-950 border-t border-gold-300/15">
      {/* Dark background image */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
        style={{ backgroundImage: 'url(/images/footer-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/85 to-forest-900/50" />
      <div className="grain" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Бренд */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark size={40} />
              <span className="font-display text-base font-semibold tracking-tight text-ivory-50">
                Центр розвитку та здоров'я
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Масаж, фізична реабілітація, йога та навчання. Допомагаємо тілу відновити баланс, стабільність і свободу руху.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <a href="https://instagram.com/center_rozvutky_vi" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-gold-500 hover:text-forest-950">
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a href="#" aria-label="Telegram" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-gold-500 hover:text-forest-950">
                <Send className="h-4.5 w-4.5" />
              </a>
              <a href="tel:+380638069916" aria-label="Телефон" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-gold-500 hover:text-forest-950">
                <Phone className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Розділи */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold-400">Розділи</h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.route}>
                  <button
                    onClick={() => navigate(l.route)}
                    className="text-sm text-slate-300 transition hover:text-gold-400 text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate('location')}
                  className="text-sm text-slate-300 transition hover:text-gold-400 text-left"
                >
                  Як нас знайти
                </button>
              </li>
            </ul>
          </div>

          {/* Послуги */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold-400">Послуги</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button onClick={() => navigate('services')} className="text-sm text-slate-300 transition hover:text-gold-400 text-left">Лікувальний масаж</button>
              </li>
              <li>
                <button onClick={() => navigate('services')} className="text-sm text-slate-300 transition hover:text-gold-400 text-left">Реабілітація</button>
              </li>
              <li>
                <button onClick={() => navigate('services')} className="text-sm text-slate-300 transition hover:text-gold-400 text-left">Йога та практики</button>
              </li>
              <li>
                <button onClick={() => navigate('services')} className="text-sm text-slate-300 transition hover:text-gold-400 text-left">Курси й навчання</button>
              </li>
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold-400">Контакти</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a href="tel:+380638069916" className="transition hover:text-gold-300">+38 (063) 806-99-16</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span>м. Вінниця · запис онлайн</span>
              </li>
            </ul>

            {/* Графік роботи */}
            <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock className="h-4 w-4 text-gold-400" /> Графік роботи
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Пн – Пт</dt>
                  <dd className="font-semibold text-white">9:00 – 18:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Сб</dt>
                  <dd className="font-semibold text-white">9:00 – 13:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Нд</dt>
                  <dd className="font-medium text-slate-500">вихідний</dd>
                </div>
              </dl>
            </div>

            <button
              onClick={goToBooking}
              className="btn-gold mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
            >
              Записатися
            </button>
          </div>
        </div>

        {/* Юридичні документи */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-8 text-xs">
          <button onClick={() => navigate('legal')} className="text-slate-300 transition hover:text-gold-400">
            Публічна оферта
          </button>
          <button onClick={() => navigate('legal')} className="text-slate-300 transition hover:text-gold-400">
            Політика конфіденційності
          </button>
          <button onClick={() => navigate('legal')} className="text-slate-300 transition hover:text-gold-400">
            Повернення коштів
          </button>
          <button onClick={() => navigate('donate')} className="font-semibold text-gold-400 transition hover:text-gold-300">
            Підтримати ❤️
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Центр розвитку та здоров'я. Усі права захищені.</p>
          <a
            href="https://www.instagram.com/aysite_company/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 transition hover:bg-gold-500/10 hover:ring-gold-400/40"
          >
            Зроблено з <Heart className="h-3.5 w-3.5 fill-gold-500 text-gold-500 transition group-hover:scale-110" />
            <span className="font-bold tracking-wide text-gold-400 transition group-hover:text-gold-300">AYSITE</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
