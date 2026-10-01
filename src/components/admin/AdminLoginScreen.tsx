import { getContent } from "@/lib/content-store";
import { adminSignIn } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";

export async function AdminLoginScreen({
  subtitle,
  deniedEmail,
}: {
  subtitle?: string;
  deniedEmail?: string | null;
}) {
  const { customLogo } = await getContent();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="ornate-card p-8">
          <div className="text-center mb-6">
            {customLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={customLogo}
                alt=""
                className="mx-auto h-12 w-12 object-contain mb-4"
              />
            ) : (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-deep text-white heading-serif text-lg font-semibold mb-4">
                ا
              </span>
            )}
            <span className="arabic-text block text-emerald-deep">لوحة الإدارة</span>
            <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
              Admin Access
            </h1>
            <p className="text-sm text-ink/60 mt-2">
              {deniedEmail
                ? `${deniedEmail} isn't on the admin allow-list.`
                : subtitle ?? "Review submitted applications. Advisor only."}
            </p>
          </div>
          <LoginForm action={adminSignIn} />
        </div>
      </div>
    </div>
  );
}
