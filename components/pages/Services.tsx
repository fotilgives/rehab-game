import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Check, ArrowRight, X, Play, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SmartImage from '../SmartImage';
import PriceList from '../PriceList';
import MediaShowcase from '../MediaShowcase';

const SPECIALISTS = ['Володимир Мальцев', 'Інший спеціаліст'] as const;

interface ServiceItem {
  title: string;
  category?: string;
  image: string;
  /** Коротке відео процесу (необов'язково) — показується у вікні «Докладніше». */
  video?: string;
  /** Постер для відео (інакше береться image). */
  poster?: string;
  short: string;
  details: string;
  cases: string[];
  /** Заголовок над списком показань/напрямків. */
  casesTitle?: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    title: 'Східний (тайський) масаж',
    image: '/images/consultation.jpg',
    short: 'Традиційний тайський масаж: розтяжка, акупресура та відновлення енергетичного балансу тіла.',
    details: 'Тайський масаж поєднує глибокий тиск на біологічно активні точки, пасивну йогу та ритмічні розтяжки. Сеанс покращує кровообіг, знімає м’язові блоки, відновлює гнучкість та заряджає енергією на кілька днів вперед.',
    cases: [
      'Хронічна втома та зниження тонусу тіла',
      'М’язові затиски у спині, шиї та плечах',
      'Порушення постави та обмежена рухливість',
      'Стрес та емоційне перевантаження'
    ]
  },
  {
    title: 'Оздоровчий масаж',
    image: '/images/massage.jpg',
    short: 'Зняття м’язового тонусу, покращення кровообігу та лімфотоку, зменшення больових симптомів.',
    details: 'Сеанси оздоровчого масажу проводяться за індивідуальними показаннями, допомагають розслабити перевантажені ділянки тіла, покращити лімфоток та підготувати м’язи до активних занять.',
    cases: [
      'М’язові затиски, спазми та біль у спині/шиї',
      'Набряки кінцівок при обмеженому русі',
      'Атрофія м’язів внаслідок гіподинамії',
      'Загальна втома та слабкість м’язового корсета'
    ]
  },
  {
    title: 'Фізична реабілітація',
    image: '/images/physical_therapy.jpg',
    short: 'Відновлення рухових функцій, сили та балансу після травм і тривалого лікування.',
    details: 'Програма фізичної реабілітації поєднує лікувальну фізкультуру, мануальні та сучасні методики (DNS, Redcord, фасціальні техніки). Індивідуально підібрані вправи зміцнюють м’язи, покращують координацію та повертають природний обсяг рухів у суглобах.',
    cases: [
      'Слабкість м’язів після операцій та тривалого лікування',
      'Порушення координації рухів та балансу тіла',
      'Реабілітація після травм хребта та суглобів',
      'Профілактика болю у спині при сидячому способі життя'
    ]
  },
  {
    title: 'Йога та тілесні практики',
    image: '/images/yoga.jpg',
    short: 'Адаптивна йога та тілесні практики для гнучкості, балансу та свободи руху тіла.',
    details: 'Заняття поєднують елементи терапевтичної йоги та тілесних практик: індивідуально підібрані асани зміцнюють глибокі м’язи, покращують координацію, гнучкість і відновлюють природний обсяг рухів. Практика підходить для різного рівня підготовки — індивідуально, сімейно або у групі.',
    cases: [
      'Скутість та обмежена рухливість тіла',
      'Біль у спині при сидячому способі життя',
      'Слабкість глибоких м’язів та порушення постави',
      'Потреба у відновленні гнучкості та балансу'
    ]
  },
  {
    title: 'Електровакуумна терапія',
    image: '/images/electro.jpg',
    video: '/media/electro_service.mp4',
    short: 'Поєднання вакуумного впливу та електростимуляції для кровообігу, зняття напруження й відновлення тканин.',
    details: 'У нашому центрі проводяться фізіотерапевтичні процедури з використанням апарату електровакуумної терапії — сучасного методу впливу на м’язи, суглоби та м’які тканини. Метод поєднує вакуумний вплив і електростимуляцію, завдяки чому покращується місцевий кровообіг, активізуються обмінні процеси та зменшується м’язове напруження. Спеціальні насадки створюють контрольований вакуумний вплив у поєднанні з електричними імпульсами, а інтенсивність підбирається індивідуально. Наша мета — не просто тимчасове полегшення, а комплексна підтримка рухливості, комфорту та відновлення організму.',
    casesTitle: 'Може застосовуватися:',
    cases: [
      'При м’язовому перенапруженні та спазмах',
      'При болях у спині, шиї та суглобах',
      'У програмах відновлення після фізичних навантажень',
      'Для покращення мікроциркуляції та живлення тканин',
      'Як доповнення до масажу, реабілітації та фізіотерапії'
    ]
  },
  {
    title: 'Дитяча йога з нейровправами',
    image: '/images/neuro.jpg',
    video: '/media/neuro.mp4',
    short: 'Ігрові заняття для розвитку координації, рівноваги, уваги та впевненого руху дитини.',
    details: 'Дитяча йога з нейровправами поєднує м’які тілесні вправи, ігри на баланс та нейрогімнастику. Такі заняття розвивають координацію рухів, рівновагу та концентрацію уваги, покращують пам’ять і мовлення. Усе проходить у формі гри, тож дитина займається із задоволенням, зміцнює тіло та вчиться краще керувати своїм рухом і емоціями.',
    casesTitle: 'Що розвиваємо:',
    cases: [
      'Координацію рухів та рівновагу',
      'Концентрацію та стійкість уваги',
      'Силу м’язів та правильну поставу',
      'Пам’ять, мовлення та сприйняття',
      'Уміння керувати тілом та емоціями'
    ]
  },
  {
    title: 'Дитячий логопед-дефектолог',
    image: '/images/speech_therapy.jpg',
    video: '/media/speech.mp4',
    poster: '/images/speech_poster.jpg',
    short: 'Розвиток мовлення, корекція звуковимови та підготовка до школи у м’якій ігровій формі.',
    details: 'Мовлення — це не лише правильна вимова звуків. Через мову дитина вчиться висловлювати думки, розуміти інших, спілкуватися та впевнено взаємодіяти зі світом. Дитячий логопед-дефектолог допомагає подолати труднощі мовленнєвого та психомовленнєвого розвитку, розвиває навички спілкування, увагу, мислення та мовне сприйняття. Заняття проходять у м’якій ігровій формі з урахуванням віку та особливостей дитини: вправи на мовлення, артикуляцію, дрібну моторику, слухове сприйняття, пам’ять та увагу. Важлива частина роботи — співпраця з батьками, адже підтримка вдома значно підсилює результат занять.',
    casesTitle: 'З чим ми працюємо:',
    cases: [
      'Затримка мовленнєвого розвитку',
      'Порушення звуковимови',
      'Труднощі з формуванням слів і речень',
      'Нерозбірливе мовлення',
      'Проблеми з читанням і письмом',
      'Труднощі концентрації та сприйняття інформації',
      'Розвиток мовлення у дітей з особливостями розвитку',
      'Підготовка до школи та комунікативні навички'
    ]
  },
  {
    title: 'Дитячий психолог',
    image: '/images/psych_card.jpg',
    video: '/media/psych.mp4',
    poster: '/images/psych_poster.jpg',
    short: 'М’яка підтримка дитини через ігрову терапію, творчі практики та роботу з емоціями.',
    details: 'Дитинство — це період, коли формується характер, самооцінка, відчуття безпеки та довіри до світу. Робота дитячого психолога допомагає дитині м’яко пройти складні етапи розвитку, навчитися виражати свої почуття та будувати здоровий контакт із собою та оточенням. Використовуються лише м’які та безпечні методи: ігрова терапія, бесіда, творчі практики, вправи на емоційне усвідомлення. Для дитини це не «лікування», а простір, де її чують, розуміють і підтримують. Важлива частина роботи — взаємодія з батьками. Наша мета — допомогти дитині рости спокійною, відкритою, впевненою та емоційно стійкою.',
    casesTitle: 'Допомагаємо при:',
    cases: [
      'Труднощах у вираженні емоцій та почуттів',
      'Підвищеній тривожності та страхах',
      'Складних етапах розвитку та адаптації',
      'Проблемах у спілкуванні з однолітками',
      'Зниженій самооцінці та невпевненості',
      'Потребі підтримки батьків у вихованні'
    ]
  }
];

const SERVICE_OPTIONS = [
  'Східний (тайський) масаж',
  'Оздоровчий масаж',
  'Фізична реабілітація',
  'Йога та тілесні практики',
  'Електровакуумна терапія',
  'Дитяча йога з нейровправами',
  'Дитячий логопед-дефектолог',
  'Дитячий психолог',
  'Інше / Комплексна програма'
];

const CAT: Record<string, string> = {
  'Східний (тайський) масаж': 'Масаж',
  'Оздоровчий масаж': 'Масаж',
  'Фізична реабілітація': 'Реабілітація',
  'Йога та тілесні практики': 'Йога',
  'Електровакуумна терапія': 'Апарат',
  'Дитяча йога з нейровправами': 'Діти',
  'Дитячий логопед-дефектолог': 'Логопедія',
  'Дитячий психолог': 'Психологія',
};

interface Props {
  embedded?: boolean;
}

const Services: React.FC<Props> = ({ embedded = false }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [specialist, setSpecialist] = useState<string>(SPECIALISTS[0]);
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preferredDates = React.useMemo(() => {
    const daysUk = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthsUk = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
    const list: string[] = ['Найближчий вільний день (узгодити)'];
    const now = new Date();
    for (let i = 0; i < 14 && list.length < 8; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      if (d.getDay() !== 0) {
        list.push(`${daysUk[d.getDay()]}, ${d.getDate()} ${monthsUk[d.getMonth()]}`);
      }
    }
    return list;
  }, []);

  // Selected service for detail modal
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Послуги з бази (редагуються в адмінці); фолбек — SERVICES_DATA.
  const [services, setServices] = useState<ServiceItem[]>(SERVICES_DATA);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('rps_services_list');
      const rows = (data as Array<Record<string, unknown>> | null) || [];
      if (error || rows.length === 0) return;
      setServices(rows.map((r) => ({
        title: String(r.title || ''),
        category: (r.category as string) || undefined,
        image: (r.image_url as string) || '',
        video: (r.video_url as string) || undefined,
        poster: (r.poster_url as string) || undefined,
        short: (r.short as string) || '',
        details: (r.details as string) || '',
        casesTitle: (r.cases_title as string) || undefined,
        cases: String(r.cases || '').split('\n').map((c) => c.trim()).filter(Boolean),
      })));
    })();
  }, []);

  // Якщо прийшли сюди через кнопку «Записатися» — плавно прокрутити до форми.
  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem('rps_scroll_book') === '1';
      if (flagged) sessionStorage.removeItem('rps_scroll_book');
    } catch {
      /* ignore */
    }
    if (flagged) {
      const t = setTimeout(() => {
        document.getElementById('book-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
      return () => clearTimeout(t);
    }
  }, []);

  const submit = async () => {
    setErr(null);
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setErr("Вкажіть ім'я та телефон");
      return;
    }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErr('Вкажіть коректний e-mail або залиште поле порожнім');
      return;
    }
    setBusy(true);
    const dateChoice = preferredDate || preferredDates[0];
    const fullNote = `Спеціаліст: ${specialist}\nБажана дата: ${dateChoice}${note.trim() ? `\nКоментар: ${note.trim()}` : ''}`;
    const { error } = await supabase.rpc('rps_book', {
      p_name: name,
      p_phone: phone,
      p_service: service,
      p_note: fullNote,
      p_email: email.trim() || null,
    });
    setBusy(false);
    if (error) { setErr('Не вдалося відправити. Спробуйте ще раз.'); return; }
    setDone(true);
    // Лист-підтвердження клієнту + сповіщення власнику (fire-and-forget).
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking', name, phone, email: email.trim(), service, date: dateChoice, note: fullNote }),
    }).catch(() => {});
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
          <span className="eyebrow">Наші послуги</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Послуги та напрямки</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 text-sm">Оберіть напрямок реабілітації або одразу залиште заявку — підберемо програму під вас.</p>
          <button
            onClick={() => document.getElementById('book-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="shine mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <CalendarCheck className="h-5 w-5" /> Записатися на прийом
          </button>
        </div>
      )}

      {/* Преміум-сітка послуг — image-forward картки */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {services.map((item, idx) => (
          <motion.button
            key={item.title}
            onClick={() => setSelectedService(item)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -20px 0px' }}
            transition={{ duration: 0.45, delay: idx * 0.05 }}
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl text-left shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 hover:ring-emerald-300"
          >
            <SmartImage
              src={item.image}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              fallback={
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-100 to-teal-50 text-slate-400">
                  📷
                </div>
              }
            />
            {/* Затемнення знизу для читабельності */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/30 to-transparent" />

            {/* Категорія + бейдж відео */}
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur">
              {item.category || CAT[item.title]}
            </span>
            {item.video && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur">
                <Play className="h-3 w-3 fill-white" /> Відео
              </span>
            )}

            {/* Текст */}
            <div className="relative z-10 p-3 sm:p-4">
              <h3 className="text-[13px] font-extrabold leading-tight text-white drop-shadow-sm sm:text-base">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-white/75 sm:mt-1.5 sm:text-[11px]">{item.short}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 sm:mt-3 sm:text-[11px]">
                Докладніше <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </motion.button>
        ))}

        {/* Картка консультації — на всю ширину */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -20px 0px' }}
          transition={{ duration: 0.45, delay: 8 * 0.05 }}
          onClick={() => {
            const el = document.getElementById('consultation-section') || document.getElementById('book-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="group col-span-2 lg:col-span-1 relative flex flex-row items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-left text-white shadow-md shadow-emerald-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:flex-col lg:aspect-[3/4] lg:justify-between lg:gap-0"
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 lg:h-11 lg:w-11">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div className="relative flex-1">
            <h3 className="text-sm font-extrabold leading-tight sm:text-lg">Безкоштовна консультація</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-50 sm:text-xs">
              Допоможемо розібратися зі станом та скласти покроковий план відновлення.
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              <span>Залишити опис стану</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Відео-підрозділи та прайс — на головній рендеряться окремо, тут лише на сторінці «Послуги» */}
      {!embedded && <MediaShowcase />}
      {!embedded && <PriceList />}

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

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              placeholder="E-mail (надішлемо підтвердження)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={specialist}
              onChange={(e) => setSpecialist(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {SPECIALISTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {preferredDates.map((d) => (
                <option key={d} value={d}>📅 {d}</option>
              ))}
            </select>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Зручний день і час + скарги/побажання (адміністратор підтвердить запис)"
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
            <a
              href="tel:+380638069916"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300"
            >
              <Phone className="h-4 w-4" /> Подзвонити
            </a>
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
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100 md:flex-row"
            >
              {/* Медіа-колонка — медіа показується ПОВНІСТЮ (object-contain),
                  а простір довкола заповнює розмитий фон. Нічого не обрізається. */}
              <div className="relative w-full shrink-0 overflow-hidden bg-slate-950 md:w-[44%]">
                {/* Розмитий фон із того ж кадру */}
                <div
                  aria-hidden
                  className="absolute inset-0 scale-125 bg-cover bg-center opacity-40 blur-2xl"
                  style={{ backgroundImage: `url(${selectedService.poster || selectedService.image})` }}
                />
                <div className="relative h-[46vh] w-full sm:h-[52vh] md:h-full md:min-h-[440px]">
                  {selectedService.video ? (
                    <video
                      key={selectedService.video}
                      src={selectedService.video}
                      poster={selectedService.poster || selectedService.image}
                      className="absolute inset-0 h-full w-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <SmartImage
                      src={selectedService.poster || selectedService.image}
                      alt={selectedService.title}
                      className="absolute inset-0 h-full w-full object-contain"
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">📷</div>
                      }
                    />
                  )}
                </div>
                <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur">
                  {selectedService.category || CAT[selectedService.title] || 'Послуга'}
                </span>
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950/50 text-white backdrop-blur transition hover:bg-slate-950/75 md:hidden"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Контент-колонка */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3 p-6 pb-3">
                  <h3 className="text-xl font-extrabold leading-tight text-slate-900">{selectedService.title}</h3>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:grid"
                    aria-label="Закрити"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6">
                  <p className="text-sm leading-relaxed text-slate-600">{selectedService.details}</p>
                  <div className="mt-6">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {selectedService.casesTitle || 'Показання та випадки лікування:'}
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
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
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
