import { rpc, s, WFP_MERCHANT, WFP_DOMAIN, wfpSign, wfpConfigured } from './_wfp.js';

/**
 * Створення платежу WayForPay за онлайн-курс йоги (фіксована ціна).
 * Контакти покупця (email/телефон/імʼя) передаються у WayForPay — він надсилає
 * квитанцію на пошту, а в кабінеті мерчанта видно замовлення з контактами.
 * Після оплати WayForPay повертає користувача на returnUrl (?to=course),
 * звідки ми перекидаємо його в Telegram-бот курсу.
 */
const COURSE_PRICE = 2500;
const COURSE_NAME = 'Курс з йоги (онлайн)';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const name = s(body.name).slice(0, 60);
    const email = s(body.email).slice(0, 80);
    const phone = s(body.phone).replace(/[^\d+]/g, '').slice(0, 20);
    const playerId = s(body.playerId).slice(0, 40);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Вкажіть коректний e-mail для доступу до курсу.' });
    }
    if (!/^[0-9a-fA-F-]{8,40}$/.test(playerId)) {
      return res.status(400).json({ error: 'Невірний ідентифікатор акаунта.' });
    }
    if (phone.replace(/\D/g, '').length < 9) {
      return res.status(400).json({ error: 'Вкажіть коректний номер телефону.' });
    }

    // playerId зашитий у orderReference, щоб після оплати скинути таймер «таяння».
    const pidPart = /^[0-9a-fA-F-]{8,40}$/.test(playerId) ? playerId : 'anon';
    const orderRef = `COURSE_${pidPart}_${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = 'UAH';

    if (!wfpConfigured())
      return res.status(500).json({ error: 'Платіжний сервіс ще не налаштований. Додайте WFP_MERCHANT_SECRET у Vercel.' });

    const merchant = WFP_MERCHANT;
    const domain = WFP_DOMAIN;
    const sigStr = [
      merchant, domain, orderRef, String(orderDate),
      String(COURSE_PRICE), currency, COURSE_NAME, '1', String(COURSE_PRICE),
    ].join(';');
    const signature = wfpSign(sigStr);

    const origin = `https://${domain}`;
    const fields = {
      merchantAccount: merchant,
      merchantDomainName: domain,
      merchantSignature: signature,
      orderReference: orderRef,
      orderDate: String(orderDate),
      amount: String(COURSE_PRICE),
      currency,
      productName: [COURSE_NAME],
      productCount: ['1'],
      productPrice: [String(COURSE_PRICE)],
      language: 'UA',
      returnUrl: `${origin}/api/wayforpay-return?to=course`,
      serviceUrl: `${origin}/api/wayforpay-callback`,
    };
    if (name) fields.clientFirstName = name;
    if (email) fields.clientEmail = email;
    if (phone) fields.clientPhone = phone;

    await rpc('rps_course_order_upsert', {
      p_order_reference: orderRef,
      p_player_id: playerId,
      p_email: email,
      p_name: name || null,
      p_phone: phone || null,
      p_course_name: COURSE_NAME,
      p_amount_uah: COURSE_PRICE,
      p_telegram_url: 'https://t.me/+o9i9tJpoj4A3MTcy',
    });

    return res.status(200).json({ action: 'https://secure.wayforpay.com/pay', fields });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `[DEBUG] ${msg}` });
  }
}
