import { buildBookingEmail, buildPrizeEmail, buildOwnerNotice, normalizeOrigin, sendTransactionalEmail } from './_mail.js';
import { tgNotifyAdmins } from './_tg.js';
import { rpc, s } from './_wfp.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Єдиний ендпоінт сповіщень.
//  POST { type:'booking', name, phone, email?, service?, note? }
//  POST { type:'redeem',  playerId, reward, cost, nickname? }
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';
    const supportEmail = process.env.COURSE_SUPPORT_EMAIL || 'support@example.com';
    const owner = process.env.NOTIFY_EMAIL || process.env.COURSE_SUPPORT_EMAIL || process.env.GMAIL_USER;
    const sendOwner = async (notice) => {
      if (!owner) return;
      try { await sendTransactionalEmail({ to: owner, subject: notice.subject, html: notice.html, text: notice.text }); }
      catch (e) { console.error('[notify] owner mail ERR:', e.message); }
    };

    const type = s(body.type) || 'booking';

    if (type === 'redeem') {
      const playerId = s(body.playerId);
      const reward = s(body.reward);
      const cost = Number(body.cost);
      const nickname = s(body.nickname);
      const code = s(body.code);
      const profileUrl = origin ? `${origin}/#/profile` : '';

      let email = '';
      if (/^[0-9a-fA-F-]{8,40}$/.test(playerId)) {
        email = s(await rpc('rps_player_email', { p_id: playerId })).trim().toLowerCase();
      }
      if (EMAIL_RE.test(email)) {
        const m = buildPrizeEmail({ name: nickname, reward, cost: Number.isFinite(cost) ? cost : undefined, code, profileUrl, supportEmail, bannerUrl });
        try { await sendTransactionalEmail({ to: email, subject: m.subject, html: m.html, text: m.text }); }
        catch (e) { console.error('[notify] redeem client mail ERR:', e.message); }
      }
      await sendOwner(buildOwnerNotice({
        title: '🎁 Новий обмін на приз',
        rows: [['Гравець', nickname || playerId || '—'], ['Email', email || '— (гість)'], ['Приз', reward || '—'], ['Код', code || '—'], ['Списано монет', Number.isFinite(cost) ? String(cost) : '—']],
      }));
      try { await tgNotifyAdmins(`🎁 <b>Новий обмін на приз</b>\n\n👤 ${nickname || playerId || '—'}\n📧 ${email || '— (гість)'}\n🏆 ${reward || '—'}\n🎟️ Код: <b>${code || '—'}</b>\n🪙 ${Number.isFinite(cost) ? cost : '—'} монет`); }
      catch (e) { console.error('[notify] redeem tg ERR:', e.message); }
      return res.status(200).json({ ok: true });
    }

    // type === 'booking'
    const name = s(body.name).trim();
    const phone = s(body.phone).trim();
    const email = s(body.email).trim().toLowerCase();
    const service = s(body.service).trim();
    const date = s(body.date || body.when).trim();
    const note = s(body.note).trim();

    if (EMAIL_RE.test(email)) {
      const m = buildBookingEmail({ name, service, phone, date, appUrl: origin, supportEmail, bannerUrl });
      try { await sendTransactionalEmail({ to: email, subject: m.subject, html: m.html, text: m.text }); }
      catch (e) { console.error('[notify] booking client mail ERR:', e.message); }
    }
    await sendOwner(buildOwnerNotice({
      title: '🗓️ Новий запис на послугу',
      rows: [
        ['Імʼя', name || '—'],
        ['Телефон', phone || '—'],
        ['Email', email || '—'],
        ['Послуга', service || '—'],
        date ? ['Бажана дата', date] : null,
        ['Коментар', note || '—'],
      ].filter(Boolean),
    }));
    try {
      const dateStr = date ? `\n📅 <b>Дата:</b> ${date}` : '';
      await tgNotifyAdmins(`🗓️ <b>Новий запис (сайт)</b>\n\n👤 ${name || '—'}\n📞 ${phone || '—'}\n📧 ${email || '—'}\n🤲 ${service || '—'}${dateStr}${note ? `\n📝 ${note}` : ''}`);
    } catch (e) { console.error('[notify] booking tg ERR:', e.message); }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify] ERR:', err.message);
    return res.status(500).json({ error: 'notify failed' });
  }
}
