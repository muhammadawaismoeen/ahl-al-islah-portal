import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { createSessionAction } from "../actions";
import { SessionForm } from "../SessionForm";

export const metadata: Metadata = {
  title: "New Session — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
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

  const hasBlobUpload = !!process.env.BLOB_READ_WRITE_TOKEN;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-2xl mx-auto">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sessions
          </Link>
          <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mb-1">
            New Session
          </h1>
          <p className="text-sm text-ink/60 mb-8">
            Create a session, then add activities to it.
          </p>

          <div className="ornate-card p-6 sm:p-8">
            <SessionForm
              mode="create"
              action={createSessionAction}
              defaults={{
                title: "",
                arabicTitle: "",
                date: new Date().toISOString().slice(0, 10),
                startTime: "",
                endTime: "",
                meetingLink: "",
                description: "",
              }}
              hasBlobUpload={hasBlobUpload}
              cancelHref="/admin/sessions"
              submitLabel="Create session"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
