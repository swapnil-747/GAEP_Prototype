// Canonical route table + navigation graph (single source of truth).

export type ScreenId =
  | 'landing' | 'login' | 'catalog' | 'provision'
  | 'workspace' | 'dashboard' | 'gallery' | 'graduate';

export const ROUTES: Record<ScreenId, string> = {
  landing: '/gaep',
  login: '/gaep/login',
  catalog: '/gaep/catalog',
  provision: '/gaep/provision',
  workspace: '/gaep/workspace',
  dashboard: '/gaep/dashboard',
  gallery: '/gaep/gallery',
  graduate: '/gaep/graduate',
};

// Authenticated-area nav (inside the App_Shell).
export const NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'workspace', label: 'My Workspace' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'graduate', label: 'Graduate' },
];

// Directed demo-flow graph used for reachability tests.
const EDGES: Record<ScreenId, ScreenId[]> = {
  landing: ['login'],
  login: ['catalog'],
  catalog: ['provision', 'workspace', 'gallery', 'dashboard', 'graduate'],
  provision: ['workspace'],
  workspace: ['graduate', 'gallery', 'dashboard', 'catalog'],
  dashboard: ['catalog', 'gallery', 'graduate', 'workspace'],
  gallery: ['workspace', 'catalog', 'dashboard'],
  graduate: ['landing', 'catalog', 'dashboard'],
};

export function outgoing(screen: ScreenId): ScreenId[] {
  return EDGES[screen] ?? [];
}

export function reachableScreens(start: ScreenId): Set<ScreenId> {
  const seen = new Set<ScreenId>([start]);
  const queue: ScreenId[] = [start];
  while (queue.length) {
    const s = queue.shift()!;
    for (const next of outgoing(s)) {
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen;
}

export const ALL_SCREENS = Object.keys(ROUTES) as ScreenId[];
