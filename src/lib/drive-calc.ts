/**
 * Pure calculation helpers shared between server (drive-settings.ts) and
 * client components (ambassador registration form) — no fs/Redis imports,
 * safe to bundle into the browser.
 */

/** Portal-suggested "Ihsan-level" target: the ambassador's own target
 *  boosted by the admin-configured percentage, rounded up to a clean
 *  Rs. 500 step so it reads as a deliberate figure, not raw arithmetic. */
export function computeSuggestedTarget(
  ownTarget: number,
  ihsanPercentage: number
): number {
  const boosted = ownTarget * (1 + ihsanPercentage / 100);
  return Math.ceil(boosted / 500) * 500;
}
