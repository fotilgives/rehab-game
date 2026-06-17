import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Check, ArrowRight, X, ShieldAlert, Activity, Heart, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SmartImage from '../SmartImage';

interface ServiceItem {
  title: string;
  image: string;
  short: string;
  details: string;
  cases: string[];
}

const SERVICES_DATA: ServiceItem[] = [
  {
    title: 'Медичні консультації та діагностика',
    image: '/images/consultation.png',
    short: 'Оцінка загального стану, вимірювання тиску, складання індивідуального плану реабілітації.',
    details: 'Наш лікар-реабілітолог проводить комплексний огляд пацієнта, оцінює рівень збережених рухових функцій за міжнародними шкалами, визначає реабілітаційний потенціал та формує індивідуальну програму відновлення.',
    cases: [
      'Стани після інсульту та інфаркту міокарда',
      'Хронічні захворювання опорно-рухового апарату',
      'Травми суглобів та хребта',
      'Підготовка до протезування суглобів та кінцівок'
    ]
  },
  {
    title: 'Фізична терапія',
    image: '/images/physical_therapy.png',
    short: 'Активне відновлення рухових функцій за допомогою підвісних систем, кінезотерапії та ЛФК.',
    details: 'Використання сучасного обладнання (наприклад, підвісних терапевтичних систем Redcord) дозволяє тренувати м’язи в стані невагомості або з індивідуально підібраним опором, що значно прискорює повернення сили та гнучкості.',
    cases: [
      'Слабкість м’язів після тривалого лікування та операцій',
      'Порушення координації рухів та балансу тіла',
      'Парези та паралічі різного ступеня важкості',
      'Біль у спині та суглобах при обмеженій рухливості'
    ]
  },
  {
    title: 'Ерготерапія',
    image: '/images/ergotherapy.png',
    short: 'Відновлення повсякденних та побутових навичок самообслуговування, дрібної моторики рук.',
    details: 'Ерготерапевт допомагає пацієнту заново навчитися користуватися столовими приборами, одягатися, писати, готувати їжу, адаптуючи життєвий простір та використовуючи спеціальні тренажери для пальців та долоней.',
    cases: [
      'Труднощі з письмом чи утриманням предметів',
      'Необхідність адаптації будинку після травм',
      'Втрата побутової незалежності',
      'Когнітивні розлади, що заважають самообслуговуванню'
    ]
  },
  {
    title: 'Психологічна допомога',
    image: '/images/psychology.png',
    short: 'Психологічна підтримка пацієнта та його родичів, подолання депресивних станів після травм.',
    details: 'Реабілітація — це важкий психологічний процес. Індивідуальні консультації психолога допомагають пацієнту знайти внутрішню мотивацію до відновлення та повернути емоційний баланс.',
    cases: [
      'Апатія та депресія після інсульту чи ампутації',
      'Тривожність та страх перед майбутнім',
      'Емоційне вигорання членів родини, що доглядають за хворим',
      'Посттравматичний синдром (ПТСР)'
    ]
  },
  {
    title: 'Логопедична допомога (корекція)',
    image: '/images/speech_therapy.png',
    short: 'Відновлення мовлення (афазія, дизартрія), тренування безпечного ковтання (дисфагія).',
    details: 'Спеціальні логопедичні масажі та артикуляційні вправи допомагають відновити контроль над мімічними м’язами та мовним апаратом, а також безпечно приймати їжу.',
    cases: [
      'Порушення вимови або розуміння мови після інсульту',
      'Порушення ковтання їжі чи води',
      'Слабкість артикуляційних м’язів',
      'Заїкання та інші мовленнєві розлади'
    ]
  },
  {
    title: 'Лікувальний масаж',
    image: '/images/massage.jpg',
    short: 'Зняття м’язового тонусу, покращення кровообігу та лімфотоку, зменшення больових симптомів.',
    details: 'Сеанси лікувального масажу проводяться за індивідуальними показаннями, допомагають розслабити перевантажені ділянки тіла та підготувати м’язи до активних занять ЛФК.',
    cases: [
      'М’язові затиски, спазми та біль у спині/шиї',
      'Набряки кінцівок при обмеженому русі',
      'Атрофія м’язів внаслідок гіподинамії',
      'Загальна втома та слабкість м’язового корсета'
    ]
  },
  {
    title: 'Фізіотерапевтичні процедури',
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
    short: 'Апаратне лікування (електростимуляція, магнітотерапія, ультразвук) для відновлення тканин.',
    details: 'Фізіотерапія застосовується як допоміжний засіб для зменшення болю, покращення кровообігу в уражених зонах та активації регенераційних процесів в організмі.',
    cases: [
      'Повільне зрощення кісток або сухожиль',
      'Гострі запальні процеси та набряки м’яких тканин',
      'Необхідність стимуляції паретичних м’язів струмом',
      'Потреба у глибокому безболісному прогріванні тканин'
    ]
  }
];

const SERVICE_OPTIONS = [
  'Консультація реабілітолога',
  'Фізична терапія (сесія)',
  'Ерготерапія (сесія)',
  'Психологічна допомога',
  'Логопедична допомога',
  'Лікувальний масаж',
  'Фізіотерапевтичні процедури',
  'Інше / Комплексна програма'
];

interface Props {
  embedded?: boolean;
}

const Services: React.FC<Props> = ({ embedded = false }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Selected service for detail modal
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const submit = async () => {
    setErr(null);
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setErr("Вкажіть ім'я та телефон");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('rps_book', {
      p_name: name,
      p_phone: phone,
      p_service: service,
      p_note: note,
    });
    setBusy(false);
    if (error) setErr('Не вдалося відправити. Спробуйте ще раз.');
    else setDone(true);
  };

  const openBookingFor = (serviceName: string) => {
    setSelectedService(null);
    const matchedOption = SERVICE_OPTIONS.find(
      (opt) => opt.toLowerCase().includes(serviceName.toLowerCase().split(' ')[0])
    ) || SERVICE_OPTIONS[SERVICE_OPTIONS.length - 1];
    setService(matchedOption);
    
    // Smooth scroll to booking form
    setTimeout(() => {
      const el = document.getElementById('book-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const Wrapper: any = embedded ? 'div' : 'main';
  return (
    <Wrapper className={embedded ? '' : 'mx-auto max-w-5xl px-5 pb-20 pt-12 sm:pt-16'}>
      {!embedded && (
        <div className="text-center mb-10">
          <span className="eyebrow">🤲 Наші послуги</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Послуги та напрямки відновлення</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 text-sm">Оберіть напрямок реабілітації для отримання кваліфікованої допомоги.</p>
        </div>
      )}

      {/* Grid of 7 services + 1 extra card */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES_DATA.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -20px 0px" }}
            transition={{ duration: 0.45, delay: idx * 0.05 }}
            whileHover={{ y: -4 }}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:shadow-emerald-900/5"
          >
            <div>
              {/* Image box */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <SmartImage
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      📷
                    </div>
                  }
                />
              </div>

              {/* Text */}
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                  {item.short}
                </p>
              </div>
            </div>

            {/* CTA row */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelectedService(item)}
                className="flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                Докладніше <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* 8th Card: More services link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -20px 0px" }}
          transition={{ duration: 0.45, delay: 7 * 0.05 }}
          whileHover={{ y: -4 }}
          onClick={() => {
            const el = document.getElementById('consultation-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-md shadow-emerald-200/40 hover:from-emerald-700 hover:to-teal-700"
        >
          <div className="flex flex-col justify-between h-full min-h-[160px]">
            <div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-lg font-extrabold leading-tight">
                Отримати консультацію реабілітолога
              </h3>
              <p className="mt-2 text-xs text-emerald-100 leading-relaxed">
                Допоможемо розібратися зі станом пацієнта та скласти покроковий план відновлення.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold border-t border-white/10 pt-4">
              <span>Залишити опис стану</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Booking Form Section */}
      <motion.div
        id="book-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        className="card-glow mx-auto mt-16 max-w-xl rounded-3xl p-6 ring-1 ring-white/60 shadow-xl shadow-slate-100 sm:p-8"
      >
        <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
          <CalendarCheck className="h-6 w-6 text-emerald-600" /> Запис на реабілітацію
        </h2>
        <p className="mt-1 text-xs text-slate-500">Залиште контакти, і ми зв'яжемося для узгодження часу першого візиту.</p>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8" />
            </span>
            <p className="text-lg font-extrabold text-slate-900">Заявка надіслана!</p>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Ми зв'яжемося з вами найближчим часом для узгодження деталей. Дякуємо за довіру!
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше ім'я"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
                inputMode="tel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Опишіть скарги або побажання (необов'язково)"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
            
            <button
              onClick={submit}
              disabled={busy}
              className="shine w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Відправляємо заявку…' : 'Записатися на прийом'}
            </button>
          </div>
        )}
      </motion.div>

      {/* ─── Detail Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100"
            >
              {/* Header Image box */}
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-100">
                <SmartImage
                  src={selectedService.image}
                  alt={selectedService.title}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      📷
                    </div>
                  }
                />
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-950/40 text-white backdrop-blur transition hover:bg-slate-950/65"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {selectedService.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {selectedService.details}
                </p>

                {/* Cases / Indications */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Показання та випадки лікування:
                  </h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {selectedService.cases.map((cs) => (
                      <li key={cs} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{cs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Modal Footer */}
                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => openBookingFor(selectedService.title)}
                    className="shine rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                  >
                    Записатися
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

export default Services;
