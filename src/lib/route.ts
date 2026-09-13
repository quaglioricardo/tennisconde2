import { useEffect, useState } from 'react';

export type Route =
  | { kind: 'rankings' }
  | { kind: 'ranking'; id: string; matchId?: string }
  | { kind: 'players' };

export function parseHash(hash: string): Route {
  const [path, query] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'rankings' && parts[1]) {
    const matchId = new URLSearchParams(query).get('match') ?? undefined;
    return { kind: 'ranking', id: parts[1], matchId };
  }
  if (parts[0] === 'players') return { kind: 'players' };
  return { kind: 'rankings' };
}

export function toHash(route: Route): string {
  switch (route.kind) {
    case 'rankings': return '#/rankings';
    case 'players': return '#/players';
    case 'ranking': return `#/rankings/${route.id}${route.matchId ? `?match=${route.matchId}` : ''}`;
  }
}

export function navigate(route: Route) {
  window.location.hash = toHash(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
