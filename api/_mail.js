import nodemailer from 'nodemailer';


export function normalizeOrigin(domain) {
  const raw = String(domain || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
  return `https://${raw.replace(/\/+$/, '')}`;
}

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCourseAccessEmail({
  name,
  courseName,
  amountUah,
  courseUrl,
  profileUrl,
  supportEmail,
  bannerUrl,
}) {
  const safeName = escapeHtml(name || 'друже');
  const safeCourse = escapeHtml(courseName || 'Курс з йоги');
  const safeSupport = escapeHtml(supportEmail || 'support@example.com');
  const prettyAmount = Number.isFinite(amountUah) ? `${amountUah.toLocaleString('uk-UA')} грн` : '';
  const text = [
    `Вітаємо, ${name || 'друже'}!`,
    '',
    `Оплату за "${courseName || 'Курс з йоги'}" підтверджено.`,
    prettyAmount ? `Сума: ${prettyAmount}` : '',
    `Доступ: ${courseUrl || ''}`,
    `Історія покупок: ${profileUrl || ''}`,
    `Підтримка: ${supportEmail || ''}`,
  ].filter(Boolean).join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f0fdfa;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px 40px;">
      <div style="background:#ffffff;border:1px solid rgba(16,185,129,.12);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.08);">
        <div style="background:linear-gradient(135deg,#047857 0%,#0f766e 55%,#14b8a6 100%);padding:0;">
          <img src="${bannerUrl || ''}" alt="" width="720" style="display:block;width:100%;max-width:720px;height:auto;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:32px 28px 30px;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;letter-spacing:.02em;">Оплату підтверджено</div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.1;font-weight:800;color:#0f172a;">Доступ до курсу відкрито</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#475569;">Вітаємо, ${safeName}. Дякуємо за покупку <strong>${safeCourse}</strong>. Нижче — швидкий доступ до чату курсу та історії покупок.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 12px;margin:0 0 20px;">
            <tr>
              <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:16px 18px;">
                <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Курс</div>
                <div style="margin-top:4px;font-size:17px;font-weight:800;color:#0f172a;">${safeCourse}</div>
                ${prettyAmount ? `<div style="margin-top:4px;font-size:13px;color:#64748b;">Оплачено: ${escapeHtml(prettyAmount)}</div>` : ''}
              </td>
            </tr>
          </table>

          <div style="display:flex;flex-wrap:wrap;gap:12px;margin:6px 0 24px;">
            <a href="${courseUrl || '#'}" style="display:inline-block;padding:14px 18px;border-radius:16px;background:#059669;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 14px 30px rgba(5,150,105,.22);">Відкрити курс у Telegram →</a>
            <a href="${profileUrl || '#'}" style="display:inline-block;padding:14px 18px;border-radius:16px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-weight:800;font-size:15px;">Переглянути історію покупок</a>
          </div>

          <div style="padding:16px 18px;border-radius:20px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:700;color:#0f766e;">Підтримка та підтвердження</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#475569;">Якщо лист не дійшов або виникло питання, просто відповідай на цей лист або пиши на <a href="mailto:${safeSupport}" style="color:#059669;text-decoration:none;font-weight:700;">${safeSupport}</a>.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return { subject: `Підтвердження покупки — ${courseName || 'Курс з йоги'}`, html, text };
}

export function buildWelcomeEmail({ name, appUrl, supportEmail, bannerUrl }) {
  const safeName = escapeHtml(name || 'друже');
  const safeSupport = escapeHtml(supportEmail || 'support@example.com');
  const url = appUrl || 'https://reabilitolog-play.vercel.app';
  const text = [
    `Вітаємо в RehabPlay, ${name || 'друже'}!`,
    '',
    'Акаунт створено. Заходь, грай і відновлюйся разом з нами.',
    `Відкрити застосунок: ${url}`,
    `Підтримка: ${supportEmail || ''}`,
  ].filter(Boolean).join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f0fdfa;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px 40px;">
      <div style="background:#ffffff;border:1px solid rgba(16,185,129,.12);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.08);">
        <div style="background:linear-gradient(135deg,#047857 0%,#0f766e 55%,#14b8a6 100%);padding:0;">
          <img src="${bannerUrl || ''}" alt="" width="720" style="display:block;width:100%;max-width:720px;height:auto;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:32px 28px 30px;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;letter-spacing:.02em;">Ласкаво просимо</div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.1;font-weight:800;color:#0f172a;">Вітаємо в RehabPlay 🌿</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#475569;">Привіт, ${safeName}! Твій акаунт створено. RehabPlay — це ігри, що допомагають відновлюватись і тримати тонус. Заходь, грай і вигравай монети.</p>

          <div style="display:flex;flex-wrap:wrap;gap:12px;margin:6px 0 24px;">
            <a href="${url}" style="display:inline-block;padding:14px 18px;border-radius:16px;background:#059669;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 14px 30px rgba(5,150,105,.22);">Почати грати →</a>
          </div>

          <div style="padding:16px 18px;border-radius:20px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:700;color:#0f766e;">Потрібна допомога?</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#475569;">Просто відповідай на цей лист або пиши на <a href="mailto:${safeSupport}" style="color:#059669;text-decoration:none;font-weight:700;">${safeSupport}</a>.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return { subject: 'Вітаємо в RehabPlay 🌿', html, text };
}

export function buildTopupReceiptEmail({ name, coins, amountUah, appUrl, supportEmail, bannerUrl }) {
  const safeName = escapeHtml(name || 'друже');
  const safeSupport = escapeHtml(supportEmail || 'support@example.com');
  const url = appUrl || 'https://reabilitolog-play.vercel.app';
  const prettyCoins = Number.isFinite(coins) ? coins.toLocaleString('uk-UA') : '';
  const prettyAmount = Number.isFinite(amountUah) && amountUah > 0 ? `${amountUah.toLocaleString('uk-UA')} грн` : '';
  const text = [
    `Вітаємо, ${name || 'друже'}!`,
    '',
    `Оплату отримано. Зараховано ${prettyCoins} монет на ваш баланс.`,
    prettyAmount ? `Сума: ${prettyAmount}` : '',
    `Грати: ${url}`,
    `Підтримка: ${supportEmail || ''}`,
  ].filter(Boolean).join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f0fdfa;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px 40px;">
      <div style="background:#ffffff;border:1px solid rgba(16,185,129,.12);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.08);">
        <div style="background:linear-gradient(135deg,#047857 0%,#0f766e 55%,#14b8a6 100%);padding:0;">
          <img src="${bannerUrl || ''}" alt="" width="720" style="display:block;width:100%;max-width:720px;height:auto;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:32px 28px 30px;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;letter-spacing:.02em;">Оплату підтверджено</div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.1;font-weight:800;color:#0f172a;">Монети зараховано 🪙</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#475569;">Вітаємо, ${safeName}. Дякуємо за поповнення! Монети вже на вашому балансі.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 12px;margin:0 0 20px;">
            <tr>
              <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:16px 18px;">
                <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Зараховано</div>
                <div style="margin-top:4px;font-size:22px;font-weight:800;color:#0f172a;">${escapeHtml(prettyCoins)} монет</div>
                ${prettyAmount ? `<div style="margin-top:4px;font-size:13px;color:#64748b;">Оплачено: ${escapeHtml(prettyAmount)}</div>` : ''}
              </td>
            </tr>
          </table>

          <div style="display:flex;flex-wrap:wrap;gap:12px;margin:6px 0 24px;">
            <a href="${url}" style="display:inline-block;padding:14px 18px;border-radius:16px;background:#059669;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 14px 30px rgba(5,150,105,.22);">Грати далі →</a>
          </div>

          <div style="padding:16px 18px;border-radius:20px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:700;color:#0f766e;">Підтримка</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#475569;">Питання? Просто відповідай на цей лист або пиши на <a href="mailto:${safeSupport}" style="color:#059669;text-decoration:none;font-weight:700;">${safeSupport}</a>.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return { subject: 'Оплату отримано — монети зараховано 🪙', html, text };
}

function shell({ bannerUrl, badge, title, intro, rows, buttons, footerNote, supportEmail }) {
  const safeSupport = escapeHtml(supportEmail || 'support@example.com');
  const rowsHtml = (rows || []).filter(Boolean).map((r) => `
    <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(r[0])}</div>
      <div style="margin-top:3px;font-size:16px;font-weight:800;color:#0f172a;">${escapeHtml(r[1])}</div>
    </td></tr>`).join('<tr><td style="height:10px;"></td></tr>');
  const btnsHtml = (buttons || []).map((b) => `
    <a href="${b.href || '#'}" style="display:inline-block;margin:0 8px 8px 0;padding:13px 18px;border-radius:14px;background:${b.primary ? '#059669' : '#eff6ff'};color:${b.primary ? '#ffffff' : '#1d4ed8'};text-decoration:none;font-weight:800;font-size:15px;">${escapeHtml(b.label)}</a>`).join('');
  return `
  <div style="margin:0;padding:0;background:#f0fdfa;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:24px 16px 36px;">
      <div style="background:#ffffff;border:1px solid rgba(16,185,129,.12);border-radius:26px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.08);">
        ${bannerUrl ? `<div style="background:linear-gradient(135deg,#047857,#0f766e 55%,#14b8a6);"><img src="${bannerUrl}" alt="" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;" /></div>` : ''}
        <div style="padding:30px 26px 28px;">
          ${badge ? `<div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;">${escapeHtml(badge)}</div>` : ''}
          <h1 style="margin:16px 0 10px;font-size:26px;line-height:1.15;font-weight:800;color:#0f172a;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#475569;">${intro}</p>
          ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${rowsHtml}</table>` : ''}
          ${btnsHtml ? `<div style="margin:4px 0 20px;">${btnsHtml}</div>` : ''}
          <div style="padding:14px 16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${footerNote || `Маєш питання? Просто відповідай на цей лист або пиши на <a href="mailto:${safeSupport}" style="color:#059669;font-weight:700;text-decoration:none;">${safeSupport}</a>.`}</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function buildBookingEmail({ name, service, phone, date, appUrl, supportEmail, bannerUrl }) {
  const safeName = name || 'друже';
  const svc = service || 'консультацію';
  const text = [
    `Вітаємо, ${safeName}!`, '',
    `Ми отримали вашу заявку на: ${svc}.`,
    date ? `Бажана дата візиту: ${date}` : '',
    phone ? `Ми зателефонуємо на ${phone}, щоб узгодити точний час.` : 'Ми звʼяжемося з вами найближчим часом.',
    appUrl ? `Сайт: ${appUrl}` : '',
    supportEmail ? `Підтримка: ${supportEmail}` : '',
  ].filter(Boolean).join('\n');
  const html = shell({
    bannerUrl, supportEmail,
    badge: 'Заявку прийнято 🗓️',
    title: 'Дякуємо за запис! 🌿',
    intro: `Вітаємо, <strong>${escapeHtml(safeName)}</strong>! Ми успішно отримали вашу заявку та незабаром звʼяжемося з вами, щоб підібрати та узгодити точний час візиту.`,
    rows: [
      ['Напрямок / Послуга', svc],
      date ? ['Бажана дата візиту', date] : null,
      phone ? ['Ваш телефон', phone] : null,
    ].filter(Boolean),
    buttons: appUrl ? [{ label: 'Перейти на сайт', href: appUrl, primary: true }] : [],
    footerNote: 'Якщо плани зміняться — просто відповідайте на цей лист. До зустрічі у Центрі розвитку та реабілітації 💚',
  });
  return { subject: `Заявку прийнято — ${svc}`, html, text };
}

export function buildPrizeEmail({ name, reward, cost, code, profileUrl, supportEmail, bannerUrl }) {
  const safeName = name || 'друже';
  const text = [
    `Вітаємо, ${safeName}!`, '',
    `Ви оформили приз: ${reward}.`,
    Number.isFinite(cost) ? `Списано: ${cost} монет.` : '',
    code ? `Код для отримання: ${code}` : '',
    'Покажіть цей код спеціалісту центру, щоб скористатися призом.',
    profileUrl ? `Історія: ${profileUrl}` : '',
  ].filter(Boolean).join('\n');
  const html = shell({
    bannerUrl, supportEmail,
    badge: 'Приз оформлено',
    title: 'Вітаємо з призом! 🎁',
    intro: `Чудово, <strong>${escapeHtml(safeName)}</strong>! Ви обміняли монети на приз. Покажіть код нижче спеціалісту центру, щоб ним скористатися.`,
    rows: [
      ['Приз', reward || 'Винагорода'],
      code ? ['Код для отримання', code] : null,
      Number.isFinite(cost) ? ['Списано монет', String(cost)] : null,
    ].filter(Boolean),
    buttons: profileUrl ? [{ label: 'Мої призи', href: profileUrl }] : [],
  });
  return { subject: `Приз оформлено — ${reward || 'винагорода'}`, html, text };
}

export function buildOwnerNotice({ title, rows }) {
  const text = [title, '', ...(rows || []).map((r) => `${r[0]}: ${r[1]}`)].join('\n');
  const html = shell({
    title,
    intro: 'Нове сповіщення з сайту 👇',
    rows: rows || [],
    footerNote: 'Це автоматичне сповіщення з сайту.',
  });
  return { subject: title, html, text };
}

export async function sendTransactionalEmail({ to, subject, html, text }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const from = process.env.GMAIL_FROM || user;
  if (!user) throw new Error('GMAIL_USER is not configured');
  if (!pass) throw new Error('GMAIL_APP_PASSWORD is not configured');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
