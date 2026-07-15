import { parseBody, s, confirmAndCredit, buildAcceptResponse } from './_wfp.js';

/**
 * serviceUrl поповнення монет — WayForPay шле сюди статус транзакції (server-to-server).
 * Зараховуємо монети через єдину перевірену логіку (CHECK_STATUS + підпис, ідемпотентно)
 * і завжди відповідаємо валідним accept-підписом, щоб WayForPay не повторював запити.
 */
export default async function handler(req, res) {
  let orderReference = '';
  let merchantAccount = '';
  try {
    const body = await parseBody(req);
    orderReference = s(body.orderReference);
    merchantAccount = s(body.merchantAccount);
    console.log('[wfp-cb] ref:', orderReference, 'bodyStatus:', s(body.transactionStatus));

    await confirmAndCredit(body, 'callback');

    const resp = await buildAcceptResponse(orderReference, merchantAccount);
    return res.status(200).json(resp);
  } catch (err) {
    console.error('[wfp-cb] FATAL:', err.message);
    const time = Math.floor(Date.now() / 1000);
    return res.status(200).json({ orderReference, status: 'accept', time, signature: '' });
  }
}
