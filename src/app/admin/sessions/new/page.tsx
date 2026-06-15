import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { createSessionAction } from "../actions";

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

          <form
            action={createSessionAction}
            encType="multipart/form-data"
            className="ornate-card p-6 sm:p-8 space-y-5"
          >
            <Field
              label="Session title *"
              name="title"
              placeholder="e.g. Ibrahim عليه السلام: Khalilullah"
              required
            />
            <Field
              label="Arabic title (optional)"
              name="arabicTitle"
              placeholder="إبراهيم عليه السلام"
              dir="rtl"
            />
            <Field
              label="Date *"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Start time (PKT)"
                name="startTime"
                type="time"
                placeholder="16:00"
              />
              <Field
                label="End time (PKT)"
                name="endTime"
                type="time"
                placeholder="17:15"
              />
            </div>
            <Field
              label="Meeting link (optional)"
              name="meetingLink"
              type="url"
              placeholder="https://meet.google.com/… or https://zoom.us/j/…"
            />
            <FieldArea
              label="One-line description (optional)"
              name="description"
              placeholder="What this session was about — visible on the public Sessions page."
              rows={3}
            />
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
                Poster image (optional)
              </span>
              <input
                type="file"
                name="poster"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full text-sm text-ink file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-deep file:text-white file:font-medium hover:file:bg-emerald-rich file:cursor-pointer cursor-pointer"
              />
              <span className="text-[11px] text-ink/45 mt-1.5 block">
                JPG, PNG, WebP, or GIF — up to 16 MB.
              </span>
            </label>
            <div className="pt-4 flex items-center justify-between">
              <Link href="/admin/sessions" className="btn-ghost text-sm">
                Cancel
              </Link>
              <button type="submit" className="btn-primary">
                Create session
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  dir,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        dir={dir}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg border border-cream-muted bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition"
      />
    </label>
  );
}

function FieldArea({
  label,
  name,
  placeholder,
  rows = 4,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
        {label}
      </span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg border border-cream-muted bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition resize-y"
      />
    </label>
  );
}
