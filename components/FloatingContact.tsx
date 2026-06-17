import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User } from 'lucide-react';

interface FormState {
  name: string;
  question: string;
}

const contacts = [
  {
    label: 'Telegram',
    emoji: '✈️',
    href: 'https://t.me/your_handle',
    bg: 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100',
  },
  {
    label: 'Viber',
    emoji: '📱',
    href: 'viber://chat?number=%2B380XXXXXXXXX',
    bg: 'bg-violet-50 text-violet-700 ring-violet-200 hover:bg-violet-100',
  },
  {
    label: 'Телефон',
    emoji: '📞',
    href: 'tel:+380XXXXXXXXX',
    bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  },
];

const FloatingContact: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', question: '' });

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', question: '' });
      setOpen(false);
    }, 3200);
  };

  return createPortal(
    <>
      {/* ── Floating button ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        aria-label={open ? 'Закрити' : 'Задати питання'}
        className="fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-400/40 ring-4 ring-emerald-100 transition hover:bg-emerald-700"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-emerald-400"
            animate={{ scale: [1, 1.45, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Label bubble */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="fixed bottom-8 right-24 z-50 pointer-events-none"
          >
            <div className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-white/60 shadow-md whitespace-nowrap">
              💬 Задати питання
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Popup card ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm"
            style={{ transformOrigin: 'bottom right' }}
          >
            <div className="glass overflow-hidden rounded-3xl ring-1 ring-white/70 shadow-2xl shadow-slate-900/12">

              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 ring-1 ring-white/30">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Задати питання</div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-100">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      Відповімо протягом години
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {sent ? (
                  /* ── Success state ── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-4 text-center"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-3xl">
                      ✅
                    </div>
                    <p className="text-base font-bold text-slate-900">Дякуємо!</p>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Ваше питання отримано. Зв'яжемося з вами найближчим часом.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Quick contact links */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {contacts.map((c) => (
                        <a
                          key={c.label}
                          href={c.href}
                          className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center ring-1 transition ${c.bg}`}
                        >
                          <span className="text-xl">{c.emoji}</span>
                          <span className="text-[11px] font-semibold">{c.label}</span>
                        </a>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        або напишіть тут
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-2.5">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Ваше ім'я"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <textarea
                        placeholder="Ваше питання..."
                        value={form.question}
                        onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                        required
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Надіслати питання
                      </motion.button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default FloatingContact;
