import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Clock, Timer, Edit3, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import {
  getSession,
  sortActivities,
} from "@/lib/sessions-store";
import { updateSessionAction } from "../actions";
import { SessionForm } from "../SessionForm";
import {
  DeleteSessionButton,
  DeleteActivityButton,
} from "../SessionAdminButtons";

export const metadata: Metadata = {
  title: "Edit Session — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSessionPage({ params }: Props) {
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

  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const activities = sortActivities(session.activities);
  const updateBound = updateSessionAction.bind(null, session.id);
  const hasBlobUpload = !!process.env.BLOB_READ_WRITE_TOKEN;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin/sessions"
              className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All sessions
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/sessions/${session.slug}`}
                className="btn-ghost !py-1.5 !px-3 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                View public page
              </Link>
              <DeleteSessionButton
                sessionId={session.id}
                redirectTo="/admin/sessions"
              />
            </div>
          </div>

          {/* Session metadata form */}
          <section className="ornate-card p-6 sm:p-8 mb-6">
            <h2 className="heading-serif text-xl font-semibold text-emerald-deep mb-1">
              Session details
            </h2>
            <p className="text-xs text-ink/50 mb-5">
              Slug:{" "}
              <code className="font-mono bg-cream-muted px-1.5 py-0.5 rounded">
                {session.slug}
              </code>
            </p>
            <SessionForm
              mode="edit"
              action={updateBound}
              defaults={{
                title: session.title,
                arabicTitle: session.arabicTitle ?? "",
                date: session.date,
                startTime: session.startTime ?? "",
                endTime: session.endTime ?? "",
                meetingLink: session.meetingLink ?? "",
                description: session.description ?? "",
              }}
              currentPosterUrl={session.posterUrl}
              hasBlobUpload={hasBlobUpload}
              cancelHref="/admin/sessions"
              submitLabel="Save changes"
            />
          </section>

          {/* Activities list */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-serif text-xl font-semibold text-emerald-deep">
                Activities ({session.activities.length})
              </h2>
              <Link
                href={`/admin/sessions/${session.id}/activities/new`}
                className="btn-primary !py-2 !px-4 text-xs inline-flex"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Activity
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="ornate-card p-8 text-center">
                <p className="text-sm text-ink/55">
                  No activities yet. Add the first one to start mapping this
                  session.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="ornate-card p-5 flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
                          {a.title}
                        </h3>
                        {a.timeMarker && (
                          <span className="text-xs inline-flex items-center gap-1 text-ink/55">
                            <Clock className="h-3 w-3" />
                            {a.timeMarker}
                          </span>
                        )}
                        {a.durationMin !== undefined && (
                          <span className="text-xs inline-flex items-center gap-1 text-ink/55">
                            <Timer className="h-3 w-3" />
                            {a.durationMin} min
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink/65 line-clamp-2">
                        {a.body.split("\n")[0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/sessions/${session.id}/activities/${a.id}`}
                        className="btn-ghost !py-1 !px-2 text-[11px]"
                        title="Edit activity"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Link>
                      <DeleteActivityButton
                        sessionId={session.id}
                        activityId={a.id}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

