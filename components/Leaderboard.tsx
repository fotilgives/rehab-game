import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';
import AnimatedNumber from './AnimatedNumber';

interface Row {
  id: string;
  nickname: string;
  balance: number;
  wins: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC<{ account: Account }> = ({ account }) => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('rps_profiles')
        .select('id,nickname,balance,wins')
        .order('balance', { ascending: false })
        .limit(8);
      if (active && data) setRows(data as Row[]);
    };
    load();
    const id = window.setInterval(load, 8000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section id="leaders" className="mx-auto max-w-3xl px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass overflow-hidden rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 ring-1 ring-white/60"
      >
        <span className="eyebrow">Рейтинг</span>
        <h2 className="mt-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-white shadow-lg shadow-amber-200">
            <Trophy className="h-5 w-5" />
          </span>
          Лідери
        </h2>
        <p className="mt-1 text-xs text-slate-500">Топ гравців за балансом · оновлюється автоматично</p>

        <div className="mt-5 space-y-2">
          <AnimatePresence initial={false}>
            {rows.map((r, i) => {
              const isMe = r.id === account.playerId;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white/70 ring-1 ring-slate-100'
                  }`}
                >
                  <div className={`w-7 text-center text-lg font-extrabold ${isMe ? 'text-white' : 'text-slate-400'}`}>
                    {MEDALS[i] ?? i + 1}
                  </div>
                  <div className="min-w-0 flex-1 truncate font-bold">
                    {r.nickname} {isMe && <span className="text-emerald-100">(ти)</span>}
                  </div>
                  <div className={`text-xs ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>🏆 {r.wins}</div>
                  <div className={`flex items-center gap-1 font-extrabold ${isMe ? 'text-white' : 'text-emerald-600'}`}>
                    <Coins className="h-4 w-4" />
                    <AnimatedNumber value={r.balance} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {rows.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Поки що порожньо - зіграй перший раунд!</p>}
        </div>
      </motion.div>
    </section>
  );
};

export default Leaderboard;
