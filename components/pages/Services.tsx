import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Check,
  Activity,
  Award,
  BookOpen,
  ChevronDown,
  User,
  Heart,
  FileText,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ZoomImage from '../ZoomImage';

// --- Services Data ---
const servicesData = [
  {
    id: 'massage',
    icon: Heart,
    title: 'Лікувальний та оздоровчий масаж',
    shortDesc: 'Ручний вплив на м’язи, фасції та суглоби для зняття болю, відновлення рухливості та покращення кровообігу.',
    image: '/images/massage.jpg',
    fullDesc: 'Класичні та інноваційні масажні техніки, адаптовані під потреби вашого тіла. Допомагають усунути м’язові затиски, тригерні точки, покращити лімфоток та прискорити відновлення після фізичних навантажень.',
    methods: [
      { name: 'Оздоровчий масаж спини', desc: 'Глибоке опрацювання м’язів спини, шийно-комірцевої зони та попереку.' },
      { name: 'Тайський традиційний масаж', desc: 'Робота через розтягування, скручування та акупресуру для розкриття суглобів.' },
      { name: 'Міофасціальний реліз', desc: 'М’який вплив на сполучну тканину (фасцію) для відновлення її еластичності.' },
      { name: 'Вакуумний банковий масаж', desc: 'Покращення мікроциркуляції та зняття глибоких застійних явищ.' }
    ]
  },
  {
    id: 'rehab',
    icon: Activity,
    title: 'Фізична реабілітація та терапія',
    shortDesc: 'Комплексне відновлення опорно-рухового апарату після травм, операцій та за хронічних больових синдромів.',
    image: '/images/rehab.jpg',
    fullDesc: 'Сучасні кінезіотерапевтичні методики, спрямовані на перенавчання нервово-м’язової системи, відновлення правильних рухових патернів та зміцнення глибоких стабілізуючих м’язів.',
    methods: [
      { name: 'Юмейхо-терапія', desc: 'Східна мануальна техніка для вирівнювання тазу та корекції положення хребта.' },
      { name: 'DNS (Динамічна нейром’язова стабілізація)', desc: 'Метод активації вроджених рухових стереотипів на основі онтогенезу.' },
      { name: 'Redcord-терапія (Neurac)', desc: 'Тренування в підвісних системах для виявлення та усунення слабких м’язових ланок.' },
      { name: 'Blomberg Therapy (RMT)', desc: 'Ритмічна рухова терапія для інтеграції первинних рефлексів.' }
    ]
  },
  {
    id: 'yoga',
    icon: Award,
    title: 'Терапевтична йога та практики',
    shortDesc: 'Індивідуальні заняття, спрямовані на розвиток гнучкості, балансу, координації та покращення постави.',
    image: '/images/yoga_service.jpg',
    fullDesc: 'М’яка йогатерапія для зміцнення м’язового корсета, розвантаження хребта та нормалізації психоемоційного стану. Програма адаптується під рівень гнучкості та стан здоров’я.',
    methods: [
      { name: 'Йогатерапія хребта', desc: 'Спеціальні асани для декомпресії дисків та усунення сутулості.' },
      { name: 'Дихальні практики (Пранаяма)', desc: 'Робота з диханням для зниження стресу та регуляції нервової системи.' },
      { name: 'Пресролінг (робота з ролом)', desc: 'Самостійний міофасціальний реліз для розслаблення всього тіла.' }
    ]
  },
  {
    id: 'education',
    icon: BookOpen,
    title: 'Навчання та авторські курси',
    shortDesc: 'Професійні курси з масажу, йогатерапії та тілесних практик для спеціалістів та початківців.',
    image: '/images/education.jpg',
    fullDesc: 'Передача практичного досвіду та знань з анатомії, фізіології та біомеханіки. Навчання побудоване на поєднанні теоретичної бази та інтенсивного відпрацювання практичних навичок.',
    methods: [
      { name: 'Базовий курс лікувального масажу', desc: 'Теорія анатомії, базові прийоми масажу, безпека роботи.' },
      { name: 'Курс тайського масажу', desc: 'Традиційні східні розтяжки та робота на татамі.' },
      { name: 'Йога-інструктор: від практики до викладання', desc: 'Методологія побудови занять та корекція асан.' }
    ]
  }
];

// --- Cases Data ---
const casesData = [
  {
    id: 'case-shoulder',
    title: 'Реабілітація після травми плеча',
    badge: '8 сесій',
    patient: 'Андрій, 34 роки, кросфіт-атлет',
    symptoms: 'Різкий біль у правому плечі при підйомі руки вище 90 градусів, обмеження амплітуди рухів, неможливість тренуватися.',
    diagnose: 'Пошкодження ротаторної манжети плеча, імпінджмент-синдром.',
    therapy: 'Redcord-терапія (Neurac) для активації глибоких стабілізаторів плечового поясу, DNS для виправлення лопатково-плечового ритму, міофасціальний реліз для зняття перенапруження.',
    result: 'Повна амплітуда рухів відновлена. Андрій повернувся до тренувань з власною вагою на 5-му тижні, на 8-му сесію біль повністю зник навіть під навантаженням.',
    duration: '1.5 місяці',
    image: '/images/case_shoulder.jpg'
  },
  {
    id: 'case-back',
    title: 'Усунення болю при грижі L4-L5',
    badge: '12 сесій',
    patient: 'Олена, 42 роки, ІТ-менеджер',
    symptoms: 'Ниючий біль у попереку, що посилювався під час сидіння (більше 20 хв) та віддавав у ліву ногу (сідницю та задню поверхню стегна).',
    diagnose: 'Грижа диска L4-L5 (5.4 мм), дискогенний радикуліт.',
    therapy: 'Юмейхо-терапія для корекції перекосу тазу та декомпресії хребта, м’які тракційні техніки, вправи DNS для стабілізації поперекового відділу через дихання.',
    result: 'Біль повністю куповано. Олена може вільно сидіти до 2 годин без дискомфорту. Контрольне МРТ через 6 місяців показало зменшення протрузії до 3.1 мм (резорбція грижі).',
    duration: '3 місяці',
    image: '/images/rehab.jpg'
  },
  {
    id: 'case-neck',
    title: 'Лікування хронічного головного болю',
    badge: '6 сесій',
    patient: 'Дмитро, 29 років, веб-розробник',
    symptoms: 'Часті головні болі напруги, скутість у шиї, відчуття важкості у плечах наприкінці робочого дня та оніміння кінчиків пальців.',
    diagnose: 'Цервікокраніалгія, синдром комп’ютерної шиї (forward head posture).',
    therapy: 'Міофасціальний масаж шийно-комірцевої зони, постізометрична релаксація м’язів шиї, вправи на зміцнення глибоких згиначів шиї.',
    result: 'Головні болі припинилися повністю після 3-ї сесії. Постава помітно покращилася, оніміння пальців зникло. Отримано комплекс домашніх вправ для профілактики.',
    duration: '1 місяць',
    image: '/images/yoga_service.jpg'
  }
];

const SERVICE_OPTIONS = [
  'Лікувальний масаж',
  'Тайський масаж',
  'Реабілітаційна сесія',
  'Заняття з йоги',
  'Консультація',
  'Курс / навчання',
  'Подарунковий сертифікат',
  'Інше',
];

interface Props {
  /** true - компонент рендериться всередині акордеону на головній. */
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

  // States for expanded items
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setExpandedService(expandedService === id ? null : id);
  };

  const toggleCase = (id: string) => {
    setExpandedCase(expandedCase === id ? null : id);
  };

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

  const handleBook = (serviceName: string) => {
    setService(serviceName);
    const el = document.getElementById('book');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const Wrapper: any = embedded ? 'div' : 'main';
  return (
    <Wrapper className={embedded ? '' : 'mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16'}>
      {!embedded && (
        <div className="text-center">
          <span className="eyebrow">Послуги</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Послуги та курси</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Оберіть напрямок відновлення або навчання.</p>
        </div>
      )}

      {/* --- Services Grid --- */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {servicesData.map((s, i) => {
          const Icon = s.icon;
          const isOpen = expandedService === s.id;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass overflow-hidden rounded-3xl border border-white/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-100"
            >
              {/* Card Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={s.image}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-extrabold text-emerald-800 shadow backdrop-blur-sm">
                  <Icon className="h-3.5 w-3.5" />
                  {s.id === 'massage' && 'Масаж'}
                  {s.id === 'rehab' && 'Реабілітація'}
                  {s.id === 'yoga' && 'Йога'}
                  {s.id === 'education' && 'Навчання'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.shortDesc}</p>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-slate-100/60 mt-4 space-y-4">
                        <p className="text-sm leading-relaxed text-slate-600">{s.fullDesc}</p>
                        
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Напрямки та методики:</span>
                          <ul className="space-y-3">
                            {s.methods.map((method) => (
                              <li key={method.name} className="flex items-start gap-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <div>
                                  <span className="block text-sm font-bold text-slate-800">{method.name}</span>
                                  <span className="block text-xs text-slate-500 leading-normal mt-0.5">{method.desc}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => handleBook(s.title)}
                          className="w-full mt-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100/80"
                        >
                          Записатися на цей напрямок
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Row */}
                <div className="mt-5 pt-4 border-t border-slate-100/60 flex items-center justify-between">
                  <button
                    onClick={() => toggleService(s.id)}
                    className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    {isOpen ? 'Згорнути' : 'Докладніше'}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* --- Practice Cases Section --- */}
      <div className="mt-16 border-t border-slate-100 pt-16">
        <div className="text-center">
          <span className="eyebrow">Результати</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Випадки з практики</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Реальні приклади відновлення здоров'я, усунення болю та покращення постави моїх клієнтів.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {casesData.map((c, i) => {
            const isOpen = expandedCase === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass overflow-hidden rounded-3xl border border-white/60 shadow-sm transition-all hover:shadow-md hover:border-emerald-100"
              >
                {/* Case Header / Summary */}
                <button
                  onClick={() => toggleCase(c.id)}
                  className="w-full p-5 sm:p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="hidden sm:grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
                          {c.badge}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">Тривалість: {c.duration}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{c.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{c.patient}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto text-sm font-bold text-emerald-700">
                    <span>{isOpen ? 'Згорнути' : 'Читати історію'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Case Expandable Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="case-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 sm:px-6 border-t border-slate-100/60 pt-5">
                        <div className="grid gap-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
                          {/* Case Image / Zoom Image */}
                          <div>
                            <ZoomImage
                              src={c.image}
                              alt={c.title}
                              caption="Огляд процесу відновлення"
                              ratio="aspect-[4/3] sm:aspect-[3/4]"
                            />
                          </div>

                          {/* Case Text Details */}
                          <div className="space-y-4">
                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Скарги та симптоми:</span>
                              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.symptoms}</p>
                            </div>

                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Попередній діагноз:</span>
                              <p className="mt-1 text-sm font-bold text-slate-800 leading-relaxed">{c.diagnose}</p>
                            </div>

                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Методи лікування та реабілітації:</span>
                              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.therapy}</p>
                            </div>

                            <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100/40">
                              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">Результат терапії:</span>
                              <p className="mt-1 text-sm text-emerald-950 font-medium leading-relaxed">{c.result}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* --- Booking Form --- */}
      <motion.div
        id="book"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        className="card-glow mx-auto mt-16 max-w-xl rounded-3xl p-7 ring-1 ring-white/60"
      >
        <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-slate-900">
          <CalendarCheck className="h-6 w-6 text-emerald-600" /> Запис на сесію
        </h2>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </span>
            <p className="text-lg font-bold text-slate-900">Дякуємо! Заявку отримано.</p>
            <p className="text-sm text-slate-500">Я зв'яжуся з вами найближчим часом для узгодження деталей.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="booking-name" className="sr-only">Ваше ім'я</label>
              <input
                id="booking-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше ім'я"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="booking-phone" className="sr-only">Телефон</label>
              <input
                id="booking-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
                inputMode="tel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="booking-service" className="sr-only">Оберіть послугу</label>
              <select
                id="booking-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              >
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="booking-note" className="sr-only">Коментар</label>
              <textarea
                id="booking-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Коментар (необов'язково)"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
            {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="shine w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Відправляю…' : 'Записатися'}
            </button>
          </div>
        )}
      </motion.div>
    </Wrapper>
  );
};

export default Services;
