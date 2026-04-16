"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_CONTENT } from "@/lib/content-defaults";
import type { NavContent } from "@/lib/content-types";

export function Navbar({ content = DEFAULT_CONTENT.nav, customLogo }: { content?: NavContent; customLogo?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-cream/85 backdrop-blur-lg border-b border-cream-muted shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container-prose flex h-16 sm:h-20 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label={`${content.siteName} home`}
        >
          {customLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={customLogo} alt={content.siteName} className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform group-hover:scale-105" />
          )}
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg sm:text-xl font-semibold text-emerald-deep">
              {content.siteName}
            </span>
            {content.siteNameArabic && (
              <span className="arabic-text text-xs text-gold-antique">
                {content.siteNameArabic}
              </span>
            )}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {content.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-emerald-deep transition-colors rounded-full hover:bg-emerald-deep/5"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/positions" className="btn-primary ml-3 !py-2 !px-5">
            {content.ctaLabel}
          </Link>
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-emerald-deep/5"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <X className="h-6 w-6 text-emerald-deep" />
          ) : (
            <Menu className="h-6 w-6 text-emerald-deep" />
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-cream-muted bg-cream/95 backdrop-blur-lg">
          <nav className="container-prose py-4 flex flex-col gap-1">
            {content.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-ink/80 hover:text-emerald-deep hover:bg-emerald-deep/5 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/positions"
              onClick={() => setOpen(false)}
              className="btn-primary mt-3"
            >
              {content.ctaLabel}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
