import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Trophy, Heart, Users, Receipt, Gift, LogIn, LogOut, Copy, Check,
  Loader2, Pencil, Plus, ExternalLink, Gamepad2, Sparkles, Share2, Timer, Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Account } from '../../hooks/useAccount';
import AnimatedNumber from '../AnimatedNumber';
import { navigate } from '../../hooks/useRoute';

const COURSE_GROUP_URL = 'https://t.me/+o9i9tJpoj4A3MTcy';

interface Props {
  account: Account;
  onTopUp: () => void;
  onLogin: () => void;
}

interface Purchase {
  kind: 'topup' | 'redeem';
  title: string;
  coins: number;
  uah: number | null;
  status: string;
  at: string;
  code?: string | null;
}
interface Activity {
  move: string;
  stake: number;
  payout: number;
  net: number;
  at: string;
  round_id: number;
}
interface Cabinet {
  profile: { nickname: string; balance: number; wins: number; donated: number; created_at: string; referrals: number } | null;
  purchases: Purchase[];
  activity: Activity[];
}

const MOVE_EMOJI: Record<string, string> = { rock: '✊', scissors: '✌️', paper: '✋' };

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtDay = (s: string) => new Date(s).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });

const isCourse = (title: string) => /курс|йог/i.test(title);

const purchaseBadge = (kind: string, status: string) => {
  if (kind === 'topup') return { text: 'Зараховано', cls: 'bg-emerald-100 text-emerald-700' };
  switch (status) {
    case 'done':
    case 'delivered':
      return { text: 'Видано', cls: 'bg-emerald-100 text-emerald-700' };
    case 'rejected':
      return { text: 'Відхилено', cls: 'bg-rose-100 text-rose-600' };
    default:
      return { text: 'Активно', cls: 'bg-amber-100 text-amber-700' };
  }
};

interface TournamentReminder {
  id: number;
  name: string;
  status: 'scheduled' | 'active' | 'finished';
  date: string;
  end_date: string | null;
}

const Profile: React.FC<Props> = ({ account, onTopUp, onLogin }) => {
  const [cab, setCab] = useState<Cabinet | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'purchases' | 'activity'>('purchases');
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState(account.nickname);
  const [copied, setCopied] = useState(false);
  const [tournament, setTournament] = useState<TournamentReminder | null>(null);
  const [countdown, setCountdown] = useState('');

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${account.playerId}` : '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc('rps_cabinet', { p_id: account.playerId }).then(({ data }) => {
      if (cancelled) return;
      setCab((data as Cabinet) ?? { profile: null, purchases: [], activity: [] });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [account.playerId, account.balance]);

  // Залізний фікс: використовуємо SQL-функцію напряму (без PostgREST join)
  useEffect(() => {
    if (!account.playerId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('rps_my_registered_tournament', { p_player_id: account.playerId });
      if (cancelled) return;
      if (error || !data) { setTournament(null); return; }
      setTournament({
        id: data.id,
        name: data.name,
        status: data.status,
        date: data.date,
        end_date: data.end_date ?? null,
      });
    })();
    return () => { cancelled = true; };
  }, [account.playerId]);

  // Зворотній відлік до початку турніру
  useEffect(() => {
    if (!tournament || tournament.status !== 'scheduled') { setCountdown(''); return; }
    const tick = () => {
      const diff = new Date(tournament.date).getTime() - Date.now();
      if (diff <= 0) { setCountdown('Вже починається!'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(
        h > 0
          ? `${h} год ${String(m).padStart(2,'0')} хв`
          : m > 0
          ? `${m} хв ${String(s).padStart(2,'0')} сек`
          : `${s} сек`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tournament]);

  const saveNick = () => {
    const n = nickDraft.trim().slice(0, 20);
    if (n) account.setNickname(n);
    setEditingNick(false);
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  const shareText = "Приєднуйся до гри та отримуй призи й оздоровчі процедури у Центрі розвитку та здоров'я! 🎁💪";

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareViber = () => {
    const url = `viber://forward?text=${encodeURIComponent(shareText + '\n' + inviteLink)}`;
    window.open(url, '_blank');
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + inviteLink)}`;
    window.open(url, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Центр розвитку та здоров'я",
          text: shareText,
          url: inviteLink,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      copyInvite();
    }
  };

  const initial = (account.nickname || 'Г').trim().charAt(0).toUpperCase();
  const memberSince = cab?.profile?.created_at ? fmtDay(cab.profile.created_at) : null;
  const donated = cab?.profile?.donated ?? 0;
  const referrals = cab?.profile?.referrals ?? 0;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:pt-12">
      {/* Профіль */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-xl shadow-emerald-900/15 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-teal-300/20 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl font-extrabold ring-1 ring-white/30 backdrop-blur-sm sm:h-20 sm:w-20 sm:text-3xl">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            {editingNick ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => e.key === 'Enter' && saveNick()}
                  autoFocus
                  className="w-full rounded-xl bg-white/20 px-3 py-1.5 text-lg font-extrabold text-white placeholder-white/60 outline-none ring-1 ring-white/40"
                />
                <button onClick={saveNick} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/25 hover:bg-white/35">
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNickDraft(account.nickname); setEditingNick(true); }}
                className="group flex items-center gap-2 text-left"
              >
                <span className="truncate text-xl font-extrabold sm:text-2xl">{account.nickname || 'Гравець'}</span>
                <Pencil className="h-4 w-4 shrink-0 opacity-60 transition group-hover:opacity-100" />
              </button>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-bold ${account.isAccount ? 'bg-white/25' : 'bg-amber-400/90 text-amber-950'}`}>
                {account.isAccount ? '✓ Акаунт' : 'Гість'}
              </span>
              {memberSince && <span className="text-white/70">з {memberSince}</span>}
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-white/70">Баланс</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-3xl font-extrabold sm:text-4xl">
              <Coins className="h-6 w-6 text-amber-300 sm:h-7 sm:w-7" />
              <AnimatedNumber value={account.balance} />
            </div>
          </div>
          <button
            onClick={onTopUp}
            className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" /> Поповнити
          </button>
        </div>

        <div className="relative mt-5 flex justify-end">
          {account.isAccount ? (
            <button onClick={account.logout} className="flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Вийти
            </button>
          ) : (
            <button onClick={onLogin} className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold transition hover:bg-white/30">
              <LogIn className="h-3.5 w-3.5" /> Увійти, щоб зберігати на всіх пристроях
            </button>
          )}
        </div>
      </motion.section>

      {/* Банер турніру */}
      <AnimatePresence>
        {tournament && (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-4 overflow-hidden rounded-3xl shadow-xl"
          >
            {/* Gradient background based on status */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              tournament.status === 'finished'
                ? 'from-slate-700 via-slate-800 to-slate-900'
                : 'from-violet-600 via-purple-600 to-indigo-700'
            }`} />
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-violet-300/20 blur-2xl" />
            <div className="pointer-events-none absolute right-1/3 top-0 h-20 w-20 rounded-full bg-white/5 blur-xl" />

            <div className="relative p-5 sm:p-6">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl ring-1 ring-white/30 backdrop-blur-sm">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {tournament.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-950 animate-pulse">
                        <Zap className="h-2.5 w-2.5" /> Турнір ЙДЕ
                      </span>
                    ) : tournament.status === 'finished' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-100">
                        ✓ Завершився
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950">
                        <Timer className="h-2.5 w-2.5" /> Зареєстрований
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-base font-black leading-snug text-white sm:text-lg">
                    «{tournament.name}»
                  </h4>
                </div>
              </div>

              {/* Info row */}
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm text-white">
                {tournament.status === 'active' ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-violet-100">
                      🎮 Турнір вже активний! Переходь до гри та борись за перемогу.
                    </p>
                    {tournament.end_date && (
                      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                        <span className="font-semibold text-violet-300">Триває до:</span>
                        <span className="font-bold text-white">
                          {new Date(tournament.end_date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : tournament.status === 'finished' ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                      Турнір успішно завершився. Дякуємо за участь! Результати та виграші оновлено в загальній таблиці.
                    </p>
                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                      <span className="font-semibold text-slate-400">Час закінчення:</span>
                      <span className="font-bold text-slate-200">
                        {tournament.end_date
                          ? new Date(tournament.end_date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Не вказано'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-violet-300">Початок</span>
                        <span className="font-bold">
                          {new Date(tournament.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {tournament.end_date && (
                        <div className="text-right">
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-violet-300">Закінчення</span>
                          <span className="font-bold">
                            {new Date(tournament.end_date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      )}
                    </div>
                    {countdown && (
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                        <span className="font-semibold text-violet-300">Час до старту:</span>
                        <span className="font-mono font-bold text-amber-300">{countdown}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {tournament.status === 'active' && (
                <button
                  onClick={() => navigate('home')}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-extrabold text-violet-750 shadow-lg transition hover:bg-violet-50 active:scale-95"
                >
                  <Zap className="h-4 w-4" /> Грати зараз!
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Статистика */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { icon: Trophy, label: 'Перемоги', value: account.wins, cls: 'text-amber-500' },
          { icon: Heart, label: 'Задоновано', value: donated, cls: 'text-rose-500' },
          { icon: Users, label: 'Запрошено', value: referrals, cls: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm sm:p-4">
            <s.icon className={`mx-auto h-5 w-5 ${s.cls}`} />
            <div className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
              <AnimatedNumber value={s.value} />
            </div>
            <div className="text-[11px] font-medium text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Запрошення */}
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <Sparkles className="h-4 w-4" /> Запроси друга — і отримай бонус активності
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            className="min-w-0 flex-1 truncate rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none"
          />
          <button
            onClick={copyInvite}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Скопійовано' : 'Копіювати'}
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={shareTelegram}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#229ED9] py-2 text-xs font-bold text-white transition hover:bg-[#1c85b7]"
          >
            Telegram
          </button>
          <button
            onClick={shareViber}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#7360F2] py-2 text-xs font-bold text-white transition hover:bg-[#5c4cc4]"
          >
            Viber
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 text-xs font-bold text-white transition hover:bg-[#20ba5a]"
          >
            WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1877F2] py-2 text-xs font-bold text-white transition hover:bg-[#166fe5]"
          >
            Facebook
          </button>
        </div>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            onClick={shareNative}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            <Share2 className="h-4 w-4" /> Поділитись через інші додатки
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="mt-6 flex gap-1 rounded-2xl bg-slate-100 p-1">
        {[
          { id: 'purchases' as const, label: 'Покупки', icon: Receipt },
          { id: 'activity' as const, label: 'Активність', icon: Gamepad2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
              tab === t.id ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === t.id && (
              <motion.span layoutId="cab-tab" className="absolute inset-0 rounded-xl bg-white shadow-sm" />
            )}
            <span className="relative flex items-center gap-1.5"><t.icon className="h-4 w-4" /> {t.label}</span>
          </button>
        ))}
      </div>

      {/* Контент вкладки */}
      <div className="mt-4 min-h-[160px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-sm">Завантажуємо…</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'purchases' && (
                (cab?.purchases.length ?? 0) === 0 ? (
                  <EmptyState icon={Receipt} title="Покупок поки немає" hint="Поповни баланс або обміняй монети на приз — і вони зʼявляться тут." />
                ) : (
                  <ul className="space-y-2.5">
                    {cab!.purchases.map((it, i) => {
                      const topup = it.kind === 'topup';
                      const badge = purchaseBadge(it.kind, it.status);
                      const course = !topup && isCourse(it.title);
                      return (
                        <li key={i} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${topup ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'}`}>
                              {topup ? <Coins className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-slate-900">{it.title}</div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="whitespace-nowrap text-[11px] text-slate-400">{fmtDate(it.at)}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.text}</span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className={`flex items-center justify-end gap-1 text-sm font-extrabold ${topup ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {topup ? '+' : '−'}{it.coins.toLocaleString('uk-UA')}
                                <Coins className="h-3.5 w-3.5 text-amber-400" />
                              </div>
                              {topup && it.uah ? <div className="text-[11px] text-slate-400">{it.uah} грн</div> : null}
                            </div>
                          </div>
                          {course && (
                            <a
                              href={COURSE_GROUP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                              <ExternalLink className="h-4 w-4" /> Відкрити курс у Telegram
                            </a>
                          )}
                          {!topup && !course && it.code && it.status !== 'rejected' && (
                            <div className={`mt-2.5 rounded-xl border p-3 text-center ${badge.text === 'Видано' ? 'border-slate-200 bg-slate-50' : 'border-emerald-200 bg-emerald-50'}`}>
                              <div className="text-[11px] font-semibold text-emerald-700">
                                {badge.text === 'Видано' ? '🎟️ Використаний код' : '🎟️ Покажіть цей код спеціалісту, щоб скористатися'}
                              </div>
                              <div className="mt-1 font-mono text-xl font-extrabold tracking-widest text-slate-900">{it.code}</div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )
              )}

              {tab === 'activity' && (
                (cab?.activity.length ?? 0) === 0 ? (
                  <EmptyState icon={Gamepad2} title="Ще не грав" hint="Зіграй раунд камінь-ножиці-папір — результати зʼявляться тут." />
                ) : (
                  <ul className="space-y-2">
                    {cab!.activity.map((a, i) => {
                      const win = a.net > 0;
                      const draw = a.net === 0;
                      return (
                        <li key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl">
                            {MOVE_EMOJI[a.move] ?? '🎮'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-900">Раунд #{a.round_id}</div>
                            <div className="whitespace-nowrap text-[11px] text-slate-400">{fmtDate(a.at)}</div>
                          </div>
                          <div className={`flex shrink-0 items-center gap-1 text-sm font-extrabold ${win ? 'text-emerald-600' : draw ? 'text-slate-400' : 'text-rose-500'}`}>
                            {win ? '+' : draw ? '' : '−'}{Math.abs(a.net).toLocaleString('uk-UA')}
                            <Coins className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
};

const EmptyState: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; hint: string }> = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
    <Icon className="h-8 w-8" />
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    <p className="max-w-xs px-4 text-xs">{hint}</p>
  </div>
);

export default Profile;
