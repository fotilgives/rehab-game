import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ShieldCheck, LogOut, Users, Gift, MessageSquare, BarChart3, RefreshCw,
  Search, Plus, Minus, Check, EyeOff, Eye, Loader2, Coins, Star, Crown,
  Settings, Package, Trash2, Pencil, Save, Image as ImageIcon, Upload, X,
  ArrowUp, ArrowDown, Copy, Sparkles, Clock, TrendingDown, Link2,
  CheckCircle2, ExternalLink, Wand2, Table2, HandHeart,
  KeyRound, Trophy, Send, ChevronDown, ChevronUp, AlertCircle, Calendar, Lock, Share2, Download,
} from 'lucide-react';

const TOKEN_KEY = 'rps_admin_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}
function saveToken(t: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, t);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, t);
    localStorage.removeItem(TOKEN_KEY);
  }
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

const fmt = (n: number) => (n ?? 0).toLocaleString('uk-UA');
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : '—';

interface UserRow {
  id: string; nick: string; email: string | null; login: string | null;
  balance: number; wins: number; donated: number; created: string;
  last_activity: string; is_account: boolean; is_admin: boolean;
}
interface RedRow { id: number; nick: string; reward: string; cost: number; status: string; created: string; email: string | null; }
interface ReviewRow { id: number; nick: string; rating: number; text: string; hidden: boolean; created: string; }
interface Stats { players: number; accounts: number; coins: number; redemptions_pending: number; redemptions_total: number; reviews: number; bookings: number; }
interface PrizeRow {
  id: number; emoji: string; title: string; cost: number; image_url: string | null;
  delivery_type: string; delivery_url: string | null; delivery_label: string | null;
  active: boolean; sort: number;
}
type Config = Record<string, number>;

type Tab = 'stats' | 'users' | 'orders' | 'catalog' | 'reviews' | 'settings' | 'script' | 'prices' | 'servs' | 'tournaments';

interface ScriptRow {
  round_no: number;
  rock: number; scissors: number; paper: number;
  r2s: number; r2p: number; s2r: number; s2p: number; p2r: number; p2s: number;
  res_rock: number; res_scissors: number; res_paper: number;
  rk?: number; sc?: number; pp?: number;
  br?: number; bs?: number; bp?: number;
}
interface Settings { [key: string]: { value: string; label: string } }
interface TournamentInvite { invite_id: number; player_id: string; nick: string; status: string; }
interface Tournament {
  id: number; name: string; description: string; date: string | null; end_date: string | null;
  prepay_coins: number; created_at: string;
  stake: number; round_seconds: number; status: 'scheduled' | 'active' | 'finished';
  responses: { total: number; yes: number; no: number; later: number; pending: number };
  invites: TournamentInvite[];
}
interface LeaderRow { rank: number; nickname: string; tournament_balance: number; wins: number }
type GameSubTab = 'payouts' | 'bots' | 'bluff';

type PriceRow = { id?: number; group_title: string; name: string; price: string; meta: string | null; sort: number; active: boolean };
type ServiceRow = { id?: number; title: string; category: string | null; short: string | null; details: string | null; cases: string | null; cases_title: string | null; image_url: string | null; video_url: string | null; poster_url: string | null; sort: number; active: boolean };

// ============ НАЛАШТУВАННЯ ГРИ — згруповано ============
const SETTINGS_GROUPS: { title: string; icon: React.ElementType; hint: string; items: [string, string, number, string][] }[] = [
  {
    title: 'Ставка раунду', icon: Coins, hint: 'Виплати визначає таблиця 35 раундів (зашита в грі). Тут лише ставка.',
    items: [
      ['stake', 'Ставка раунду', 100, 'Скільки монет коштує одна гра (таблиця розрахована на 100)'],
    ],
  },
  {
    title: 'Раунд', icon: Clock, hint: 'Темп гри.',
    items: [
      ['round_seconds', 'Тривалість раунду (сек)', 30, 'Час до автоматичного розіграшу'],
    ],
  },
  {
    title: 'Таяння балів (енергія)', icon: TrendingDown, hint: 'Стимулює грати регулярно. Постав «через днів» дуже великим, щоб вимкнути.',
    items: [
      ['decay_start_days', 'Починати через (днів)', 3, 'Днів неактивності до старту таяння'],
      ['decay_period_days', 'Період кроку (днів)', 7, 'Як часто застосовувати таяння'],
      ['decay_pct', 'Відсоток за крок (%)', 1, 'На скільки % зменшувати баланс щокроку'],
    ],
  },
  {
    title: 'Реєстрація', icon: Gift, hint: 'Бонус новачкам.',
    items: [
      ['starter_coins', 'Стартові монети', 0, 'Бонус новому акаунту при реєстрації'],
    ],
  },
  {
    title: 'Реферальна програма', icon: Gift, hint: 'Налаштування бонусів за запрошення нових гравців.',
    items: [
      ['referral_new_bonus', 'Бонус новачку (монет)', 100, 'Бонус новому акаунту при реєстрації за реф-посиланням'],
      ['referral_inviter_bonus', 'Бонус запросившому (монет)', 100, 'Бонус гравцю, який запросив друга'],
    ],
  },
  {
    title: 'Денний ліміт фонду', icon: ShieldCheck, hint: 'Максимальний денний ліміт монет для банку.',
    items: [
      ['daily_fund_limit', 'Денний ліміт банку', 5000, 'Скільки монет максимум може бути у щоденному фонді'],
    ],
  },
  {
    title: 'Магазин (поповнення)', icon: Coins, hint: 'Курс обміну при купівлі монет за гроші. Сума у грн не змінюється — змінюється скільки монет за неї дають.',
    items: [
      ['coin_rate', 'Балів за 1 грн', 5, 'Напр. 5 → 100 грн = 500 монет. Постав 10 → 100 грн = 1000 монет (курс 1×10)'],
    ],
  },
];

// Пресети — задають кілька значень одразу.
const PRESETS: { id: string; label: string; icon: React.ElementType; desc: string; values: Config }[] = [
  { id: 'normal', label: 'Стандарт', icon: Sparkles, desc: 'ставка 100, 30 сек', values: { stake: 100, round_seconds: 30 } },
  { id: 'fast', label: 'Швидкі раунди', icon: Clock, desc: 'ставка 100, 15 сек', values: { stake: 100, round_seconds: 15 } },
  { id: 'nodecay', label: 'Вимкнути таяння', icon: TrendingDown, desc: 'бали не згоряють', values: { decay_start_days: 99999 } },
];

// ============ ВХІД ============
const Login: React.FC<{ onIn: (t: string) => void }> = ({ onIn }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setBusy(true);
    const { data, error } = await supabase.rpc('rps_admin_login', { p_login: login.trim(), p_password: password });
    setBusy(false);
    if (error || !data) { setErr('Невірний логін або пароль'); return; }
    const t = (data as { token: string }).token;
    saveToken(t, remember);
    onIn(t);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">Адмін-панель</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Вхід лише для адміністратора</p>

        <div className="mt-6 space-y-3">
          <input
            value={login} onChange={(e) => setLogin(e.target.value)}
            placeholder="Логін" autoCapitalize="none"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" placeholder="Пароль"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
            <span className="text-sm text-slate-600">Запамʼятати мене</span>
          </label>
        </div>

        {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

        <button
          onClick={submit} disabled={busy || !login || !password}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {busy ? 'Перевіряю…' : 'Увійти'}
        </button>
      </div>
    </div>
  );
};

// ============ КАРТКА КОРИСТУВАЧА (з кастомною сумою) ============
const UserCard: React.FC<{ u: UserRow; onGrant: (id: string, delta: number) => void; onDelete: (id: string, label: string) => void }> = ({ u, onGrant, onDelete }) => {
  const [custom, setCustom] = useState('');
  const apply = (sign: number) => {
    const n = Math.abs(parseInt(custom, 10));
    if (!n) return;
    onGrant(u.id, sign * n);
    setCustom('');
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            {u.is_admin && <Crown className="h-4 w-4 text-amber-500" />}
            <span className="truncate">{u.nick || 'Гравець'}</span>
            {u.is_account
              ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">акаунт</span>
              : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">гість</span>}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{u.email || u.login || '— без пошти —'}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            активність: {fmtDate(u.last_activity)} · перемог: {u.wins ?? 0} · донат: {fmt(u.donated)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 font-extrabold text-amber-600">
            <Coins className="h-4 w-4" /> {fmt(u.balance)}
          </div>
          <button
            onClick={() => onDelete(u.id, u.nick || u.email || u.login || 'Гравець')}
            title="Видалити учасника"
            className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-500 transition hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {[100, 500, 1000].map((v) => (
          <button key={'p' + v} onClick={() => onGrant(u.id, v)} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
            <Plus className="h-3 w-3" />{v}
          </button>
        ))}
        {[100, 500].map((v) => (
          <button key={'m' + v} onClick={() => onGrant(u.id, -v)} className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">
            <Minus className="h-3 w-3" />{v}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <input
            value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric" placeholder="сума"
            className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-emerald-400 focus:bg-white"
          />
          <button onClick={() => apply(1)} disabled={!custom} className="rounded-lg bg-emerald-600 p-1.5 text-white transition hover:bg-emerald-700 disabled:opacity-40" title="Додати"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={() => apply(-1)} disabled={!custom} className="rounded-lg bg-rose-500 p-1.5 text-white transition hover:bg-rose-600 disabled:opacity-40" title="Відняти"><Minus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
};

// ============ МОДАЛКА ЗМІНИ ПАРОЛЯ ============
const ChangePasswordModal: React.FC<{ token: string; onClose: () => void }> = ({ token, onClose }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (newPass !== newPass2) { setMsg({ type: 'error', text: 'Новий пароль та підтвердження не збігаються' }); return; }
    if (newPass.length < 4) { setMsg({ type: 'error', text: 'Пароль має бути мінімум 4 символи' }); return; }
    setBusy(true);
    const { data } = await supabase.rpc('rps_admin_change_password', {
      p_token: token, p_old_password: oldPass, p_new_password: newPass,
    });
    setBusy(false);
    if (data === 'ok') {
      setMsg({ type: 'ok', text: '✅ Пароль успішно змінено!' });
      setOldPass(''); setNewPass(''); setNewPass2('');
    } else if (data === 'bad_old_password') {
      setMsg({ type: 'error', text: 'Невірний поточний пароль' });
    } else if (data === 'password_short') {
      setMsg({ type: 'error', text: 'Новий пароль занадто короткий' });
    } else {
      setMsg({ type: 'error', text: 'Помилка. Спробуй ще раз.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </span>
            Зміна пароля
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Поточний пароль</label>
            <input
              type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Новий пароль</label>
            <input
              type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder="Мінімум 4 символи"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Підтвердити новий пароль</label>
            <input
              type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)}
              placeholder="Повторіть пароль"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
        </div>

        {msg && (
          <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
            {msg.text}
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy || !oldPass || !newPass || !newPass2}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {busy ? 'Збереження…' : 'Змінити пароль'}
        </button>
      </div>
    </div>
  );
};

// ============ ТАБЛИЦЯ ГРИ ============
const GameTableTab: React.FC<{ token: string }> = ({ token }) => {
  const [subTab, setSubTab] = useState<GameSubTab>('payouts');
  const [script, setScript] = useState<ScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc('rps_admin_get_script', { p_token: token });
      if (data) setScript(data as ScriptRow[]);
      setLoading(false);
    })();
  }, [token]);

  const update = (roundNo: number, field: keyof ScriptRow, val: string) => {
    const num = parseInt(val) || 0;
    setScript((prev) => prev.map((r) => r.round_no === roundNo ? { ...r, [field]: num } : r));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await supabase.rpc('rps_admin_set_script', { p_token: token, p_rows: script });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const subTabs: { id: GameSubTab; label: string; emoji: string }[] = [
    { id: 'payouts', label: 'Виплати', emoji: '💰' },
    { id: 'bots',    label: 'Боти на хід', emoji: '🤖' },
    { id: 'bluff',   label: 'Блеф', emoji: '🤫' },
  ];

  const numInput = (row: ScriptRow, field: keyof ScriptRow) => (
    <input
      type="number" min={0} max={999}
      value={row[field] as number}
      onChange={(e) => update(row.round_no, field, e.target.value)}
      className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-center text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white"
    />
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div>
      {/* Підвкладки */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {subTabs.map((s) => (
          <button
            key={s.id} onClick={() => setSubTab(s.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${subTab === s.id ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-3 py-3 text-left text-slate-400 font-semibold">№</th>
              {subTab === 'payouts' && <>
                <th className="px-3 py-3 text-center text-slate-600">✊ Камінь</th>
                <th className="px-3 py-3 text-center text-slate-600">✌️ Ножиці</th>
                <th className="px-3 py-3 text-center text-slate-600">✋ Папір</th>
              </>}
              {subTab === 'bots' && <>
                <th className="px-3 py-3 text-center text-slate-600">✊ Камінь</th>
                <th className="px-3 py-3 text-center text-slate-600">✌️ Ножиці</th>
                <th className="px-3 py-3 text-center text-slate-600">✋ Папір</th>
                <th className="px-3 py-3 text-center text-slate-400">Разом</th>
              </>}
              {subTab === 'bluff' && <>
                <th className="px-2 py-3 text-center text-slate-600">✊➔✌️</th>
                <th className="px-2 py-3 text-center text-slate-600">✊➔✋</th>
                <th className="px-2 py-3 text-center text-slate-600">✌️➔✊</th>
                <th className="px-2 py-3 text-center text-slate-600">✌️➔✋</th>
                <th className="px-2 py-3 text-center text-slate-600">✋➔✊</th>
                <th className="px-2 py-3 text-center text-slate-600">✋➔✌️</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {script.map((row, i) => (
              <tr key={row.round_no} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <td className="px-3 py-2 font-bold text-slate-400">{row.round_no}</td>
                {subTab === 'payouts' && <>
                  <td className="px-3 py-2 text-center">{numInput(row, 'res_rock')}</td>
                  <td className="px-3 py-2 text-center">{numInput(row, 'res_scissors')}</td>
                  <td className="px-3 py-2 text-center">{numInput(row, 'res_paper')}</td>
                </>}
                {subTab === 'bots' && <>
                  <td className="px-3 py-2 text-center">{numInput(row, 'rock')}</td>
                  <td className="px-3 py-2 text-center">{numInput(row, 'scissors')}</td>
                  <td className="px-3 py-2 text-center">{numInput(row, 'paper')}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-500">{row.rock + row.scissors + row.paper}</td>
                </>}
                {subTab === 'bluff' && <>
                  <td className="px-2 py-2 text-center">{numInput(row, 'r2s')}</td>
                  <td className="px-2 py-2 text-center">{numInput(row, 'r2p')}</td>
                  <td className="px-2 py-2 text-center">{numInput(row, 's2r')}</td>
                  <td className="px-2 py-2 text-center">{numInput(row, 's2p')}</td>
                  <td className="px-2 py-2 text-center">{numInput(row, 'p2r')}</td>
                  <td className="px-2 py-2 text-center">{numInput(row, 'p2s')}</td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={save} disabled={saving}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white transition ${saved ? 'bg-teal-500' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? 'Зберігаю…' : saved ? '✅ Збережено!' : 'Зберегти таблицю'}
      </button>
    </div>
  );
};

// ============ НАЛАШТУВАННЯ ============
const SettingsTab: React.FC<{ token: string }> = ({ token }) => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc('rps_admin_get_settings', { p_token: token });
      if (data) setSettings(data as Settings);
      setLoading(false);
    })();
  }, [token]);

  const update = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: { ...prev[key], value: val } }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const payload: Record<string, string> = {};
    Object.entries(settings).forEach(([k, v]) => { payload[k] = v.value; });
    await supabase.rpc('rps_admin_save_settings', { p_token: token, p_data: payload });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  const groups: { title: string; emoji: string; keys: string[] }[] = [
    {
      title: 'Реєстрація та реферали',
      emoji: '🎁',
      keys: ['starter_coins', 'referral_new_bonus', 'referral_inviter_bonus'],
    },
    {
      title: 'Фонд та гра',
      emoji: '⚙️',
      keys: ['daily_fund_limit', 'round_seconds'],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
            <span>{g.emoji}</span> {g.title}
          </h3>
          <div className="space-y-3">
            {g.keys.map((key) => {
              const s = settings[key];
              if (!s) return null;
              return (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">{s.label}</label>
                  <input
                    type="number" min={0} value={s.value}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:bg-white"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={save} disabled={saving}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white transition ${saved ? 'bg-teal-500' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? 'Зберігаю…' : saved ? '✅ Збережено!' : 'Зберегти налаштування'}
      </button>
    </div>
  );
};

// ============ ТУРНІРИ ============
const SITE_URL_ADMIN = typeof window !== 'undefined' ? window.location.origin : 'https://reabilitolog-play.vercel.app';

const TournamentsTab: React.FC<{ token: string; users: UserRow[] }> = ({ token, users }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copiedTId, setCopiedTId] = useState<number | null>(null);

  // Форма
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tDate, setTDate] = useState('');
  const [tEndDate, setTEndDate] = useState('');
  const [tPrepay, setTPrepay] = useState('0');
  const [tStake, setTStake] = useState('100');
  const [tRoundSecs, setTRoundSecs] = useState('30');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [leaderboardFor, setLeaderboardFor] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('rps_admin_get_tournaments', { p_token: token });
    if (data) setTournaments(data as Tournament[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = users.filter((u) => u.is_account);
    setSelectedPlayers(new Set(filtered.map((u) => u.id)));
  };

  const filteredUsers = users.filter((u) => {
    if (!u.is_account) return false;
    if (!searchQ.trim()) return true;
    const s = searchQ.toLowerCase();
    return (u.nick || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  const send = async () => {
    if (!tName.trim()) { setSendMsg({ type: 'error', text: 'Введи назву турніру' }); return; }
    setSending(true); setSendMsg(null);
    const base = {
      p_token:      token,
      p_name:       tName.trim(),
      p_desc:       tDesc.trim(),
      p_date:       tDate ? new Date(tDate).toISOString() : null,
      p_end_date:   tEndDate ? new Date(tEndDate).toISOString() : null,
      p_prepay:     parseInt(tPrepay) || 0,
      p_player_ids: Array.from(selectedPlayers),
    };
    const baseCompat = {
      p_token:      token,
      p_name:       tName.trim(),
      p_desc:       tDesc.trim(),
      p_date:       tDate ? new Date(tDate).toISOString() : null,
      p_prepay:     parseInt(tPrepay) || 0,
      p_player_ids: Array.from(selectedPlayers),
    };
    // Основний виклик — з власною ставкою та тривалістю раунду.
    let { data, error } = await supabase.rpc('rps_admin_create_tournament', {
      ...base,
      p_stake:      parseInt(tStake) || 100,
      p_round_seconds: parseInt(tRoundSecs) || 30,
    });
    // Якщо схема-кеш PostgREST ще не знає нову версію — падаємо на
    // сумісну версію, щоб турнір усе одно створився без очікування перезавантаження кешу.
    if (error && /schema cache|PGRST202|could not find/i.test(error.message || '')) {
      ({ data, error } = await supabase.rpc('rps_admin_create_tournament', baseCompat));
    }
    setSending(false);
    if (data && !data.error) {
      setSendMsg({ type: 'ok', text: `✅ Запрошення надіслано ${data.invited || selectedPlayers.size} гравцям!` });
      setTName(''); setTDesc(''); setTDate(''); setTEndDate(''); setTPrepay('0'); setTStake('100'); setTRoundSecs('30'); setSelectedPlayers(new Set());
      setShowForm(false);
      load();
    } else {
      setSendMsg({ type: 'error', text: `Помилка при створенні турніру${error?.message ? `: ${error.message}` : data?.error ? `: ${data.error}` : ''}` });
    }
  };

  const deleteTournament = async (id: number) => {
    if (!window.confirm('Видалити турнір остаточно? Дію не можна скасувати.')) return;
    setBusyId(id);
    const { data } = await supabase.rpc('rps_admin_tournament_delete', { p_token: token, p_id: id });
    setBusyId(null);
    if (data === 'ok') load();
    else alert('Не вдалося видалити турнір.');
  };

  // Редагування (лише для неактивних турнірів)
  const [editId, setEditId] = useState<number | null>(null);
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eDate, setEDate] = useState('');
  const [eEndDate, setEEndDate] = useState('');
  const [ePrepay, setEPrepay] = useState('0');
  const [eStake, setEStake] = useState('100');
  const [eRoundSecs, setERoundSecs] = useState('30');
  const [eBusy, setEBusy] = useState(false);
  const [eMsg, setEMsg] = useState<string | null>(null);

  const startEdit = (t: Tournament) => {
    setEditId(t.id);
    setEName(t.name);
    setEDesc(t.description || '');
    setEDate(t.date ? t.date.slice(0, 16) : '');
    setEEndDate(t.end_date ? t.end_date.slice(0, 16) : '');
    setEPrepay(String(t.prepay_coins));
    setEStake(String(t.stake));
    setERoundSecs(String(t.round_seconds));
    setEMsg(null);
  };

  const saveEdit = async () => {
    if (editId == null) return;
    setEBusy(true); setEMsg(null);
    let { data, error } = await supabase.rpc('rps_admin_tournament_update', {
      p_token: token, p_id: editId, p_name: eName.trim(), p_desc: eDesc.trim(),
      p_date: eDate ? new Date(eDate).toISOString() : null,
      p_end_date: eEndDate ? new Date(eEndDate).toISOString() : null,
      p_prepay: parseInt(ePrepay) || 0, p_stake: parseInt(eStake) || 100, p_round_seconds: parseInt(eRoundSecs) || 30,
    });
    if (error && /schema cache|PGRST202|could not find/i.test(error.message || '')) {
      ({ data, error } = await supabase.rpc('rps_admin_tournament_update', {
        p_token: token, p_id: editId, p_name: eName.trim(), p_desc: eDesc.trim(),
        p_date: eDate ? new Date(eDate).toISOString() : null,
        p_prepay: parseInt(ePrepay) || 0, p_stake: parseInt(eStake) || 100, p_round_seconds: parseInt(eRoundSecs) || 30,
      }));
    }
    setEBusy(false);
    if (data === 'ok') { setEditId(null); load(); }
    else if (data === 'is_active') setEMsg('Не можна редагувати активний турнір — спершу заверши його.');
    else setEMsg(`Помилка${error?.message ? `: ${error.message}` : ''}`);
  };

  const startTournament = async (id: number) => {
    setBusyId(id);
    const { data, error } = await supabase.rpc('rps_admin_tournament_start', { p_token: token, p_tournament_id: id });
    setBusyId(null);
    if (data === 'ok') load();
    else if (data === 'other_active') alert('Вже є активний турнір — спершу заверши його.');
    else if (data === 'not_found') alert('Турнір не знайдено (онови сторінку).');
    else alert(`Не вдалося запустити турнір${error?.message ? `: ${error.message}` : data ? `: ${data}` : ''}`);
  };

  const finishTournament = async (id: number) => {
    if (!window.confirm('Завершити турнір? Гра одразу повернеться в звичайний режим для всіх.')) return;
    setBusyId(id);
    const { data, error } = await supabase.rpc('rps_admin_tournament_finish', { p_token: token, p_tournament_id: id });
    setBusyId(null);
    if (data === 'ok') load();
    else alert(`Не вдалося завершити турнір${error?.message ? `: ${error.message}` : data ? `: ${data}` : ''}`);
  };

  const viewLeaderboard = async (t: Tournament) => {
    const { data } = await supabase.rpc('rps_tournament_leaderboard', { p_tournament_id: t.id });
    setLeaderboard((data as LeaderRow[]) || []);
    setLeaderboardFor(t);
  };

  const statusColor = (s: string) =>
    s === 'yes' ? 'text-emerald-600 bg-emerald-50' :
    s === 'no' ? 'text-rose-600 bg-rose-50' :
    s === 'later' ? 'text-amber-600 bg-amber-50' :
    'text-slate-500 bg-slate-100';
  const statusLabel = (s: string) =>
    s === 'yes' ? '✅ Так' : s === 'no' ? '❌ Ні' : s === 'later' ? '🔔 Пізніше' : '⏳ Очікує';

  return (
    <div className="space-y-4">
      {/* Кнопка створення */}
      <button
        onClick={() => { setShowForm(!showForm); setSendMsg(null); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
      >
        <Send className="h-5 w-5" />
        {showForm ? 'Скасувати' : '+ Нове запрошення на турнір'}
      </button>

      {/* Форма */}
      {showForm && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Нове турнірне запрошення
          </h3>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Назва турніру *</label>
            <input
              value={tName} onChange={(e) => setTName(e.target.value)}
              placeholder="Наприклад: Великий турнір червня"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Опис / деталі</label>
            <textarea
              value={tDesc} onChange={(e) => setTDesc(e.target.value)}
              rows={2}
              placeholder="Умови участі, призи, правила…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                <Calendar className="inline h-3.5 w-3.5 mr-1" />Дата початку
              </label>
              <input
                type="date"
                value={tDate.split('T')[0] || ''}
                onChange={(e) => {
                  const time = tDate.split('T')[1] || '00:00';
                  setTDate(e.target.value ? `${e.target.value}T${time}` : '');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                ⏱️ Час початку
              </label>
              <input
                type="time"
                value={tDate.split('T')[1] || ''}
                onChange={(e) => {
                  const date = tDate.split('T')[0] || new Date().toISOString().split('T')[0];
                  setTDate(e.target.value ? `${date}T${e.target.value}` : '');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                <Calendar className="inline h-3.5 w-3.5 mr-1" />Дата закінчення
              </label>
              <input
                type="date"
                value={tEndDate.split('T')[0] || ''}
                onChange={(e) => {
                  const time = tEndDate.split('T')[1] || '00:00';
                  setTEndDate(e.target.value ? `${e.target.value}T${time}` : '');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                ⏱️ Час закінчення
              </label>
              <input
                type="time"
                value={tEndDate.split('T')[1] || ''}
                onChange={(e) => {
                  const date = tEndDate.split('T')[0] || new Date().toISOString().split('T')[0];
                  setTEndDate(e.target.value ? `${date}T${e.target.value}` : '');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                <Lock className="inline h-3.5 w-3.5 mr-1" />Передоплата (монет)
              </label>
              <input
                type="number" min={0} value={tPrepay} onChange={(e) => setTPrepay(e.target.value)}
                placeholder="0 = безкоштовно"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
            <p className="mb-2 text-xs font-bold text-amber-800">⚙️ Налаштування ТІЛЬКИ для цього турніру (не чіпають звичайну гру)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Ставка раунду (турнір)</label>
                <input
                  type="number" min={1} value={tStake} onChange={(e) => setTStake(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Тривалість раунду (сек)</label>
                <input
                  type="number" min={5} value={tRoundSecs} onChange={(e) => setTRoundSecs(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Вибір гравців */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">
                Гравці ({selectedPlayers.size} обрано)
              </label>
              <button onClick={selectAll} className="text-xs font-semibold text-emerald-600 hover:underline">
                Обрати всіх ({filteredUsers.length})
              </button>
            </div>
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Пошук гравця…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl ring-1 ring-slate-100">
              {filteredUsers.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">Немає зареєстрованих гравців</p>
              )}
              {filteredUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(u.id)}
                    onChange={() => togglePlayer(u.id)}
                    className="h-4 w-4 accent-emerald-600 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 truncate">{u.nick || 'Гравець'}</div>
                    <div className="text-xs text-slate-400 truncate">{u.email || u.login || '—'}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-bold text-amber-600 shrink-0">
                    <Coins className="h-3 w-3" /> {fmt(u.balance)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {tPrepay !== '0' && parseInt(tPrepay) > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              При відповіді «Так» з гравця буде списано {tPrepay} монет як передоплата.
            </div>
          )}

          {sendMsg && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${sendMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
              {sendMsg.text}
            </div>
          )}

          <button
            onClick={send} disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {selectedPlayers.size > 0 ? `Створити турнір та надіслати запрошення (${selectedPlayers.size})` : 'Створити турнір'}
          </button>
        </div>
      )}

      {/* Список турнірів */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : tournaments.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Турнірів ще немає. Створи перший!</p>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <button
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{t.name}</span>
                    {t.status === 'active' && (
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> ЖИВИЙ
                      </span>
                    )}
                    {t.status === 'finished' && (
                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">завершено</span>
                    )}
                    {t.prepay_coins > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {t.prepay_coins} монет
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                    Створено: {fmtDate(t.created_at)}
                    {t.date && ` · Початок: ${fmtDate(t.date)}`}
                    {t.end_date && ` · Закінчення: ${fmtDate(t.end_date)}`}
                    {` · ставка ${t.stake} · ${t.round_seconds}с`}
                  </div>
                  {/* Статистика відповідей */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Всього: {t.responses.total}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      ✅ {t.responses.yes}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                      ❌ {t.responses.no}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                      🔔 {t.responses.later}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      ⏳ {t.responses.pending}
                    </span>
                  </div>
                </div>
                {expanded === t.id
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400 mt-1" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 mt-1" />}
              </button>

              {expanded === t.id && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  {t.description && <p className="mb-3 text-sm text-slate-600">{t.description}</p>}

                  {/* Керування турніром: старт/фініш + рейтинг */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {t.status !== 'active' && (
                      <button
                        onClick={() => startTournament(t.id)}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '▶️'} {t.status === 'finished' ? 'Запустити знову' : 'Старт турніру'}
                      </button>
                    )}
                    {t.status === 'active' && (
                      <button
                        onClick={() => finishTournament(t.id)}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        {busyId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '⏹️'} Завершити турнір
                      </button>
                    )}
                    <button
                      onClick={() => viewLeaderboard(t)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-200"
                    >
                      🏆 Рейтинг
                    </button>
                    {t.status !== 'active' && (
                      <button
                        onClick={() => startEdit(t)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Редагувати
                      </button>
                    )}
                    <button
                      onClick={() => deleteTournament(t.id)}
                      disabled={busyId === t.id}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Видалити
                    </button>
                  </div>
                  {t.status === 'active' && (
                    <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      Зараз грають лише учасники цього турніру (ставка {t.stake}, раунд {t.round_seconds}с). Інші гравці бачать екран очікування.
                    </p>
                  )}

                  {/* Публічне посилання для соцмереж */}
                  <div className="mb-4 rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
                    <p className="mb-2 text-xs font-bold text-indigo-800">🔗 Посилання для соцмереж (будь-хто зможе приєднатись):</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${SITE_URL_ADMIN}/?tournament=${t.id}`}
                        className="min-w-0 flex-1 truncate rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(`${SITE_URL_ADMIN}/?tournament=${t.id}`);
                          setCopiedTId(t.id);
                          setTimeout(() => setCopiedTId(null), 2000);
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                      >
                        {copiedTId === t.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedTId === t.id ? 'Скоп.' : 'Копія'}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                      {(() => {
                        const link = `${SITE_URL_ADMIN}/?tournament=${t.id}`;
                        const txt = `🏆 Запрошення на турнір «${t.name}»! Переходь за посиланням і приєднуйся:`;
                        return (
                          <>
                            <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(txt)}`, '_blank')}
                              className="rounded-xl bg-[#229ED9] py-2 text-[11px] font-bold text-white transition hover:bg-[#1c85b7]">Telegram</button>
                            <button onClick={() => window.open(`viber://forward?text=${encodeURIComponent(txt + '\n' + link)}`, '_blank')}
                              className="rounded-xl bg-[#7360F2] py-2 text-[11px] font-bold text-white transition hover:bg-[#5c4cc4]">Viber</button>
                            <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt + '\n' + link)}`, '_blank')}
                              className="rounded-xl bg-[#25D366] py-2 text-[11px] font-bold text-white transition hover:bg-[#20ba5a]">WhatsApp</button>
                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank')}
                              className="rounded-xl bg-[#1877F2] py-2 text-[11px] font-bold text-white transition hover:bg-[#166fe5]">Facebook</button>
                            <button onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ title: t.name, text: txt, url: link }).catch(() => {});
                                } else {
                                  navigator.clipboard?.writeText(`${txt}\n${link}`);
                                  setCopiedTId(t.id);
                                  setTimeout(() => setCopiedTId(null), 2000);
                                }
                              }}
                              className="rounded-xl bg-slate-800 flex items-center justify-center py-2 text-white transition hover:bg-slate-700">
                                <Share2 className="h-4 w-4" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Список запрошених гравців */}
                  <div className="space-y-2">
                    {t.invites.map((inv) => (
                      <div key={inv.invite_id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-sm font-medium text-slate-800">{inv.nick || 'Гравець'}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColor(inv.status)}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </div>
                    ))}
                    {t.invites.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Немає запрошених гравців (використай посилання вище)</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модалка редагування турніру */}
      {editId != null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setEditId(null)}>
          <div className="w-full max-w-sm space-y-3 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Редагувати турнір</h3>
              <button onClick={() => setEditId(null)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Назва турніру"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
            <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={2} placeholder="Опис / деталі"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Дата початку</label>
                <input
                  type="date"
                  value={eDate.split('T')[0] || ''}
                  onChange={(e) => {
                    const time = eDate.split('T')[1] || '00:00';
                    setEDate(e.target.value ? `${e.target.value}T${time}` : '');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Час початку</label>
                <input
                  type="time"
                  value={eDate.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = eDate.split('T')[0] || new Date().toISOString().split('T')[0];
                    setEDate(e.target.value ? `${date}T${e.target.value}` : '');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Дата закінчення</label>
                <input
                  type="date"
                  value={eEndDate.split('T')[0] || ''}
                  onChange={(e) => {
                    const time = eEndDate.split('T')[1] || '00:00';
                    setEEndDate(e.target.value ? `${e.target.value}T${time}` : '');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Час закінчення</label>
                <input
                  type="time"
                  value={eEndDate.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = eEndDate.split('T')[0] || new Date().toISOString().split('T')[0];
                    setEEndDate(e.target.value ? `${date}T${e.target.value}` : '');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Передоплата (монет)</label>
                <input type="number" min={0} value={ePrepay} onChange={(e) => setEPrepay(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Ставка раунду</label>
                <input type="number" min={1} value={eStake} onChange={(e) => setEStake(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Тривалість раунду (сек)</label>
                <input type="number" min={5} value={eRoundSecs} onChange={(e) => setERoundSecs(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
              </div>
            </div>
            {eMsg && <p className="text-xs font-semibold text-rose-600">{eMsg}</p>}
            <button onClick={saveEdit} disabled={eBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {eBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Зберегти зміни
            </button>
          </div>
        </div>
      )}

      {/* Модалка рейтингу турніру */}
      {leaderboardFor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setLeaderboardFor(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-br from-amber-500 to-orange-500 px-5 py-4 text-white">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-50/90">Рейтинг</div>
                <div className="font-black">{leaderboardFor.name}</div>
              </div>
              <button onClick={() => setLeaderboardFor(null)} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-4">
              {leaderboard.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Ще немає результатів.</p>}
              {leaderboard.map((row) => {
                const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`;
                return (
                  <div key={row.rank} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${row.rank <= 3 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    <span className="w-7 shrink-0 text-center text-lg font-black">{medal}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{row.nickname}</span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-black text-emerald-700"><Coins className="h-3.5 w-3.5 text-amber-500" /> {row.tournament_balance.toLocaleString('uk-UA')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ============ PWA (адмін-додаток для телефона) ============
// На сторінці /admin підмінюємо маніфест на адмінський (start_url → /#/admin),
// додаємо apple-мета й реєструємо service worker. На виході з адмінки прибираємо
// підміну, щоб публічний сайт не успадкував адмінський маніфест.
interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }>; }
function useAdminPwa() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const head = document.head;
    const added: HTMLElement[] = [];
    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      head.appendChild(el);
      added.push(el);
      return el;
    };
    add('link', { rel: 'manifest', href: '/admin.webmanifest', id: 'admin-manifest' });
    add('meta', { name: 'theme-color', content: '#059669', id: 'admin-theme' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    add('meta', { name: 'apple-mobile-web-app-title', content: 'Адмін' });
    add('link', { rel: 'apple-touch-icon', href: '/images/logo.png' });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);

    return () => {
      added.forEach((el) => el.remove());
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
  }, [deferred]);

  return { canInstall: !!deferred && !installed, promptInstall };
}

// ============ ПАНЕЛЬ ============
const Admin: React.FC = () => {
  const { canInstall, promptInstall } = useAdminPwa();
  const [token, setToken] = useState<string | null>(getToken());
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('stats');
  const [showChangePass, setShowChangePass] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reds, setReds] = useState<RedRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [catalog, setCatalog] = useState<PrizeRow[]>([]);
  const [config, setConfig] = useState<Config>({});
  const [script, setScript] = useState<ScriptRow[]>([]);
  const [scriptSaved, setScriptSaved] = useState(false);
  const [scriptView, setScriptView] = useState<'pay' | 'bots'>('pay');
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [servs, setServs] = useState<ServiceRow[]>([]);
  const [editPrize, setEditPrize] = useState<Partial<PrizeRow> | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [onlyAccounts, setOnlyAccounts] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'issued'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const rpc = useCallback(async (fn: string, args: Record<string, unknown> = {}) => {
    return supabase.rpc(fn, { p_token: token, ...args });
  }, [token]);

  useEffect(() => {
    if (!token) { setAuthed(false); return; }
    (async () => {
      const { data, error } = await supabase.rpc('rps_admin_stats', { p_token: token });
      if (error || !data) { setAuthed(false); clearToken(); return; }
      setStats(data as Stats);
      setAuthed(true);
    })();
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, u, r, rv, c, cfg, sc, pr, sv] = await Promise.all([
      rpc('rps_admin_stats'),
      rpc('rps_admin_users'),
      rpc('rps_admin_redemptions'),
      rpc('rps_admin_reviews'),
      rpc('rps_admin_prizes'),
      rpc('rps_admin_get_config'),
      rpc('rps_admin_get_script'),
      rpc('rps_admin_prices'),
      rpc('rps_admin_services'),
    ]);
    if (s.data) setStats(s.data as Stats);
    if (u.data) setUsers(u.data as UserRow[]);
    if (r.data) setReds(r.data as RedRow[]);
    if (rv.data) setReviews(rv.data as ReviewRow[]);
    if (c.data) setCatalog(c.data as PrizeRow[]);
    if (cfg.data) setConfig(cfg.data as Config);
    if (sc.data) setScript(sc.data as ScriptRow[]);
    if (pr.data) setPrices(pr.data as PriceRow[]);
    if (sv.data) setServs(sv.data as ServiceRow[]);
    setLoading(false);
  }, [rpc]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  const reloadPrizes = useCallback(async () => {
    const { data } = await rpc('rps_admin_prizes');
    if (data) setCatalog(data as PrizeRow[]);
  }, [rpc]);

  const logout = async () => {
    if (token) await supabase.rpc('rps_admin_logout', { p_token: token });
    clearToken(); setToken(null); setAuthed(false);
  };

  const grant = async (id: string, delta: number) => {
    const { data } = await rpc('rps_admin_grant', { p_player: id, p_delta: delta });
    if (typeof data === 'number') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, balance: data as number } : u)));
    }
  };
  const removeUser = async (id: string, label: string) => {
    if (!window.confirm(`Видалити учасника «${label}»?\n\nБудуть стерті його акаунт, баланс, ставки та історія. Дію не можна скасувати.`)) return;
    const { error } = await rpc('rps_admin_delete_user', { p_player: id });
    if (error) { window.alert('Не вдалося видалити: ' + (error.message || '')); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const setRedStatus = async (id: number, status: string) => {
    await rpc('rps_admin_set_redemption', { p_id: id, p_status: status });
    setReds((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };
  const setReviewHidden = async (id: number, hidden: boolean) => {
    await rpc('rps_admin_set_review', { p_id: id, p_hidden: hidden });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
  };

  // --- Налаштування гри ---
  const [cfgSaved, setCfgSaved] = useState(false);
  const persistConfig = useCallback(async (next: Config) => {
    const clean: Config = {};
    Object.entries(next).forEach(([k, v]) => { clean[k] = Number(v) || 0; });
    await rpc('rps_admin_set_config', { p_data: clean });
    setCfgSaved(true);
    window.setTimeout(() => setCfgSaved(false), 2000);
  }, [rpc]);
  const saveConfig = () => persistConfig(config);

  // --- Таблиця виплат (35 раундів) ---
  const setScriptCell = (i: number, key: 'rk' | 'sc' | 'pp' | 'br' | 'bs' | 'bp', value: number) => {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    setScript((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  };
  const saveScript = async () => {
    await rpc('rps_admin_set_script', { p_rows: script });
    setScriptSaved(true);
    window.setTimeout(() => setScriptSaved(false), 2000);
  };

  // --- Прайс ---
  const setPriceCell = (i: number, key: keyof PriceRow, value: string | number | boolean) =>
    setPrices((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addPrice = () => setPrices((rows) => [...rows, { group_title: rows[rows.length - 1]?.group_title || 'Послуги', name: '', price: '', meta: '', sort: (rows[rows.length - 1]?.sort || 0) + 1, active: true }]);
  const savePrice = async (i: number) => {
    const r = prices[i];
    const { data } = await rpc('rps_admin_price_upsert', { p_id: r.id ?? null, p_group_title: r.group_title, p_name: r.name, p_price: r.price, p_meta: r.meta || null, p_sort: r.sort, p_active: r.active });
    if (typeof data === 'number' && !r.id) setPrices((rows) => rows.map((x, idx) => (idx === i ? { ...x, id: data as number } : x)));
  };
  const deletePrice = async (i: number) => {
    const r = prices[i];
    if (!window.confirm('Видалити рядок прайсу?')) return;
    if (r.id) await rpc('rps_admin_price_delete', { p_id: r.id });
    setPrices((rows) => rows.filter((_, idx) => idx !== i));
  };

  // --- Послуги ---
  const setServCell = (i: number, key: keyof ServiceRow, value: string | number | boolean) =>
    setServs((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addServ = () => setServs((rows) => [...rows, { title: '', category: '', short: '', details: '', cases: '', cases_title: '', image_url: '', video_url: '', poster_url: '', sort: (rows[rows.length - 1]?.sort || 0) + 10, active: true }]);
  const saveServ = async (i: number) => {
    const r = servs[i];
    const { data } = await rpc('rps_admin_service_upsert', {
      p_id: r.id ?? null, p_title: r.title, p_category: r.category || null, p_short: r.short || null, p_details: r.details || null,
      p_cases: r.cases || null, p_cases_title: r.cases_title || null, p_image_url: r.image_url || null, p_video_url: r.video_url || null,
      p_poster_url: r.poster_url || null, p_sort: r.sort, p_active: r.active,
    });
    if (typeof data === 'number' && !r.id) setServs((rows) => rows.map((x, idx) => (idx === i ? { ...x, id: data as number } : x)));
  };
  const deleteServ = async (i: number) => {
    const r = servs[i];
    if (!window.confirm('Видалити послугу?')) return;
    if (r.id) await rpc('rps_admin_service_delete', { p_id: r.id });
    setServs((rows) => rows.filter((_, idx) => idx !== i));
  };
  const applyPreset = (values: Config) => {
    const next = { ...config, ...values };
    setConfig(next);
    persistConfig(next);
  };

  // --- Каталог призів ---
  const [savingPrize, setSavingPrize] = useState(false);
  const upsertPrize = useCallback(async (p: Partial<PrizeRow>) => {
    return rpc('rps_admin_prize_upsert', {
      p_id: p.id ?? null,
      p_emoji: p.emoji ?? '🎁',
      p_title: p.title,
      p_cost: Number(p.cost) || 0,
      p_image_url: p.image_url ?? null,
      p_delivery_type: p.delivery_type ?? 'contact',
      p_delivery_url: p.delivery_url ?? null,
      p_delivery_label: p.delivery_label ?? null,
      p_active: p.active ?? true,
      p_sort: Number(p.sort) || 0,
    });
  }, [rpc]);

  const savePrize = async () => {
    if (!editPrize || !editPrize.title?.trim()) return;
    setSavingPrize(true);
    await upsertPrize(editPrize);
    await reloadPrizes();
    setSavingPrize(false);
    setEditPrize(null);
  };
  const deletePrize = async (id: number) => {
    if (!window.confirm('Видалити цей приз?')) return;
    await rpc('rps_admin_prize_delete', { p_id: id });
    setCatalog((prev) => prev.filter((p) => p.id !== id));
  };
  const togglePrizeActive = async (p: PrizeRow) => {
    setCatalog((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    await upsertPrize({ ...p, active: !p.active });
  };
  const duplicatePrize = (p: PrizeRow) => {
    setEditPrize({ ...p, id: undefined, title: `${p.title} (копія)`, sort: (catalog.at(-1)?.sort ?? 0) + 1 });
  };
  const movePrize = async (p: PrizeRow, dir: -1 | 1) => {
    const idx = catalog.findIndex((x) => x.id === p.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= catalog.length) return;
    const other = catalog[swapIdx];
    const next = [...catalog];
    next[idx] = { ...p, sort: other.sort };
    next[swapIdx] = { ...other, sort: p.sort };
    next.sort((a, b) => a.sort - b.sort || a.id - b.id);
    setCatalog(next);
    await Promise.all([upsertPrize({ ...p, sort: other.sort }), upsertPrize({ ...other, sort: p.sort })]);
  };

  const uploadImage = async (file: File) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('prizes').upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('prizes').getPublicUrl(path);
    return data.publicUrl;
  };

  const filtered = useMemo(() => users.filter((u) => {
    if (onlyAccounts && !u.is_account) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (u.nick || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.login || '').toLowerCase().includes(s);
  }), [users, q, onlyAccounts]);

  const visibleReds = useMemo(() => reds.filter((r) => orderFilter === 'all' || r.status === orderFilter), [reds, orderFilter]);
  const visibleReviews = useMemo(() => reviews.filter((r) => reviewFilter === 'all' || (reviewFilter === 'hidden' ? r.hidden : !r.hidden)), [reviews, reviewFilter]);

  if (authed === null) return <div className="grid min-h-screen place-items-center bg-slate-900 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!authed) return <Login onIn={(t) => setToken(t)} />;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'stats', label: 'Огляд', icon: BarChart3 },
    { id: 'users', label: 'Користувачі', icon: Users, badge: stats?.accounts },
    { id: 'orders', label: 'Заявки', icon: Gift, badge: stats?.redemptions_pending },
    { id: 'catalog', label: 'Призи', icon: Package, badge: catalog.length },
    { id: 'reviews', label: 'Відгуки', icon: MessageSquare, badge: stats?.reviews },
    { id: 'servs', label: 'Послуги', icon: HandHeart, badge: servs.length },
    { id: 'prices', label: 'Прайс', icon: Coins, badge: prices.length },
    { id: 'script', label: 'Таблиця гри', icon: Table2 },
    { id: 'settings', label: 'Гра / Турніри', icon: Settings },
    { id: 'tournaments', label: 'Турніри', icon: Trophy },
  ];
  const activeTab = tabs.find((t) => t.id === tab);

  return (
    <div className="min-h-screen bg-slate-100">
      {showChangePass && token && (
        <ChangePasswordModal token={token} onClose={() => setShowChangePass(false)} />
      )}

      {/* Шапка */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white"><ShieldCheck className="h-5 w-5" /></span>
            <span>Адмін-панель</span>
          </div>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
                title="Встановити як додаток"
              >
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Встановити</span>
              </button>
            )}
            <a href="/" className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 sm:flex">
              <ExternalLink className="h-4 w-4" /> На сайт
            </a>
            <button
              onClick={() => setShowChangePass(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              title="Змінити пароль"
            >
              <KeyRound className="h-4 w-4" /> <span className="hidden sm:inline">Пароль</span>
            </button>
            <button onClick={loadAll} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Оновити</span>
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>
        </div>
        {/* Вкладки — горизонтальний скрол лише на мобільному */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
          {tabs.map((t) => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {!!t.badge && <span className={`rounded-full px-1.5 text-xs ${tab === t.id ? 'bg-white/25' : 'bg-slate-200 text-slate-600'}`}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5">
        {/* Бічна навігація — лише десктоп */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-white'}`}
              >
                <t.icon className="h-5 w-5" /> <span className="flex-1 text-left">{t.label}</span>
                {!!t.badge && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.id ? 'bg-white/25' : 'bg-slate-200 text-slate-600'}`}>{t.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {activeTab && (
            <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <activeTab.icon className="h-6 w-6 text-emerald-600" /> {activeTab.label}
            </h1>
          )}

          {/* ОГЛЯД */}
          {tab === 'stats' && stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { label: 'Гравців усього', value: stats.players, icon: Users, c: 'text-sky-600 bg-sky-50' },
                { label: 'Зареєстрованих', value: stats.accounts, icon: Crown, c: 'text-emerald-600 bg-emerald-50' },
                { label: 'Монет в обігу', value: stats.coins, icon: Coins, c: 'text-amber-600 bg-amber-50' },
                { label: 'Призи в роботі', value: stats.redemptions_pending, icon: Gift, c: 'text-rose-600 bg-rose-50' },
                { label: 'Призів видано', value: stats.redemptions_total, icon: CheckCircle2, c: 'text-fuchsia-600 bg-fuchsia-50' },
                { label: 'Відгуків', value: stats.reviews, icon: MessageSquare, c: 'text-indigo-600 bg-indigo-50' },
                { label: 'Заявок (запис)', value: stats.bookings, icon: Check, c: 'text-teal-600 bg-teal-50' },
                { label: 'Призів у каталозі', value: catalog.length, icon: Package, c: 'text-violet-600 bg-violet-50' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.c}`}><s.icon className="h-5 w-5" /></span>
                  <div className="mt-3 text-2xl font-extrabold text-slate-900">{fmt(s.value)}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* КОРИСТУВАЧІ */}
          {tab === 'users' && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: пошта, нік, логін…" className="w-full bg-transparent text-sm outline-none" />
                </div>
                <button
                  onClick={() => setOnlyAccounts((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${onlyAccounts ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
                >
                  <Crown className="h-4 w-4" /> Лише акаунти
                </button>
              </div>
              <div className="grid gap-2.5 lg:grid-cols-2">
                {filtered.map((u) => <UserCard key={u.id} u={u} onGrant={grant} onDelete={removeUser} />)}
              </div>
              {filtered.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Нічого не знайдено.</p>}
            </div>
          )}

          {/* ЗАЯВКИ НА ПРИЗИ */}
          {tab === 'orders' && (
            <div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {([['all', 'Усі'], ['pending', 'В роботі'], ['issued', 'Видані']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setOrderFilter(k)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${orderFilter === k ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2.5 lg:grid-cols-2">
                {visibleReds.map((r) => {
                  const issued = r.status === 'issued';
                  return (
                    <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">{r.reward}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{r.nick} · {r.email || 'без пошти'} · {fmtDate(r.created)}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-600"><Coins className="h-3 w-3" />{fmt(r.cost)}</div>
                        </div>
                        <button
                          onClick={() => setRedStatus(r.id, issued ? 'pending' : 'issued')}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${issued ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          <Check className="h-4 w-4" /> {issued ? 'Видано' : 'Позначити виданим'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleReds.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Заявок немає.</p>}
            </div>
          )}

          {/* КАТАЛОГ ПРИЗІВ */}
          {tab === 'catalog' && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">Додавай призи з фото — їх одразу бачать гравці на сторінці «Призи».</p>
                <button
                  onClick={() => setEditPrize({ emoji: '🎁', title: '', cost: 0, delivery_type: 'contact', active: true, sort: (catalog.at(-1)?.sort ?? 0) + 1 })}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" /> Додати приз
                </button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {catalog.map((p, i) => (
                  <div key={p.id} className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ${p.active ? 'ring-slate-100' : 'ring-slate-200 opacity-60'}`}>
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-3xl">{p.emoji}</div>}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="truncate font-bold text-slate-900">{p.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-600"><Coins className="h-3 w-3" />{fmt(p.cost)}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        {p.delivery_type === 'link' ? <><Link2 className="h-3 w-3" /> посилання</> : <><MessageSquare className="h-3 w-3" /> заявка</>}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-1 pt-2">
                        <button onClick={() => setEditPrize(p)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"><Pencil className="h-3 w-3" /> Змінити</button>
                        <button onClick={() => togglePrizeActive(p)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200" title={p.active ? 'Сховати' : 'Показати'}>{p.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</button>
                        <button onClick={() => duplicatePrize(p)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200" title="Дублювати"><Copy className="h-3 w-3" /></button>
                        <button onClick={() => movePrize(p, -1)} disabled={i === 0} className="rounded-lg bg-slate-100 px-1.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30" title="Вище"><ArrowUp className="h-3 w-3" /></button>
                        <button onClick={() => movePrize(p, 1)} disabled={i === catalog.length - 1} className="rounded-lg bg-slate-100 px-1.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30" title="Нижче"><ArrowDown className="h-3 w-3" /></button>
                        <button onClick={() => deletePrize(p.id)} className="rounded-lg bg-rose-50 px-1.5 py-1 text-rose-600 hover:bg-rose-100" title="Видалити"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {catalog.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Призів ще немає — додай перший ☝️</p>}
            </div>
          )}

          {/* НАЛАШТУВАННЯ ГРИ / ТУРНІРИ */}
          {/* ПРАЙС */}
          {tab === 'prices' && (
            <div className="max-w-3xl space-y-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
                <h3 className="flex items-center gap-2 font-bold text-slate-900"><Coins className="h-5 w-5 text-emerald-600" /> Прайс</h3>
                <p className="mt-1 text-xs text-slate-500">Редагуй ціни — оновлюється і на сайті, і в боті. «Група» — заголовок секції.</p>
                <div className="mt-4 space-y-2.5">
                  {prices.map((r, i) => (
                    <div key={r.id ?? `n${i}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input value={r.group_title} onChange={(e) => setPriceCell(i, 'group_title', e.target.value)} placeholder="Група" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                        <input value={r.name} onChange={(e) => setPriceCell(i, 'name', e.target.value)} placeholder="Назва послуги" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                        <input value={r.price} onChange={(e) => setPriceCell(i, 'price', e.target.value)} placeholder="Ціна (напр. 700 або 200 / 500)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                        <input value={r.meta ?? ''} onChange={(e) => setPriceCell(i, 'meta', e.target.value)} placeholder="Підпис (необов.)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={r.active} onChange={(e) => setPriceCell(i, 'active', e.target.checked)} className="accent-emerald-600" /> активна</label>
                        <input type="number" value={r.sort} onChange={(e) => setPriceCell(i, 'sort', Number(e.target.value))} title="порядок" className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none" />
                        <button onClick={() => savePrice(i)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">Зберегти</button>
                        <button onClick={() => deletePrice(i)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addPrice} className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"><Plus className="h-4 w-4" /> Додати рядок</button>
              </div>
            </div>
          )}

          {/* ПОСЛУГИ */}
          {tab === 'servs' && (
            <div className="max-w-3xl space-y-3">
              <p className="text-xs text-slate-500">Редагуй послуги — оновлюється на сайті (картки) та в боті. Показання — кожне з нового рядка.</p>
              {servs.map((r, i) => (
                <div key={r.id ?? `n${i}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={r.title} onChange={(e) => setServCell(i, 'title', e.target.value)} placeholder="Назва" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
                    <input value={r.category ?? ''} onChange={(e) => setServCell(i, 'category', e.target.value)} placeholder="Категорія (бейдж)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                  </div>
                  <textarea value={r.short ?? ''} onChange={(e) => setServCell(i, 'short', e.target.value)} placeholder="Короткий опис (на картці)" rows={2} className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                  <textarea value={r.details ?? ''} onChange={(e) => setServCell(i, 'details', e.target.value)} placeholder="Повний опис (у вікні)" rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                  <textarea value={r.cases ?? ''} onChange={(e) => setServCell(i, 'cases', e.target.value)} placeholder="Показання (кожне з нового рядка)" rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input value={r.cases_title ?? ''} onChange={(e) => setServCell(i, 'cases_title', e.target.value)} placeholder="Заголовок показань (необов.)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                    <input value={r.image_url ?? ''} onChange={(e) => setServCell(i, 'image_url', e.target.value)} placeholder="URL фото (/images/...)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                    <input value={r.video_url ?? ''} onChange={(e) => setServCell(i, 'video_url', e.target.value)} placeholder="URL відео (необов.)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                    <input value={r.poster_url ?? ''} onChange={(e) => setServCell(i, 'poster_url', e.target.value)} placeholder="URL постера відео (необов.)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={r.active} onChange={(e) => setServCell(i, 'active', e.target.checked)} className="accent-emerald-600" /> активна</label>
                    <input type="number" value={r.sort} onChange={(e) => setServCell(i, 'sort', Number(e.target.value))} title="порядок" className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none" />
                    <button onClick={() => saveServ(i)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">Зберегти</button>
                    <button onClick={() => deleteServ(i)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <button onClick={addServ} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"><Plus className="h-4 w-4" /> Додати послугу</button>
            </div>
          )}

          {tab === 'script' && token && <GameTableTab token={token} />}

          {tab === 'settings' && (
            <div className="max-w-3xl space-y-4">
              {/* Пресети */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h3 className="flex items-center gap-2 font-bold text-slate-900"><Wand2 className="h-5 w-5 text-emerald-600" /> Швидкі пресети</h3>
                <p className="mt-1 text-xs text-slate-500">Один клік — і налаштування застосовані одразу. Зручно вмикати/вимикати турнір.</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => applyPreset(p.values)}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><p.icon className="h-5 w-5" /></span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-900">{p.label}</span>
                        <span className="block truncate text-xs text-slate-500">{p.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Групи налаштувань */}
              {SETTINGS_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900"><group.icon className="h-5 w-5 text-emerald-600" /> {group.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{group.hint}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {group.items.map(([k, label, def, desc]) => (
                      <label key={k} className="block">
                        <span className="text-xs font-semibold text-slate-600">{label}</span>
                        <input
                          type="number"
                          value={config[k] ?? def}
                          onChange={(e) => setConfig((c) => ({ ...c, [k]: Number(e.target.value) }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                        />
                        <span className="mt-1 block text-[11px] text-slate-400">{desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Збереження — липке знизу */}
              <div className="sticky bottom-3 z-10">
                <button onClick={saveConfig} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700">
                  {cfgSaved ? <><Check className="h-5 w-5" /> Збережено ✓</> : <><Save className="h-5 w-5" /> Зберегти всі налаштування</>}
                </button>
              </div>
            </div>
          )}

          {/* ВІДГУКИ */}
          {tab === 'reviews' && (
            <div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {([['all', 'Усі'], ['visible', 'Видимі'], ['hidden', 'Сховані']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setReviewFilter(k)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${reviewFilter === k ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2.5 lg:grid-cols-2">
                {visibleReviews.map((r) => (
                  <div key={r.id} className={`rounded-2xl p-4 shadow-sm ring-1 ${r.hidden ? 'bg-slate-50 ring-slate-200 opacity-70' : 'bg-white ring-slate-100'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.nick}</span>
                          <span className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{r.text}</p>
                        <div className="mt-0.5 text-[11px] text-slate-400">{fmtDate(r.created)}</div>
                      </div>
                      <button
                        onClick={() => setReviewHidden(r.id, !r.hidden)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                      >
                        {r.hidden ? <><Eye className="h-4 w-4" /> Показати</> : <><EyeOff className="h-4 w-4" /> Сховати</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {visibleReviews.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Відгуків немає.</p>}
            </div>
          )}

          {/* ТУРНІРИ */}
          {tab === 'tournaments' && token && <TournamentsTab token={token} users={users} />}
        </main>
      </div>

      {/* Редагування призу */}
      {editPrize && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditPrize(null)}>
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">{editPrize.id ? 'Редагувати приз' : 'Новий приз'}</h3>
              <button onClick={() => setEditPrize(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {/* Картинка */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {editPrize.image_url
                  ? <img src={editPrize.image_url} alt="" className="h-full w-full object-cover" />
                  : <ImageIcon className="h-7 w-7 text-slate-300" />}
              </div>
              <div className="flex-1">
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
                  <Upload className="h-4 w-4" /> Завантажити фото
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await uploadImage(f);
                    if (url) setEditPrize((p) => ({ ...p!, image_url: url }));
                    else window.alert('Не вдалося завантажити фото. Спробуй ще раз.');
                  }} />
                </label>
                {editPrize.image_url && (
                  <button onClick={() => setEditPrize((p) => ({ ...p!, image_url: null }))} className="mt-1.5 w-full text-center text-xs text-rose-500 hover:underline">Прибрати фото</button>
                )}
                <p className="mt-1 text-center text-[11px] text-slate-400">Якщо фото нема — покажемо емодзі.</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Емодзі</span>
                <input value={editPrize.emoji ?? ''} onChange={(e) => setEditPrize((p) => ({ ...p!, emoji: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-center text-sm outline-none focus:border-emerald-400 focus:bg-white" />
              </label>
              <label className="col-span-3 block">
                <span className="text-xs font-medium text-slate-500">Назва</span>
                <input value={editPrize.title ?? ''} onChange={(e) => setEditPrize((p) => ({ ...p!, title: e.target.value }))} placeholder="напр. Балансир-дошка" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
              </label>
              <label className="col-span-2 block">
                <span className="text-xs font-medium text-slate-500">Ціна (монет)</span>
                <input type="number" value={editPrize.cost ?? 0} onChange={(e) => setEditPrize((p) => ({ ...p!, cost: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
              </label>
              <label className="col-span-2 block">
                <span className="text-xs font-medium text-slate-500">Порядок</span>
                <input type="number" value={editPrize.sort ?? 0} onChange={(e) => setEditPrize((p) => ({ ...p!, sort: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs font-medium text-slate-500">Видача після покупки</span>
              <select value={editPrize.delivery_type ?? 'contact'} onChange={(e) => setEditPrize((p) => ({ ...p!, delivery_type: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white">
                <option value="contact">Спеціаліст зв'яжеться (заявка)</option>
                <option value="link">Показати посилання (напр. ТГ-канал)</option>
              </select>
            </label>
            {editPrize.delivery_type === 'link' && (
              <div className="mt-2 space-y-2">
                <input value={editPrize.delivery_url ?? ''} onChange={(e) => setEditPrize((p) => ({ ...p!, delivery_url: e.target.value }))} placeholder="Посилання (https://t.me/...)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                <input value={editPrize.delivery_label ?? ''} onChange={(e) => setEditPrize((p) => ({ ...p!, delivery_label: e.target.value }))} placeholder="Напис на кнопці (напр. Відкрити курс)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
              </div>
            )}

            <label className="mt-3 flex cursor-pointer items-center gap-2 select-none">
              <input type="checkbox" checked={editPrize.active ?? true} onChange={(e) => setEditPrize((p) => ({ ...p!, active: e.target.checked }))} className="h-4 w-4 rounded accent-emerald-600" />
              <span className="text-sm text-slate-600">Показувати на сайті</span>
            </label>

            <button onClick={savePrize} disabled={savingPrize || !editPrize.title?.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {savingPrize ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Зберегти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
