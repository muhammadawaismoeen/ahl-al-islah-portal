import type { Metadata } from "next";
import { isAuthenticated } from "@/app/admin/actions";
import { getContent } from "@/lib/content-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { ContentEditor } from "./ContentEditor";

export const metadata: Metadata = {
  title: "Admin · Content Editor",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen subtitle="Content editor. Advisor only." />;
  }

  const content = await getContent();

  return (
    <AdminShell section="programming">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="arabic-text text-emerald-deep">تحرير المحتوى</span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Content Editor
            </h1>
            <p className="text-sm text-ink/60 mt-1">
              Edit all public-facing text on the portal. Changes are live
              immediately after saving.
            </p>
          </div>
        </div>

        <ContentEditor initialContent={content} />
      </div>
    </AdminShell>
  );
}
