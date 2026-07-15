import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../hooks/useRoute';

interface Review { id: number; nickname: string; rating: number; text: string; }

const goWrite = () => {
  navigate('prizes');
  // після переходу прокручуємо до форми відгуку
  window.setTimeout(() => {
    document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 350);
};

const ReviewsWall: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('rps_reviews')
        .select('id,nickname,rating,text')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(12);
      if (data) setReviews(data as Review[]);
    })();
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-5">
      <div className="text-center">
        <span className="eyebrow">Відгуки</span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-forest-800 sm:text-4xl">Що кажуть учасники</h2>
        <button
          onClick={goWrite}
          className="btn-gold mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
        >
          <PenLine className="h-4 w-4" /> Залишити відгук
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-7 text-center text-sm text-slate-400">Поки що відгуків немає — стань першим! ☺️</p>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              className="card-glow relative rounded-3xl p-5 ring-1 ring-forest-800/5"
            >
              <Quote className="absolute right-4 top-4 h-6 w-6 text-gold-300/50" />
              <div className="flex items-center gap-0.5 text-gold-500">
                {Array.from({ length: r.rating || 0 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-gold-400 text-gold-400" />)}
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-forest-900/70">{r.text}</p>
              <div className="font-display mt-3 text-sm font-semibold italic text-forest-900">— {r.nickname}</div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewsWall;
