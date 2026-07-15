// Мінімальний service worker — потрібен лише для встановлюваності PWA (адмін-додаток).
// Без кешування: всі запити йдуть у мережу як зазвичай (щоб не віддавати застарілий
// білд після деплою). Наявність fetch-обробника — умова інсталяції в Chrome.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // passthrough — не перехоплюємо відповідь, браузер обробляє сам
});
