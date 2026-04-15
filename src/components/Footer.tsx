import Link from "next/link";
import { AhlLogo } from "./AhlLogo";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-cream-muted bg-ink text-cream">
      <div className="absolute inset-0 geometric-bg opacity-30 pointer-events-none" />
      <div className="container-prose relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <AhlLogo className="h-10 w-10 text-gold-warm" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-semibold text-cream">
                  Ahl Al-Islah
                </span>
                <span className="arabic-text text-sm text-gold-soft">
                  أهل الإصلاح
                </span>
              </div>
            </div>
            <p className="text-cream/70 text-sm max-w-md leading-relaxed">
              A Shariah-first department within Humanity Still Exists (HSE),
              powered by Rijal Al-Huda. Reviving the Prophetic spirit of
              guidance and service — one heart at a time.
            </p>
            <div className="pt-2 text-xs text-cream/50 leading-loose">
              <p className="italic font-serif">
                &ldquo;Indeed, Allah does not change the condition of a people
                until they change what is within themselves.&rdquo;
              </p>
              <p className="mt-1">— Surah Ar-Ra&rsquo;d, 13:11</p>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-warm mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#about" className="text-cream/80 hover:text-gold-soft transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#structure" className="text-cream/80 hover:text-gold-soft transition">
                  Structure
                </Link>
              </li>
              <li>
                <Link href="/#roadmap" className="text-cream/80 hover:text-gold-soft transition">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/positions" className="text-cream/80 hover:text-gold-soft transition">
                  Open Positions
                </Link>
              </li>
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-warm mb-4">
              Structure
            </h4>
            <ul className="space-y-2 text-sm text-cream/80">
              <li>Advisor (single bridge)</li>
              <li>Male Wing — جناح الإخوة</li>
              <li>Female Wing — جناح الأخوات</li>
              <li>Under HSE / Rijal Al-Huda</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/50">
          <p>
            &copy; {new Date().getFullYear()} Ahl Al-Islah. Confidential — for
            internal use.
          </p>
          <p>
            Built with{" "}
            <span className="text-gold-soft">ikhlas</span> for Rijal Al-Huda.
          </p>
        </div>
      </div>
    </footer>
  );
}
