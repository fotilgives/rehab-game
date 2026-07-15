import crypto from 'node:crypto';

/**
 * serviceUrl — WayForPay надсилає сюди статус транзакції (POST).
 * Ми маємо відповісти підтвердженням, інакше WayForPay повторюватиме запити.
 * Відповідь: { orderReference, status: 'accept', time, signature }.
 */
const SECRET = process.env.WFP_MERCHANT_SECRET || '';

export default async function handler(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const orderReference = String(body.orderReference || '');
  const status = 'accept';
  const time = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('md5', SECRET)
    .update([orderReference, status, String(time)].join(';'), 'utf8')
    .digest('hex');

  res.status(200).json({ orderReference, status, time, signature });
}
