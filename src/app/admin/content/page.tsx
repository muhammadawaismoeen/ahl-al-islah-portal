import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, ArrowLeft } from "lucide-react";
import { isAuthenticated, logout } from "@/app/admin/actions";
import { getContent } from "@/lib/content-store";
import { LoginForm } from "@/app/admin/LoginForm";
import { login } from "@/app/admin/actions";
import { ContentEditor } from "./ContentEditor";

export const metadata: Metadata = {
  title: "Admin · Content Editor",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-md mx-auto">
          <div className="ornate-card p-8">
            <div className="text-center mb-6">
              <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
              <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
                Admin Access
              </h1>
              <p className="text-sm text-ink/60 mt-2">
                Content editor. Advisor only.
              </p>
            </div>
            <LoginForm action={login} />
          </div>
        </div>
      </main>
    );
  }

  const content = await getContent();

  return (
    <main className="pt-8 pb-20">
      <div className="container-prose">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Applications
              </Link>
            </div>
            <span className="arabic-text text-gold-antique">تحرير المحتوى</span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Content Editor
            </h1>
            <p className="text-sm text-ink/60 mt-1">
              Edit all public-facing text on the portal. Changes are live
              immediately after saving.
            </p>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-secondary !py-2 !px-4 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>

        <ContentEditor initialContent={content} />
      </div>
    </main>
  );
}
