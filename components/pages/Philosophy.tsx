import React from 'react';
import { motion } from 'framer-motion';

const moves = [
  {
    emoji: '✊',
    name: 'Камінь',
    accent: 'from-slate-100 to-white',
    traits: ['стабільність', 'сила', 'опора', 'витривалість', 'внутрішній стрижень'],
    lines: [
      ['Йога', 'стан заземлення та стійкості'],
      ['Масаж', 'глибока структурна робота з тілом'],
      ['Бойові мистецтва', 'тверда позиція, витримка, здатність тримати удар'],
    ],
    note: 'Але надмірна жорсткість робить систему менш гнучкою.',
  },
  {
    emoji: '✌️',
    name: 'Ножиці',
    accent: 'from-emerald-50 to-white',
    traits: ['точність', 'швидкість', 'напрямок', 'рішучість', 'здатність розділяти зайве'],
    lines: [
      ['Бойові мистецтва', 'швидка та точна техніка'],
      ['Масаж', 'точкова робота та точний вплив на напруження'],
      ['Йога', 'дисципліна, концентрація, контроль'],
    ],
    note: 'Але надмірна різкість без стабільності втрачає баланс.',
  },
  {
    emoji: '✋',
    name: 'Папір',
    accent: 'from-teal-50 to-white',
    traits: ['гнучкість', 'адаптація', 'мʼякість', 'сприйнятливість', 'здатність обтікати силу'],
    lines: [
      ['Йога', 'принцип плавності та прийняття'],
      ['Масаж', 'мʼякі фасціальні та розслаблюючі техніки'],
      ['Бойові мистецтва', 'використання енергії суперника замість прямого протистояння'],
    ],
    note: 'Мʼякість не означає слабкість — гнучкість часто перемагає там, де сила не працює.',
  },
];

const bluffBlocks = [
  {
    title: 'Блеф у бойових мистецтвах',
    text: 'Фінти, зміна ритму, приховані наміри, відволікання уваги, несподівана зміна дії. Досвідчений боєць створює ілюзію одного руху, щоб виконати інший. Важлива уважність, самоконтроль і спокій. Перемагає не той, хто сильніше напружений, а хто краще відчуває момент.',
  },
  {
    title: 'Блеф у йозі',
    text: 'Тут блеф — це робота розуму та его: образ сили, прихована втома, маскування напруги. Практика вчить помічати ці внутрішні «маски» й бачити справжній стан. Це тренування усвідомленості: чи зберігаю спокій, чи помічаю емоції суперника, чи контролюю реакції.',
  },
  {
    title: 'Блеф у роботі з тілом',
    text: 'Тіло теж «блефує»: посмішка при напруженому тілі, «все добре» при затиснутих мʼязах. Спеціаліст читає дихання, тонус мʼязів, реакції нервової системи, мікрорухи. Зовнішнє не завжди відповідає внутрішньому.',
  },
];

const Section: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay }}>
    {children}
  </motion.div>
);

const Philosophy: React.FC = () => {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <div className="text-center">
        <span className="eyebrow">🧠 Філософія</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Камінь · Ножиці · <span className="text-gradient">Папір</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-600">
          У йозі, масажі та бойових мистецтвах важливе не лише фізичне виконання, а й розуміння взаємодії сили, гнучкості
          й адаптації. Тому гру можна розглядати як символ трьох станів та стратегій.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {moves.map((m, i) => (
          <Section key={m.name} delay={i * 0.08}>
            <div className={`h-full rounded-3xl bg-gradient-to-b ${m.accent} p-6 shadow-lg shadow-emerald-900/5 ring-1 ring-white/70`}>
              <div className="text-5xl">{m.emoji}</div>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900">{m.name}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.traits.map((t) => (
                  <span key={t} className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
                    {t}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {m.lines.map(([k, v]) => (
                  <li key={k} className="text-sm text-slate-600">
                    <b className="text-slate-800">{k}:</b> {v}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs italic text-slate-500">{m.note}</p>
            </div>
          </Section>
        ))}
      </div>

      <Section delay={0.1}>
        <div className="card-glow mt-10 rounded-3xl p-7 ring-1 ring-white/60">
          <h2 className="text-xl font-extrabold text-slate-900">Баланс трьох принципів</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            Немає абсолютної сили чи абсолютної переваги. Стійкість без гнучкості стає жорсткістю; гнучкість без структури —
            нестабільністю; швидкість без контролю — хаосом.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Бути твердим, коли потрібно', 'Гнучким, коли ситуація змінюється', 'Точним у потрібний момент'].map((t) => (
              <div key={t} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{t}</div>
            ))}
          </div>
        </div>
      </Section>

      {/* Bluff */}
      <Section delay={0.05}>
        <div className="mt-12 text-center">
          <span className="eyebrow">🤫 Блеф</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Мистецтво контролю та усвідомлення
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-600">
            Блеф — це не просто хитрість, а здатність керувати увагою, емоціями та намірами. Важливо не лише те, що людина
            робить зовні, а й який внутрішній стан вона передає.
          </p>
        </div>
      </Section>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {bluffBlocks.map((b, i) => (
          <Section key={b.title} delay={i * 0.08}>
            <div className="glass h-full rounded-3xl p-6 ring-1 ring-violet-100">
              <h3 className="text-base font-bold text-violet-700">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.text}</p>
            </div>
          </Section>
        ))}
      </div>

      <Section delay={0.1}>
        <div className="mt-8 rounded-3xl bg-violet-600 p-7 text-white shadow-xl shadow-violet-300/40">
          <h3 className="text-lg font-extrabold">Навіщо блеф у грі?</h3>
          <p className="mt-2 text-sm leading-relaxed text-violet-50">
            Він робить гру глибшою й розвиває психологічну уважність, швидкість мислення, контроль емоцій, інтуїцію, здатність
            адаптуватися та самовладання у стресі. Це вже не випадковість, а взаємодія розуму, уваги й внутрішнього стану.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['уважність', 'швидкість мислення', 'контроль емоцій', 'інтуїція', 'адаптація', 'самовладання'].map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{t}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section delay={0.1}>
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-medium leading-relaxed text-slate-700">
          Саме цей баланс — твердості, гнучкості й точності — лежить в основі здорового руху, тілесної роботи та внутрішньої
          рівноваги. 🌿
        </p>
      </Section>
    </main>
  );
};

export default Philosophy;
