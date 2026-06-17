import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserRound, LogIn } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

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
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const e =
      mode === 'login'
        ? await account.login(login, password)
        : await account.signup(login, password, nick);
    setBusy(false);
    if (e) setErr(e);
    else {
      setLogin('');
      setPassword('');
      setNick('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
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
                placeholder="Логін"
                autoCapitalize="none"
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
            </div>

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
