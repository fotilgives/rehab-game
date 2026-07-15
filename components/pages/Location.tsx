import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Heart } from 'lucide-react';

const Location: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Як нас знайти
        </h1>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
          Ми знаходимось у зручному районі міста. Завітайте до нас для відновлення здоров'я та гармонії.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid items-stretch gap-6 rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 lg:grid-cols-[1fr_1.4fr] shadow-xl shadow-emerald-900/5"
      >
        <div className="flex flex-col justify-center p-2 sm:p-4">
          <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <MapPin className="h-6 w-6 text-emerald-600" /> Центр розвитку та здоров'я
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            вулиця Шевченка, 44, Вінниця
            <br />
            Вінницька область, Україна, 21000
          </p>
          
          <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Clock className="h-4 w-4 text-emerald-600" /> Графік роботи
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Пн – Пт</dt>
                <dd className="font-semibold text-slate-800">9:00 – 18:00</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Сб</dt>
                <dd className="font-semibold text-slate-800">9:00 – 13:00</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Нд</dt>
                <dd className="font-medium text-slate-400">вихідний</dd>
              </div>
            </dl>
          </div>

          <a
            href="https://maps.app.goo.gl/?q=Tsentr+Rozvytku+Ta+Zdorovya+Vinnytsia"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <MapPin className="h-4 w-4" /> Відкрити в Google Maps
          </a>
        </div>
        
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <iframe
            title="Центр розвитку та здоров'я — на мапі"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2493.794567182449!2d28.438581199999998!3d49.22406230000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x472d5de19377df09%3A0x5de3b0db0143f75e!2sTsentr%20Rozvytku%20Ta%20Zdorov&#39;ya!5e1!3m2!1sru!2spl!4v1781862453626!5m2!1sru!2spl"
            className="h-80 w-full lg:h-full"
            style={{ border: 0, minHeight: '300px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Location;
