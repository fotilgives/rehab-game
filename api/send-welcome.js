import { buildWelcomeEmail, normalizeOrigin, sendTransactionalEmail } from './_mail.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const email = String(body.email || '').trim();
    const name = String(body.name || '').trim();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'bad email' });

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';

    const { subject, html, text } = buildWelcomeEmail({
      name,
      appUrl: origin || 'https://reabilitolog-play.vercel.app',
      supportEmail: process.env.COURSE_SUPPORT_EMAIL || 'support@example.com',
      bannerUrl,
    });

    await sendTransactionalEmail({ to: email, subject, html, text });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-welcome] ERR:', err.message);
    return res.status(500).json({ error: 'send failed' });
  }
}
