import { useEffect, useState } from 'react';

export type Route =
  | 'home'
  | 'game'
  | 'about'
  | 'services'
  | 'prizes'
  | 'philosophy'
  | 'prices'
  | 'location'
  | 'donate'
  | 'legal'
  | 'profile'
  | 'admin';

const ROUTES: Route[] = ['home', 'game', 'about', 'services', 'prizes', 'philosophy', 'prices', 'location', 'donate', 'legal', 'profile', 'admin'];

const parse = (): Route => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin') return 'admin';
  if (path === '/' || path === '') return 'home';
  const segment = path.replace(/^\//, '') as Route;
  return (ROUTES.includes(segment) ? segment : 'home') as Route;
};

export function navigate(to: Route) {
  const path = to === 'home' ? '/' : `/${to}`;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Перехід на сторінку «Послуги» з автопрокруткою до форми запису.
 * Робить навігацію передбачуваною: кнопка «Записатися» завжди веде до форми.
 */
export function goToBooking() {
  try {
    sessionStorage.setItem('rps_scroll_book', '1');
  } catch {
    /* ignore */
  }
  if (parse() === 'services') {
    // Уже на сторінці — просто прокрутити до форми.
    const el = document.getElementById('book-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    navigate('services');
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => {
      const next = parse();
      setRoute((prev) => {
        if (prev !== next) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          }, 0);
        }
        return next;
      });
    };
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return route;
}
