import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "Join as Core Member — Ahl Al-Islah",
  description:
    "Become a Core Member of Ahl Al-Islah. Open to brothers and sisters of all years.",
};

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const content = await getContent();

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-24">
        <div className="container-prose max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-antique/10 border border-gold-antique/20 text-xs font-medium text-gold-antique tracking-wider uppercase mb-6">
              <Users className="h-3.5 w-3.5" />
              Open Recruitment
            </div>
            <p className="arabic-text text-3xl text-gold-antique mb-3">انضم إلينا</p>
            <h1 className="heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
              Join as Core Member
            </h1>
            <div className="gold-divider" />
            <p className="mt-4 text-lg text-ink/70 leading-relaxed max-w-xl mx-auto">
              Core Members are the backbone of Ahl Al-Islah — active contributors who show up, support their cohort, and grow alongside the team. Select your cohort below.
            </p>
          </div>

          {/* Two cohort cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Brothers */}
            <div className="ornate-card p-8 flex flex-col group hover:shadow-lg transition-shadow">
              <div className="mb-5">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-deep mb-4" />
                <p className="arabic-text text-xl text-gold-antique mb-1">جناح الإخوة</p>
                <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
                  Brothers&apos; Cohort
                </h2>
                <p className="mt-3 text-sm text-ink/65 leading-relaxed">
                  Join the Brothers&apos; Core Team. Work alongside fellow brothers to plan events, grow in character, and support the department&apos;s mission under the guidance of the Brothers&apos; Head and Advisor.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-ink/70 mb-8 flex-1">
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>Weekly cohort meetings</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>Event planning &amp; execution</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>3–5 hrs/week commitment</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>1 academic year term</li>
              </ul>
              <Link
                href="/apply/core-member-male"
                className="btn-primary w-full justify-center group"
              >
                Apply — Brothers&apos; Cohort
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Sisters */}
            <div className="ornate-card p-8 flex flex-col group hover:shadow-lg transition-shadow">
              <div className="mb-5">
                <span className="inline-block w-3 h-3 rounded-full bg-gold-antique mb-4" />
                <p className="arabic-text text-xl text-gold-antique mb-1">جناح الأخوات</p>
                <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
                  Sisters&apos; Cohort
                </h2>
                <p className="mt-3 text-sm text-ink/65 leading-relaxed">
                  Join the Sisters&apos; Core Team. Work alongside fellow sisters to plan events, grow in character, and support the department&apos;s mission under the guidance of the Sisters&apos; Head and Advisor.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-ink/70 mb-8 flex-1">
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>Weekly cohort meetings</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>Event planning &amp; execution</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>3–5 hrs/week commitment</li>
                <li className="flex gap-2"><span className="text-gold-antique shrink-0">•</span>1 academic year term</li>
              </ul>
              <Link
                href="/apply/core-member-female"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gold-gradient text-ink font-semibold tracking-wide shadow-md hover:shadow-gold-warm/30 hover:scale-[1.02] transition-all group"
              >
                Apply — Sisters&apos; Cohort
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-10 text-center text-xs text-ink/40">
            Looking to apply for a leadership position instead?{" "}
            <Link href="/positions" className="underline underline-offset-2 hover:text-emerald-deep transition">
              View open leadership roles →
            </Link>
          </p>
        </div>
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
