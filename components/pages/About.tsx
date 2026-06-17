import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Dumbbell, GraduationCap, CalendarCheck, ArrowRight } from 'lucide-react';
import { navigate } from '../../hooks/useRoute';

const directions = [
  'Лікувальний та оздоровчий масаж',
  'Тайський масаж',
  'Юмейхо-терапія',
  'Фасціальні техніки',
  'Пресролінг',
  'Вакуумні банки',
  'Лікувальна фізкультура',
  "Динамічна нейром'язова стабілізація (DNS)",
  'Redcord-терапія',
  'Blomberg Therapy',
  'Йога та тілесні практики',
];

const courses = [
  'Курси з йоги',
  'Курси масажу',
  'Навчання лікувальному масажу',
  'Навчання тайському масажу',
  'Онлайн-курси та програми для самостійної практики',
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] } }),
};

const About: React.FC = () => {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
        <span className="eyebrow">👋 Про мене</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Володимир <span className="text-gradient">Мальцев</span>
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Масажист-реабілітолог із понад <b className="text-slate-800">15-річним досвідом</b> у відновленні здоров'я, руху та фізичній реабілітації.
        </p>
      </motion.div>

      <motion.div
        custom={1}
        variants={fade}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="card-glow mx-auto mt-8 max-w-2xl rounded-3xl p-6 ring-1 ring-white/60"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
          <HeartPulse className="h-6 w-6" />
        </span>
        <p className="mt-4 leading-relaxed text-slate-600">
          У своїй практиці поєдную сучасні реабілітаційні підходи, мануальні техніки та роботу з тілом через рух.
          Моя мета — не просто тимчасово зняти біль, а допомогти організму відновити <b className="text-slate-800">баланс,
          стабільність та свободу руху</b>.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <motion.section custom={2} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="glass rounded-3xl p-6 ring-1 ring-white/60">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Dumbbell className="h-5 w-5 text-emerald-600" /> Напрямки роботи
          </h2>
          <ul className="mt-4 space-y-2">
            {directions.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {d}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section custom={3} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="glass rounded-3xl p-6 ring-1 ring-white/60">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <GraduationCap className="h-5 w-5 text-emerald-600" /> Навчання та курси
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Я також інструктор з йоги та проводжу навчальні курси для спеціалістів і всіх, хто хоче глибше зрозуміти роботу з тілом.
          </p>
          <ul className="mt-4 space-y-2">
            {courses.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      <motion.div
        custom={4}
        variants={fade}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-emerald-600 p-7 text-center text-white shadow-xl shadow-emerald-300/40"
      >
        <CalendarCheck className="h-8 w-8" />
        <h2 className="text-xl font-extrabold">Записатися на прийом</h2>
        <p className="max-w-md text-sm text-emerald-50">
          Оберіть послугу та залиште контакти — я зв'яжуся з вами, щоб підібрати зручний час.
        </p>
        <button
          onClick={() => navigate('services')}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
        >
          Послуги та запис <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </main>
  );
};

export default About;
