import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { getSession } from "@/lib/sessions-store";
import { addActivityAction } from "../../../actions";
import { ActivityForm } from "../../../ActivityForm";

export const metadata: Metadata = {
  title: "New Activity — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewActivityPage({ params }: Props) {
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

  const boundAction = addActivityAction.bind(null, session.id);

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-3xl mx-auto">
          <Link
            href={`/admin/sessions/${session.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to{" "}
            <span className="font-medium">{session.title}</span>
          </Link>
          <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mb-1">
            New Activity
          </h1>
          <p className="text-sm text-ink/60 mb-8">
            Adding to{" "}
            <span className="font-medium text-emerald-deep">{session.title}</span>.
          </p>

          <ActivityForm action={boundAction} submitLabel="Add activity" />
        </div>
      </main>
      <Footer />
    </>
  );
}
