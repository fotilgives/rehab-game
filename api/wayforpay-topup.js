import { rpc, WFP_MERCHANT, WFP_DOMAIN, wfpSign, wfpConfigured } from './_wfp.js';

// Фіксовані пакети — лише сума у грн; монети рахуються з курсу coin_rate.
const PACKAGE_AMOUNTS = { p50: 50, p100: 100, p200: 200, p500: 500 };

// Тестовий пакет вимкнено (лишаємо мапу порожньою — клієнт його більше не шле).
const TEST_PACKAGES = {};

// Курс монет (1 грн = N балів) задається в адмінці — rps_config.coin_rate. Дефолт 5.
const DEFAULT_COIN_RATE = 5;
const CUSTOM_MIN_UAH = 1;
const CUSTOM_MAX_UAH = 100000;

// Поточний курс із БД; стійко до помилок — падаємо на дефолт.
async function getCoinRate() {
  try {
    const v = Number(await rpc('rps_cfg', { p_key: 'coin_rate', p_default: DEFAULT_COIN_RATE }));
    if (Number.isFinite(v) && v >= 1) return Math.floor(v);
  } catch {
    /* ignore — використаємо дефолт */
  }
  return DEFAULT_COIN_RATE;
}

// Пакет для оплати: або фіксований (packageId), або довільна сума (amount у грн).
function resolvePackage(body, rate) {
  const custom = Number(body.amount);
  if (Number.isFinite(custom) && custom >= CUSTOM_MIN_UAH) {
    const amount = Math.floor(custom);
    if (amount > CUSTOM_MAX_UAH) return null;
    return { amount, coins: amount * rate };
  }
  if (TEST_PACKAGES[body.packageId]) return TEST_PACKAGES[body.packageId];
  const amount = PACKAGE_AMOUNTS[body.packageId];
  if (!amount) return null;
  return { amount, coins: amount * rate };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const rate = await getCoinRate();
    const pkg = resolvePackage(body, rate);
    if (!pkg) return res.status(400).json({ error: 'Невірна сума поповнення.' });

    const playerId = String(body.playerId || '');
    if (!playerId || playerId.length < 8)
      return res.status(400).json({ error: 'Невірний ідентифікатор гравця.' });

    const orderRef    = `TOP_${playerId}_${pkg.coins}_${Date.now()}`;
    const orderDate   = Math.floor(Date.now() / 1000);
    const productName = `${pkg.coins} ігрових монет`;
    const currency    = 'UAH';

    if (!wfpConfigured())
      return res.status(500).json({ error: 'Платіжний сервіс ще не налаштований. Додайте WFP_MERCHANT_SECRET у Vercel.' });

    const merchant = WFP_MERCHANT;
    const domain = WFP_DOMAIN;
    const sigStr = [
      merchant, domain, orderRef, String(orderDate),
      String(pkg.amount), currency, productName, '1', String(pkg.amount),
    ].join(';');
    const signature = wfpSign(sigStr);

    const origin = `https://${domain}`;
    return res.status(200).json({
      action: 'https://secure.wayforpay.com/pay',
      fields: {
        merchantAccount:    merchant,
        merchantDomainName: domain,
        merchantSignature:  signature,
        orderReference:     orderRef,
        orderDate:          String(orderDate),
        amount:             String(pkg.amount),
        currency,
        productName:        [productName],
        productCount:       ['1'],
        productPrice:       [String(pkg.amount)],
        language:           'UA',
        returnUrl:          `${origin}/api/wayforpay-return?to=topup`,
        serviceUrl:         `${origin}/api/wayforpay-topup-callback`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `[DEBUG] ${msg}` });
  }
}
