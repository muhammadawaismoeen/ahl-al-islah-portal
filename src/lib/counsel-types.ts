/**
 * Shared counsel types and constants — safe to import from client components.
 * All I/O and hashing helpers live in counsel-store.ts (server-only).
 */

/** httpOnly cookie holding the seeker's thread id on this device. */
export const COUNSEL_THREAD_COOKIE = "ahl_counsel_thread";
/** Legacy httpOnly cookie from the Vercel Blob era (held the thread's direct
 *  blob URL). No longer written — kept only so existing cookies get cleared. */
export const COUNSEL_BLOB_COOKIE = "ahl_counsel_blob";
/** sessionStorage key that carries the claim code from the start form to the
 *  thread view, where it's shown until the seeker dismisses it. */
export const CLAIM_CODE_STORAGE_KEY = "ahl_counsel_claim_code";

export type CounselCohort = "brothers" | "sisters";

export const COHORT_LABELS: Record<CounselCohort, string> = {
  brothers: "Brothers",
  sisters: "Sisters",
};

export type CounselMessageAuthor = "seeker" | "advisor";

export interface CounselMessage {
  id: string;
  from: CounselMessageAuthor;
  body: string;
  submittedAt: string;
}

export type CounselThreadStatus = "open" | "closed";

export interface CounselThread {
  id: string;
  claimCodeHash: string;
  cohort?: CounselCohort;
  createdAt: string;
  updatedAt: string;
  status: CounselThreadStatus;
  advisorHasUnread: boolean;
  seekerHasUnread: boolean;
  messages: CounselMessage[];
}
