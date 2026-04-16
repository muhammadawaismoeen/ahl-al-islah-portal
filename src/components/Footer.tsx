import Link from "next/link";
import { DEFAULT_CONTENT } from "@/lib/content-defaults";
import type { FooterContent, NavContent } from "@/lib/content-types";

export function Footer({
  content = DEFAULT_CONTENT.footer,
  navContent = DEFAULT_CONTENT.nav,
  customLogo,
}: {
  content?: FooterContent;
  navContent?: NavContent;
  customLogo?: string;
}) {
  return (
    <footer className="relative mt-32 border-t border-cream-muted bg-ink text-cream">
      <div className="absolute inset-0 geometric-bg opacity-30 pointer-events-none" />
      <div className="container-prose relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {customLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={customLogo} alt={navContent.siteName} className="h-10 w-10 object-contain" />
              )}
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-semibold text-cream">
                  {navContent.siteName}
                </span>
                {navContent.siteNameArabic && (
                  <span className="arabic-text text-sm text-gold-soft">
                    {navContent.siteNameArabic}
                  </span>
                )}
              </div>
            </div>
            <p className="text-cream/70 text-sm max-w-md leading-relaxed">
              {content.tagline}
            </p>
            <div className="pt-2 text-xs text-cream/50 leading-loose">
              <p className="italic font-serif">{content.quote}</p>
              <p className="mt-1">{content.quoteAttribution}</p>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-warm mb-4">
              {content.exploreHeading}
            </h4>
            <ul className="space-y-2 text-sm">
              {content.exploreLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-cream/80 hover:text-gold-soft transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-warm mb-4">
              {content.structureHeading}
            </h4>
            <ul className="space-y-2 text-sm text-cream/80">
              {content.structureItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/50">
          <p>
            &copy; {new Date().getFullYear()} {navContent.siteName}.
          </p>
          <p className="text-cream/50">{content.smallPrint}</p>
        </div>
      </div>
    </footer>
  );
}
