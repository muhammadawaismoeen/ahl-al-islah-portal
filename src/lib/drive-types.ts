/**
 * Shared Qur'an & Seerah Drive types and constants — safe to import from
 * client components. All I/O lives in drive-store.ts (server-only).
 */

/** httpOnly cookie holding the applicant/donor's own record ids on this
 *  device — no account system exists in this portal, so this is the same
 *  device-recognition approach counsel threads use, extended to a list. */
export const DRIVE_DEVICE_COOKIE = "ahl_drive_ids";

export type DriveStatus = "open" | "closed";

/** Canonical Department / Year-of-study option lists for the Drive apply
 *  form — kept in sync with the equivalent membership-application fields
 *  in questions.ts so both forms use the same organizational taxonomy. */
export const DRIVE_DEPARTMENT_OPTIONS = [
  "MBBS",
  "BDS",
  "DPT",
  "MIT (Medical Imaging Technology)",
  "MLT (Medical Lab Technology)",
  "Pharmacy / Pharm-D",
  "Nutrition",
  "Nursing",
  "Other",
] as const;

export const DRIVE_YEAR_OF_STUDY_OPTIONS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "Final year",
  "House officer / intern",
  "Other",
] as const;

/** Which wing of the department an applicant belongs to. Stored as
 *  "male"/"female" to match the `wing` field membership submissions and
 *  head applications already use, so the whole portal speaks one dialect;
 *  every user-facing surface renders it through the label maps below. */
export type DriveWing = "male" | "female";

export const DRIVE_WINGS: DriveWing[] = ["male", "female"];

/** Plural, for counts and column headings: "Brothers: 31". */
export const DRIVE_WING_LABEL: Record<DriveWing, string> = {
  male: "Brothers",
  female: "Sisters",
};

/** Singular, for a student choosing on their own behalf. */
export const DRIVE_WING_SELF_LABEL: Record<DriveWing, string> = {
  male: "Brother",
  female: "Sister",
};

export interface Drive {
  id: string;
  name: string;
  startDate: string; // ISO date, yyyy-mm-dd — donation collection window opens
  endDate: string; // ISO date, yyyy-mm-dd — donation collection window closes
  /** ISO date, yyyy-mm-dd — the actual day applicants come collect their
   *  item. Distinct from startDate/endDate above (the donation window):
   *  a drive commonly keeps collecting donations for weeks before handing
   *  anything out on a single pickup day. Undefined on drives created
   *  before this field existed; every display falls back to the
   *  startDate–endDate range until an admin sets it. */
  pickupDate?: string;
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

/** The Drive-day lifecycle. A ticket moves pending-review → confirmed →
 *  checked-in → picked-up. The two scans on Drive Day are the last two
 *  transitions: the Registration Desk sets checked-in, the Handover desk
 *  sets picked-up. "waitlisted" is a dead end kept for historical records —
 *  reserveBook no longer creates one (an out-of-stock item is refused). */
export type ApplicationStatus =
  | "pending-review"
  | "confirmed"
  | "checked-in"
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
  /** Absent on records written before these fields existed (see
   *  withApplicationDefaults), which default them to "". */
  applicantDepartment?: string;
  applicantYearOfStudy?: string;
  /** Absent on every application submitted before the apply form asked for
   *  it — those are backfilled by hand from the Applicants tab, so treat
   *  undefined as "not yet recorded", never as a default wing. */
  applicantGender?: DriveWing;
  status: ApplicationStatus;
  /** Shown as a QR code on the ticket page and matched at the pickup table —
   *  a ticket number, not a secret credential, so it's stored in plaintext. */
  pickupCode: string;
  createdAt: string;
  updatedAt: string;
  /** Set by the Registration Desk's scan on Drive Day. Absent until then,
   *  and on records that reached picked-up before this two-stage flow
   *  existed (see withApplicationDefaults). */
  checkedInAt?: string;
  pickedUpAt?: string;
  /** Set when reserveBook() notices this application's name/contact/email
   *  closely resembles another applicant's on the same drive (typo-level
   *  phone/email match, or an identical name under different details) —
   *  not blocked outright since it may well be two real people, just
   *  surfaced for the Advisor to glance at in the Applicants tab. */
  flaggedReason?: string | null;
  /** Best-effort requester IP at submission time (from x-forwarded-for),
   *  kept server-side as an audit trail only — it does not block duplicate
   *  applications (shared campus wifi puts many real applicants on one
   *  address) and is never shown in any UI. Absent on older records, and
   *  unset entirely in the filesystem dev fallback (no real proxy). */
  submittedIp?: string | null;
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
  /** Unlocks the read-only Drive Day supervisor board at /drive/supervisor.
   *  Stored in plaintext on purpose: an Owner has to be able to read it off
   *  the screen to hand to a supervisor, and it guards a page with no
   *  personal data on it — counts and stock only. Absent = board disabled. */
  supervisorPin?: string;
}
