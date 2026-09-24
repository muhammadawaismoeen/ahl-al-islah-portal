import type { AdminRole, AdminSection, AdminFeature, PermissionTier } from "./admin-types";

export const ADMIN_ROLES: AdminRole[] = [
  "owner",
  "drive-manager",
  "content-programming",
  "community-care",
  "people-ops",
];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  "drive-manager": "Drive Manager",
  "content-programming": "Content & Programming",
  "community-care": "Community Care",
  "people-ops": "People Ops",
};

export const ADMIN_ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: "Full access to every section, including managing admin users.",
  "drive-manager":
    "Qur'an & Seerah Drive only — drives, applicants, donations, ambassadors, payments.",
  "content-programming": "Sessions, Positions, and the Content Editor.",
  "community-care": "Inbox, Feedback, Counsel, and Activity Audits.",
  "people-ops": "Core Members and Heads.",
};

const ROLE_SECTIONS: Record<AdminRole, AdminSection[]> = {
  owner: ["people", "community", "programming", "drive", "users"],
  "drive-manager": ["drive"],
  "content-programming": ["programming"],
  "community-care": ["community"],
  "people-ops": ["people"],
};

export function roleHasSection(role: AdminRole, section: AdminSection): boolean {
  return ROLE_SECTIONS[role].includes(section);
}

export function sectionsForRole(role: AdminRole): AdminSection[] {
  return ROLE_SECTIONS[role];
}

/** Where a signed-in admin should land first, per section. Used by /admin
 *  to send a role without "people" access (e.g. Drive Manager) straight to
 *  their own section instead of the People-gated root page. */
export const SECTION_HOME: Record<AdminSection, string> = {
  people: "/admin",
  community: "/admin/messages",
  programming: "/admin/sessions",
  drive: "/admin/drive",
  users: "/admin/users",
};

/* ------------------------------------------------------------------ */
/*  Per-feature permission tiers                                        */
/* ------------------------------------------------------------------ */

/** Every admin screen that supports fine-grained Edit/Delete/Read-Only
 *  control, in display order within each section. "users" has no entries —
 *  see the AdminFeature comment in admin-types.ts. */
export const SECTION_FEATURES: Record<Exclude<AdminSection, "users">, AdminFeature[]> = {
  people: ["people.members", "people.heads"],
  community: [
    "community.messages",
    "community.feedback",
    "community.counsel",
    "community.activity-audits",
  ],
  programming: ["programming.sessions", "programming.positions", "programming.content"],
  drive: [
    "drive.drives",
    "drive.catalog",
    "drive.applicants",
    "drive.checkin",
    "drive.donations",
    "drive.ambassadors",
    "drive.payments",
    "drive.report",
  ],
};

export const FEATURE_LABEL: Record<AdminFeature, string> = {
  "people.members": "Core Members",
  "people.heads": "Heads",
  "community.messages": "Inbox / Messages",
  "community.feedback": "Feedback",
  "community.counsel": "Counsel",
  "community.activity-audits": "Activity Audits",
  "programming.sessions": "Sessions",
  "programming.positions": "Positions",
  "programming.content": "Content Editor",
  "drive.drives": "Drives",
  "drive.catalog": "Catalog",
  "drive.applicants": "Applicants",
  "drive.checkin": "Check-in",
  "drive.donations": "Donations",
  "drive.ambassadors": "Ambassadors",
  "drive.payments": "Payment Settings",
  "drive.report": "Financial Report",
};

export const ADMIN_FEATURES: AdminFeature[] = Object.keys(FEATURE_LABEL) as AdminFeature[];

export const PERMISSION_TIERS: PermissionTier[] = ["none", "read", "edit", "full"];

export const PERMISSION_TIER_LABEL: Record<PermissionTier, string> = {
  none: "No Access",
  read: "Read-Only",
  edit: "Can Edit",
  full: "Can Edit + Delete",
};

/** Features that have nothing to edit or delete (pure display screens) —
 *  their tier picker only meaningfully offers No Access / Read-Only. */
export const READ_ONLY_FEATURES: ReadonlySet<AdminFeature> = new Set([
  "people.members",
  "people.heads",
  "drive.report",
]);

function sectionOfFeature(feature: AdminFeature): AdminSection {
  return feature.split(".")[0] as AdminSection;
}

/** Resolves what a person can actually do with one admin screen: the
 *  section gate always wins first (a role that doesn't include the
 *  feature's section can never be granted it via an override), then an
 *  explicit override, then the default of full access to everything the
 *  role's sections include. Owners are always "full", ignoring overrides —
 *  fine-grained limits are for the four scoped roles, not for the person
 *  who manages everyone else's access. */
export function getFeatureTier(
  role: AdminRole,
  overrides: Partial<Record<AdminFeature, PermissionTier>> | undefined,
  feature: AdminFeature
): PermissionTier {
  if (role === "owner") return "full";
  if (!roleHasSection(role, sectionOfFeature(feature))) return "none";
  return overrides?.[feature] ?? "full";
}

export function canRead(tier: PermissionTier): boolean {
  return tier !== "none";
}

export function canEdit(tier: PermissionTier): boolean {
  return tier === "edit" || tier === "full";
}

export function canDelete(tier: PermissionTier): boolean {
  return tier === "full";
}

export function isValidFeature(value: string): value is AdminFeature {
  return (ADMIN_FEATURES as string[]).includes(value);
}

export function isValidPermissionTier(value: string): value is PermissionTier {
  return (PERMISSION_TIERS as string[]).includes(value);
}
