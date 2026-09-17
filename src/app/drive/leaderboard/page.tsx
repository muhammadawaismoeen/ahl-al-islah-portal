import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trophy, Award, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { listAmbassadors, getActiveDrive } from "@/lib/drive-store";
import { DRIVE_CURRENCY } from "@/lib/drive-config";

export const metadata: Metadata = {
  title: "Ambassador Leaderboard — Ahl Al-Islah",
  description: "See who's leading the Drive Ambassador program this season.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [content, drive] = await Promise.all([getContent(), getActiveDrive()]);
  const ambassadors = await listAmbassadors(drive?.id);
  const ranked = ambassadors
    .filter((a) => a.status === "approved")
    .sort((a, b) => b.raisedAmount - a.raisedAmount);

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Drive
          </Link>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <Trophy className="h-7 w-7 text-emerald-deep" />
            </div>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Ambassador Leaderboard
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              {drive?.name ?? "Qur'an & Seerah Drive"} — ranked by verified
              donations raised.
            </p>
          </div>

          {ranked.length === 0 ? (
            <div className="ornate-card p-10 text-center">
              <p className="text-sm text-ink/60 mb-4">
                No approved Ambassadors yet — be the first.
              </p>
              <Link href="/drive/ambassador" className="btn-primary inline-flex">
                <Award className="h-4 w-4" />
                Become an Ambassador
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {ranked.map((a, i) => {
                const progressPct =
                  a.chosenTarget > 0
                    ? Math.min(100, Math.round((a.raisedAmount / a.chosenTarget) * 100))
                    : 0;
                return (
                  <li key={a.id} className="ornate-card p-5 flex items-center gap-4">
                    <span
                      className={`inline-flex items-center justify-center h-9 w-9 rounded-full shrink-0 font-serif font-semibold text-sm ${
                        i === 0
                          ? "bg-amber text-white"
                          : i === 1
                            ? "bg-ink/25 text-white"
                            : i === 2
                              ? "bg-emerald-deep/40 text-white"
                              : "bg-surface-2 text-ink/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-ink flex items-center gap-1.5">
                        {a.name}
                        {a.isIhsanLevel && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber/15 text-amber">
                            <Sparkles className="h-2.5 w-2.5" /> Ihsan-level
                          </span>
                        )}
                      </p>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden border border-border mt-2">
                        <div
                          className="h-full bg-emerald rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-emerald-deep shrink-0">
                      {DRIVE_CURRENCY} {a.raisedAmount.toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
