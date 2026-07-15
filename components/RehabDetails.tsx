import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Consultation Form Steps ─────────────────────────────────────────────────
const RehabDetails: React.FC = () => {
  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleNext = () => {
    if (condition.trim().length < 5) {
      setErr('Будь ласка, опишіть детальніше (мінімум 5 символів)');
      return;
    }
    setErr(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setErr("Вкажіть коректне ім'я та номер телефону");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc('rps_book', {
        p_name: name,
        p_phone: phone,
        p_service: 'Безкоштовна консультація',
        p_note: `Стан: ${condition}`,
      });
      if (error) throw error;
      setStep(3);
    } catch {
      setErr('Не вдалося надіслати. Спробуйте пізніше або зателефонуйте нам.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-20 py-8">

      {/* ── SECTION: Multi-step Consultation Form ─────────────────── */}
      <motion.section
        id="consultation-section"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-lg px-5"
      >
        <div className="card-glow rounded-3xl p-6 ring-1 ring-white/60 shadow-xl sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <span className="eyebrow mb-3 inline-block">Безкоштовно</span>
            <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Консультація реабілітолога
            </h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Опишіть стан пацієнта — підберемо індивідуальну програму відновлення.
            </p>
          </div>

          {/* Step indicator */}
          {step < 3 && (
            <div className="mb-5 flex items-center gap-2">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`h-px flex-1 transition-colors ${step > s ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <textarea
                  placeholder="Наприклад: вік 55 р., переніс інсульт 3 місяці тому, права рука погано рухається, є порушення мовлення..."
                  rows={5}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
                <button
                  onClick={handleNext}
                  className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Далі <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text" placeholder="Ваше ім'я" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="tel" placeholder="+380..." required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setErr(null); setStep(1); }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      Назад
                    </button>
                    <button type="submit" disabled={busy}
                      className="shine flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
                      {busy ? 'Надсилаємо...' : <><Send className="h-4 w-4" /> Надіслати</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3 — Success */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-8 w-8" />
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">Заявку отримано!</h4>
                <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                  Наш спеціаліст ознайомиться з описом та зв'яжеться з вами протягом робочого дня.
                </p>
                <button onClick={() => { setStep(1); setCondition(''); setName(''); setPhone(''); }}
                  className="text-xs font-bold text-emerald-600 hover:underline">
                  Надіслати ще одну заявку
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
};

export default RehabDetails;
