import React from 'react';
import { motion } from 'framer-motion';

/**
 * Анімований фон сайту: плавно «дихаючі» кольорові плями.
 * Анімуємо лише transform (translate) -> дешево для GPU й плавно навіть на телефоні.
 */
const orbs = [
  { c: 'bg-emerald-300/25', s: 'left-[-12%] top-[-10%] h-[440px] w-[440px]', x: [0, 50, 0], y: [0, 30, 0], d: 22 },
  { c: 'bg-teal-300/20', s: 'right-[-12%] top-[12%] h-[400px] w-[400px]', x: [0, -40, 0], y: [0, 50, 0], d: 26 },
  { c: 'bg-amber-200/25', s: 'bottom-[-8%] left-[18%] h-[380px] w-[380px]', x: [0, 36, 0], y: [0, -30, 0], d: 24 },
];

const Background: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-50">
      <div className="bg-grid absolute inset-0" />
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[90px] ${o.c} ${o.s}`}
          style={{ willChange: 'transform' }}
          animate={{ x: o.x, y: o.y }}
          transition={{ duration: o.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

export default Background;
