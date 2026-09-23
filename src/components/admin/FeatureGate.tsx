import { ShieldAlert, Eye } from "lucide-react";

/** Shown in place of a screen's content when the signed-in admin's role
 *  includes the section (so AdminShell already let them past its own gate)
 *  but an Owner has set this specific feature to "No Access" for them. */
export function FeatureRestricted() {
  return (
    <div className="max-w-md mx-auto mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-amber" />
      <h1 className="heading-serif mt-4 text-lg font-semibold text-emerald-deep">
        Access restricted
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        You don&apos;t have access to this screen. Ask an Owner to update your permissions from
        Users &amp; Roles if you need it.
      </p>
    </div>
  );
}

/** Shown above a screen's content when the signed-in admin has "Read-Only"
 *  access — the screen renders normally but edit/delete controls stay hidden. */
export function ReadOnlyBanner({ note }: { note?: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-sapphire/10 border border-sapphire/25 px-3.5 py-2.5 text-xs text-sapphire">
      <Eye className="h-3.5 w-3.5 shrink-0" />
      {note ?? "You have read-only access to this screen."}
    </div>
  );
}
