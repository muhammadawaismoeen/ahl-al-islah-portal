/**
 * Editable copy and constants for the Qur'an & Seerah Drive module.
 * Update this file to change the bank details card, currency, or default
 * on-page labels — nothing below should be hardcoded again in the JSX.
 */

export const DRIVE_CURRENCY = "Rs.";

/** Sane upper bound for a single proof-of-transfer upload (bank receipts are
 *  small scans/photos, not the constraint here — this just caps abuse). Bytes
 *  go to Vercel Blob, not inline into a Redis document, so there's no REST
 *  payload-size ceiling to size this against. Lives here (not
 *  donation-upload.ts) so client components can import it without pulling
 *  server-only `fs`/Redis code into the browser bundle. */
export const MAX_PROOF_BYTES = 600 * 1024;

export const BANK_TRANSFER_DETAILS = {
  bankName: "Meezan Bank",
  accountTitle: "Ahl Al-Islah — Rijal Al-Huda",
  accountNumber: "0123-4567891-01",
  iban: "PK00MEZN0001234567891",
  branch: "Main Branch",
};
