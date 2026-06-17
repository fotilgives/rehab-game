import { useEffect, useState } from 'react';

export type Route = 'home' | 'game' | 'about' | 'services' | 'prizes' | 'philosophy';

const parse = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '');
  const r = h.split('?')[0] as Route;
  return (['home', 'game', 'about', 'services', 'prizes', 'philosophy'].includes(r) ? r : 'home') as Route;
};

export function navigate(to: Route) {
  window.location.hash = to === 'home' ? '/' : `/${to}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
