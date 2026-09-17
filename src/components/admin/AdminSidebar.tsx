"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ArrowLeft } from "lucide-react";
import { ADMIN_NAV_ITEMS, type AdminBadgeKey } from "./admin-nav-items";

interface Props {
  badges: Record<AdminBadgeKey, number>;
  adminEmail?: string | null;
  logoutAction: () => Promise<void>;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges: Record<AdminBadgeKey, number>;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const count = item.badgeKey ? badges[item.badgeKey] : 0;
        const Icon = item.icon;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-deep text-white shadow-[0_6px_18px_-8px_rgba(5,122,85,0.55)]"
                  : "text-ink/65 hover:bg-emerald/8 hover:text-emerald-deep"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                    active ? "bg-white/25 text-white" : "bg-amber text-white"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-2 py-1 group">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-deep text-white heading-serif text-base font-semibold shrink-0">
        ا
      </span>
      <span className="min-w-0">
        <span className="arabic-text block text-emerald-deep text-[11px] leading-none">
          لوحة الإدارة
        </span>
        <span className="heading-serif block text-base font-semibold text-emerald-deep leading-tight truncate">
          Admin
        </span>
      </span>
    </Link>
  );
}

function SidebarFooter({
  adminEmail,
  logoutAction,
}: {
  adminEmail?: string | null;
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="border-t border-border pt-3 space-y-2">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-ink/50 hover:text-emerald-deep hover:bg-emerald/8 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        Back to site
      </Link>
      {adminEmail && (
        <div className="px-3 text-[11px] text-ink/40 truncate" title={adminEmail}>
          {adminEmail}
        </div>
      )}
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink/60 hover:bg-danger/10 hover:text-danger transition"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar({ badges, adminEmail, logoutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-surface border-b border-border">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-emerald-deep hover:bg-emerald/8 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-ink/50 hover:bg-surface-2 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <NavList pathname={pathname} badges={badges} onNavigate={() => setOpen(false)} />
            </nav>
            <SidebarFooter adminEmail={adminEmail} logoutAction={logoutAction} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:border-border lg:bg-surface lg:p-4">
        <div className="mb-6">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NavList pathname={pathname} badges={badges} />
        </nav>
        <SidebarFooter adminEmail={adminEmail} logoutAction={logoutAction} />
      </aside>
    </>
  );
}
