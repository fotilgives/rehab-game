import crypto from 'node:crypto';

/**
 * Створення платежу WayForPay для благодійного внеску (донат).
 *
 * БЕЗПЕКА: секретний ключ мерчанта читається ВИКЛЮЧНО зі змінної оточення
 * `WFP_MERCHANT_SECRET` на сервері (Vercel → Settings → Environment Variables)
 * і ніколи не потрапляє у браузер. Підпис формується тут, на сервері.
 */
const ACCOUNT = process.env.WFP_MERCHANT_ACCOUNT || 'freelance_user_69089df759268';
const SECRET = process.env.WFP_MERCHANT_SECRET;
const DOMAIN = process.env.WFP_DOMAIN || 'reabilitolog-play.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!SECRET) {
    res.status(500).json({
      error: 'Платіжний сервіс ще не налаштований. Додайте змінну оточення WFP_MERCHANT_SECRET у Vercel.',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  let amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    res.status(400).json({ error: 'Вкажіть коректну суму внеску.' });
    return;
  }
  amount = Math.min(Math.round(amount), 100000); // ціла сума у грн, розумний ліміт
  const amountStr = String(amount);

  const name = String(body.name || '').slice(0, 60);
  const email = String(body.email || '').slice(0, 80);

  const orderReference = `DON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const currency = 'UAH';
  const productName = ['Благодійний внесок (донат)'];
  const productCount = [1];
  const productPrice = [amount];

  // Рядок підпису згідно з документацією WayForPay (Purchase).
  const signSource = [
    ACCOUNT,
    DOMAIN,
    orderReference,
    String(orderDate),
    amountStr,
    currency,
    ...productName,
    ...productCount.map(String),
    ...productPrice.map(String),
  ].join(';');
  const merchantSignature = crypto.createHmac('md5', SECRET).update(signSource, 'utf8').digest('hex');

  const origin = `https://${DOMAIN}`;
  const fields = {
    merchantAccount: ACCOUNT,
    merchantDomainName: DOMAIN,
    merchantSignature,
    orderReference,
    orderDate,
    amount: amountStr,
    currency,
    productName,
    productCount,
    productPrice,
    language: 'UA',
    returnUrl: `${origin}/api/wayforpay-return`,
    serviceUrl: `${origin}/api/wayforpay-callback`,
  };
  if (name) fields.clientFirstName = name;
  if (email) fields.clientEmail = email;

  res.status(200).json({ action: 'https://secure.wayforpay.com/pay', fields });
}
