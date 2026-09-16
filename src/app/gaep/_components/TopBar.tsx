'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, ROUTES } from '@/gaep/navigation';

export function TopBar() {
  const pathname = usePathname();
  return (
    <div className="topbar">
      <Link className="brand" href={ROUTES.landing}>
        <div className="logo">G</div>
        <div className="name">GAEP<small>Global Analytics Experimentation Platform</small></div>
      </Link>
      <div className="nav">
        {NAV_ITEMS.map((n) => {
          const href = ROUTES[n.id];
          const on = pathname === href;
          return (
            <Link key={n.id} href={href} className={on ? 'on' : ''}>{n.label}</Link>
          );
        })}
        <Link href={ROUTES.landing}>Home</Link>
      </div>
    </div>
  );
}
