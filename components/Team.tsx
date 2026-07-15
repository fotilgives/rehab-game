import React from 'react';
import { motion } from 'framer-motion';
import { HandHeart, MessageCircle, Heart } from 'lucide-react';

interface Member {
  name: string;
  role: string;
  desc: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  /** Точка фокуса фото при обрізанні (object-position). */
  objectPos?: string;
}

const MEMBERS: Member[] = [
  {
    name: 'Володимир Мальцев',
    role: 'Масажист-реабілітолог',
    image: '/images/team_vlad.jpg',
    icon: HandHeart,
    objectPos: 'object-top',
    desc: 'Оздоровчий, баночний, тайський масаж. Відновлення після травм, інсультів, операцій. Робота зі сколіозом. Індивідуальний підхід до кожного пацієнта.',
    tags: ['Оздоровчий масаж', 'Баночний масаж', 'Реабілітація'],
  },
  {
    name: 'Станіслава Шимонюк',
    role: 'Логопед-дефектолог',
    image: '/images/team_logoped.jpg',
    icon: MessageCircle,
    objectPos: 'object-top',
    desc: 'Працює з дітками та дорослими. Запуск мовлення, постановка звуків та вимови. Працює із порушеннями мовлення: алалія, дизартрія, заїкування.',
    tags: ['Звуковимова', 'Розвиток мовлення', 'Алалія та заїкування'],
  },
  {
    name: 'Кородзієвська Сніжана',
    role: 'Дитячий психолог',
    image: '/images/team_psych.jpg',
    icon: Heart,
    objectPos: 'object-top',
    desc: 'Психологічна діагностика, корекційно-розвивальні заняття. Сенсорна інтеграція, арт-терапія, нейрокорекція. М´яка підтримка дитини в безпечному просторі.',
    tags: ['Діагностика', 'Арт-терапія', 'Нейрокорекція'],
  },
  {
    name: 'Наталія Атоян',
    role: 'Інструктор йоги та масажист',
    image: '/images/team_natalia.jpg',
    icon: HandHeart,
    objectPos: 'object-top',
    desc: 'Інструктор дитячої та дорослої йоги. Масажист: класичний, релакс, лімфодренажний, тайський та масаж обличчя. Індивідуальний підхід.',
    tags: ['Йога', 'Лімфодренаж', 'Масаж обличчя'],
  },
];

const Team: React.FC = () => {
  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:gap-6">
      {MEMBERS.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-emerald-900/5"
          >
            {/* Фото показуємо повністю — на ньому вже є вся інформація про спеціаліста */}
            <div className="relative overflow-hidden bg-slate-100">
              <img
                src={m.image}
                alt={`${m.name} — ${m.role}`}
                loading="lazy"
                className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-white/85 text-emerald-600 shadow-sm backdrop-blur">
                <Icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">{m.name}</h3>
                <p className="truncate text-xs font-semibold text-emerald-600 sm:text-sm">{m.role}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Team;
