import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, CalendarCheck } from 'lucide-react';
import { goToBooking } from '../hooks/useRoute';

interface Item {
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  /** Відео або фото. */
  type: 'video' | 'image';
  src: string;
  poster?: string;
}

const ITEMS: Item[] = [
  {
    tag: 'Апаратне лікування',
    title: 'Електровакуумна терапія',
    type: 'video',
    src: '/media/electro_showcase.mp4',
    poster: '/images/electro.jpg',
    desc: 'Сучасний апарат поєднує вакуумний вплив та електростимуляцію: покращує кровообіг, активізує обмінні процеси та знімає м’язове напруження. Інтенсивність підбирається індивідуально під стан кожного пацієнта.',
    bullets: [
      'М’язове перенапруження та спазми',
      'Біль у спині, шиї та суглобах',
      'Відновлення після навантажень',
      'Покращення мікроциркуляції тканин',
    ],
  },
  {
    tag: 'Дитячий розвиток',
    title: 'Дитяча йога з нейровправами',
    type: 'video',
    src: '/media/neuro_showcase.mp4',
    poster: '/images/neuro.jpg',
    desc: 'Ігрові заняття поєднують м’які тілесні вправи, баланс та нейрогімнастику. Дитина зміцнює тіло, розвиває координацію й увагу та вчиться краще керувати своїм рухом — і все це у форматі гри.',
    bullets: [
      'Координація та рівновага',
      'Концентрація і стійкість уваги',
      'Сила м’язів та правильна постава',
      'Пам’ять, мовлення та сприйняття',
    ],
  },
  {
    tag: 'Логопедія',
    title: 'Дитячий логопед-дефектолог',
    type: 'video',
    src: '/media/speech_showcase.mp4',
    poster: '/images/speech_therapy.jpg',
    desc: 'Заняття у м’якій ігровій формі допомагають дитині подолати труднощі мовлення, поставить звуки та підготуватися до школи. Вправи розвивають артикуляцію, дрібну моторику, слух, пам’ять та увагу.',
    bullets: [
      'Затримка мовленнєвого розвитку',
      'Порушення звуковимови',
      'Підготовка до школи',
      'Розвиток уваги та сприйняття',
    ],
  },
  {
    tag: 'Психологія',
    title: 'Дитячий психолог',
    type: 'video',
    src: '/media/psych_showcase.mp4',
    poster: '/images/psychology.jpg',
    desc: 'М’яка та безпечна підтримка через ігрову терапію, творчі практики й роботу з емоціями. Простір, де дитину чують і розуміють, допомагає їй рости спокійною, відкритою та емоційно стійкою.',
    bullets: [
      'Тривожність та страхи',
      'Складні етапи розвитку й адаптації',
      'Спілкування з однолітками',
      'Самооцінка та впевненість',
    ],
  },
];

const MediaBlock: React.FC<{ item: Item }> = ({ item }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  // Оптимізація для телефона: відео завантажується та програється лише коли
  // потрапляє у видиму область, і ставиться на паузу, коли зникає з екрана.
  useEffect(() => {
    if (item.type !== 'video') return;
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [item.type]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="w-full">
      <div className="group relative aspect-[9/16] overflow-hidden rounded-[1.5rem] bg-slate-900 shadow-md ring-1 ring-black/5">
        {item.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={item.src}
              poster={item.poster}
              onClick={toggle}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              className="h-full w-full cursor-pointer object-cover"
              muted
              loop
              playsInline
              preload="auto"
            />
            {/* Кнопка play, поки відео на паузі */}
            <button
              type="button"
              onClick={toggle}
              aria-label={paused ? 'Відтворити' : 'Пауза'}
              className={`absolute inset-0 grid place-items-center bg-slate-950/15 transition-opacity duration-300 ${
                paused ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-emerald-700 shadow-lg ring-1 ring-white/70">
                <Play className="h-6 w-6 translate-x-0.5 fill-emerald-700" />
              </span>
            </button>
          </>
        ) : (
          <img src={item.src} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        )}
        {item.type === 'video' && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <Play className="h-3 w-3 fill-white" /> Реальне відео
          </span>
        )}
      </div>
    </div>
  );
};

const MediaShowcase: React.FC = () => {
  return (
    <section id="showcase" className="mx-auto max-w-5xl px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="eyebrow">Як проходять заняття</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Наші кабінети та напрямки
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Реальні відео процесів у нашому центрі — подивіться, як виглядають заняття та процедури
          наживо. Відео вмикаються автоматично, натисніть для паузи.
        </p>
      </motion.div>

      <div className="mt-12 space-y-14 sm:space-y-20">
        {ITEMS.map((item, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              {/* Media */}
              <div className={reverse ? 'lg:order-2' : 'lg:order-1'}>
                <div className="mx-auto w-full max-w-[300px] sm:max-w-[340px]">
                  <MediaBlock item={item} />
                </div>
              </div>

              {/* Text */}
              <div className={reverse ? 'lg:order-1' : 'lg:order-2'}>
                <span className="eyebrow">{item.tag}</span>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goToBooking}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  <CalendarCheck className="h-4 w-4" /> Записатися
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default MediaShowcase;
