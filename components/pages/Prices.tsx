import React from 'react';
import { motion } from 'framer-motion';
import PriceList from '../PriceList';
import YogaCourseCard from '../YogaCourseCard';
import type { Account } from '../../hooks/useAccount';

const Prices: React.FC<{ account: Account }> = ({ account }) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-5 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Вартість послуг
        </h1>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
          Прозорі ціни на всі види масажу та реабілітації. Інвестуйте у своє здоров'я та комфорт.
        </p>
      </motion.div>

      <YogaCourseCard account={account} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PriceList />
      </motion.div>
    </div>
  );
};

export default Prices;
