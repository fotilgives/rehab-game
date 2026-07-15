import { parseBody, confirmAndCredit, checkStatus, rpc, s, WFP_DOMAIN } from './_wfp.js';
import { buildCourseAccessEmail, normalizeOrigin, sendTransactionalEmail } from './_mail.js';

const COURSE_GROUP_URL = 'https://t.me/+o9i9tJpoj4A3MTcy';

/**
 * returnUrl — куди WayForPay повертає користувача (POST) після оплати.
 *
 * Для поповнення монет це ще й ЗАПАСНИЙ шлях зарахування: навіть якщо
 * server-to-server колбек (serviceUrl) не спрацював, ми тут підтверджуємо
 * оплату напряму в WayForPay (CHECK_STATUS) і зараховуємо монети ідемпотентно.
 */
export default async function handler(req, res) {
  let to = '';
  try {
    to = new URL(req.url, 'http://localhost').searchParams.get('to') || '';
  } catch {
    to = '';
  }

  if (to === 'course') {
    // Якщо оплату курсу підтверджено — скидаємо таймер «таяння» гравцю
    // (playerId зашитий у orderReference: COURSE_<playerId>_<ts>).
    try {
      const body = await parseBody(req);
      const ref = s(body.orderReference);
      const pid = ref.split('_')[1] || '';
      if (ref.startsWith('COURSE_') && /^[0-9a-fA-F-]{8,40}$/.test(pid) && pid !== 'anon') {
        const st = await checkStatus(ref);
        if (st && st.status === 'Approved') {
          await rpc('rps_touch_activity', { p_id: pid });
          const order = await rpc('rps_course_order_mark_paid', { p_order_reference: ref });
          const current = order || (await rpc('rps_course_order_by_ref', { p_order_reference: ref }));
          const email = s(current?.email || body.clientEmail || body.email || body.customerEmail);
          const alreadyEmailed = s(current?.status) === 'emailed' || !!current?.emailed_at;
          if (email && !alreadyEmailed) {
            const origin = normalizeOrigin(WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
            const profileUrl = origin ? `${origin}/#/profile` : '/#/profile';
            const bannerUrl = origin ? `${origin}/images/email/course-banner.svg` : '';
            const courseName = s(current?.course_name) || 'Курс з йоги (онлайн)';
            const amountUah = Number(current?.amount_uah || 2500);
            const { subject, html, text } = buildCourseAccessEmail({
              name: s(current?.name) || '',
              courseName,
              amountUah,
              courseUrl: COURSE_GROUP_URL,
              profileUrl,
              supportEmail: process.env.COURSE_SUPPORT_EMAIL || 'support@example.com',
              bannerUrl,
            });
            try {
              await sendTransactionalEmail({
                to: email,
                subject,
                html,
                text,
              });
              await rpc('rps_course_order_mark_emailed', { p_order_reference: ref });
              try {
                const { tgNotifyAdmins } = await import('./_tg.js');
                await tgNotifyAdmins(`🧘 <b>Оплата курсу (гроші)</b>\n\n👤 ${s(current?.name) || '—'}\n📧 ${email}\n🎓 ${courseName}\n💳 ${amountUah} грн`);
              } catch (tgErr) { console.error('[wfp-return course] tg ERR:', tgErr.message); }
            } catch (mailErr) {
              console.error('[wfp-return course] mail ERR:', mailErr.message);
            }
          } else if (!email) {
            console.warn('[wfp-return course] no email for order', ref);
          }
        }
      }
    } catch (e) {
      console.error('[wfp-return course] ERR:', e.message);
    }
    // Після оплати ведемо людину одразу в Telegram-групу курсу (видає доступ/відео).
    res.writeHead(302, { Location: COURSE_GROUP_URL });
    res.end();
    return;
  }

  if (to === 'topup') {
    try {
      const body = await parseBody(req);
      await confirmAndCredit(body, 'return');
    } catch (e) {
      console.error('[wfp-return] ERR:', e.message);
    }
    res.writeHead(302, { Location: '/?topup=thanks' });
    res.end();
    return;
  }

  res.writeHead(302, { Location: '/?donate=thanks' });
  res.end();
}
