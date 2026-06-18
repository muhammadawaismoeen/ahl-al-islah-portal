import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus, CalendarDays, ListChecks } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { listSessions } from "@/lib/sessions-store";
import { formatDate } from "@/lib/utils";
import { SeedIdentityPillarsButton } from "./SessionAdminButtons";

export const metadata: Metadata = {
  title: "Sessions — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-md mx-auto">
            <div className="ornate-card p-8">
              <div className="text-center mb-6">
                <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
                  Admin Access
                </h1>
              </div>
              <LoginForm action={login} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const sessions = await listSessions();

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Membership applicants
              </Link>
              <span className="arabic-text block text-gold-antique">الجلسات</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Sessions
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link href="/admin/sessions/new" className="btn-primary inline-flex">
              <Plus className="h-4 w-4" />
              New Session
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="ornate-card p-10 text-center">
              <CalendarDays className="h-10 w-10 text-ink/20 mx-auto mb-3" />
              <p className="text-sm text-ink/60 mb-4">No sessions yet.</p>
              <p className="text-xs text-ink/50 mb-6 max-w-md mx-auto">
                Start with the founding session — the Ibrahim journey with the
                Identity Pillars Audit activity pre-loaded.
              </p>
              <SeedIdentityPillarsButton />
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="ornate-card p-5 flex items-start justify-between gap-4 hover:bg-cream-warm/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      {s.arabicTitle && (
                        <p className="arabic-text text-sm text-gold-antique mb-0.5">
                          {s.arabicTitle}
                        </p>
                      )}
                      <h2 className="heading-serif text-lg font-semibold text-emerald-deep leading-snug">
                        {s.title}
                      </h2>
                      {s.description && (
                        <p className="text-sm text-ink/65 mt-1 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-ink/50">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(s.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="h-3.5 w-3.5" />
                          {s.activities.length} activit
                          {s.activities.length === 1 ? "y" : "ies"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-ink/40 shrink-0">Edit →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
