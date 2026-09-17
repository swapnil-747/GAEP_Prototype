"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, ROUTES } from "@/gaep/navigation";
import { getCurrentUser, logout, type CurrentUser } from "@/platform/api";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Proceed to login even if network call failed
    }
    setUser(null);
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <div className="topbar">
      <Link className="brand" href={ROUTES.landing}>
        <div className="logo">G</div>
        <div className="name">
          GAEP
          <small>Global Analytics Experimentation Platform</small>
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

        <Link href={ROUTES.landing}>Home</Link>

        {user ? (
          <>
            <span className="pill" style={{ display: "inline-flex", alignItems: "center" }}>
              ● {user.username}
            </span>
            <a
              role="button"
              tabIndex={0}
              onClick={handleLogout}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void handleLogout();
                }
              }}
              style={{ cursor: "pointer" }}
            >
              Sign out
            </a>
          </>
        ) : (
          <Link href={ROUTES.login} className="on">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}