import { buildCourseAccessEmail, normalizeOrigin, sendTransactionalEmail } from './_mail.js';
import { tgNotifyAdmins } from './_tg.js';
import { rpc, s } from './_wfp.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const COURSE_GROUP_URL = 'https://t.me/+o9i9tJpoj4A3MTcy';

// Лист доступу до курсу — для оплати МОНЕТАМИ (грошова оплата шле лист у
// wayforpay-return). Викликається з фронту після списання монет.
// POST { playerId, email?, name?, courseName?, amountUah? }
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const playerId = s(body.playerId);
    let email = s(body.email).trim().toLowerCase();
    // Якщо email не передали — беремо з акаунта гравця.
    if (!EMAIL_RE.test(email) && /^[0-9a-fA-F-]{8,40}$/.test(playerId)) {
      email = s(await rpc('rps_player_email', { p_id: playerId })).trim().toLowerCase();
    }
    if (!EMAIL_RE.test(email)) {
      // Немає пошти (гість) — не помилка, просто немає куди слати.
      return res.status(200).json({ ok: false, reason: 'no email' });
    }

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const profileUrl = origin ? `${origin}/#/profile` : '/#/profile';
    const bannerUrl = origin ? `${origin}/images/email/course-banner.svg` : '';

    const { subject, html, text } = buildCourseAccessEmail({
      name: s(body.name) || '',
      courseName: s(body.courseName) || 'Курс з йоги (онлайн)',
      amountUah: Number(body.amountUah) || 0,
      courseUrl: COURSE_GROUP_URL,
      profileUrl,
      supportEmail: process.env.COURSE_SUPPORT_EMAIL || 'support@example.com',
      bannerUrl,
    });

    await sendTransactionalEmail({ to: email, subject, html, text });
    try {
      await tgNotifyAdmins(`🧘 <b>Оплата курсу (монети)</b>\n\n👤 ${s(body.name) || '—'}\n📧 ${email}\n🎓 ${s(body.courseName) || 'Курс з йоги'}`);
    } catch (e) { console.error('[send-course-access] tg ERR:', e.message); }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-course-access] ERR:', err.message);
    return res.status(500).json({ error: 'send failed' });
  }
}
