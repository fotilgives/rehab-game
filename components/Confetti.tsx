import React from 'react';
import { motion } from 'framer-motion';

const RIBBONS = ['#10b981', '#34d399', '#14b8a6', '#fbbf24', '#f59e0b'];

/** Святковий вибух поверх контейнера (родич: position: relative + overflow-hidden). */
const Confetti: React.FC<{ count?: number }> = ({ count = 30 }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* стрічки в кольорах сайту */}
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.3 + Math.random() * 0.9;
        const w = 5 + Math.random() * 6;
        const drift = (Math.random() - 0.5) * 70;
        return (
          <motion.span
            key={`r${i}`}
            className="absolute top-0 rounded-full"
            style={{ left: `${left}%`, width: w, height: w * 2.4, background: RIBBONS[i % RIBBONS.length], opacity: 0.9 }}
            initial={{ y: -28, x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: '140%', x: drift, opacity: [0, 1, 1, 0], rotate: Math.random() * 720 - 360 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
          />
        );
      })}

      {/* золоті монети, що злітають */}
      {Array.from({ length: 10 }).map((_, i) => {
        const left = 8 + Math.random() * 84;
        const delay = Math.random() * 0.25;
        const size = 16 + Math.random() * 12;
        return (
          <motion.span
            key={`coin${i}`}
            className="absolute"
            style={{ left: `${left}%`, bottom: '18%', width: size, height: size }}
            initial={{ y: 16, opacity: 0, scale: 0.5 }}
            animate={{ y: -70 - Math.random() * 60, opacity: [0, 1, 1, 0], scale: 1, rotateY: [0, 180, 360] }}
            transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: 'easeOut' }}
          >
            <span
              className="block h-full w-full rounded-full"
              style={{
                background: 'radial-gradient(circle at 32% 28%, #fff6c9 0%, #fbbf24 42%, #d97706 100%)',
                boxShadow: 'inset 0 0 0 2px rgba(217,119,6,0.55), 0 1px 3px rgba(180,83,9,0.4)',
              }}
            />
          </motion.span>
        );
      })}

      {/* теплий спалах у центрі */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 130, height: 130, background: 'radial-gradient(circle, rgba(251,191,36,0.4), transparent 70%)' }}
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 2.3, opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  );
};

export default Confetti;
