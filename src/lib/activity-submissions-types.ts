/**
 * Identity Pillars Audit — submission shape.
 * Public form lives at /activity/identity-pillars and writes through
 * activity-submissions-store.ts. Admin reads them at
 * /admin/activity-submissions.
 *
 * Submissions are anonymous by default; `name` is the only optional
 * identity field. The session is snapshotted (title + id) at submit time
 * so the inbox stays meaningful even if the session is renamed.
 */

export type PillarType = "" | "A" | "B";

export interface IdentityPillar {
  text: string;
  type: PillarType;
}

export interface IdentityPillarsSubmission {
  id: string;
  submittedAt: string;
  sessionId?: string;
  sessionTitle?: string;
  name?: string;
  pillar1: IdentityPillar;
  pillar2: IdentityPillar;
  pillar3: IdentityPillar;
  reflection?: string;
  status: "unread" | "read";
}

export const PILLAR_TYPE_LABELS: Record<"A" | "B", string> = {
  A: "Allah-grounded",
  B: "Approval-grounded",
};

export const PILLAR_TYPE_DESCRIPTIONS: Record<"A" | "B", string> = {
  A: "Holds even if everyone around me disagrees. Survives the fire, the rejection, the empty valley. Mine — not the environment's.",
  B: "Depends on being validated by people around me. If they withdrew their approval, this pillar would shake.",
};
