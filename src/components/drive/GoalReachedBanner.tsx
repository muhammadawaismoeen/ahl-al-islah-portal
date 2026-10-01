import { DRIVE_CURRENCY } from "@/lib/drive-config";
import type { GoalProgress } from "@/lib/drive-goal";

/**
 * The goal-reached announcement, carried above the fold so it lands before
 * anyone scrolls to the progress card. Server-rendered — no motion of its
 * own beyond the site's existing fade-up.
 *
 * `donationsOpen` decides the second line: while the collection window is
 * still open there is a reason to keep giving, and saying so stops the
 * banner from reading as "we don't need you any more" directly above a
 * Donate button.
 */
export function GoalReachedBanner({
  progress,
  donationsOpen,
}: {
  progress: GoalProgress;
  donationsOpen: boolean;
}) {
  const { raised } = progress;

  return (
    <div className="animate-fade-up rounded-xl border border-gold/45 bg-gradient-to-r from-gold/15 to-emerald/10 px-5 py-4 mb-8 flex items-center gap-4 text-left">
      <span
        aria-hidden
        className="font-arabic text-amber text-2xl leading-none shrink-0"
      >
        الحمد لله
      </span>
      <div className="min-w-0">
        <p className="heading-serif font-semibold text-ink text-base">
          We reached the goal — {DRIVE_CURRENCY} {raised.toLocaleString()}.
        </p>
        <p className="mt-0.5 text-sm text-ink/60 leading-relaxed">
          {donationsOpen
            ? "Every further donation now funds another copy beyond what we promised."
            : "Thank you to everyone who gave. Pickup details are below."}
        </p>
      </div>
    </div>
  );
}
