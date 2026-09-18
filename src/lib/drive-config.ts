/**
 * Editable copy and constants for the Qur'an & Seerah Drive module.
 * Update this file to change the bank details card, currency, or default
 * on-page labels — nothing below should be hardcoded again in the JSX.
 */

export const DRIVE_CURRENCY = "Rs.";

/** Sane upper bound for a single proof-of-transfer upload — just caps abuse,
 *  not sized against any storage constraint (bytes go to Vercel Blob, not
 *  inline into a Redis document). A raw phone screenshot of a bank/wallet
 *  app easily runs 1-3 MB, so this needs real headroom above that or the
 *  donation silently fails at the file-size check with no explanation.
 *  Lives here (not donation-upload.ts) so client components can import it
 *  without pulling server-only `fs`/Redis code into the browser bundle. */
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** Book applications are restricted to Akhtar Saeed Medical and Dental
 *  College's official student email domain — an explicit gate requested
 *  alongside admin-approval for that program. (Ambassador registration is
 *  open to any signed-in Google account; it does not use this gate.) */
export const COLLEGE_EMAIL_DOMAIN = "@amdc.edu.pk";

export function isCollegeEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN);
}

export const DEFAULT_IHSAN_PERCENTAGE = 20;
