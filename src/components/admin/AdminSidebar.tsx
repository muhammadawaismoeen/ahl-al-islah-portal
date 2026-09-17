"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ADMIN_NAV_ITEMS, type AdminBadgeKey } from "./admin-nav-items";

interface Props {
  badges: Record<AdminBadgeKey, number>;
  adminEmail?: string | null;
  logoutAction: () => Promise<void>;
}

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const EXPANDED_W = "16rem";
const COLLAPSED_W = "4.5rem";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  badges,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  badges: Record<AdminBadgeKey, number>;
  collapsed?: boolean;
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
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50 ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-emerald-deep text-white shadow-[0_6px_18px_-8px_rgba(5,122,85,0.55)]"
                  : "text-ink/65 hover:bg-emerald/8 hover:text-emerald-deep"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {count > 0 &&
                (collapsed ? (
                  <span
                    className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
                      active ? "bg-white" : "bg-amber"
                    }`}
                    aria-hidden
                  />
                ) : (
                  <span
                    className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                      active ? "bg-white/25 text-white" : "bg-amber text-white"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ))}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin"
      className={`flex items-center gap-3 px-2 py-1 group ${collapsed ? "justify-center px-0" : ""}`}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-deep text-white heading-serif text-base font-semibold shrink-0">
        ا
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="arabic-text block text-emerald-deep text-[11px] leading-none">
            لوحة الإدارة
          </span>
          <span className="heading-serif block text-base font-semibold text-emerald-deep leading-tight truncate">
            Admin
          </span>
        </span>
      )}
    </Link>
  );
}

function SidebarFooter({
  adminEmail,
  logoutAction,
  collapsed,
}: {
  adminEmail?: string | null;
  logoutAction: () => Promise<void>;
  collapsed?: boolean;
}) {
  return (
    <div className="border-t border-border pt-3 space-y-2">
      <Link
        href="/"
        title={collapsed ? "Back to site" : undefined}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-ink/50 hover:text-emerald-deep hover:bg-emerald/8 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50 ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && "Back to site"}
      </Link>
      {!collapsed && adminEmail && (
        <div className="px-3 text-[11px] text-ink/40 truncate" title={adminEmail}>
          {adminEmail}
        </div>
      )}
      <form action={logoutAction}>
        <button
          type="submit"
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-ink/60 hover:bg-danger/10 hover:text-danger transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar({ badges, adminEmail, logoutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    ADMIN_NAV_ITEMS.find((item) => isActive(pathname, item.href))?.label ?? "Admin";

  useEffect(() => {
    setHydrated(true);
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.style.setProperty(
      "--admin-sidebar-w",
      collapsed ? COLLAPSED_W : EXPANDED_W
    );
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, hydrated]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-surface border-b border-border">
        <Brand />
        <span className="text-xs font-medium text-ink/50 truncate max-w-[35%]">
          {currentLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-emerald-deep hover:bg-emerald/8 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-ink/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-border p-4 flex flex-col transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <Brand />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-ink/50 hover:bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50"
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

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-border lg:bg-surface lg:p-4 transition-[width] duration-200 ease-out overflow-hidden"
        style={{ width: "var(--admin-sidebar-w, 16rem)" }}
      >
        <div className="mb-6 flex items-center justify-between gap-2">
          <Brand collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-lg text-ink/40 hover:bg-emerald/8 hover:text-emerald-deep transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="inline-flex items-center justify-center h-8 w-8 mx-auto mb-4 -mt-2 rounded-lg text-ink/40 hover:bg-emerald/8 hover:text-emerald-deep transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <NavList pathname={pathname} badges={badges} collapsed={collapsed} />
        </nav>
        <SidebarFooter adminEmail={adminEmail} logoutAction={logoutAction} collapsed={collapsed} />
      </aside>
    </>
  );
}
