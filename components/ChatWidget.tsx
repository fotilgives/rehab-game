import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

interface Msg {
  from: 'bot' | 'me';
  text: string;
}

const QUICK = ['Як поповнити баланс?', 'Як грати?', 'Куди йдуть донати?', 'Записатися на консультацію'];

function reply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('поповн') || t.includes('баланс') || t.includes('гро'))
    return 'Натисніть «Поповнити» вгорі сторінки та оберіть пакет монет. У демо-режимі монети нараховуються миттєво.';
  if (t.includes('грат') || t.includes('гра') || t.includes('камін'))
    return 'Оберіть ставку, потім свій хід — камінь, ножиці або папір. За перемогу ставка подвоюється 🙂';
  if (t.includes('донат') || t.includes('підтрим'))
    return 'Донати — це підтримка роботи реабілітолога. Ви можете задонатити монети у розділі «Підтримати».';
  if (t.includes('консультац') || t.includes('запис') || t.includes('реабіліт'))
    return 'Чудово! Залиште, будь ласка, своє імʼя та зручний час — і спеціаліст звʼяжеться з вами.';
  return 'Дякую за повідомлення! Реабілітолог відповість найближчим часом. А поки можете зіграти 😉';
}

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Вітаю! 👋 Я помічник реабілітолога. Чим можу допомогти?' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMsgs((m) => [...m, { from: 'me', text: trimmed }]);
    setInput('');
    window.setTimeout(() => {
      setMsgs((m) => [...m, { from: 'bot', text: reply(trimmed) }]);
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-300/50 transition hover:bg-emerald-700"
        aria-label="Чат"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="bg-emerald-600 px-5 py-4 text-white">
              <div className="font-bold">Чат із реабілітологом</div>
              <div className="text-xs text-emerald-100">Зазвичай відповідає швидко</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.from === 'me'
                        ? 'rounded-br-sm bg-emerald-600 text-white'
                        : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-100'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {msgs.length <= 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишіть повідомлення…"
                className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
