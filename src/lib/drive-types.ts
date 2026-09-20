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
  /** Gates /drive/apply independently of `status` — a drive can stay open
   *  for donations while applications are paused. Records written before
   *  this field existed are treated as `true` (see withDriveDefaults). */
  applicationsOpen: boolean;
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

export type ApplicationStatus =
  | "pending-review"
  | "confirmed"
  | "waitlisted"
  | "picked-up";

export interface DriveApplication {
  id: string;
  driveId: string;
  /** The catalog item that counts toward stock/applied totals — the
   *  Advisor-confirmed item when different from what was requested,
   *  otherwise the same as requestedItemId. */
  itemId: string;
  /** The catalog item the student originally selected at request time. Set
   *  once at creation and never changed, even if the Advisor confirms a
   *  different item — kept for an audit trail. Records written before this
   *  field existed are treated as equal to itemId (see withApplicationDefaults). */
  requestedItemId: string;
  applicantName: string;
  applicantContact: string;
  /** Google account email of the signed-in applicant. Absent on records
   *  created before Google sign-in became mandatory. */
  applicantEmail?: string;
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
  /** Google account email of the signed-in donor. Absent on records
   *  created before Google sign-in became mandatory. */
  donorEmail?: string;
  /** The amount that counts toward the drive/ambassador's raised total — the
   *  Advisor-corrected figure when different from what the donor submitted,
   *  otherwise the same as donorSubmittedAmount. */
  amount: number;
  /** What the donor typed into the donation form at submission time. Set
   *  once at creation and never changed, even if the Advisor corrects the
   *  amount during review — kept for an audit trail. Records written before
   *  this field existed are treated as equal to amount (see
   *  withDonationDefaults). */
  donorSubmittedAmount: number;
  proofUrl: string;
  status: DonationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Reference code the donor can quote when following up — same plaintext
   *  ticket-number reasoning as DriveApplication.pickupCode. */
  refCode: string;
  /** Ambassador the donor credited via the "Select Ambassador" dropdown, if
   *  any. null/absent = not attributed to an ambassador. */
  ambassadorId?: string | null;
  createdAt: string;
}

export interface DriveStats {
  booksGivenAllTime: number;
  drivesRun: number;
  generalFundTotal: number;
}

/* ------------------------------------------------------------------ */
/*  Drive Ambassadors                                                   */
/* ------------------------------------------------------------------ */

export type AmbassadorStatus = "pending" | "approved" | "rejected";

export interface Ambassador {
  id: string;
  driveId: string;
  name: string;
  /** Google account email of the signed-in student. */
  email: string;
  contact?: string;
  /** The target the ambassador typed in themselves. */
  ownTarget: number;
  /** Portal-suggested target above `ownTarget`, computed from the
   *  admin-configured Ihsan percentage — see computeSuggestedTarget in
   *  drive-calc.ts. */
  suggestedTarget: number;
  /** Whichever of ownTarget/suggestedTarget the ambassador picked as their
   *  real, committed target. */
  chosenTarget: number;
  /** True when chosenTarget is the portal-suggested (higher) figure. */
  isIhsanLevel: boolean;
  /** Sum of verified donations attributed to this ambassador. */
  raisedAmount: number;
  status: AmbassadorStatus;
  /** Set the first time raisedAmount reaches chosenTarget — gates the
   *  certificate download and never clears once set. */
  certificateIssuedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Payment methods + Drive settings                                    */
/* ------------------------------------------------------------------ */

export type PaymentMethodKind = "bank" | "wallet";

export interface PaymentMethod {
  id: string;
  kind: PaymentMethodKind;
  /** Short display name, e.g. "Meezan Bank" or "JazzCash". */
  label: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branch?: string;
  /** Freeform extra note shown under the method, e.g. wallet instructions. */
  instructions?: string;
  createdAt: string;
}

export interface DriveSettings {
  /** Percentage above an ambassador's own target used to compute the
   *  suggested Ihsan-level target, e.g. 20 = own target x 1.2. */
  ihsanPercentage: number;
  paymentMethods: PaymentMethod[];
}
