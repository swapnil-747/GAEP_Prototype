"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, ROUTES } from "@/gaep/navigation";
import { logout } from "@/platform/api";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <div className="topbar">
      <Link
        className="brand"
        href={ROUTES.landing}
      >
        <div className="logo">G</div>

        <div className="name">
          GAEP
          <small>
            Global Analytics Experimentation Platform
          </small>
        </div>
      </Link>

      <div className="nav">
        {NAV_ITEMS.map((item) => {
          const href = ROUTES[item.id];
          const active = pathname === href;

          return (
            <Link
              key={item.id}
              href={href}
              className={active ? "on" : ""}
            >
              {item.label}
            </Link>
          );
        })}

        <Link href={ROUTES.landing}>
          Home
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: "none",
            border: 0,
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
            padding: 0,
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}