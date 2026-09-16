/**
 * Shared Qur'an & Seerah Drive types and constants — safe to import from
 * client components. All I/O lives in drive-store.ts (server-only).
 */

/** httpOnly cookie holding the applicant/donor's own record ids on this
 *  device — no account system exists in this portal, so this is the same
 *  device-recognition approach counsel threads use, extended to a list. */
export const DRIVE_DEVICE_COOKIE = "ahl_drive_ids";

export type DriveStatus = "open" | "closed";

export interface Drive {
  id: string;
  name: string;
  startDate: string; // ISO date, yyyy-mm-dd
  endDate: string; // ISO date, yyyy-mm-dd
  status: DriveStatus;
  goalAmount: number;
  raisedAmount: number;
  pickupLocation: string;
  pickupNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveItem {
  id: string;
  driveId: string;
  name: string;
  totalStock: number;
  remainingStock: number;
  perStudentLimit: number;
  createdAt: string;
}

export type ApplicationStatus = "confirmed" | "waitlisted" | "picked-up";

export interface DriveApplication {
  id: string;
  driveId: string;
  itemId: string;
  applicantName: string;
  applicantContact: string;
  status: ApplicationStatus;
  /** Shown as a QR code on the ticket page and matched at the pickup table —
   *  a ticket number, not a secret credential, so it's stored in plaintext. */
  pickupCode: string;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
}

export type DonationStatus = "pending" | "verified" | "rejected";

export interface Donation {
  id: string;
  /** null = general fund, not tied to a specific drive */
  driveId: string | null;
  donorName: string | null;
  donorContact: string | null;
  amount: number;
  proofUrl: string;
  status: DonationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Reference code the donor can quote when following up — same plaintext
   *  ticket-number reasoning as DriveApplication.pickupCode. */
  refCode: string;
  createdAt: string;
}

export interface DriveStats {
  booksGivenAllTime: number;
  drivesRun: number;
  generalFundTotal: number;
}
