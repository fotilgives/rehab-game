import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserRound, LogIn } from 'lucide-react';
import type { Account } from '../hooks/useAccount';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

const AuthModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [nick, setNick] = useState('');
  const [refCode, setRefCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Бонуси реферала з адмінки (rps_config). Дефолти — поки не підвантажено.
  const [newBonus, setNewBonus] = useState(100);
  const [inviterBonus, setInviterBonus] = useState(100);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('rps_config').select('data').eq('id', 1).single();
      const cfg = (data as { data?: Record<string, number> } | null)?.data || {};
      const nb = Number(cfg.referral_new_bonus);
      const ib = Number(cfg.referral_inviter_bonus);
      if (Number.isFinite(nb) && nb >= 0) setNewBonus(Math.floor(nb));
      if (Number.isFinite(ib) && ib >= 0) setInviterBonus(Math.floor(ib));
    })();
  }, [open]);

  // Автозаповнення коду запрошення з ?ref=<uuid> у лінку; перемикаємо на реєстрацію.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setRefCode(ref);
      setMode('signup');
    }
  }, [open]);

  const submit = async () => {
    setErr(null);
    if (mode === 'signup' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login.trim())) {
      setErr('Вкажіть коректну пошту (email)');
      return;
    }
    if (password.length < 4) {
      setErr('Пароль — мінімум 4 символи');
      return;
    }
    setBusy(true);
    const e =
      mode === 'login'
        ? await account.login(login, password, rememberMe)
        : await account.signup(login, password, nick, rememberMe, refCode);
    setBusy(false);
    if (e) setErr(e);
    else {
      setLogin('');
      setPassword('');
      setNick('');
      setRefCode('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {mode === 'login' ? 'Вхід' : 'Реєстрація'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Акаунт зберігає баланс на будь-якому пристрої
                </p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {mode === 'signup' && (
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value.slice(0, 20))}
                  placeholder="Імʼя у грі (необовʼязково)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              )}
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={mode === 'signup' ? 'Пошта (email)' : 'Пошта (email)'}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Пароль"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
              {mode === 'signup' && (
                <div>
                  <input
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="Код запрошення (необовʼязково)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                  />
                  <p className="mt-1 px-1 text-xs text-emerald-700">
                    {newBonus === inviterBonus
                      ? `🎁 Код друга = +${newBonus} монет тобі й другу`
                      : `🎁 Код друга = +${newBonus} монет тобі, +${inviterBonus} другу`}
                  </p>
                </div>
              )}
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span className="text-sm text-slate-600">Запамʼятати мене</span>
            </label>

            {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              disabled={busy || !login || !password}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              {busy ? 'Зачекай…' : mode === 'login' ? 'Увійти' : 'Створити акаунт'}
            </motion.button>

            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErr(null);
              }}
              className="mt-4 w-full text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              {mode === 'login' ? 'Немає акаунта? Зареєструватися' : 'Вже маєш акаунт? Увійти'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
