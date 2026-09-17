import type { Metadata } from "next";
import Link from "next/link";
import { Plus, CalendarDays, ListChecks } from "lucide-react";
import { isAuthenticated } from "@/app/admin/actions";
import { listSessions } from "@/lib/sessions-store";
import { formatDate } from "@/lib/utils";
import { SeedIdentityPillarsButton } from "./SessionAdminButtons";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Sessions — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    return <AdminLoginScreen />;
  }

  const sessions = await listSessions();

  return (
    <AdminShell>
      <div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="arabic-text block text-emerald-deep">الجلسات</span>
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
                    className="ornate-card p-5 flex items-start justify-between gap-4 hover:bg-surface-2/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      {s.arabicTitle && (
                        <p className="arabic-text text-sm text-emerald-deep mb-0.5">
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
    </AdminShell>
  );
}
