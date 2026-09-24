import type { Metadata } from "next";
import { isAuthenticated, getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import { getContent } from "@/lib/content-store";
import { DEFAULT_CONTENT } from "@/lib/content-defaults";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { FeatureRestricted, ReadOnlyBanner } from "@/components/admin/FeatureGate";
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

  const tier = await getFeaturePermission("programming.content");
  if (tier === "none") {
    return (
      <AdminShell section="programming">
        <FeatureRestricted />
      </AdminShell>
    );
  }

  const content = await getContent();
  const safeContent = { ...content, team: content.team ?? DEFAULT_CONTENT.team };

  return (
    <AdminShell section="programming">
      <div>
        {tier === "read" && <ReadOnlyBanner />}

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

        <ContentEditor
          initialContent={safeContent}
          canEdit={canEdit(tier)}
          canDelete={canDelete(tier)}
        />
      </div>
    </AdminShell>
  );
}
