import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface Props extends HTMLMotionProps<'div'> {
  /** Затримка появи (для каскаду), у секундах. */
  delay?: number;
  /** Напрямок зсуву під час появи. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Наскільки елемент має з'явитись у в'юпорті, щоб запуститись (0..1). */
  amount?: number;
}

const offset = {
  up: { y: 22, x: 0 },
  down: { y: -22, x: 0 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Єдина «преміум» поява для всіх секцій: м'який fade + зсув,
 * запускається один раз, плавний easeOut без різких ривків.
 */
const Reveal: React.FC<Props> = ({ children, delay = 0, direction = 'up', amount = 0.2, ...rest }) => {
  const o = offset[direction];
  return (
    <motion.div
      initial={{ opacity: 0, ...o }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
