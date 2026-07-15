import { checkStatus, parseTopupRef, creditTopup, transactionList, s } from './_wfp.js';

/**
 * Автоматична звірка платежів (страхувальна сітка).
 *
 * Клієнт надсилає список своїх orderReference (які він зберіг при створенні
 * платежу). Сервер для кожного питає реальний статус у WayForPay (CHECK_STATUS)
 * і дораховує монети за оплачені (Approved), але ще не зараховані замовлення.
 * Завдяки ідемпотентності повторні нарахування неможливі. Це гарантує
 * зарахування навіть якщо serviceUrl-колбек і returnUrl не спрацювали.
 *
 * Додатково (якщо акаунт це підтримує) пробуємо TRANSACTION_LIST як ще одне джерело.
 */
export default async function handler(req, res) {
  const result = { ok: true, checked: 0, credited: 0, done: [], details: [] };
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    let playerId = s(body.playerId);
    let refs = Array.isArray(body.refs) ? body.refs.map(s) : [];
    if (!playerId || refs.length === 0) {
      try {
        const u = new URL(req.url, 'http://localhost');
        if (!playerId) playerId = s(u.searchParams.get('playerId'));
        const qr = u.searchParams.get('refs');
        if (refs.length === 0 && qr) refs = qr.split(',').map(s);
      } catch {
        /* ignore */
      }
    }
    if (playerId.length < 8) return res.status(400).json({ error: 'bad playerId' });

    const seen = new Set();
    const prefix = `TOP_${playerId}_`;

    // 1) Головне джерело — CHECK_STATUS по кожному відомому замовленню (надійно).
    for (const ref of refs.slice(0, 50)) {
      if (!ref || seen.has(ref)) continue;
      seen.add(ref);
      const { valid, coins } = parseTopupRef(ref);
      if (!valid || !ref.startsWith(prefix)) {
        result.details.push({ ref, skip: 'invalid-or-foreign' });
        continue;
      }
      result.checked += 1;
      const st = await checkStatus(ref);
      const status = st ? st.status : 'unreachable';
      if (st && st.status === 'Approved') {
        const ok = await creditTopup(ref, coins, null, 'reconcile');
        if (ok) {
          result.credited += 1;
          result.done.push(ref); // клієнт може прибрати ці з локального списку
        }
      }
      result.details.push({ ref, status });
    }

    // 2) Додаткове джерело (best-effort) — TRANSACTION_LIST, якщо акаунт підтримує.
    try {
      const now = Math.floor(Date.now() / 1000);
      const list = await transactionList(now - 35 * 24 * 3600, now);
      for (const t of list) {
        const ref = s(t.orderReference);
        if (!ref.startsWith(prefix) || seen.has(ref)) continue;
        seen.add(ref);
        if (s(t.transactionStatus) !== 'Approved') continue;
        const { valid, coins } = parseTopupRef(ref);
        if (!valid) continue;
        const ok = await creditTopup(ref, coins, null, 'reconcile-list');
        if (ok) {
          result.credited += 1;
          result.done.push(ref);
        }
      }
    } catch {
      /* ignore */
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[wfp-reconcile] ERR:', err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
