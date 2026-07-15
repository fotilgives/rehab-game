-- 0011 — Курс обміну монет при поповненні: скільки балів нараховувати за 1 грн.
-- Налаштовується в адмін-панелі (вкладка «Гра / Турніри» → «Магазин»).
-- Читається через rps_cfg('coin_rate', 5) на бекенді (api/wayforpay-topup.js) і на фронті.
-- Ідемпотентно: ставимо дефолт 5 лише якщо ключа ще немає.

UPDATE public.rps_config
SET data = jsonb_set(data, '{coin_rate}', to_jsonb(5), true)
WHERE id = 1 AND NOT (data ? 'coin_rate');
