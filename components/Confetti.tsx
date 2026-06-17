import React from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa'];

/** Конфеті-вибух поверх контейнера (родич має бути position: relative + overflow-hidden). */
const Confetti: React.FC<{ count?: number }> = ({ count = 32 }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.35;
        const dur = 1.2 + Math.random() * 0.9;
        const size = 6 + Math.random() * 7;
        return (
          <motion.span
            key={i}
            className="absolute top-0 rounded-[2px]"
            style={{ left: `${left}%`, width: size, height: size * 1.5, background: COLORS[i % COLORS.length] }}
            initial={{ y: -24, opacity: 0, rotate: 0 }}
            animate={{ y: '130%', opacity: [0, 1, 1, 0], rotate: Math.random() * 720 - 360 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
};

export default Confetti;
