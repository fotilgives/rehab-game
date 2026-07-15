// Спільні хелпери Telegram-бота.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || '776148901,6194420485')
  .split(',').map((x) => x.trim()).filter(Boolean);

export const SITE_URL = 'https://reabilitolog-play.vercel.app';
export const PHONE = '+38 (063) 806-99-16';
export const PHONE_RAW = '+380638069916';
export const MAPS_URL = 'https://maps.app.goo.gl/?q=Tsentr+Rozvytku+Ta+Zdorovya+Vinnytsia';

export const SERVICES = [
  'Східний (тайський) масаж',
  'Оздоровчий масаж',
  'Фізична реабілітація',
  'Йога та тілесні практики',
  'Електровакуумна терапія',
  'Дитяча йога з нейровправами',
  'Дитячий логопед-дефектолог',
  'Дитячий психолог',
  'Інше / Комплексна програма',
];

export const SERVICES_TEXT =
  '🤲 <b>Наші послуги</b>\n\n' +
  '• Східний (тайський) масаж\n' +
  '• Оздоровчий масаж\n' +
  '• Фізична реабілітація\n' +
  '• Йога та тілесні практики\n' +
  '• Електровакуумна терапія\n' +
  '• Дитяча йога з нейровправами\n' +
  '• Дитячий логопед-дефектолог\n' +
  '• Дитячий психолог\n\n' +
  'Натисни «📝 Записатися», щоб залишити заявку.';

export const PRICES_TEXT =
  '💸 <b>Прайс</b>\n\n' +
  '<b>Дитячий напрямок</b>\n' +
  '• Консультація психолога (діагностика) — 700 грн\n' +
  '• Корекційні заняття з психологом — 500 грн\n' +
  '• Логопед — 500 грн\n' +
  '• Дитяча йога — 200 / 500 грн (групова / індивід.)\n' +
  '• Ха-Тха йога — 200 / 500 грн\n\n' +
  '<b>Масаж</b>\n' +
  '• Загальний — 700 грн · Спини — 500 грн\n' +
  '• Лімфодренажний / Антицелюлітний / Східний — 700 грн\n' +
  '• Обличчя — 500 грн\n\n' +
  '<b>Авторські — Володимир Мальцев</b>\n' +
  '• Оздоровчий масаж / Тренування / Східний / Йога — 900 грн\n\n' +
  '<b>Апаратне лікування</b>\n' +
  '• Електрофорез / вакуумна електротерапія — 300 грн\n' +
  '• Фонофорез — 200 грн · для обличчя — 400 грн';

export const CONTACTS_TEXT =
  '📍 <b>Центр розвитку та здоровʼя</b> (Вінниця)\n\n' +
  `☎️ Телефон: ${PHONE}\n` +
  '🕘 Графік:\n• Пн–Пт: 9:00–18:00\n• Сб: 9:00–13:00\n• Нд: вихідний\n\n' +
  `🗺️ Мапа: ${MAPS_URL}`;

async function tgCall(method, payload) {
  if (!TOKEN) { console.error('[tg] no TELEGRAM_BOT_TOKEN'); return null; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (e) {
    console.error('[tg] call ERR:', method, e.message);
    return null;
  }
}

export function tgSend(chatId, text, extra = {}) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });
}

export function tgAnswerCallback(id, text) {
  return tgCall('answerCallbackQuery', { callback_query_id: id, text: text || '' });
}

export async function tgNotifyAdmins(text) {
  for (const id of ADMIN_IDS) {
    // eslint-disable-next-line no-await-in-loop
    await tgSend(id, text);
  }
}

// Головне меню (inline-кнопки).
export function mainMenuKeyboard(chatId = null) {
  const kb = [
    [{ text: '🚀 Відкрити застосунок', web_app: { url: SITE_URL } }],
    [{ text: '📝 Записатися', callback_data: 'book' }],
    [{ text: '🤲 Послуги', callback_data: 'services' }, { text: '💸 Ціни', callback_data: 'prices' }],
    [{ text: '📍 Контакти', callback_data: 'contacts' }],
    [{ text: '🌐 Сайт', url: SITE_URL }],
  ];
  if (chatId && ADMIN_IDS.includes(String(chatId))) {
    kb.push([{ text: '👑 [Адмін] Змінити пароль', callback_data: 'admin_password' }]);
    kb.push([{ text: '⚙️ [Адмін] Оновити Webhook', callback_data: 'admin_webhook' }]);
  }
  return { inline_keyboard: kb };
}

export function servicesKeyboard() {
  return {
    inline_keyboard: SERVICES.map((s, i) => [{ text: s, callback_data: `svc:${i}` }]),
  };
}

export function datesKeyboard() {
  const daysUk = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const monthsUk = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const dates = [];
  const now = new Date();
  
  for (let i = 0; i < 14 && dates.length < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() !== 0) { // Пропускаємо неділю (вихідний)
      const dayName = daysUk[d.getDay()];
      const dateNum = d.getDate();
      const monthName = monthsUk[d.getMonth()];
      const formatted = `${dayName}, ${dateNum} ${monthName}`;
      dates.push(formatted);
    }
  }

  const kb = dates.map((label) => [{ text: `📅 ${label}`, callback_data: `dt:${label}` }]);
  kb.push([{ text: '💬 Узгодити в переписці / інша дата', callback_data: 'dt:узгодити в переписці' }]);
  return { inline_keyboard: kb };
}

export const hasToken = () => !!TOKEN;
